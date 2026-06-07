'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { getPersonalRecords, getStrengthCurve, getExercises } from '@fit-n-fatal/db';
import { Card, Button } from '@/components/ui';
import { getDateRangeStart, type DateRange } from '@fit-n-fatal/utils';

const RANGES: DateRange[] = ['week', 'month', 'quarter', 'year'];

export default function ProgressPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>('month');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const fromDate = getDateRangeStart(range)?.toISOString();

  const { data: prs } = useQuery({
    queryKey: ['prs', userId],
    queryFn: () => getPersonalRecords(userId!),
    enabled: !!userId,
  });

  const { data: exercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => getExercises(),
  });

  const { data: curve } = useQuery({
    queryKey: ['strengthCurve', userId, selectedExercise, range],
    queryFn: () => getStrengthCurve(userId!, selectedExercise!, fromDate ?? undefined),
    enabled: !!userId && !!selectedExercise,
  });

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-fnf-text mb-6">Progress</h2>

      <div className="flex gap-2 mb-6">
        {RANGES.map((r) => (
          <Button key={r} variant={range === r ? 'primary' : 'secondary'} onClick={() => setRange(r)}>
            {r}
          </Button>
        ))}
      </div>

      <h3 className="text-fnf-muted text-xs uppercase tracking-wider mb-3">Personal Records</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {(prs ?? []).map((pr) => (
          <Card key={pr.exercise_id}>
            <p className="text-fnf-text text-sm truncate">{pr.exercise_name}</p>
            <p className="text-fnf-violet font-bold text-xl">{pr.max_weight} kg</p>
            <p className="text-fnf-muted text-xs">1RM ~{pr.estimated_1rm} kg</p>
          </Card>
        ))}
      </div>

      <h3 className="text-fnf-muted text-xs uppercase tracking-wider mb-3">Strength Curve</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {(exercises ?? []).slice(0, 10).map((ex) => (
          <Button
            key={ex.id}
            variant={selectedExercise === ex.id ? 'primary' : 'ghost'}
            onClick={() => setSelectedExercise(ex.id)}
          >
            {ex.name}
          </Button>
        ))}
      </div>

      {curve && curve.length > 0 ? (
        <Card>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={curve}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#6B5A8A" fontSize={11} />
              <YAxis stroke="#6B5A8A" fontSize={11} />
              <Tooltip contentStyle={{ background: '#13121F', border: '1px solid rgba(180,100,255,0.2)' }} />
              <Line type="monotone" dataKey="max_weight" stroke="#C84BFF" strokeWidth={2} dot={{ fill: '#8B2BFF' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      ) : (
        <Card><p className="text-fnf-muted text-sm">Select an exercise with logged data to view strength curve</p></Card>
      )}
    </div>
  );
}
