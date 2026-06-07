'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getActiveSession,
  startWorkoutSession,
  endWorkoutSession,
  addExerciseToSession,
  logSet,
  getExercises,
} from '@fit-n-fatal/db';
import { Card, Button, Input, Badge } from '@/components/ui';
import { useCurrentUserId } from '@/lib/use-current-user';

export default function WorkoutPage() {
  const queryClient = useQueryClient();
  const { userId, ready } = useCurrentUserId();
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [setInputs, setSetInputs] = useState<Record<string, { reps: string; weight: string; rpe: string }>>({});

  const { data: session } = useQuery({
    queryKey: ['activeSession', userId],
    queryFn: () => getActiveSession(userId!),
    enabled: !!userId,
  });

  const { data: exercises } = useQuery({
    queryKey: ['exercises', search],
    queryFn: () => getExercises(search),
    enabled: !!session,
  });

  const startMutation = useMutation({
    mutationFn: () => startWorkoutSession(userId!),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const endMutation = useMutation({
    mutationFn: () => endWorkoutSession(session!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['prs'] });
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: (exerciseId: string) =>
      addExerciseToSession(session!.id, exerciseId, session!.workout_exercises.length),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activeSession'] }),
  });

  const logSetMutation = useMutation({
    mutationFn: ({
      workoutExerciseId,
      setNumber,
      reps,
      weight,
      rpe,
    }: {
      workoutExerciseId: string;
      setNumber: number;
      reps: number;
      weight: number;
      rpe?: number;
    }) => logSet(workoutExerciseId, setNumber, reps, weight, rpe),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activeSession'] }),
  });

  const handleLogSet = (weId: string, setCount: number) => {
    const input = setInputs[weId] ?? { reps: '', weight: '', rpe: '' };
    const reps = parseInt(input.reps, 10);
    const weight = parseFloat(input.weight);
    if (!reps || isNaN(weight)) return;
    logSetMutation.mutate({
      workoutExerciseId: weId,
      setNumber: setCount + 1,
      reps,
      weight,
      rpe: input.rpe ? parseFloat(input.rpe) : undefined,
    });
    setSetInputs((prev) => ({ ...prev, [weId]: { reps: '', weight: input.weight, rpe: '' } }));
  };

  if (!session) {
    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-fnf-text mb-6">Workout</h2>
        <Card className="max-w-md">
          <p className="text-fnf-muted mb-4">Start a fresh workout session</p>
          {ready && !userId && (
            <p className="text-amber-200 text-sm mb-4">
              You need to be signed in to start a workout.{' '}
              <Link href="/login" className="text-fnf-violet hover:underline">Log in</Link>
              {' or '}
              <Link href="/signup" className="text-fnf-violet hover:underline">sign up</Link>.
            </p>
          )}
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <Button
            onClick={() => startMutation.mutate()}
            disabled={!ready || !userId || startMutation.isPending}
          >
            {startMutation.isPending ? 'Starting...' : 'Start New Workout'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold text-fnf-text">Active Workout</h2>
        <Badge color="pink">{session.workout_exercises.length} exercises</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {session.workout_exercises.map((we) => {
            const input = setInputs[we.id] ?? { reps: '', weight: '', rpe: '' };
            return (
              <Card key={we.id}>
                <p className="font-medium text-fnf-text">{we.exercise.name}</p>
                <p className="text-fnf-muted text-xs mb-3">{we.exercise.muscle_group}</p>
                {we.sets.map((s) => (
                  <p key={s.id} className="text-fnf-secondary text-sm">
                    Set {s.set_number}: {s.reps} × {s.weight} kg{s.rpe ? ` @ RPE ${s.rpe}` : ''}
                  </p>
                ))}
                <div className="flex gap-2 mt-3">
                  <Input value={input.reps} onChange={(v) => setSetInputs((p) => ({ ...p, [we.id]: { ...input, reps: v } }))} placeholder="Reps" className="!w-20" />
                  <Input value={input.weight} onChange={(v) => setSetInputs((p) => ({ ...p, [we.id]: { ...input, weight: v } }))} placeholder="kg" className="!w-20" />
                  <Input value={input.rpe} onChange={(v) => setSetInputs((p) => ({ ...p, [we.id]: { ...input, rpe: v } }))} placeholder="RPE" className="!w-20" />
                  <Button onClick={() => handleLogSet(we.id, we.sets.length)}>Log</Button>
                </div>
              </Card>
            );
          })}
          <Button onClick={() => endMutation.mutate()} disabled={endMutation.isPending} variant="secondary">
            Finish Workout
          </Button>
        </div>

        <Card>
          <p className="font-medium text-fnf-text mb-3">Add Exercise</p>
          <Input value={search} onChange={setSearch} placeholder="Search..." className="mb-3" />
          <div className="max-h-96 overflow-y-auto space-y-2">
            {(exercises ?? []).map((ex) => (
              <button
                key={ex.id}
                onClick={() => addExerciseMutation.mutate(ex.id)}
                className="w-full text-left p-2 rounded-lg hover:bg-purple-500/10 text-sm text-fnf-secondary"
              >
                {ex.name}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
