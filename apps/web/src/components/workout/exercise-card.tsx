'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trash2, Copy, Plus } from 'lucide-react';
import { getLastUsedSets } from '@fit-n-fatal/db';
import type { WorkoutExercise, WorkoutSet, Exercise } from '@fit-n-fatal/db';
import { Card, Button, ConfirmDialog } from '@/components/ui';

type WE = WorkoutExercise & { exercise: Exercise; sets: WorkoutSet[] };

export function ExerciseCard({
  we,
  userId,
  onLogSet,
  onUpdateSet,
  onDeleteSet,
  onRemoveExercise,
  onCopyLastWorkout,
}: {
  we: WE;
  userId: string;
  onLogSet: (weId: string, reps: number, weight: number) => void;
  onUpdateSet: (setId: string, patch: { reps?: number; weight?: number; completed?: boolean }) => void;
  onDeleteSet: (setId: string) => void;
  onRemoveExercise: (weId: string) => void;
  onCopyLastWorkout: (we: WE) => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  const { data: last } = useQuery({
    queryKey: ['lastUsed', userId, we.exercise_id],
    queryFn: () => getLastUsedSets(userId, we.exercise_id),
    enabled: !!userId,
  });

  const lastWorkingSets = (last?.sets ?? []).filter((s) => !s.is_warmup);
  const lastSummary =
    lastWorkingSets.length > 0
      ? `${lastWorkingSets[0].weight} kg × ${lastWorkingSets[0].reps} × ${lastWorkingSets.length}`
      : null;

  const sets = we.sets;
  const lastSet = sets[sets.length - 1];
  const [draftWeight, setDraftWeight] = useState(String(lastSet?.weight ?? lastWorkingSets[0]?.weight ?? ''));
  const [draftReps, setDraftReps] = useState(String(lastSet?.reps ?? lastWorkingSets[0]?.reps ?? ''));

  const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

  const handleAddSet = () => {
    const w = parseFloat(draftWeight);
    const r = parseInt(draftReps, 10);
    if (isNaN(w) || !r) return;
    onLogSet(we.id, r, w);
  };

  return (
    <Card>
      <div className="flex justify-between items-start mb-1">
        <div>
          <p className="font-medium text-fnf-text">{we.exercise.name}</p>
          <p className="text-fnf-muted text-xs">{we.exercise.muscle_group}</p>
        </div>
        <button onClick={() => setConfirmRemove(true)} className="text-fnf-muted hover:text-red-400 p-1">
          <Trash2 size={15} />
        </button>
      </div>

      {lastSummary && <p className="text-fnf-muted text-xs mb-3">Last time: {lastSummary}</p>}
      {!lastSummary && sets.length === 0 && lastWorkingSets.length === 0 && last === undefined && null}

      {sets.length === 0 && lastWorkingSets.length > 0 && (
        <button onClick={() => onCopyLastWorkout(we)} className="text-fnf-violet text-xs flex items-center gap-1 mb-3 hover:underline">
          <Copy size={12} /> Copy last workout&apos;s sets
        </button>
      )}

      <div className="space-y-2 mb-3">
        {sets.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <span className="text-fnf-muted text-xs w-10 shrink-0">Set {i + 1}</span>
            <input
              type="number"
              defaultValue={s.weight}
              onBlur={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v !== s.weight) onUpdateSet(s.id, { weight: v });
              }}
              className="w-16 bg-fnf-bg/50 border border-purple-500/15 rounded-lg px-2 py-1.5 text-sm text-fnf-text text-center"
            />
            <span className="text-fnf-muted text-xs">kg ×</span>
            <input
              type="number"
              defaultValue={s.reps}
              onBlur={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v !== s.reps) onUpdateSet(s.id, { reps: v });
              }}
              className="w-14 bg-fnf-bg/50 border border-purple-500/15 rounded-lg px-2 py-1.5 text-sm text-fnf-text text-center"
            />
            <span className="text-fnf-muted text-xs">reps</span>
            <label className="ml-auto flex items-center gap-1.5 text-xs text-fnf-muted cursor-pointer">
              <input
                type="checkbox"
                checked={s.completed}
                onChange={(e) => onUpdateSet(s.id, { completed: e.target.checked })}
                className="accent-fnf-violet h-4 w-4"
              />
              Done
            </label>
            <button onClick={() => onDeleteSet(s.id)} className="text-fnf-muted hover:text-red-400">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-white/5 pt-3">
        <input
          type="number"
          value={draftWeight}
          onChange={(e) => setDraftWeight(e.target.value)}
          placeholder="kg"
          className="w-16 bg-fnf-bg/50 border border-purple-500/15 rounded-lg px-2 py-2 text-sm text-fnf-text text-center"
        />
        <input
          type="number"
          value={draftReps}
          onChange={(e) => setDraftReps(e.target.value)}
          placeholder="reps"
          className="w-14 bg-fnf-bg/50 border border-purple-500/15 rounded-lg px-2 py-2 text-sm text-fnf-text text-center"
        />
        <Button onClick={handleAddSet} className="!py-2 flex items-center gap-1">
          <Plus size={14} /> Add Set
        </Button>
      </div>

      {sets.length > 0 && <p className="text-fnf-muted text-xs mt-2">Volume: {totalVolume.toLocaleString()} kg</p>}

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => onRemoveExercise(we.id)}
        title="Remove exercise?"
        message={`This removes ${we.exercise.name} and all its logged sets from this workout.`}
      />
    </Card>
  );
}
