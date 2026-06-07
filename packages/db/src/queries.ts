import { getSupabaseClient } from './client';
import type {
  Exercise,
  PersonalRecord,
  StrengthDataPoint,
  WorkoutSession,
  WorkoutSessionWithDetails,
  WorkoutSet,
} from './types';
import { calculateOneRepMax, calculateVolume } from '@fit-n-fatal/utils';

export async function getExercises(search?: string): Promise<Exercise[]> {
  let query = getSupabaseClient()
    .from('exercises')
    .select('*')
    .order('name');

  if (search?.trim()) {
    query = query.ilike('name', `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createCustomExercise(
  userId: string,
  name: string,
  muscleGroup: string,
  equipment?: string
): Promise<Exercise> {
  const { data, error } = await getSupabaseClient()
    .from('exercises')
    .insert({
      user_id: userId,
      name,
      muscle_group: muscleGroup,
      equipment: equipment ?? null,
      is_custom: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLastUsedWeight(
  userId: string,
  exerciseId: string
): Promise<number | null> {
  const sessions = await getWorkoutHistory(userId, { exerciseId });
  for (const session of sessions) {
    for (const we of session.workout_exercises) {
      if (we.exercise_id !== exerciseId) continue;
      const workingSets = we.sets.filter((s) => !s.is_warmup);
      if (workingSets.length > 0) {
        return workingSets[workingSets.length - 1].weight;
      }
    }
  }
  return null;
}

export async function startWorkoutSession(userId: string): Promise<WorkoutSession> {
  const { data, error } = await getSupabaseClient()
    .from('workout_sessions')
    .insert({ user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endWorkoutSession(sessionId: string): Promise<WorkoutSession> {
  const { data, error } = await getSupabaseClient()
    .from('workout_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveSession(userId: string): Promise<WorkoutSessionWithDetails | null> {
  const { data, error } = await getSupabaseClient()
    .from('workout_sessions')
    .select(`
      *,
      workout_exercises (
        *,
        exercise:exercises (*),
        sets:workout_sets (*)
      )
    `)
    .eq('user_id', userId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    workout_exercises: (data.workout_exercises ?? []).map((we: WorkoutSessionWithDetails['workout_exercises'][0]) => ({
      ...we,
      sets: (we.sets ?? []).sort((a, b) => a.set_number - b.set_number),
    })),
  };
}

export async function addExerciseToSession(
  sessionId: string,
  exerciseId: string,
  orderIndex: number
) {
  const { data, error } = await getSupabaseClient()
    .from('workout_exercises')
    .insert({ session_id: sessionId, exercise_id: exerciseId, order_index: orderIndex })
    .select(`*, exercise:exercises (*)`)
    .single();

  if (error) throw error;
  return data;
}

export async function logSet(
  workoutExerciseId: string,
  setNumber: number,
  reps: number,
  weight: number,
  rpe?: number,
  isWarmup = false
): Promise<WorkoutSet> {
  const { data, error } = await getSupabaseClient()
    .from('workout_sets')
    .insert({
      workout_exercise_id: workoutExerciseId,
      set_number: setNumber,
      reps,
      weight,
      rpe: rpe ?? null,
      is_warmup: isWarmup,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWorkoutHistory(
  userId: string,
  options?: { exerciseId?: string; fromDate?: string; toDate?: string }
): Promise<WorkoutSessionWithDetails[]> {
  let query = getSupabaseClient()
    .from('workout_sessions')
    .select(`
      *,
      workout_exercises (
        *,
        exercise:exercises (*),
        sets:workout_sets (*)
      )
    `)
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false });

  if (options?.fromDate) {
    query = query.gte('started_at', options.fromDate);
  }
  if (options?.toDate) {
    query = query.lte('started_at', options.toDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  let sessions = (data ?? []) as WorkoutSessionWithDetails[];

  if (options?.exerciseId) {
    sessions = sessions
      .map((s) => ({
        ...s,
        workout_exercises: s.workout_exercises.filter((we) => we.exercise_id === options.exerciseId),
      }))
      .filter((s) => s.workout_exercises.length > 0);
  }

  return sessions.map((s) => ({
    ...s,
    workout_exercises: s.workout_exercises.map((we) => ({
      ...we,
      sets: (we.sets ?? []).sort((a, b) => a.set_number - b.set_number),
    })),
  }));
}

export async function getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  const sessions = await getWorkoutHistory(userId);
  const prMap = new Map<string, PersonalRecord>();

  for (const session of sessions) {
    for (const we of session.workout_exercises) {
      for (const set of we.sets.filter((s) => !s.is_warmup)) {
        const existing = prMap.get(we.exercise_id);
        const oneRm = calculateOneRepMax(set.weight, set.reps);

        if (!existing || set.weight > existing.max_weight) {
          prMap.set(we.exercise_id, {
            exercise_id: we.exercise_id,
            exercise_name: we.exercise.name,
            max_weight: set.weight,
            reps_at_max: set.reps,
            estimated_1rm: oneRm,
            achieved_at: session.started_at,
          });
        } else if (set.weight === existing.max_weight && oneRm > existing.estimated_1rm) {
          prMap.set(we.exercise_id, {
            ...existing,
            reps_at_max: set.reps,
            estimated_1rm: oneRm,
          });
        }
      }
    }
  }

  return Array.from(prMap.values()).sort((a, b) => b.max_weight - a.max_weight);
}

export async function getStrengthCurve(
  userId: string,
  exerciseId: string,
  fromDate?: string
): Promise<StrengthDataPoint[]> {
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
      date: session.started_at.split('T')[0],
      max_weight: maxWeight,
      total_volume: totalVolume,
      estimated_1rm: calculateOneRepMax(bestSet.weight, bestSet.reps),
    });
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}
