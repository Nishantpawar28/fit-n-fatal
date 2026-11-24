'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { getWorkoutHistoryPage, getLoggedExerciseOptions, deleteWorkoutSession, updateSet, deleteSet } from '@fit-n-fatal/db';
import type { WorkoutType } from '@fit-n-fatal/db';
import { Card, Select, Input, Badge, ConfirmDialog, EmptyState } from '@/components/ui';
import { useProfile } from '@/lib/use-profile';
import { useDebouncedValue, useOnVisible } from '@/lib/hooks';

const PAGE_SIZE = 10;
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

  const debouncedName = useDebouncedValue(nameQuery, 300);
  const filters = {
    workoutType: typeFilter as WorkoutType | '',
    date: dateFilter,
    nameQuery: debouncedName,
    exerciseId: exerciseFilter,
    muscleGroup: muscleFilter,
  };

  // 10 workouts at a time; the next 10 load automatically as you scroll.
  const historyQuery = useInfiniteQuery({
    queryKey: ['history', userId, 'pages', filters],
    queryFn: ({ pageParam }) => getWorkoutHistoryPage(userId!, { ...filters, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.hasMore ? all.length : undefined),
    enabled: !!userId,
  });
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = historyQuery;
  const sessions = useMemo(() => historyQuery.data?.pages.flatMap((p) => p.sessions) ?? [], [historyQuery.data]);
  const loadMoreRef = useOnVisible<HTMLDivElement>(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, !!hasNextPage);

  // Filter dropdown options: every exercise you've ever logged (tiny query).
  const { data: loggedExercises } = useQuery({
    queryKey: ['loggedExercises', userId],
    queryFn: () => getLoggedExerciseOptions(userId!),
    enabled: !!userId,
    staleTime: 10 * 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['history'] });
    queryClient.invalidateQueries({ queryKey: ['prs'] });
    queryClient.invalidateQueries({ queryKey: ['workoutStats'] });
    queryClient.invalidateQueries({ queryKey: ['lastUsed'] });
  };

  const deleteWorkoutMutation = useMutation({ mutationFn: (id: string) => deleteWorkoutSession(id), onSuccess: invalidate });
  const updateSetMutation = useMutation({ mutationFn: ({ setId, patch }: { setId: string; patch: any }) => updateSet(setId, patch), onSuccess: invalidate });
  const deleteSetMutation = useMutation({ mutationFn: (setId: string) => deleteSet(setId), onSuccess: invalidate });

  const exerciseOptions = useMemo(() => (loggedExercises ?? []).map((e) => ({ value: e.id, label: e.name })), [loggedExercises]);
  const muscleOptions = useMemo(() => {
    const set = new Set((loggedExercises ?? []).map((e) => e.muscle_group));
    return Array.from(set).sort().map((m) => ({ value: m, label: m }));
  }, [loggedExercises]);

  const filtered = sessions;

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
        {historyQuery.isLoading && <p className="text-fnf-muted text-sm text-center py-6">Loading workouts…</p>}
        {!historyQuery.isLoading && filtered.length === 0 && (
          <EmptyState icon="📖" title="No workouts found" message="Adjust your filters or log a new workout." />
        )}
        {hasNextPage && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-fnf-violet text-sm hover:underline disabled:opacity-60"
            >
              {isFetchingNextPage ? 'Loading more…' : 'Load more workouts'}
            </button>
          </div>
        )}
        {!hasNextPage && filtered.length > PAGE_SIZE && (
          <p className="text-fnf-muted text-xs text-center py-4">That&apos;s all {filtered.length} workouts.</p>
        )}
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
