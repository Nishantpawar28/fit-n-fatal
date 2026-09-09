import { getSupabaseClient } from './client';
import type {
  BodyMeasurement,
  DailyNutritionTotals,
  Exercise,
  ExerciseType,
  Food,
  FoodEntry,
  Goal,
  GoalType,
  MealType,
  PersonalRecord,
  Profile,
  ProgressPhoto,
  StrengthDataPoint,
  WaterEntry,
  WorkoutSession,
  WorkoutSessionWithDetails,
  WorkoutSet,
  WorkoutStats,
  WorkoutTemplate,
  WorkoutType,
} from './types';
import { calculateOneRepMax, calculateVolume, startOfDay, toLocalDateStr, addDaysLocal } from '@fit-n-fatal/utils';

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
  const sessions = await getWorkoutHistory(userId, { exerciseId });
  for (const session of sessions) {
    const we = session.workout_exercises.find((e) => e.exercise_id === exerciseId);
    if (we && we.sets.length > 0) {
      return { date: session.started_at, sets: we.sets };
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
  const history = await getWorkoutHistory(userId, {});
  const last = history[0];
  if (!last) return null;

  const session = await startWorkoutSession(userId, {
    workoutType: last.workout_type,
    name: last.name ?? undefined,
  });

  for (const we of last.workout_exercises.sort((a, b) => a.order_index - b.order_index)) {
    const newWe = await addExerciseToSession(session.id, we.exercise_id, we.order_index);
    const workingSets = we.sets.filter((s) => !s.is_warmup);
    for (const s of workingSets) {
      await logSet(newWe.id, s.set_number, { reps: s.reps, weight: s.weight, rpe: s.rpe ?? undefined, completed: false });
    }
  }

  return session;
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
  const sessions = await getWorkoutHistory(userId);
  const now = new Date();
  // Compare local-calendar-date strings throughout (not Date objects) —
  // workout_date is a plain DATE column representing the user's local day,
  // and parsing it back into a Date would reinterpret it as UTC midnight,
  // which drifts against local "today"/"this week" boundaries by timezone.
  const todayStr = toLocalDateStr(now);
  const weekStartDate = startOfDay(new Date(now));
  weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay());
  const weekStartStr = toLocalDateStr(weekStartDate);
  const monthStartStr = toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1));

  let workoutsThisWeek = 0;
  let workoutsThisMonth = 0;
  let totalSets = 0;
  let totalDurationMinutes = 0;
  const daysWithWorkouts = new Set<string>();

  for (const s of sessions) {
    if (s.workout_date >= weekStartStr) workoutsThisWeek++;
    if (s.workout_date >= monthStartStr) workoutsThisMonth++;
    daysWithWorkouts.add(s.workout_date);
    totalSets += s.workout_exercises.reduce((sum, we) => sum + we.sets.length, 0);
    if (s.duration_minutes) {
      totalDurationMinutes += s.duration_minutes;
    } else if (s.ended_at) {
      totalDurationMinutes += Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000);
    }
  }

  // Streak: consecutive days (from today or yesterday) with a workout
  let streak = 0;
  let cursorStr = todayStr;
  if (!daysWithWorkouts.has(cursorStr)) cursorStr = addDaysLocal(cursorStr, -1);
  while (daysWithWorkouts.has(cursorStr)) {
    streak++;
    cursorStr = addDaysLocal(cursorStr, -1);
  }

  return {
    workoutsThisWeek,
    workoutsThisMonth,
    currentStreak: streak,
    totalSessions: sessions.length,
    totalDurationMinutes,
    totalSets,
  };
}

export async function getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  const sessions = await getWorkoutHistory(userId);
  const prMap = new Map<string, PersonalRecord>();

  for (const session of sessions) {
    for (const we of session.workout_exercises) {
      const workingSets = we.sets.filter((s) => !s.is_warmup);
      if (workingSets.length === 0) continue;

      const sessionVolume = workingSets.reduce((sum, s) => sum + calculateVolume(s.reps, s.weight), 0);
      let existing = prMap.get(we.exercise_id);

      for (const set of workingSets) {
        const oneRm = calculateOneRepMax(set.weight, set.reps);
        if (!existing) {
          existing = {
            exercise_id: we.exercise_id,
            exercise_name: we.exercise.name,
            max_weight: set.weight,
            reps_at_max: set.reps,
            estimated_1rm: oneRm,
            max_volume_session: sessionVolume,
            best_reps_at_weight: { weight: set.weight, reps: set.reps },
            achieved_at: session.started_at,
          };
        } else {
          if (set.weight > existing.max_weight || (set.weight === existing.max_weight && set.reps > existing.reps_at_max)) {
            existing = { ...existing, max_weight: set.weight, reps_at_max: set.reps, achieved_at: session.started_at };
          }
          if (oneRm > existing.estimated_1rm) {
            existing = { ...existing, estimated_1rm: oneRm };
          }
          if (set.reps > existing.best_reps_at_weight.reps) {
            existing = { ...existing, best_reps_at_weight: { weight: set.weight, reps: set.reps } };
          }
        }
      }

      if (existing) {
        existing.max_volume_session = Math.max(existing.max_volume_session, sessionVolume);
        prMap.set(we.exercise_id, existing);
      }
    }
  }

  return Array.from(prMap.values()).sort((a, b) => b.max_weight - a.max_weight);
}

