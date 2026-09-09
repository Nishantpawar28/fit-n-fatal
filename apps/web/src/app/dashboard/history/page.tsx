'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { getWorkoutHistory, deleteWorkoutSession, updateSet, deleteSet } from '@fit-n-fatal/db';
import { Card, Select, Input, Badge, ConfirmDialog, EmptyState } from '@/components/ui';
import { useProfile } from '@/lib/use-profile';
import { formatDate, formatDuration, WORKOUT_TYPE_LABELS, WORKOUT_TYPES } from '@fit-n-fatal/utils';

function HistoryInner() {
  const searchParams = useSearchParams();
  const { userId } = useProfile();
  const queryClient = useQueryClient();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [exerciseFilter, setExerciseFilter] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [nameQuery, setNameQuery] = useState(searchParams.get('q') ?? '');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setNameQuery(q);
  }, [searchParams]);

  const { data: history } = useQuery({
    queryKey: ['history', userId],
    queryFn: () => getWorkoutHistory(userId!),
    enabled: !!userId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['history'] });
    queryClient.invalidateQueries({ queryKey: ['prs'] });
    queryClient.invalidateQueries({ queryKey: ['workoutStats'] });
  };

  const deleteWorkoutMutation = useMutation({ mutationFn: (id: string) => deleteWorkoutSession(id), onSuccess: invalidate });
  const updateSetMutation = useMutation({ mutationFn: ({ setId, patch }: { setId: string; patch: any }) => updateSet(setId, patch), onSuccess: invalidate });
  const deleteSetMutation = useMutation({ mutationFn: (setId: string) => deleteSet(setId), onSuccess: invalidate });

  const exerciseOptions = useMemo(() => {
    const names = new Map<string, string>();
    for (const s of history ?? []) for (const we of s.workout_exercises) names.set(we.exercise_id, we.exercise.name);
    return Array.from(names.entries()).map(([value, label]) => ({ value, label }));
  }, [history]);

  const muscleOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of history ?? []) for (const we of s.workout_exercises) set.add(we.exercise.muscle_group);
    return Array.from(set).map((m) => ({ value: m, label: m }));
  }, [history]);

  const filtered = (history ?? []).filter((s) => {
    if (typeFilter && s.workout_type !== typeFilter) return false;
    if (dateFilter && s.workout_date !== dateFilter) return false;
    if (nameQuery && !(s.name ?? '').toLowerCase().includes(nameQuery.toLowerCase())) return false;
    if (exerciseFilter && !s.workout_exercises.some((we) => we.exercise_id === exerciseFilter)) return false;
    if (muscleFilter && !s.workout_exercises.some((we) => we.exercise.muscle_group === muscleFilter)) return false;
    return true;
  });

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-fnf-text mb-6">Workout History</h2>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input value={nameQuery} onChange={setNameQuery} placeholder="Search by name..." className="max-w-[180px]" />
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="bg-fnf-surface border border-purple-500/15 rounded-lg px-3 py-2.5 text-sm text-fnf-text" />
        <Select value={typeFilter} onChange={setTypeFilter} placeholder="All types" options={WORKOUT_TYPES.map((t) => ({ value: t, label: WORKOUT_TYPE_LABELS[t] }))} className="max-w-[150px]" />
        <Select value={exerciseFilter} onChange={setExerciseFilter} placeholder="All exercises" options={exerciseOptions} className="max-w-[180px]" />
        <Select value={muscleFilter} onChange={setMuscleFilter} placeholder="All muscle groups" options={muscleOptions} className="max-w-[180px]" />
      </div>

      <div className="space-y-3">
        {filtered.map((session) => {
          const isOpen = expanded === session.id;
          const totalSets = session.workout_exercises.reduce((s, we) => s + we.sets.length, 0);
          const totalVolume = session.workout_exercises.reduce((s, we) => s + we.sets.reduce((v, set) => v + set.weight * set.reps, 0), 0);
          return (
            <Card key={session.id}>
              <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpanded(isOpen ? null : session.id)}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-fnf-text">{session.name || formatDate(session.workout_date)}</p>
                    <Badge>{WORKOUT_TYPE_LABELS[session.workout_type]}</Badge>
                  </div>
                  <p className="text-fnf-muted text-xs mt-1">
                    {formatDate(session.workout_date)} · {session.workout_exercises.length} exercises · {totalSets} sets · {totalVolume.toLocaleString()} kg volume
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-fnf-violet text-sm">
                    {session.duration_minutes ? `${session.duration_minutes}m` : formatDuration(session.started_at, session.ended_at)}
                  </p>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(session.id); }} className="text-fnf-muted hover:text-red-400">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                  {session.workout_exercises.map((we) => (
                    <div key={we.id}>
                      <p className="text-fnf-secondary text-sm font-medium mb-1">{we.exercise.name}</p>
                      {we.sets.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2 ml-2 mb-1">
                          <span className="text-fnf-muted text-xs w-10">Set {i + 1}</span>
                          <input
                            type="number"
                            defaultValue={s.weight}
                            onBlur={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v) && v !== s.weight) updateSetMutation.mutate({ setId: s.id, patch: { weight: v } });
                            }}
                            className="w-14 bg-fnf-bg/50 border border-purple-500/15 rounded px-1.5 py-1 text-xs text-fnf-text text-center"
                          />
                          <span className="text-fnf-muted text-xs">kg ×</span>
                          <input
                            type="number"
                            defaultValue={s.reps}
                            onBlur={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v) && v !== s.reps) updateSetMutation.mutate({ setId: s.id, patch: { reps: v } });
                            }}
                            className="w-12 bg-fnf-bg/50 border border-purple-500/15 rounded px-1.5 py-1 text-xs text-fnf-text text-center"
                          />
                          <span className="text-fnf-muted text-xs">reps</span>
                          <button onClick={() => deleteSetMutation.mutate(s.id)} className="text-fnf-muted hover:text-red-400 ml-1">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                  {session.notes && <p className="text-fnf-muted text-xs italic">&ldquo;{session.notes}&rdquo;</p>}
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && <EmptyState icon="📖" title="No workouts found" message="Adjust your filters or log a new workout." />}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteWorkoutMutation.mutate(deleteId)}
        title="Delete workout?"
        message="This permanently removes the workout and all logged sets."
      />
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={null}>
      <HistoryInner />
    </Suspense>
  );
}
