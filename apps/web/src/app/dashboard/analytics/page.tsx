'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getWorkoutHistory, getWorkoutStats, getNutritionTrend, getWaterTrend } from '@fit-n-fatal/db';
import { Card } from '@/components/ui';
import { useProfile } from '@/lib/use-profile';
import { getDateRangeStart, type DateRange } from '@fit-n-fatal/utils';

const RANGES: DateRange[] = ['week', 'month', 'quarter', 'year'];
const PIE_COLORS = ['#8B2BFF', '#C84BFF', '#FF6BAA', '#00FFA0', '#3FC5FF', '#F5A623', '#F0EEFF'];

export default function AnalyticsPage() {
  const { userId, profile } = useProfile();
  const [range, setRange] = useState<DateRange>('month');

  const fromDate = getDateRangeStart(range) ?? new Date(0);
  const fromDateStr = fromDate.toISOString().split('T')[0];
  const toDateStr = new Date().toISOString().split('T')[0];

  const { data: history } = useQuery({ queryKey: ['history', userId], queryFn: () => getWorkoutHistory(userId!), enabled: !!userId });
  const { data: stats } = useQuery({ queryKey: ['workoutStats', userId], queryFn: () => getWorkoutStats(userId!), enabled: !!userId });
  const { data: nutritionTrend } = useQuery({
    queryKey: ['nutritionTrend', userId, fromDateStr],
    queryFn: () => getNutritionTrend(userId!, fromDateStr, toDateStr),
    enabled: !!userId,
  });
  const { data: waterTrend } = useQuery({
    queryKey: ['waterTrend', userId, fromDateStr],
    queryFn: () => getWaterTrend(userId!, fromDateStr, toDateStr),
    enabled: !!userId,
  });

  const inRange = (history ?? []).filter((h) => new Date(h.workout_date) >= fromDate);

  const totalSets = inRange.reduce((s, h) => s + h.workout_exercises.reduce((x, we) => x + we.sets.length, 0), 0);
  const totalReps = inRange.reduce((s, h) => s + h.workout_exercises.reduce((x, we) => x + we.sets.reduce((r, set) => r + set.reps, 0), 0), 0);
  const totalVolume = inRange.reduce((s, h) => s + h.workout_exercises.reduce((x, we) => x + we.sets.reduce((v, set) => v + set.weight * set.reps, 0), 0), 0);
  const totalDuration = inRange.reduce((s, h) => s + (h.duration_minutes ?? 0), 0);

  const muscleDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of inRange) {
      for (const we of h.workout_exercises) {
        map.set(we.exercise.muscle_group, (map.get(we.exercise.muscle_group) ?? 0) + we.sets.length);
      }
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [inRange]);

  const avgCalories = nutritionTrend?.length ? Math.round(nutritionTrend.reduce((s, d) => s + d.calories, 0) / nutritionTrend.length) : 0;
  const avgProtein = nutritionTrend?.length ? Math.round(nutritionTrend.reduce((s, d) => s + d.protein, 0) / nutritionTrend.length) : 0;
  const avgCarbs = nutritionTrend?.length ? Math.round(nutritionTrend.reduce((s, d) => s + d.carbs, 0) / nutritionTrend.length) : 0;
  const avgFat = nutritionTrend?.length ? Math.round(nutritionTrend.reduce((s, d) => s + d.fat, 0) / nutritionTrend.length) : 0;
  const calorieGoal = profile?.daily_calorie_goal ?? 2200;
  const adherenceDays = nutritionTrend?.filter((d) => Math.abs(d.calories - calorieGoal) <= calorieGoal * 0.1).length ?? 0;

  const waterGoal = profile?.daily_water_goal_ml ?? 3000;
  const avgWater = waterTrend?.length ? Math.round(waterTrend.reduce((s, d) => s + d.amount_ml, 0) / waterTrend.length) : 0;
  const daysGoalMet = waterTrend?.filter((d) => d.amount_ml >= waterGoal).length ?? 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="font-heading text-2xl font-bold text-fnf-text">Analytics</h2>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`text-xs px-3 py-1.5 rounded-full ${range === r ? 'bg-purple-500/25 text-fnf-violet' : 'text-fnf-muted hover:bg-white/5'}`}>{r}</button>
          ))}
        </div>
      </div>

      <h3 className="text-fnf-muted text-xs uppercase tracking-wider mb-3">Workout Analytics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card><p className="text-fnf-violet font-heading font-bold text-2xl">{inRange.length}</p><p className="text-fnf-muted text-xs">Workouts</p></Card>
        <Card><p className="text-fnf-violet font-heading font-bold text-2xl">{totalSets}</p><p className="text-fnf-muted text-xs">Total sets</p></Card>
        <Card><p className="text-fnf-violet font-heading font-bold text-2xl">{totalReps}</p><p className="text-fnf-muted text-xs">Total reps</p></Card>
        <Card><p className="text-fnf-violet font-heading font-bold text-2xl">{totalVolume.toLocaleString()}</p><p className="text-fnf-muted text-xs">Volume (kg)</p></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <p className="text-fnf-muted text-xs uppercase tracking-wider mb-3">Muscle Group Distribution</p>
          {muscleDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={muscleDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {muscleDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'rgb(var(--fnf-surface))', border: '1px solid rgba(180,100,255,0.2)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-fnf-muted text-sm">No data in this range.</p>}
        </Card>
        <Card>
          <p className="text-fnf-muted text-xs uppercase tracking-wider mb-3">Frequency & Duration</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-fnf-secondary">This week</span><span className="text-fnf-text">{stats?.workoutsThisWeek ?? 0} workouts</span></div>
            <div className="flex justify-between"><span className="text-fnf-secondary">This month</span><span className="text-fnf-text">{stats?.workoutsThisMonth ?? 0} workouts</span></div>
            <div className="flex justify-between"><span className="text-fnf-secondary">Total duration ({range})</span><span className="text-fnf-text">{totalDuration} min</span></div>
            <div className="flex justify-between"><span className="text-fnf-secondary">Current streak</span><span className="text-fnf-text">{stats?.currentStreak ?? 0} days</span></div>
          </div>
        </Card>
      </div>

      <h3 className="text-fnf-muted text-xs uppercase tracking-wider mb-3">Nutrition Analytics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card><p className="text-fnf-violet font-heading font-bold text-xl">{avgCalories}</p><p className="text-fnf-muted text-xs">Avg calories/day</p></Card>
        <Card><p className="text-fnf-violet font-heading font-bold text-xl">{avgProtein}g</p><p className="text-fnf-muted text-xs">Avg protein/day</p></Card>
        <Card><p className="text-fnf-violet font-heading font-bold text-xl">{avgCarbs}g</p><p className="text-fnf-muted text-xs">Avg carbs/day</p></Card>
        <Card><p className="text-fnf-violet font-heading font-bold text-xl">{avgFat}g</p><p className="text-fnf-muted text-xs">Avg fat/day</p></Card>
      </div>
      <Card className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <p className="text-fnf-muted text-xs uppercase tracking-wider">Daily Calorie Intake</p>
          <p className="text-fnf-muted text-xs">{adherenceDays}/{nutritionTrend?.length ?? 0} days within target</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={nutritionTrend ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="#6B5A8A" fontSize={10} />
            <YAxis stroke="#6B5A8A" fontSize={11} />
            <Tooltip contentStyle={{ background: 'rgb(var(--fnf-surface))', border: '1px solid rgba(180,100,255,0.2)' }} />
            <Line type="monotone" dataKey="calories" stroke="#C84BFF" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <h3 className="text-fnf-muted text-xs uppercase tracking-wider mb-3">Hydration Analytics</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <Card><p className="text-fnf-violet font-heading font-bold text-xl">{(avgWater / 1000).toFixed(2)} L</p><p className="text-fnf-muted text-xs">Avg intake/day</p></Card>
        <Card><p className="text-fnf-violet font-heading font-bold text-xl">{daysGoalMet}/{waterTrend?.length ?? 0}</p><p className="text-fnf-muted text-xs">Days goal met</p></Card>
        <Card><p className="text-fnf-violet font-heading font-bold text-xl">{stats?.currentStreak ?? 0}</p><p className="text-fnf-muted text-xs">Workout streak</p></Card>
      </div>
      <Card>
        <p className="text-fnf-muted text-xs uppercase tracking-wider mb-3">Water Intake Trend</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={waterTrend ?? []}>
            <XAxis dataKey="date" stroke="#6B5A8A" fontSize={10} />
            <YAxis stroke="#6B5A8A" fontSize={11} />
            <Tooltip contentStyle={{ background: 'rgb(var(--fnf-surface))', border: '1px solid rgba(180,100,255,0.2)' }} />
            <Bar dataKey="amount_ml" fill="#3FC5FF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