export async function getStrengthCurve(userId: string, exerciseId: string, fromDate?: string): Promise<StrengthDataPoint[]> {
  const sessions = await getWorkoutHistory(userId, { exerciseId, fromDate });
  const points: StrengthDataPoint[] = [];

  for (const session of sessions) {
    const we = session.workout_exercises.find((e) => e.exercise_id === exerciseId);
    if (!we) continue;

    const workingSets = we.sets.filter((s) => !s.is_warmup);
    if (workingSets.length === 0) continue;

    const maxWeight = Math.max(...workingSets.map((s) => s.weight));
    const bestSet = workingSets.find((s) => s.weight === maxWeight)!;
    const totalVolume = workingSets.reduce((sum, s) => sum + calculateVolume(s.reps, s.weight), 0);

    points.push({
      date: session.workout_date,
      max_weight: maxWeight,
      reps_at_max: bestSet.reps,
      total_volume: totalVolume,
      estimated_1rm: calculateOneRepMax(bestSet.weight, bestSet.reps),
    });
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
  for (const te of template.exercises ?? []) {
    await addExerciseToSession(session.id, te.exercise_id, te.order_index);
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
// BODY MEASUREMENTS + PROGRESS PHOTOS
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

export async function getProgressPhotos(userId: string): Promise<ProgressPhoto[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', userId)
    .order('taken_date', { ascending: false });
  if (error) throw error;

  const withUrls = await Promise.all(
    (data ?? []).map(async (p) => {
      const { data: signed } = await supabase.storage.from('progress-photos').createSignedUrl(p.photo_path, 3600);
      return { ...p, url: signed?.signedUrl };
    })
  );
  return withUrls;
}

export async function uploadProgressPhoto(userId: string, file: File, takenDate: string, notes?: string): Promise<ProgressPhoto> {
  const supabase = getSupabaseClient();
  const path = `${userId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from('progress-photos').upload(path, file);
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('progress_photos')
    .insert({ user_id: userId, photo_path: path, taken_date: takenDate, notes: notes ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProgressPhoto(photo: ProgressPhoto): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.storage.from('progress-photos').remove([photo.photo_path]);
  const { error } = await supabase.from('progress_photos').delete().eq('id', photo.id);
  if (error) throw error;
}

// =========================================================================
// GOALS
// =========================================================================
export async function getGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await getSupabaseClient()
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface GoalInput {
  type: GoalType;
  title: string;
  targetValue: number;
  currentValue?: number;
  unit: string;
  exerciseId?: string;
  deadline?: string;
}

export async function createGoal(userId: string, input: GoalInput): Promise<Goal> {
  const { data, error } = await getSupabaseClient()
    .from('goals')
    .insert({
      user_id: userId,
      type: input.type,
      title: input.title,
      target_value: input.targetValue,
      current_value: input.currentValue ?? 0,
      unit: input.unit,
      exercise_id: input.exerciseId ?? null,
      deadline: input.deadline ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateGoalProgress(goalId: string, currentValue: number, target: number): Promise<Goal> {
  const completed = currentValue >= target;
  const { data, error } = await getSupabaseClient()
    .from('goals')
    .update({
      current_value: currentValue,
      status: completed ? 'completed' : 'active',
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', goalId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('goals').delete().eq('id', goalId);
  if (error) throw error;
}

// =========================================================================
// DATA EXPORT
// =========================================================================
export async function exportUserData(userId: string) {
  const supabase = getSupabaseClient();
  const [profile, exercises, workouts, templates, foods, foodEntries, waterEntries, measurements, goals] = await Promise.all([
    getProfile(userId),
    supabase.from('exercises').select('*').eq('user_id', userId).then((r) => r.data ?? []),
    getWorkoutHistory(userId),
    getTemplates(userId),
    supabase.from('foods').select('*').eq('user_id', userId).then((r) => r.data ?? []),
    supabase.from('food_entries').select('*').eq('user_id', userId).order('entry_date').then((r) => r.data ?? []),
    supabase.from('water_entries').select('*').eq('user_id', userId).order('logged_at').then((r) => r.data ?? []),
    getBodyMeasurements(userId),
    getGoals(userId),
  ]);

  return { profile, exercises, workouts, templates, foods, foodEntries, waterEntries, measurements, goals, exportedAt: new Date().toISOString() };
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
