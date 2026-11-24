'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getActiveSession,
  startWorkoutSession,
  endWorkoutSession,
  addExerciseToSession,
  removeExerciseFromSession,
  logSet,
  updateSet,
  deleteSet,
  copyLastWorkoutSets,
  getTemplates,
  startWorkoutFromTemplate,
  repeatLastWorkout,
  getPersonalRecords,
} from '@fit-n-fatal/db';
import type { Exercise, WorkoutSessionWithDetails, WorkoutSet } from '@fit-n-fatal/db';
import { Card, Button, Input, Badge, Select, Modal } from '@/components/ui';
import { useExerciseSearch, isTempId } from '@/lib/hooks';
import { useProfile } from '@/lib/use-profile';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPES, detectNewPR, toLocalDateStr } from '@fit-n-fatal/utils';
import { ExerciseCard } from '@/components/workout/exercise-card';
import { RestTimer } from '@/components/rest-timer';
import { useToast } from '@/components/toast-provider';

type SessionWE = WorkoutSessionWithDetails['workout_exercises'][number];

let tempCounter = 0;
const tempId = () => `temp-${Date.now()}-${tempCounter++}`;

export default function WorkoutPage() {
  const queryClient = useQueryClient();
  const { userId, ready } = useProfile();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const [workoutType, setWorkoutType] = useState('gym');
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDate, setWorkoutDate] = useState(toLocalDateStr());

  const [prBaselines, setPrBaselines] = useState<Record<string, { max_weight: number; estimated_1rm: number; best_reps_at_weight: { weight: number; reps: number } }>>({});

  const { data: session } = useQuery({
    queryKey: ['activeSession', userId],
    queryFn: () => getActiveSession(userId!),
    enabled: !!userId,
  });

  // Exercise picker searches the cached library locally (debounced).
  const { results: exercises } = useExerciseSearch(search);

  const { data: templates } = useQuery({
    queryKey: ['templates', userId],
    queryFn: () => getTemplates(userId!),
    enabled: !!userId && showTemplates,
  });

  const { data: prs } = useQuery({
    queryKey: ['prs', userId],
    queryFn: () => getPersonalRecords(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  // Seed PR baselines from the (possibly cached) PR list.
  useEffect(() => {
    if (!prs) return;
    setPrBaselines((prev) => {
      const next = { ...prev };
      for (const pr of prs) {
        if (!next[pr.exercise_id]) {
          next[pr.exercise_id] = {
            max_weight: pr.max_weight,
            estimated_1rm: pr.estimated_1rm,
            best_reps_at_weight: pr.best_reps_at_weight,
          };
        }
      }
      return next;
    });
  }, [prs]);

  const sessionKey = ['activeSession', userId];
  const invalidateSession = () => queryClient.invalidateQueries({ queryKey: ['activeSession'] });

  // ---- Optimistic cache helpers: the screen updates immediately and the
  // save happens in the background. If a save fails we reload the truth. ----
  const patchSession = (fn: (s: WorkoutSessionWithDetails) => WorkoutSessionWithDetails) =>
    queryClient.setQueryData<WorkoutSessionWithDetails | null>(sessionKey, (old) => (old ? fn(old) : old));
  const patchWE = (weId: string, fn: (we: SessionWE) => SessionWE) =>
    patchSession((s) => ({ ...s, workout_exercises: s.workout_exercises.map((we) => (we.id === weId ? fn(we) : we)) }));
  const patchSet = (setId: string, fn: (set: WorkoutSet) => WorkoutSet | null) =>
    patchSession((s) => ({
      ...s,
      workout_exercises: s.workout_exercises.map((we) => ({
        ...we,
        sets: we.sets.flatMap((set) => {
          if (set.id !== setId) return [set];
          const out = fn(set);
          return out ? [out] : [];
        }),
      })),
    }));
  const onSaveError = (err: Error) => {
    showToast({ icon: '⚠️', title: 'Could not save', message: err.message || 'Check your connection and try again.' });
    invalidateSession();
  };
  const beforeOptimistic = () => queryClient.cancelQueries({ queryKey: sessionKey });

  const startMutation = useMutation({
    mutationFn: () =>
      startWorkoutSession(userId!, { workoutType: workoutType as any, name: workoutName || undefined, workoutDate }),
    onSuccess: () => {
      setError(null);
      invalidateSession();
    },
    onError: (err: Error) => setError(err.message),
  });

  const startFromTemplateMutation = useMutation({
    mutationFn: (templateId: string) => {
      const t = templates!.find((t) => t.id === templateId)!;
      return startWorkoutFromTemplate(userId!, t);
    },
    onSuccess: () => {
      setShowTemplates(false);
      invalidateSession();
    },
  });

  const repeatMutation = useMutation({
    mutationFn: () => repeatLastWorkout(userId!),
    onSuccess: (result) => {
      if (!result) setError('No previous workout to repeat.');
      else invalidateSession();
    },
  });

  const endMutation = useMutation({
    mutationFn: () => {
      const mins = Math.max(1, Math.round((Date.now() - new Date(session!.started_at).getTime()) / 60000));
      return endWorkoutSession(session!.id, mins);
    },
    onSuccess: () => {
      const totalSets = session?.workout_exercises.reduce((s, we) => s + we.sets.length, 0) ?? 0;
      const totalVolume = session?.workout_exercises.reduce((s, we) => s + we.sets.reduce((v, set) => v + set.weight * set.reps, 0), 0) ?? 0;
      showToast({ icon: '✅', title: 'Workout complete!', message: `${totalSets} sets • ${totalVolume.toLocaleString()} kg volume`, variant: 'celebrate' });
      invalidateSession();
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['prs'] });
      queryClient.invalidateQueries({ queryKey: ['workoutStats'] });
      queryClient.invalidateQueries({ queryKey: ['lastUsed'] });
      queryClient.invalidateQueries({ queryKey: ['loggedExercises'] });
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: ({ exercise, orderIndex }: { exercise: Exercise; orderIndex: number; tempWeId: string }) =>
      addExerciseToSession(session!.id, exercise.id, orderIndex),
    onMutate: async ({ exercise, orderIndex, tempWeId }) => {
      await beforeOptimistic();
      patchSession((s) => ({
        ...s,
        workout_exercises: [
          ...s.workout_exercises,
          { id: tempWeId, session_id: s.id, exercise_id: exercise.id, order_index: orderIndex, created_at: new Date().toISOString(), exercise, sets: [] },
        ],
      }));
    },
    onSuccess: (row: any, { tempWeId }) =>
      patchWE(tempWeId, (we) => ({ ...we, ...row, exercise: row.exercise ?? we.exercise, sets: we.sets })),
    onError: onSaveError,
  });

  const removeExerciseMutation = useMutation({
    mutationFn: (weId: string) => removeExerciseFromSession(weId),
    onMutate: async (weId) => {
      await beforeOptimistic();
      patchSession((s) => ({ ...s, workout_exercises: s.workout_exercises.filter((we) => we.id !== weId) }));
    },
    onError: onSaveError,
  });

  const logSetMutation = useMutation({
    mutationFn: ({ weId, setNumber, reps, weight }: { weId: string; setNumber: number; reps: number; weight: number; tempSetId: string }) =>
      logSet(weId, setNumber, { reps, weight, completed: true }),
    onMutate: async ({ weId, setNumber, reps, weight, tempSetId }) => {
      await beforeOptimistic();
      const optimisticSet: WorkoutSet = {
        id: tempSetId,
        workout_exercise_id: weId,
        set_number: setNumber,
        reps,
        weight,
        rpe: null,
        rest_seconds: null,
        notes: null,
        is_warmup: false,
        completed: true,
        created_at: new Date().toISOString(),
      };
      patchWE(weId, (we) => ({ ...we, sets: [...we.sets, optimisticSet] }));
    },
    // Swap the temporary row for the saved one: no refetch needed.
    onSuccess: (saved, { tempSetId }) => patchSet(tempSetId, () => saved),
    onError: onSaveError,
  });

  const updateSetMutation = useMutation({
    mutationFn: ({ setId, patch }: { setId: string; patch: { reps?: number; weight?: number; completed?: boolean } }) =>
      updateSet(setId, patch),
    onMutate: async ({ setId, patch }) => {
      await beforeOptimistic();
      patchSet(setId, (set) => ({ ...set, ...patch }));
    },
    onError: onSaveError,
  });

  const deleteSetMutation = useMutation({
    mutationFn: (setId: string) => deleteSet(setId),
    onMutate: async (setId) => {
      await beforeOptimistic();
      patchSet(setId, () => null);
    },
    onError: onSaveError,
  });

  const copyLastMutation = useMutation({
    mutationFn: (we: SessionWE) => copyLastWorkoutSets(userId!, session!.id, we.exercise_id, we.id),
    onSuccess: (inserted, we) =>
      patchWE(we.id, (cur) => ({
        ...cur,
        sets: [...cur.sets, ...(inserted as WorkoutSet[])].sort((a, b) => a.set_number - b.set_number),
      })),
    onError: onSaveError,
  });

  const handleLogSet = (weId: string, reps: number, weight: number) => {
    const we = session!.workout_exercises.find((w) => w.id === weId)!;
    if (isTempId(weId)) return; // exercise itself is still saving (a split second)
    logSetMutation.mutate({ weId, setNumber: we.sets.length + 1, reps, weight, tempSetId: tempId() });
    // Only judge PRs once your PR history has loaded, so it can't misfire.
    const check = prs ? detectNewPR(we.exercise.name, prBaselines[we.exercise_id], weight, reps) : { isPR: false, message: '' };
    if (check.isPR) {
      showToast({ icon: '🔥', title: 'New Personal Record!', message: check.message, variant: 'celebrate' });
      setPrBaselines((prev) => {
        const prevBaseline = prev[we.exercise_id];
        const oneRm = Math.round(weight * (1 + reps / 30) * 10) / 10;
        return {
          ...prev,
          [we.exercise_id]: {
            max_weight: Math.max(prevBaseline?.max_weight ?? 0, weight),
            estimated_1rm: Math.max(prevBaseline?.estimated_1rm ?? 0, oneRm),
            best_reps_at_weight:
              weight === prevBaseline?.best_reps_at_weight.weight && reps > (prevBaseline?.best_reps_at_weight.reps ?? 0)
                ? { weight, reps }
                : (prevBaseline?.best_reps_at_weight ?? { weight, reps }),
          },
        };
      });
    }
  };

  if (!session) {
    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-fnf-text mb-6">Workout</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <Card>
            <p className="font-medium text-fnf-text mb-4">Start a New Workout</p>
            <div className="space-y-3">
              <Select value={workoutType} onChange={setWorkoutType} options={WORKOUT_TYPES.map((t) => ({ value: t, label: WORKOUT_TYPE_LABELS[t] }))} />
              <Input value={workoutName} onChange={setWorkoutName} placeholder="Workout name (optional)" />
              <input
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                className="w-full bg-fnf-surface border border-purple-500/15 rounded-lg px-4 py-3 text-fnf-text text-sm"
              />
              {ready && !userId && (
                <p className="text-amber-200 text-sm">
                  You need to be signed in.{' '}
                  <Link href="/login" className="text-fnf-violet hover:underline">Log in</Link>
                </p>
              )}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button onClick={() => startMutation.mutate()} disabled={!ready || !userId || startMutation.isPending} className="w-full">
                {startMutation.isPending ? 'Starting...' : 'Start Workout'}
              </Button>
            </div>
          </Card>

          <div className="space-y-3">
            <Card>
              <p className="font-medium text-fnf-text mb-2">Quick Start</p>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" onClick={() => setShowTemplates(true)}>
                  Start from Template
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => repeatMutation.mutate()} disabled={repeatMutation.isPending}>
                  {repeatMutation.isPending ? 'Loading...' : 'Repeat Last Workout'}
                </Button>
                <Link href="/dashboard/templates">
                  <Button variant="ghost" className="w-full">Manage Templates</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        <Modal open={showTemplates} onClose={() => setShowTemplates(false)} title="Choose a Template">
          {(templates ?? []).length === 0 ? (
            <p className="text-fnf-muted text-sm">
              No templates yet. <Link href="/dashboard/templates" className="text-fnf-violet hover:underline">Create one</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {templates!.map((t) => (
                <button
                  key={t.id}
                  onClick={() => startFromTemplateMutation.mutate(t.id)}
                  className="w-full text-left p-3 rounded-xl border border-purple-500/10 hover:bg-purple-500/10"
                >
                  <p className="text-fnf-text text-sm font-medium">{t.name}</p>
                  <p className="text-fnf-muted text-xs">{t.exercises?.length ?? 0} exercises</p>
                </button>
              ))}
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-fnf-text">{session.name || 'Active Workout'}</h2>
          <p className="text-fnf-muted text-xs">{WORKOUT_TYPE_LABELS[session.workout_type]}</p>
        </div>
        <Badge color="pink">{session.workout_exercises.length} exercises</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {session.workout_exercises.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-fnf-muted text-sm">Add an exercise to get started</p>
            </Card>
          )}
          {session.workout_exercises.map((we) => (
            <ExerciseCard
              key={we.id}
              we={we}
              userId={userId!}
              onLogSet={handleLogSet}
              onUpdateSet={(setId, patch) => { if (!isTempId(setId)) updateSetMutation.mutate({ setId, patch }); }}
              onDeleteSet={(setId) => { if (!isTempId(setId)) deleteSetMutation.mutate(setId); }}
              onRemoveExercise={(weId) => { if (!isTempId(weId)) removeExerciseMutation.mutate(weId); }}
              onCopyLastWorkout={(we) => { if (!isTempId(we.id)) copyLastMutation.mutate(we); }}
            />
          ))}
          <Button onClick={() => endMutation.mutate()} disabled={endMutation.isPending} variant="secondary" className="w-full">
            {endMutation.isPending ? 'Finishing...' : 'Finish Workout'}
          </Button>
        </div>

        <Card className="h-fit lg:sticky lg:top-20">
          <p className="font-medium text-fnf-text mb-3">Add Exercise</p>
          <Input value={search} onChange={setSearch} placeholder="Search..." className="mb-3" />
          <div className="max-h-96 overflow-y-auto space-y-1">
            {exercises.slice(0, 60).map((ex) => (
              <button
                key={ex.id}
                onClick={() =>
                  addExerciseMutation.mutate({ exercise: ex, orderIndex: session.workout_exercises.length, tempWeId: tempId() })
                }
                className="w-full text-left p-2 rounded-lg hover:bg-purple-500/10 text-sm text-fnf-secondary flex justify-between"
              >
                <span>{ex.name}</span>
                <span className="text-fnf-muted text-xs">{ex.muscle_group}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <RestTimer />
    </div>
  );
}
