import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computePersonalRecords, computeWorkoutStats, type SlimSession, type StatsSession } from '../src/workout-stats';
import { filterExercises } from '../src/search';
import { toLocalDateStr, addDaysLocal } from '../src/dates';

const set = (weight: number, reps: number, is_warmup = false) => ({ weight, reps, is_warmup });

test('PRs: max weight, 1RM, best reps and session volume per exercise', () => {
  const sessions: SlimSession[] = [
    // newest first
    {
      started_at: '2026-11-20T10:00:00Z',
      workout_exercises: [{ exercise_id: 'bench', exercise_name: 'Bench', sets: [set(100, 3), set(60, 12, true)] }],
    },
    {
      started_at: '2026-11-10T10:00:00Z',
      workout_exercises: [{ exercise_id: 'bench', exercise_name: 'Bench', sets: [set(80, 10), set(80, 8)] }],
    },
  ];
  const [bench] = computePersonalRecords(sessions);
  assert.equal(bench.max_weight, 100);
  assert.equal(bench.reps_at_max, 3);
  assert.equal(bench.achieved_at, '2026-11-20T10:00:00Z');
  // Epley: 100 × (1 + 3/30) = 110 is higher than 80 × (1 + 10/30) = 106.7
  assert.equal(bench.estimated_1rm, 110);
  assert.deepEqual(bench.best_reps_at_weight, { weight: 80, reps: 10 }); // warm-up 12 reps ignored
  assert.equal(bench.max_volume_session, 80 * 10 + 80 * 8);
});

test('PRs: warm-up-only exercises are skipped; result sorted by max weight', () => {
  const prs = computePersonalRecords([
    {
      started_at: '2026-11-01T00:00:00Z',
      workout_exercises: [
        { exercise_id: 'curl', exercise_name: 'Curl', sets: [set(20, 10)] },
        { exercise_id: 'squat', exercise_name: 'Squat', sets: [set(140, 5)] },
        { exercise_id: 'warm', exercise_name: 'Warm', sets: [set(10, 10, true)] },
      ],
    },
  ]);
  assert.deepEqual(prs.map((p) => p.exercise_id), ['squat', 'curl']);
});

test('PRs: numeric strings from Postgres DECIMAL are handled', () => {
  const prs = computePersonalRecords([
    { started_at: 'x', workout_exercises: [{ exercise_id: 'a', exercise_name: 'A', sets: [{ weight: '52.50' as unknown as number, reps: 5, is_warmup: null }] }] },
  ]);
  assert.equal(prs[0].max_weight, 52.5);
});

test('Stats: counts, sets, duration and streak', () => {
  const now = new Date(2026, 10, 24, 12); // Tue 24 Nov 2026, local time
  const today = toLocalDateStr(now);
  const s = (date: string, sets: number, duration: number | null = 30): StatsSession => ({
    workout_date: date,
    started_at: `${date}T10:00:00Z`,
    ended_at: `${date}T10:45:00Z`,
    duration_minutes: duration,
    set_count: sets,
  });
  const stats = computeWorkoutStats(
    [s(today, 10), s(addDaysLocal(today, -1), 8), s(addDaysLocal(today, -2), 6, null), s(addDaysLocal(today, -40), 5)],
    now
  );
  assert.equal(stats.totalSessions, 4);
  assert.equal(stats.totalSets, 29);
  assert.equal(stats.currentStreak, 3);
  assert.equal(stats.totalDurationMinutes, 30 + 30 + 45 + 30);
  assert.equal(stats.workoutsThisWeek, 3); // week starts Sunday 22 Nov
});

test('Stats: streak still counts if you have not trained yet today', () => {
  const now = new Date(2026, 10, 24, 8);
  const y = addDaysLocal(toLocalDateStr(now), -1);
  const stats = computeWorkoutStats(
    [{ workout_date: y, started_at: '', ended_at: null, duration_minutes: null, set_count: 1 }],
    now
  );
  assert.equal(stats.currentStreak, 1);
});

test('Search: every word must match; name-prefix ranks first; muscle filter', () => {
  const lib = [
    { name: 'Archer Pull-Up', muscle_group: 'Back', equipment: 'Bar' },
    { name: 'Pull-Up', muscle_group: 'Back', equipment: 'Bar' },
    { name: 'Wide-Grip Pull-Up', muscle_group: 'Back', equipment: 'Bar' },
    { name: 'Push-Up', muscle_group: 'Chest', equipment: 'Bodyweight' },
  ];
  assert.deepEqual(filterExercises(lib, 'pull').map((e) => e.name), ['Pull-Up', 'Archer Pull-Up', 'Wide-Grip Pull-Up']);
  assert.deepEqual(filterExercises(lib, 'pull wide').map((e) => e.name), ['Wide-Grip Pull-Up']);
  assert.deepEqual(filterExercises(lib, 'chest').map((e) => e.name), ['Push-Up']);
  assert.equal(filterExercises(lib, '', 'Chest').length, 1);
  assert.equal(filterExercises(lib, '   ').length, 4);
});
