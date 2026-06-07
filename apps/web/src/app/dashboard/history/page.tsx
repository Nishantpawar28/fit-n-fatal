'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { getWorkoutHistory } from '@fit-n-fatal/db';
import { Card } from '@/components/ui';
import { formatDate, formatDuration } from '@fit-n-fatal/utils';

export default function HistoryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: history } = useQuery({
    queryKey: ['history', userId],
    queryFn: () => getWorkoutHistory(userId!),
    enabled: !!userId,
  });

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-fnf-text mb-6">Workout History</h2>
      <div className="space-y-3">
        {(history ?? []).map((session) => {
          const isOpen = expanded === session.id;
          const totalSets = session.workout_exercises.reduce((s, we) => s + we.sets.length, 0);
          return (
            <Card key={session.id} className="cursor-pointer" onClick={() => setExpanded(isOpen ? null : session.id)}>
              <div className="flex justify-between">
                <p className="font-medium text-fnf-text">{formatDate(session.started_at)}</p>
                <p className="text-fnf-violet text-sm">{formatDuration(session.started_at, session.ended_at)}</p>
              </div>
              <p className="text-fnf-muted text-xs mt-1">
                {session.workout_exercises.length} exercises · {totalSets} sets
              </p>
              {isOpen && session.workout_exercises.map((we) => (
                <div key={we.id} className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-fnf-secondary text-sm font-medium">{we.exercise.name}</p>
                  {we.sets.map((s) => (
                    <p key={s.id} className="text-fnf-muted text-xs ml-2">
                      Set {s.set_number}: {s.reps} × {s.weight} kg
                    </p>
                  ))}
                </div>
              ))}
            </Card>
          );
        })}
        {(!history || history.length === 0) && (
          <p className="text-fnf-muted">No workouts yet. Start your first session!</p>
        )}
      </div>
    </div>
  );
}
