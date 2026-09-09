'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkoutStats, getPersonalRecords, getGoals, getWaterTrend } from '@fit-n-fatal/db';
import { Card } from '@/components/ui';
import { useProfile } from '@/lib/use-profile';
import { computeAchievements, toLocalDateStr, addDaysLocal } from '@fit-n-fatal/utils';
import { cn } from '@/lib/utils';

export default function AchievementsPage() {
  const { userId, profile } = useProfile();

  const { data: stats } = useQuery({ queryKey: ['workoutStats', userId], queryFn: () => getWorkoutStats(userId!), enabled: !!userId });
  const { data: prs } = useQuery({ queryKey: ['prs', userId], queryFn: () => getPersonalRecords(userId!), enabled: !!userId });
  const { data: goals } = useQuery({ queryKey: ['goals', userId], queryFn: () => getGoals(userId!), enabled: !!userId });

  const fromDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return toLocalDateStr(d);
  }, []);
  const toDate = toLocalDateStr();

  const { data: waterTrend } = useQuery({
    queryKey: ['waterTrend', userId, 'year'],
    queryFn: () => getWaterTrend(userId!, fromDate, toDate),
    enabled: !!userId,
  });

  const hydrationStreak = useMemo(() => {
    if (!waterTrend) return 0;
    const goal = profile?.daily_water_goal_ml ?? 3000;
    const byDate = new Map(waterTrend.map((d) => [d.date, d.amount_ml]));
    let streak = 0;
    let key = toLocalDateStr();
    if ((byDate.get(key) ?? 0) < goal) {
      key = addDaysLocal(key, -1);
    }
    while ((byDate.get(key) ?? 0) >= goal) {
      streak++;
      key = addDaysLocal(key, -1);
    }
    return streak;
  }, [waterTrend, profile]);

  const achievements = computeAchievements({
    totalWorkouts: stats?.totalSessions ?? 0,
    workoutStreak: stats?.currentStreak ?? 0,
    hydrationStreak,
    totalPRs: prs?.length ?? 0,
    goalsCompleted: (goals ?? []).filter((g) => g.status === 'completed').length,
  });

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-fnf-text mb-1">Achievements</h2>
      <p className="text-fnf-muted text-sm mb-6">{unlocked.length} of {achievements.length} unlocked</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...unlocked, ...locked].map((a) => (
          <Card key={a.key} className={cn('text-center py-6', !a.unlocked && 'opacity-40 grayscale')}>
            <div className="text-3xl mb-2">{a.icon}</div>
            <p className="text-fnf-text text-sm font-medium">{a.title}</p>
            <p className="text-fnf-muted text-xs mt-1">{a.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
