import { getSupabaseClient } from './client';
import type {
  BodyMeasurement,
  DailyNutritionTotals,
  Exercise,
  ExerciseType,
  Food,
  FoodEntry,
  MealType,
  PersonalRecord,
  Profile,
  StrengthDataPoint,
  WaterEntry,
  WorkoutSession,
  WorkoutSessionWithDetails,
  WorkoutSet,
  WorkoutStats,
  WorkoutTemplate,
  WorkoutType,
} from './types';
import {
  calculateOneRepMax,
  calculateVolume,
  toLocalDateStr,
  addDaysLocal,
  computePersonalRecords,
  computeWorkoutStats,
  type SlimSession,
  type StatsSession,
} from '@fit-n-fatal/utils';

// =========================================================================
// PROFILE
// =========================================================================
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, patch: Partial<Profile>): Promise<Profile> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = getSupabaseClient();
  const path = `${userId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

// =========================================================================
// EXERCISES
// =========================================================================
export async function getExercises(search?: string, muscleGroup?: string): Promise<Exercise[]> {
  let query = getSupabaseClient().from('exercises').select('*').order('name');

  if (search?.trim()) {
    query = query.ilike('name', `%${search.trim()}%`);
  }
  if (muscleGroup) {
    query = query.eq('muscle_group', muscleGroup);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/**
 * The whole exercise library (system + your custom ones) in one request.
 * It changes rarely, so the app caches it and searches it locally —
 * typing in a search box no longer hits the server on every keystroke.
 */
export async function getExerciseLibrary(): Promise<Exercise[]> {
  return fetchAllRows<Exercise>((from, to) =>
    getSupabaseClient().from('exercises').select('*').order('name').range(from, to)
  );
}

export async function getFavoriteExerciseIds(userId: string): Promise<Set<string>> {
  const { data, error } = await getSupabaseClient()
    .from('exercise_favorites')
    .select('exercise_id')
    .eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.exercise_id));
}

export async function toggleFavoriteExercise(userId: string, exerciseId: string, isFavorite: boolean) {
  const supabase = getSupabaseClient();
  if (isFavorite) {
    const { error } = await supabase.from('exercise_favorites').insert({ user_id: userId, exercise_id: exerciseId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('exercise_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId);
    if (error) throw error;
  }
}

export interface ExerciseInput {
  name: string;
  muscle_group: string;
  secondary_muscle_group?: string | null;
  equipment?: string | null;
  exercise_type?: ExerciseType;
  description?: string | null;
  personal_notes?: string | null;
}

export async function createCustomExercise(userId: string, input: ExerciseInput): Promise<Exercise> {
  const { data, error } = await getSupabaseClient()
    .from('exercises')
    .insert({
      user_id: userId,
      name: input.name,
      muscle_group: input.muscle_group,
      secondary_muscle_group: input.secondary_muscle_group ?? null,
      equipment: input.equipment ?? null,
      exercise_type: input.exercise_type ?? 'strength',
      description: input.description ?? null,
      personal_notes: input.personal_notes ?? null,
      is_custom: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateExercise(exerciseId: string, patch: Partial<ExerciseInput>): Promise<Exercise> {
  const { data, error } = await getSupabaseClient()
    .from('exercises')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', exerciseId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExercise(exerciseId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('exercises').delete().eq('id', exerciseId);
  if (error) throw error;
}

export async function getLastUsedSets(
  userId: string,
  exerciseId: string
): Promise<{ date: string; sets: WorkoutSet[] } | null> {
  // Only the 3 most recent finished sessions that contain this exercise
  // (filtered server-side), instead of downloading the whole history.
  const { data, error } = await getSupabaseClient()
    .from('workout_sessions')
    .select('started_at, workout_exercises!inner(exercise_id, sets:workout_sets(*))')
    .eq('user_id', userId)
    .eq('workout_exercises.exercise_id', exerciseId)
    .not('ended_at', 'is', null)
    .order('workout_date', { ascending: false })
    .order('started_at', { ascending: false })
    .limit(3);
  if (error) throw error;

  for (const session of (data ?? []) as any[]) {
    for (const we of session.workout_exercises ?? []) {
      const sets = ((we.sets ?? []) as WorkoutSet[]).sort((a, b) => a.set_number - b.set_number);
      if (sets.length > 0) return { date: session.started_at, sets };
    }
  }
  return null;
}

export async function getLastUsedWeight(userId: string, exerciseId: string): Promise<number | null> {
  const last = await getLastUsedSets(userId, exerciseId);
  const workingSets = last?.sets.filter((s) => !s.is_warmup) ?? [];
  return workingSets.length > 0 ? workingSets[workingSets.length - 1].weight : null;
}

// =========================================================================
// WORKOUT SESSIONS
// =========================================================================
export interface StartWorkoutInput {
  workoutDate?: string;
  workoutType?: WorkoutType;
  name?: string;
  templateId?: string;
}

export async function startWorkoutSession(userId: string, input?: StartWorkoutInput): Promise<WorkoutSession> {
  const { data, error } = await getSupabaseClient()
    .from('workout_sessions')
    .insert({
      user_id: userId,
      workout_date: input?.workoutDate ?? toLocalDateStr(),
      workout_type: input?.workoutType ?? 'gym',
      name: input?.name ?? null,
      template_id: input?.templateId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endWorkoutSession(sessionId: string, durationMinutes?: number): Promise<WorkoutSession> {
  const { data, error } = await getSupabaseClient()
    .from('workout_sessions')
    .update({ ended_at: new Date().toISOString(), duration_minutes: durationMinutes ?? null })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkoutSession(
  sessionId: string,
  patch: Partial<Pick<WorkoutSession, 'name' | 'workout_type' | 'notes' | 'workout_date'>>
): Promise<WorkoutSession> {
  const { data, error } = await getSupabaseClient()
    .from('workout_sessions')
    .update(patch)
    .eq('id', sessionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWorkoutSession(sessionId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('workout_sessions').delete().eq('id', sessionId);
  if (error) throw error;
}

export async function getActiveSession(userId: string): Promise<WorkoutSessionWithDetails | null> {
  const { data, error } = await getSupabaseClient()
    .from('workout_sessions')
    .select(
      `
      *,
      workout_exercises (
        *,
        exercise:exercises (*),
        sets:workout_sets (*)
      )
    `
    )
    .eq('user_id', userId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return normalizeSession(data);
}

export async function getWorkoutSession(sessionId: string): Promise<WorkoutSessionWithDetails | null> {
  const { data, error } = await getSupabaseClient()
    .from('workout_sessions')
    .select(
      `
      *,
      workout_exercises (
        *,
        exercise:exercises (*),
        sets:workout_sets (*)
      )
    `
    )
    .eq('id', sessionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return normalizeSession(data);
}

function normalizeSession(data: any): WorkoutSessionWithDetails {
  return {
    ...data,
    workout_exercises: (data.workout_exercises ?? [])
      .map((we: any) => ({ ...we, sets: (we.sets ?? []).sort((a: WorkoutSet, b: WorkoutSet) => a.set_number - b.set_number) }))
      .sort((a: any, b: any) => a.order_index - b.order_index),
  };
}

export async function addExerciseToSession(sessionId: string, exerciseId: string, orderIndex: number) {
  const { data, error } = await getSupabaseClient()
    .from('workout_exercises')
    .insert({ session_id: sessionId, exercise_id: exerciseId, order_index: orderIndex })
    .select(`*, exercise:exercises (*)`)
    .single();

  if (error) throw error;
  return data;
}

export async function removeExerciseFromSession(workoutExerciseId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('workout_exercises').delete().eq('id', workoutExerciseId);
  if (error) throw error;
}

export interface LogSetInput {
  reps: number;
  weight: number;
  rpe?: number;
  restSeconds?: number;
  notes?: string;
  isWarmup?: boolean;
  completed?: boolean;
}

export async function logSet(
  workoutExerciseId: string,
  setNumber: number,
  input: LogSetInput
): Promise<WorkoutSet> {
  const { data, error } = await getSupabaseClient()
    .from('workout_sets')
    .insert({
      workout_exercise_id: workoutExerciseId,
      set_number: setNumber,
      reps: input.reps,
      weight: input.weight,
      rpe: input.rpe ?? null,
      rest_seconds: input.restSeconds ?? null,
      notes: input.notes ?? null,
      is_warmup: input.isWarmup ?? false,
      completed: input.completed ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSet(setId: string, patch: Partial<LogSetInput>): Promise<WorkoutSet> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.reps !== undefined) dbPatch.reps = patch.reps;
  if (patch.weight !== undefined) dbPatch.weight = patch.weight;
  if (patch.rpe !== undefined) dbPatch.rpe = patch.rpe;
  if (patch.restSeconds !== undefined) dbPatch.rest_seconds = patch.restSeconds;
  if (patch.notes !== undefined) dbPatch.notes = patch.notes;
  if (patch.isWarmup !== undefined) dbPatch.is_warmup = patch.isWarmup;
  if (patch.completed !== undefined) dbPatch.completed = patch.completed;

  const { data, error } = await getSupabaseClient().from('workout_sets').update(dbPatch).eq('id', setId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSet(setId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('workout_sets').delete().eq('id', setId);
  if (error) throw error;
}

export async function copyLastWorkoutSets(userId: string, sessionId: string, exerciseId: string, workoutExerciseId: string) {
  const last = await getLastUsedSets(userId, exerciseId);
  if (!last) return [];
  const supabase = getSupabaseClient();
  const rows = last.sets.map((s) => ({
    workout_exercise_id: workoutExerciseId,
    set_number: s.set_number,
    reps: s.reps,
    weight: s.weight,
    rpe: s.rpe,
    is_warmup: s.is_warmup,
    completed: true,
  }));
  const { data, error } = await supabase.from('workout_sets').insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

export async function repeatLastWorkout(userId: string): Promise<WorkoutSession | null> {
  const { sessions } = await getWorkoutHistoryPage(userId, { page: 0, pageSize: 1 });
  const last = sessions[0];
  if (!last) return null;

  const supabase = getSupabaseClient();
  const session = await startWorkoutSession(userId, {
    workoutType: last.workout_type,
    name: last.name ?? undefined,
  });

  const ordered = [...last.workout_exercises].sort((a, b) => a.order_index - b.order_index);
  if (ordered.length === 0) return session;

  // One insert for all exercises, one for all sets (was 1 request per row).
  const { data: newWes, error: weError } = await supabase
    .from('workout_exercises')
    .insert(ordered.map((we) => ({ session_id: session.id, exercise_id: we.exercise_id, order_index: we.order_index })))
    .select('id, order_index');
  if (weError) throw weError;

  const idByOrder = new Map((newWes ?? []).map((r: { id: string; order_index: number }) => [r.order_index, r.id]));
  const setRows = ordered.flatMap((we) =>
    we.sets
      .filter((s) => !s.is_warmup)
      .map((s) => ({
        workout_exercise_id: idByOrder.get(we.order_index)!,
        set_number: s.set_number,
        reps: s.reps,
        weight: s.weight,
        rpe: s.rpe ?? null,
        is_warmup: false,
        completed: false,
      }))
  );
  if (setRows.length > 0) {
    const { error: setError } = await supabase.from('workout_sets').insert(setRows);
    if (setError) throw setError;
  }

  return session;
}

const SESSION_DETAIL_SELECT = `
  *,
  workout_exercises (
    *,
    exercise:exercises (*),
    sets:workout_sets (*)
  )
