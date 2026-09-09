'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import {
  getActiveSession,
  getPersonalRecords,
  getWorkoutStats,
  getWorkoutHistory,
  getFoodEntriesForDate,
  getWaterEntriesForDate,
  getGoals,
  sumNutrition,
} from '@fit-n-fatal/db';
import { Card, Button, Badge, ProgressRing, ProgressBar } from '@/components/ui';
import { formatDate, formatWater, toLocalDateStr } from '@fit-n-fatal/utils';
import { useProfile } from '@/lib/use-profile';

const todayStr = () => toLocalDateStr();

export default function DashboardPage() {
  const { userId, profile } = useProfile();
  const today = todayStr();

  const { data: activeSession } = useQuery({
    queryKey: ['activeSession', userId],
    queryFn: () => getActiveSession(userId!),
    enabled: !!userId,
  });

  const { data: history } = useQuery({
    queryKey: ['history', userId],
    queryFn: () => getWorkoutHistory(userId!),
    enabled: !!userId,
  });

  const { data: stats } = useQuery({
    queryKey: ['workoutStats', userId],
    queryFn: () => getWorkoutStats(userId!),
    enabled: !!userId,
  });

  const { data: prs } = useQuery({
    queryKey: ['prs', userId],
    queryFn: () => getPersonalRecords(userId!),
    enabled: !!userId,
  });

  const { data: foodEntries } = useQuery({
    queryKey: ['foodEntries', userId, today],
    queryFn: () => getFoodEntriesForDate(userId!, today),
    enabled: !!userId,
  });

  const { data: waterEntries } = useQuery({
    queryKey: ['waterEntries', userId, today],
    queryFn: () => getWaterEntriesForDate(userId!, today),
    enabled: !!userId,
  });

  const { data: goals } = useQuery({
    queryKey: ['goals', userId],
    queryFn: () => getGoals(userId!),
    enabled: !!userId,
  });

  const nutrition = sumNutrition(foodEntries ?? []);
  const waterTotal = (waterEntries ?? []).reduce((s, w) => s + w.amount_ml, 0);
  const calorieGoal = profile?.daily_calorie_goal ?? 2200;
  const proteinGoal = profile?.daily_protein_goal ?? 150;
  const waterGoal = profile?.daily_water_goal_ml ?? 3000;
  const waterUnit = profile?.water_unit ?? 'ml';

  const todaysWorkout = useMemo(() => history?.find((h) => h.workout_date === today), [history, today]);
  const todaysSets = todaysWorkout ? todaysWorkout.workout_exercises.reduce((s, we) => s + we.sets.length, 0) : 0;
  const todaysReps = todaysWorkout
    ? todaysWorkout.workout_exercises.reduce((s, we) => s + we.sets.reduce((r, set) => r + set.reps, 0), 0)
    : 0;
  const todaysVolume = todaysWorkout
    ? todaysWorkout.workout_exercises.reduce((s, we) => s + we.sets.reduce((v, set) => v + set.weight * set.reps, 0), 0)
    : 0;

  const weeklyChart = useMemo(() => {
    const days: { day: string; sets: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toLocalDateStr(d);
      const session = history?.find((h) => h.workout_date === key);
      const sets = session ? session.workout_exercises.reduce((s, we) => s + we.sets.length, 0) : 0;
      days.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' })[0], sets });
    }
    return days;
  }, [history]);

  const activeGoals = (goals ?? []).filter((g) => g.status === 'active').slice(0, 3);
  const topPRs = (prs ?? []).slice(0, 3);

  const firstName = profile?.display_name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-fnf-text mb-1">
        {greeting}, {firstName} 👋
      </h2>
      <p className="text-fnf-muted text-sm mb-6">Here&apos;s your training overview for today</p>

      {/* Today's summary rings */}
      <Card className="mb-6">
        <p className="text-fnf-muted text-xs uppercase tracking-wider mb-4">Today&apos;s Summary</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center">
            <ProgressRing
              value={nutrition.calories}
              max={calorieGoal}
              color="#C84BFF"
              label={`${Math.round(nutrition.calories)}`}
              sublabel={`/ ${calorieGoal} kcal`}
            />
            <p className="text-fnf-muted text-xs mt-2">Calories</p>
          </div>
          <div className="flex flex-col items-center">
            <ProgressRing
              value={nutrition.protein}
              max={proteinGoal}
              color="#FF6BAA"
              label={`${Math.round(nutrition.protein)}g`}
              sublabel={`/ ${proteinGoal}g`}
            />
            <p className="text-fnf-muted text-xs mt-2">Protein</p>
          </div>
          <div className="flex flex-col items-center">
            <ProgressRing
              value={waterTotal}
              max={waterGoal}
              color="#3FC5FF"
              label={formatWater(waterTotal, waterUnit)}
              sublabel={`/ ${formatWater(waterGoal, waterUnit)}`}
            />
            <p className="text-fnf-muted text-xs mt-2">Water</p>
          </div>
          <div className="flex flex-col items-center">
            <ProgressRing
              value={todaysWorkout ? 1 : 0}
              max={1}
              color="#00FFA0"
              label={todaysWorkout ? '✓' : '—'}
              sublabel={todaysWorkout ? 'Done' : 'Pending'}
            />
            <p className="text-fnf-muted text-xs mt-2">Workout</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          {activeSession ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <p className="font-medium text-fnf-text">Workout in progress</p>
                <Badge color="pink">Active</Badge>
              </div>
              <p className="text-fnf-muted text-sm mb-4">Started {formatDate(activeSession.started_at)}</p>
              <Link href="/dashboard/workout"><Button>Continue Workout</Button></Link>
            </>
          ) : todaysWorkout ? (
            <>
              <div className="flex justify-between items-center mb-1">
                <p className="font-medium text-fnf-text">{todaysWorkout.name || 'Today\'s Workout'}</p>
                <Badge color="green">Completed ✓</Badge>
              </div>
              <p className="text-fnf-muted text-sm mb-4">
                {todaysSets} sets • {todaysReps} reps • {todaysVolume.toLocaleString()} kg volume
              </p>
              <Link href="/dashboard/history"><Button variant="secondary">View Details</Button></Link>
            </>
          ) : (
            <>
              <p className="font-medium text-fnf-text mb-2">Ready to train?</p>
              <p className="text-fnf-muted text-sm mb-4">Start a new session and log your sets</p>
              <Link href="/dashboard/workout"><Button>Start Workout</Button></Link>
            </>
          )}
        </Card>

        <Card>
          <p className="font-medium text-fnf-text mb-3">Workout Progress</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-fnf-violet font-heading font-bold text-xl">{stats?.workoutsThisWeek ?? 0}</p>
              <p className="text-fnf-muted text-xs">This week</p>
            </div>
            <div>
              <p className="text-fnf-violet font-heading font-bold text-xl">{stats?.currentStreak ?? 0}🔥</p>
              <p className="text-fnf-muted text-xs">Day streak</p>
            </div>
            <div>
              <p className="text-fnf-violet font-heading font-bold text-xl">{stats?.totalSessions ?? 0}</p>
              <p className="text-fnf-muted text-xs">Total sessions</p>
            </div>
            <div>
              <p className="text-fnf-violet font-heading font-bold text-xl">{stats?.totalSets ?? 0}</p>
              <p className="text-fnf-muted text-xs">Total sets</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <p className="text-fnf-muted text-xs uppercase tracking-wider mb-3">Weekly Activity</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weeklyChart}>
              <XAxis dataKey="day" stroke="#6B5A8A" fontSize={11} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgb(var(--fnf-surface))', border: '1px solid rgba(180,100,255,0.2)' }} />
              <Bar dataKey="sets" fill="#8B2BFF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-3">
            <p className="text-fnf-muted text-xs uppercase tracking-wider">Exercise Progress</p>
            <Link href="/dashboard/progress" className="text-fnf-violet text-xs hover:underline">See all</Link>
          </div>
          <div className="space-y-3">
            {topPRs.length === 0 && <p className="text-fnf-muted text-sm">Log a workout to see progress</p>}
            {topPRs.map((pr) => (
              <div key={pr.exercise_id} className="flex justify-between items-center">
                <p className="text-fnf-secondary text-sm truncate">{pr.exercise_name}</p>
                <p className="text-fnf-violet text-sm font-medium">📈 {pr.max_weight}kg</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <p className="text-fnf-muted text-xs uppercase tracking-wider">Goals</p>
          <Link href="/dashboard/goals" className="text-fnf-violet text-xs hover:underline">Manage</Link>
        </div>
        {activeGoals.length === 0 ? (
          <p className="text-fnf-muted text-sm">No active goals. <Link href="/dashboard/goals" className="text-fnf-violet hover:underline">Set one</Link></p>
        ) : (
          <div className="space-y-3">
            {activeGoals.map((g) => (
              <div key={g.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-fnf-text">{g.title}</span>
                  <span className="text-fnf-muted text-xs">
                    {g.current_value}/{g.target_value} {g.unit}
                  </span>
                </div>
                <ProgressBar value={g.current_value} max={g.target_value} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
