import { calculateOneRepMax, calculateVolume } from './weight';
import { addDaysLocal, startOfDay, toLocalDateStr } from './dates';

// Pure helpers that turn a *slim* projection of workout history into the
// numbers the app shows. Keeping them here (not in packages/db) means they
// can be unit-tested without a database and reused by web + mobile.

export interface SlimSet {
  weight: number;
  reps: number;
  is_warmup: boolean | null;
}

export interface SlimWorkoutExercise {
  exercise_id: string;
  exercise_name: string;
  sets: SlimSet[];
}

export interface SlimSession {
  started_at: string;
  workout_exercises: SlimWorkoutExercise[];
}

export interface PersonalRecordResult {
  exercise_id: string;
  exercise_name: string;
  max_weight: number;
  reps_at_max: number;
  estimated_1rm: number;
  max_volume_session: number;
  best_reps_at_weight: { weight: number; reps: number };
  achieved_at: string;
}

/**
 * Sessions must be ordered newest first (same order getWorkoutHistory uses),
 * so ties resolve to the most recent session exactly as before.
 */
export function computePersonalRecords(sessions: SlimSession[]): PersonalRecordResult[] {
  const prMap = new Map<string, PersonalRecordResult>();

  for (const session of sessions) {
    for (const we of session.workout_exercises) {
      const workingSets = we.sets.filter((s) => !s.is_warmup);
      if (workingSets.length === 0) continue;

      const sessionVolume = workingSets.reduce((sum, s) => sum + calculateVolume(s.reps, Number(s.weight)), 0);
      let existing = prMap.get(we.exercise_id);

      for (const set of workingSets) {
        const weight = Number(set.weight);
        const oneRm = calculateOneRepMax(weight, set.reps);
        if (!existing) {
          existing = {
            exercise_id: we.exercise_id,
            exercise_name: we.exercise_name,
            max_weight: weight,
            reps_at_max: set.reps,
            estimated_1rm: oneRm,
            max_volume_session: sessionVolume,
            best_reps_at_weight: { weight, reps: set.reps },
            achieved_at: session.started_at,
          };
        } else {
          if (weight > existing.max_weight || (weight === existing.max_weight && set.reps > existing.reps_at_max)) {
            existing = { ...existing, max_weight: weight, reps_at_max: set.reps, achieved_at: session.started_at };
          }
          if (oneRm > existing.estimated_1rm) existing = { ...existing, estimated_1rm: oneRm };
          if (set.reps > existing.best_reps_at_weight.reps) {
            existing = { ...existing, best_reps_at_weight: { weight, reps: set.reps } };
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

export interface StatsSession {
  workout_date: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  set_count: number;
}

export interface WorkoutStatsResult {
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  currentStreak: number;
  totalSessions: number;
  totalDurationMinutes: number;
  totalSets: number;
}

export function computeWorkoutStats(sessions: StatsSession[], now: Date = new Date()): WorkoutStatsResult {
  // Compare local-calendar-date strings (workout_date is a plain DATE).
  const todayStr = toLocalDateStr(now);
  const weekStartDate = startOfDay(new Date(now));
  weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay());
  const weekStartStr = toLocalDateStr(weekStartDate);
  const monthStartStr = toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1));

  let workoutsThisWeek = 0;
  let workoutsThisMonth = 0;
  let totalSets = 0;
  let totalDurationMinutes = 0;
  const days = new Set<string>();

  for (const s of sessions) {
    if (s.workout_date >= weekStartStr) workoutsThisWeek++;
    if (s.workout_date >= monthStartStr) workoutsThisMonth++;
    days.add(s.workout_date);
    totalSets += s.set_count;
    if (s.duration_minutes) totalDurationMinutes += s.duration_minutes;
    else if (s.ended_at) {
      totalDurationMinutes += Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000);
    }
  }

  let streak = 0;
  let cursor = todayStr;
  if (!days.has(cursor)) cursor = addDaysLocal(cursor, -1);
  while (days.has(cursor)) {
    streak++;
    cursor = addDaysLocal(cursor, -1);
  }

  return { workoutsThisWeek, workoutsThisMonth, currentStreak: streak, totalSessions: sessions.length, totalDurationMinutes, totalSets };
}