`;

function sortSessionsNewestFirst<T extends { workout_date: string; started_at: string }>(rows: T[]): T[] {
  return rows.sort((a, b) => b.workout_date.localeCompare(a.workout_date) || b.started_at.localeCompare(a.started_at));
}

/** Supabase caps a response at 1000 rows; page through to get them all. */
async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  chunk = 1000
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += chunk) {
    const { data, error } = await build(from, from + chunk - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < chunk) return out;
  }
}

export interface WorkoutHistoryPageOptions {
  page: number;
  pageSize?: number;
  workoutType?: WorkoutType | '';
  date?: string;
  nameQuery?: string;
  exerciseId?: string;
  muscleGroup?: string;
}

export interface WorkoutHistoryPage {
  sessions: WorkoutSessionWithDetails[];
  hasMore: boolean;
}

/**
 * One page of finished workouts (newest first), with all filters applied
 * in the database. Fetches pageSize + 1 rows to know whether more exist.
 */
export async function getWorkoutHistoryPage(userId: string, opts: WorkoutHistoryPageOptions): Promise<WorkoutHistoryPage> {
  const supabase = getSupabaseClient();
  const pageSize = opts.pageSize ?? 10;
  const from = opts.page * pageSize;
  const to = from + pageSize; // inclusive → pageSize + 1 rows

  const needsExerciseJoin = !!opts.exerciseId || !!opts.muscleGroup;

  // When filtering by exercise / muscle we first find the matching session
  // ids (cheap), then load full details for just those ids.
  let query = supabase
    .from('workout_sessions')
    .select(
      needsExerciseJoin
        ? opts.muscleGroup
          ? 'id, workout_exercises!inner(exercise_id, exercises!inner(muscle_group))'
          : 'id, workout_exercises!inner(exercise_id)'
        : SESSION_DETAIL_SELECT
    )
    .eq('user_id', userId)
    .not('ended_at', 'is', null);

  if (opts.workoutType) query = query.eq('workout_type', opts.workoutType);
  if (opts.date) query = query.eq('workout_date', opts.date);
  if (opts.nameQuery?.trim()) query = query.ilike('name', `%${opts.nameQuery.trim()}%`);
  if (opts.exerciseId) query = query.eq('workout_exercises.exercise_id', opts.exerciseId);
  if (opts.muscleGroup) query = query.eq('workout_exercises.exercises.muscle_group', opts.muscleGroup);

  const { data, error } = await query
    .order('workout_date', { ascending: false })
    .order('started_at', { ascending: false })
    .range(from, to);
  if (error) throw error;

  const rows = (data ?? []) as any[];
  const hasMore = rows.length > pageSize;
  const pageRows = rows.slice(0, pageSize);

  if (!needsExerciseJoin) {
    return { sessions: pageRows.map(normalizeSession), hasMore };
  }

  const ids = pageRows.map((r) => r.id as string);
  if (ids.length === 0) return { sessions: [], hasMore: false };
  const { data: details, error: detailError } = await supabase.from('workout_sessions').select(SESSION_DETAIL_SELECT).in('id', ids);
  if (detailError) throw detailError;
  return { sessions: sortSessionsNewestFirst((details ?? []).map(normalizeSession)), hasMore };
}

/** Lightweight name search for global search: no exercises or sets. */
export async function searchWorkoutsByName(
  userId: string,
  q: string,
  limit = 5
): Promise<Pick<WorkoutSession, 'id' | 'name' | 'workout_date'>[]> {
  const { data, error } = await getSupabaseClient()
    .from('workout_sessions')
    .select('id, name, workout_date')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .ilike('name', `%${q.trim()}%`)
    .order('workout_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** Distinct exercises the user has ever logged (for history filters). */
export async function getLoggedExerciseOptions(userId: string): Promise<{ id: string; name: string; muscle_group: string }[]> {
  const rows = await fetchAllRows<any>((from, to) =>
    getSupabaseClient()
      .from('workout_exercises')
      .select('exercise_id, exercise:exercises(name, muscle_group), session:workout_sessions!inner(user_id)')
      .eq('session.user_id', userId)
      .range(from, to)
  );
  const map = new Map<string, { id: string; name: string; muscle_group: string }>();
  for (const r of rows) {
    if (r.exercise && !map.has(r.exercise_id)) {
      map.set(r.exercise_id, { id: r.exercise_id, name: r.exercise.name, muscle_group: r.exercise.muscle_group });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getWorkoutHistory(
  userId: string,
  options?: { exerciseId?: string; fromDate?: string; toDate?: string; workoutType?: WorkoutType; activeOnly?: boolean }
): Promise<WorkoutSessionWithDetails[]> {
  let query = getSupabaseClient()
    .from('workout_sessions')
    .select(
      `
      *,
      workout_exercises (
        *,
        exercise:exercises (*),
        sets:workout_sets (*)
      )
    `
    )
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('workout_date', { ascending: false })
    .order('started_at', { ascending: false });

  if (options?.fromDate) query = query.gte('workout_date', options.fromDate);
  if (options?.toDate) query = query.lte('workout_date', options.toDate);
  if (options?.workoutType) query = query.eq('workout_type', options.workoutType);

  const { data, error } = await query;
  if (error) throw error;

  let sessions = (data ?? []).map(normalizeSession);

  if (options?.exerciseId) {
    sessions = sessions
      .map((s) => ({ ...s, workout_exercises: s.workout_exercises.filter((we) => we.exercise_id === options.exerciseId) }))
      .filter((s) => s.workout_exercises.length > 0);
  }

  return sessions;
}

export async function getWorkoutStats(userId: string): Promise<WorkoutStats> {
  // Only dates, durations and a set COUNT per session — no exercise rows,
  // no set rows. A few bytes per workout instead of the full history.
  const rows = await fetchAllRows<any>((from, to) =>
    getSupabaseClient()
      .from('workout_sessions')
      .select('workout_date, started_at, ended_at, duration_minutes, workout_exercises(workout_sets(count))')
      .eq('user_id', userId)
      .not('ended_at', 'is', null)
      .order('workout_date', { ascending: false })
      .range(from, to)
  );
  const sessions: StatsSession[] = rows.map((r) => ({
    workout_date: r.workout_date,
    started_at: r.started_at,
    ended_at: r.ended_at,
    duration_minutes: r.duration_minutes,
    set_count: (r.workout_exercises ?? []).reduce(
      (sum: number, we: any) => sum + (we.workout_sets?.[0]?.count ?? 0),
      0
    ),
  }));
  return computeWorkoutStats(sessions);
}

export async function getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  // Slim projection: weight/reps/warmup per set + exercise name. Roughly
  // 10x smaller than the full history payload it replaces.
  const rows = await fetchAllRows<any>((from, to) =>
    getSupabaseClient()
      .from('workout_sessions')
      .select('started_at, workout_exercises(exercise_id, exercise:exercises(name), sets:workout_sets(weight, reps, is_warmup))')
      .eq('user_id', userId)
      .not('ended_at', 'is', null)
      .order('workout_date', { ascending: false })
      .order('started_at', { ascending: false })
      .range(from, to)
  );
  const sessions: SlimSession[] = rows.map((r) => ({
    started_at: r.started_at,
    workout_exercises: (r.workout_exercises ?? []).map((we: any) => ({
      exercise_id: we.exercise_id,
      exercise_name: we.exercise?.name ?? '',
      sets: we.sets ?? [],
    })),
  }));
  return computePersonalRecords(sessions);
}

export async function getStrengthCurve(userId: string, exerciseId: string, fromDate?: string): Promise<StrengthDataPoint[]> {
  let query = getSupabaseClient()
    .from('workout_sessions')
    .select('workout_date, workout_exercises!inner(exercise_id, sets:workout_sets(weight, reps, is_warmup))')
    .eq('user_id', userId)
    .eq('workout_exercises.exercise_id', exerciseId)
    .not('ended_at', 'is', null);
  if (fromDate) query = query.gte('workout_date', fromDate.slice(0, 10));
  const { data, error } = await query.order('workout_date', { ascending: true });
  if (error) throw error;

  const points: StrengthDataPoint[] = [];
  for (const session of (data ?? []) as any[]) {
    for (const we of session.workout_exercises ?? []) {
      const workingSets = ((we.sets ?? []) as { weight: number; reps: number; is_warmup: boolean | null }[]).filter((s) => !s.is_warmup);
      if (workingSets.length === 0) continue;
      const maxWeight = Math.max(...workingSets.map((s) => Number(s.weight)));
      const bestSet = workingSets.find((s) => Number(s.weight) === maxWeight)!;
      points.push({
        date: session.workout_date,
        max_weight: maxWeight,
        reps_at_max: bestSet.reps,
        total_volume: workingSets.reduce((sum, s) => sum + calculateVolume(s.reps, Number(s.weight)), 0),
        estimated_1rm: calculateOneRepMax(maxWeight, bestSet.reps),
      });
      break;
    }
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

// =========================================================================
// WORKOUT TEMPLATES
// =========================================================================
export async function getTemplates(userId: string): Promise<WorkoutTemplate[]> {
  const { data, error } = await getSupabaseClient()
    .from('workout_templates')
    .select(`*, exercises:workout_template_exercises (*, exercise:exercises (*))`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((t: any) => ({
    ...t,
    exercises: (t.exercises ?? []).sort((a: any, b: any) => a.order_index - b.order_index),
  }));
}

export interface TemplateExerciseInput {
  exerciseId: string;
  targetSets?: number;
  targetReps?: number;
  notes?: string;
}

export async function createTemplate(
  userId: string,
  name: string,
  workoutType: WorkoutType,
  exercises: TemplateExerciseInput[],
  notes?: string
): Promise<WorkoutTemplate> {
  const supabase = getSupabaseClient();
  const { data: template, error } = await supabase
    .from('workout_templates')
    .insert({ user_id: userId, name, workout_type: workoutType, notes: notes ?? null })
    .select()
    .single();
  if (error) throw error;

  if (exercises.length > 0) {
    const rows = exercises.map((e, i) => ({
      template_id: template.id,
      exercise_id: e.exerciseId,
      order_index: i,
      target_sets: e.targetSets ?? null,
      target_reps: e.targetReps ?? null,
      notes: e.notes ?? null,
    }));
    const { error: exError } = await supabase.from('workout_template_exercises').insert(rows);
    if (exError) throw exError;
  }

  return template;
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('workout_templates').delete().eq('id', templateId);
  if (error) throw error;
}

export async function startWorkoutFromTemplate(userId: string, template: WorkoutTemplate): Promise<WorkoutSession> {
  const session = await startWorkoutSession(userId, {
    workoutType: template.workout_type,
    name: template.name,
    templateId: template.id,
  });
  // One insert for every exercise instead of one request each.
  const rows = (template.exercises ?? []).map((te) => ({
    session_id: session.id,
    exercise_id: te.exercise_id,
    order_index: te.order_index,
  }));
  if (rows.length > 0) {
    const { error } = await getSupabaseClient().from('workout_exercises').insert(rows);
    if (error) throw error;
  }
  return session;
}

// =========================================================================
// NUTRITION
// =========================================================================
export async function getFoods(userId: string, search?: string): Promise<Food[]> {
  let query = getSupabaseClient()
    .from('foods')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('name');
  if (search?.trim()) query = query.ilike('name', `%${search.trim()}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export interface FoodInput {
  name: string;
  servingSize?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function createFood(userId: string, input: FoodInput): Promise<Food> {
  const { data, error } = await getSupabaseClient()
    .from('foods')
    .insert({
      user_id: userId,
      name: input.name,
      serving_size: input.servingSize ?? null,
      calories: input.calories,
      protein: input.protein,
      carbs: input.carbs,
      fat: input.fat,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFood(foodId: string, patch: Partial<FoodInput>): Promise<Food> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.servingSize !== undefined) dbPatch.serving_size = patch.servingSize;
  if (patch.calories !== undefined) dbPatch.calories = patch.calories;
  if (patch.protein !== undefined) dbPatch.protein = patch.protein;
  if (patch.carbs !== undefined) dbPatch.carbs = patch.carbs;
  if (patch.fat !== undefined) dbPatch.fat = patch.fat;
  const { data, error } = await getSupabaseClient().from('foods').update(dbPatch).eq('id', foodId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFood(foodId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('foods').delete().eq('id', foodId);
  if (error) throw error;
}

export async function toggleFavoriteFood(foodId: string, isFavorite: boolean): Promise<void> {
  const { error } = await getSupabaseClient().from('foods').update({ is_favorite: isFavorite }).eq('id', foodId);
  if (error) throw error;
}

export interface FoodEntryInput {
  foodId?: string | null;
  name: string;
  mealType: MealType;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  entryDate: string;
}

export async function createFoodEntry(userId: string, input: FoodEntryInput): Promise<FoodEntry> {
  const { data, error } = await getSupabaseClient()
    .from('food_entries')
    .insert({
      user_id: userId,
      food_id: input.foodId ?? null,
      name: input.name,
      meal_type: input.mealType,
      quantity: input.quantity,
      calories: input.calories,
      protein: input.protein,
      carbs: input.carbs,
      fat: input.fat,
      notes: input.notes ?? null,
      entry_date: input.entryDate,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFoodEntry(entryId: string, patch: Partial<FoodEntryInput>): Promise<FoodEntry> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.mealType !== undefined) dbPatch.meal_type = patch.mealType;
  if (patch.quantity !== undefined) dbPatch.quantity = patch.quantity;
  if (patch.calories !== undefined) dbPatch.calories = patch.calories;
  if (patch.protein !== undefined) dbPatch.protein = patch.protein;
  if (patch.carbs !== undefined) dbPatch.carbs = patch.carbs;
  if (patch.fat !== undefined) dbPatch.fat = patch.fat;
  if (patch.notes !== undefined) dbPatch.notes = patch.notes;
  if (patch.name !== undefined) dbPatch.name = patch.name;
  const { data, error } = await getSupabaseClient().from('food_entries').update(dbPatch).eq('id', entryId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFoodEntry(entryId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('food_entries').delete().eq('id', entryId);
  if (error) throw error;
}

export async function getFoodEntriesForDate(userId: string, date: string): Promise<FoodEntry[]> {
  const { data, error } = await getSupabaseClient()
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', date)
    .order('logged_at');
  if (error) throw error;
  return data ?? [];
}

export function sumNutrition(entries: FoodEntry[]): DailyNutritionTotals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + Number(e.calories),
      protein: acc.protein + Number(e.protein),
      carbs: acc.carbs + Number(e.carbs),
      fat: acc.fat + Number(e.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export async function getNutritionTrend(
  userId: string,
  fromDate: string,
  toDate: string
): Promise<{ date: string; calories: number; protein: number; carbs: number; fat: number }[]> {
  const { data, error } = await getSupabaseClient()
    .from('food_entries')
    .select('entry_date, calories, protein, carbs, fat')
    .eq('user_id', userId)
    .gte('entry_date', fromDate)
    .lte('entry_date', toDate);
  if (error) throw error;

  const byDate = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
  for (const row of data ?? []) {
    const cur = byDate.get(row.entry_date) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
    cur.calories += Number(row.calories);
    cur.protein += Number(row.protein);
    cur.carbs += Number(row.carbs);
    cur.fat += Number(row.fat);
    byDate.set(row.entry_date, cur);
  }

  return Array.from(byDate.entries())
    .map(([date, totals]) => ({ date, ...totals }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// =========================================================================
// HYDRATION
// =========================================================================
export async function getWaterEntriesForDate(userId: string, date: string): Promise<WaterEntry[]> {
  // logged_at is a UTC timestamp; convert the caller's local calendar date
  // into the correct UTC instant range rather than assuming date === UTC day.
  const startIso = new Date(`${date}T00:00:00`).toISOString();
  const endIso = new Date(`${date}T23:59:59.999`).toISOString();
  const { data, error } = await getSupabaseClient()
    .from('water_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', startIso)
    .lte('logged_at', endIso)
    .order('logged_at');
  if (error) throw error;
  return data ?? [];
}

export async function addWaterEntry(userId: string, amountMl: number): Promise<WaterEntry> {
  const { data, error } = await getSupabaseClient()
    .from('water_entries')
    .insert({ user_id: userId, amount_ml: amountMl })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWaterEntry(entryId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('water_entries').delete().eq('id', entryId);
  if (error) throw error;
}

export async function getWaterTrend(
  userId: string,
  fromDate: string,
  toDate: string
): Promise<{ date: string; amount_ml: number }[]> {
  // Pad the UTC query range by a day on each side so entries near local
  // midnight aren't dropped, then bucket by the entry's actual local date.
  const { data, error } = await getSupabaseClient()
    .from('water_entries')
    .select('logged_at, amount_ml')
    .eq('user_id', userId)
    .gte('logged_at', new Date(`${addDaysLocal(fromDate, -1)}T00:00:00`).toISOString())
    .lte('logged_at', new Date(`${addDaysLocal(toDate, 1)}T23:59:59.999`).toISOString());
  if (error) throw error;

  const byDate = new Map<string, number>();
  for (const row of data ?? []) {
    const key = toLocalDateStr(new Date(row.logged_at));
    if (key < fromDate || key > toDate) continue;
    byDate.set(key, (byDate.get(key) ?? 0) + row.amount_ml);
  }
  return Array.from(byDate.entries())
    .map(([date, amount_ml]) => ({ date, amount_ml }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// =========================================================================
// BODY MEASUREMENTS
// =========================================================================
export async function getBodyMeasurements(userId: string, fromDate?: string): Promise<BodyMeasurement[]> {
  let query = getSupabaseClient()
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('measured_date', { ascending: true });
  if (fromDate) query = query.gte('measured_date', fromDate);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export interface BodyMeasurementInput {
  measuredDate: string;
  weightKg?: number | null;
  bodyFatPct?: number | null;
  waistCm?: number | null;
  chestCm?: number | null;
  armsCm?: number | null;
  thighsCm?: number | null;
  notes?: string | null;
}

export async function upsertBodyMeasurement(userId: string, input: BodyMeasurementInput): Promise<BodyMeasurement> {
  const { data, error } = await getSupabaseClient()
    .from('body_measurements')
    .upsert(
      {
        user_id: userId,
        measured_date: input.measuredDate,
        weight_kg: input.weightKg ?? null,
        body_fat_pct: input.bodyFatPct ?? null,
        waist_cm: input.waistCm ?? null,
        chest_cm: input.chestCm ?? null,
        arms_cm: input.armsCm ?? null,
        thighs_cm: input.thighsCm ?? null,
        notes: input.notes ?? null,
      },
      { onConflict: 'user_id,measured_date' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBodyMeasurement(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from('body_measurements').delete().eq('id', id);
  if (error) throw error;
}

// =========================================================================
// DATA EXPORT
// =========================================================================
export async function exportUserData(userId: string) {
  const supabase = getSupabaseClient();
  const [profile, exercises, workouts, templates, foods, foodEntries, waterEntries, measurements] = await Promise.all([
    getProfile(userId),
    supabase.from('exercises').select('*').eq('user_id', userId).then((r) => r.data ?? []),
    getWorkoutHistory(userId),
    getTemplates(userId),
    supabase.from('foods').select('*').eq('user_id', userId).then((r) => r.data ?? []),
    supabase.from('food_entries').select('*').eq('user_id', userId).order('entry_date').then((r) => r.data ?? []),
    supabase.from('water_entries').select('*').eq('user_id', userId).order('logged_at').then((r) => r.data ?? []),
    getBodyMeasurements(userId),
  ]);

  return { profile, exercises, workouts, templates, foods, foodEntries, waterEntries, measurements, exportedAt: new Date().toISOString() };
}

// =========================================================================
// CALENDAR
// =========================================================================
export interface DayActivity {
  hasWorkout: boolean;
  hasNutritionLogged: boolean;
  waterGoalMet: boolean;
  hasPR: boolean;
}

export async function getMonthActivity(
  userId: string,
  monthStartIso: string,
  monthEndIso: string,
  waterGoalMl: number
): Promise<Record<string, DayActivity>> {
  const supabase = getSupabaseClient();
  const [{ data: workouts }, { data: foodEntries }, { data: waterEntries }] = await Promise.all([
    supabase.from('workout_sessions').select('workout_date').eq('user_id', userId).gte('workout_date', monthStartIso).lte('workout_date', monthEndIso).not('ended_at', 'is', null),
    supabase.from('food_entries').select('entry_date').eq('user_id', userId).gte('entry_date', monthStartIso).lte('entry_date', monthEndIso),
    supabase
      .from('water_entries')
      .select('logged_at, amount_ml')
      .eq('user_id', userId)
      .gte('logged_at', new Date(`${addDaysLocal(monthStartIso, -1)}T00:00:00`).toISOString())
      .lte('logged_at', new Date(`${addDaysLocal(monthEndIso, 1)}T23:59:59.999`).toISOString()),
  ]);

  const result: Record<string, DayActivity> = {};
  const ensure = (date: string) => {
    if (!result[date]) result[date] = { hasWorkout: false, hasNutritionLogged: false, waterGoalMet: false, hasPR: false };
    return result[date];
  };

  for (const w of workouts ?? []) ensure(w.workout_date).hasWorkout = true;
  for (const f of foodEntries ?? []) ensure(f.entry_date).hasNutritionLogged = true;

  const waterByDate = new Map<string, number>();
  for (const w of waterEntries ?? []) {
    const key = toLocalDateStr(new Date(w.logged_at));
    if (key < monthStartIso || key > monthEndIso) continue;
    waterByDate.set(key, (waterByDate.get(key) ?? 0) + w.amount_ml);
  }
  for (const [date, total] of Array.from(waterByDate.entries())) {
    ensure(date).waterGoalMet = total >= waterGoalMl;
  }

  return result;
}
