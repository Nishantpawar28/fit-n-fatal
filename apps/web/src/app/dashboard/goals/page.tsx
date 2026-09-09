'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import {
  getGoals,
  createGoal,
  deleteGoal,
  updateGoalProgress,
  getPersonalRecords,
  getWorkoutStats,
  getBodyMeasurements,
  getWaterEntriesForDate,
  getFoodEntriesForDate,
  sumNutrition,
  getExercises,
} from '@fit-n-fatal/db';
import type { Goal, GoalType } from '@fit-n-fatal/db';
import { Card, Button, Input, Select, ProgressBar, ConfirmDialog, EmptyState, Modal } from '@/components/ui';
import { useProfile } from '@/lib/use-profile';
import { GOAL_TYPE_LABELS, toLocalDateStr } from '@fit-n-fatal/utils';
import { useToast } from '@/components/toast-provider';

const GOAL_TYPES = Object.keys(GOAL_TYPE_LABELS) as GoalType[];

export default function GoalsPage() {
  const { userId, profile } = useProfile();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<GoalType>('weight');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('kg');
  const [exerciseId, setExerciseId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);

  const today = toLocalDateStr();

  const { data: goals } = useQuery({ queryKey: ['goals', userId], queryFn: () => getGoals(userId!), enabled: !!userId });
  const { data: prs } = useQuery({ queryKey: ['prs', userId], queryFn: () => getPersonalRecords(userId!), enabled: !!userId });
  const { data: stats } = useQuery({ queryKey: ['workoutStats', userId], queryFn: () => getWorkoutStats(userId!), enabled: !!userId });
  const { data: measurements } = useQuery({ queryKey: ['measurements', userId], queryFn: () => getBodyMeasurements(userId!), enabled: !!userId });
  const { data: waterToday } = useQuery({ queryKey: ['waterEntries', userId, today], queryFn: () => getWaterEntriesForDate(userId!, today), enabled: !!userId });
  const { data: foodToday } = useQuery({ queryKey: ['foodEntries', userId, today], queryFn: () => getFoodEntriesForDate(userId!, today), enabled: !!userId });
  const { data: exercises } = useQuery({ queryKey: ['exercises'], queryFn: () => getExercises(), enabled: showForm && type === 'lift' });

  const latestWeight = useMemo(() => {
    const withWeight = (measurements ?? []).filter((m) => m.weight_kg != null);
    return withWeight.length > 0 ? withWeight[withWeight.length - 1].weight_kg! : profile?.weight_kg ?? 0;
  }, [measurements, profile]);

  const waterTotal = (waterToday ?? []).reduce((s, w) => s + w.amount_ml, 0) / 1000;
  const proteinTotal = sumNutrition(foodToday ?? []).protein;

  const currentValueFor = (g: Goal): number => {
    switch (g.type) {
      case 'weight':
        return latestWeight;
      case 'lift':
        return g.exercise_id ? prs?.find((p) => p.exercise_id === g.exercise_id)?.max_weight ?? 0 : g.current_value;
      case 'workout_count':
        return stats?.totalSessions ?? 0;
      case 'water':
        return waterTotal;
      case 'protein':
        return proteinTotal;
      default:
        return g.current_value;
    }
  };

  const createMutation = useMutation({
    mutationFn: () => createGoal(userId!, { type, title, targetValue: parseFloat(target), unit, exerciseId: type === 'lift' ? exerciseId : undefined, deadline: deadline || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowForm(false);
      setTitle(''); setTarget(''); setExerciseId(''); setDeadline('');
    },
  });

  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteGoal(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }) });
  const syncMutation = useMutation({
    mutationFn: (g: Goal) => updateGoalProgress(g.id, currentValueFor(g), g.target_value),
    onSuccess: (data, g) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (data.status === 'completed' && g.status !== 'completed') {
        showToast({ icon: '🎉', title: 'Goal completed!', message: `You hit "${g.title}"`, variant: 'celebrate' });
      }
    },
  });

  const active = (goals ?? []).filter((g) => g.status === 'active');
  const completed = (goals ?? []).filter((g) => g.status === 'completed');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold text-fnf-text">Goals</h2>
        <Button onClick={() => setShowForm(true)}>+ New Goal</Button>
      </div>

      {active.length === 0 && <EmptyState icon="🎯" title="No active goals" message="Set a target and track your progress toward it." action={<Button onClick={() => setShowForm(true)}>Set a Goal</Button>} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {active.map((g) => {
          const current = currentValueFor(g);
          const pct = g.target_value > 0 ? Math.min(100, Math.round((current / g.target_value) * 100)) : 0;
          return (
            <Card key={g.id}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-fnf-text font-medium">{g.title}</p>
                  <p className="text-fnf-muted text-xs">{GOAL_TYPE_LABELS[g.type]}{g.deadline ? ` · by ${g.deadline}` : ''}</p>
                </div>
                <button onClick={() => setDeleteTarget(g)} className="text-fnf-muted hover:text-red-400"><Trash2 size={15} /></button>
              </div>
              <ProgressBar value={current} max={g.target_value} />
              <div className="flex justify-between items-center mt-2">
                <p className="text-fnf-muted text-xs">{current} / {g.target_value} {g.unit} ({pct}%)</p>
                {g.type !== 'custom' && (
                  <button onClick={() => syncMutation.mutate(g)} className="text-fnf-violet text-xs hover:underline">Sync</button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {completed.length > 0 && (
        <>
          <h3 className="text-fnf-muted text-xs uppercase tracking-wider mb-3">Completed 🎉</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completed.map((g) => (
              <Card key={g.id} className="opacity-80">
                <div className="flex justify-between items-center">
                  <p className="text-fnf-text font-medium">{g.title}</p>
                  <span className="text-fnf-green text-xs">✓ Done</span>
                </div>
                <p className="text-fnf-muted text-xs">{g.target_value} {g.unit}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Goal">
        <div className="space-y-3">
          <Select value={type} onChange={(v) => setType(v as GoalType)} options={GOAL_TYPES.map((t) => ({ value: t, label: GOAL_TYPE_LABELS[t] }))} />
          <Input value={title} onChange={setTitle} placeholder="Goal title (e.g. Bench Press 100kg)" />
          {type === 'lift' && (
            <Select value={exerciseId} onChange={setExerciseId} placeholder="Select exercise" options={(exercises ?? []).map((e) => ({ value: e.id, label: e.name }))} />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input value={target} onChange={setTarget} type="number" placeholder="Target value" />
            <Input value={unit} onChange={setUnit} placeholder="Unit (kg, km, L...)" />
          </div>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-fnf-surface border border-purple-500/15 rounded-lg px-4 py-3 text-sm text-fnf-text" />
          <Button className="w-full" disabled={!title || !target || createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Saving...' : 'Create Goal'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} title="Delete goal?" message="This can't be undone." />
    </div>
  );
}
