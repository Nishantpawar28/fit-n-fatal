'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthActivity, getWorkoutHistory, getFoodEntriesForDate, getWaterEntriesForDate, getBodyMeasurements, sumNutrition } from '@fit-n-fatal/db';
import { Card, Badge } from '@/components/ui';
import { useProfile } from '@/lib/use-profile';
import { cn } from '@/lib/utils';

function toKey(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function CalendarPage() {
  const { userId, profile } = useProfile();
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState<string | null>(null);

  const monthStart = toKey(monthCursor);
  const monthEndDate = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
  const monthEnd = toKey(monthEndDate);

  const { data: activity } = useQuery({
    queryKey: ['monthActivity', userId, monthStart],
    queryFn: () => getMonthActivity(userId!, monthStart, monthEnd, profile?.daily_water_goal_ml ?? 3000),
    enabled: !!userId,
  });

  const { data: history } = useQuery({ queryKey: ['history', userId], queryFn: () => getWorkoutHistory(userId!), enabled: !!userId });
  const { data: measurements } = useQuery({ queryKey: ['measurements', userId], queryFn: () => getBodyMeasurements(userId!), enabled: !!userId && !!selected });
  const { data: dayFood } = useQuery({ queryKey: ['foodEntries', userId, selected], queryFn: () => getFoodEntriesForDate(userId!, selected!), enabled: !!userId && !!selected });
  const { data: dayWater } = useQuery({ queryKey: ['waterEntries', userId, selected], queryFn: () => getWaterEntriesForDate(userId!, selected!), enabled: !!userId && !!selected });

  const days = useMemo(() => {
    const firstDay = new Date(monthCursor);
    const leadingBlanks = firstDay.getDay();
    const totalDays = monthEndDate.getDate();
    const cells: (string | null)[] = Array(leadingBlanks).fill(null);
    for (let i = 1; i <= totalDays; i++) {
      cells.push(toKey(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), i)));
    }
    return cells;
  }, [monthCursor, monthEndDate]);

  const dayWorkouts = (history ?? []).filter((h) => h.workout_date === selected);
  const dayMeasurement = (measurements ?? []).find((m) => m.measured_date === selected);
  const dayNutrition = sumNutrition(dayFood ?? []);
  const dayWaterTotal = (dayWater ?? []).reduce((s, w) => s + w.amount_ml, 0);
  const todayKey = toKey(new Date());

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-fnf-text mb-6">Calendar</h2>

      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="text-fnf-muted hover:text-fnf-text">
            <ChevronLeft size={18} />
          </button>
          <p className="text-fnf-text font-heading font-bold">{monthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          <button onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="text-fnf-muted hover:text-fnf-text">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-fnf-muted text-[10px] mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((key, i) => {
            if (!key) return <div key={i} />;
            const a = activity?.[key];
            const isToday = key === todayKey;
            const isSelected = key === selected;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={cn(
                  'aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative',
                  isSelected ? 'bg-purple-500/25 border border-fnf-violet' : 'hover:bg-white/5',
                  isToday && !isSelected && 'border border-purple-500/30'
                )}
              >
                <span className={isToday ? 'text-fnf-violet font-bold' : 'text-fnf-secondary'}>{parseInt(key.split('-')[2], 10)}</span>
                <div className="flex gap-0.5 mt-0.5">
                  {a?.hasWorkout && <span className="h-1.5 w-1.5 rounded-full bg-fnf-violet" />}
                  {a?.hasNutritionLogged && <span className="h-1.5 w-1.5 rounded-full bg-fnf-pink" />}
                  {a?.waterGoalMet && <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-4 mt-4 text-xs text-fnf-muted flex-wrap">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fnf-violet" /> Workout</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fnf-pink" /> Nutrition logged</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" /> Water goal met</span>
        </div>
      </Card>

      {selected && (
        <Card>
          <p className="font-medium text-fnf-text mb-3">{new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

          <div className="mb-3">
            <p className="text-fnf-muted text-xs uppercase tracking-wider mb-1.5">Workouts</p>
            {dayWorkouts.length === 0 ? (
              <p className="text-fnf-muted text-sm">Rest day</p>
            ) : (
              dayWorkouts.map((w) => (
                <div key={w.id} className="mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-fnf-text text-sm">{w.name || 'Workout'}</p>
                    <Badge>{w.workout_type}</Badge>
                  </div>
                  <p className="text-fnf-muted text-xs">{w.workout_exercises.map((we) => we.exercise.name).join(', ')}</p>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-fnf-muted text-xs uppercase tracking-wider mb-1">Nutrition</p>
              <p className="text-fnf-secondary text-sm">{Math.round(dayNutrition.calories)} kcal · {Math.round(dayNutrition.protein)}g protein</p>
            </div>
            <div>
              <p className="text-fnf-muted text-xs uppercase tracking-wider mb-1">Water</p>
              <p className="text-fnf-secondary text-sm">{(dayWaterTotal / 1000).toFixed(2)} L</p>
            </div>
          </div>

          {dayMeasurement && (
            <div>
              <p className="text-fnf-muted text-xs uppercase tracking-wider mb-1">Weight</p>
              <p className="text-fnf-secondary text-sm">{dayMeasurement.weight_kg} kg</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
