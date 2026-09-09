'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTemplates, createTemplate, deleteTemplate, startWorkoutFromTemplate, getExercises } from '@fit-n-fatal/db';
import { Card, Button, Input, Select, ConfirmDialog, EmptyState } from '@/components/ui';
import { useProfile } from '@/lib/use-profile';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPES } from '@fit-n-fatal/utils';
import { Trash2, Plus, X } from 'lucide-react';

export default function TemplatesPage() {
  const { userId } = useProfile();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('gym');
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<{ id: string; name: string }[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: templates } = useQuery({
    queryKey: ['templates', userId],
    queryFn: () => getTemplates(userId!),
    enabled: !!userId,
  });

  const { data: exercises } = useQuery({
    queryKey: ['exercises', search],
    queryFn: () => getExercises(search),
    enabled: showCreate,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createTemplate(
        userId!,
        name,
        type as any,
        picked.map((p) => ({ exerciseId: p.id }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowCreate(false);
      setName('');
      setPicked([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const startMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const t = templates!.find((t) => t.id === templateId)!;
      return startWorkoutFromTemplate(userId!, t);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
      router.push('/dashboard/workout');
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold text-fnf-text">Workout Templates</h2>
        <Button onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : '+ New Template'}</Button>
      </div>

      {showCreate && (
        <Card className="max-w-xl mb-6 space-y-3">
          <Input value={name} onChange={setName} placeholder="Template name (e.g. Push Day)" />
          <Select value={type} onChange={setType} options={WORKOUT_TYPES.map((t) => ({ value: t, label: WORKOUT_TYPE_LABELS[t] }))} />

          <div>
            <p className="text-fnf-secondary text-xs mb-1.5">Exercises</p>
            {picked.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {picked.map((p) => (
                  <span key={p.id} className="flex items-center gap-1 bg-purple-500/15 text-fnf-violet text-xs px-2.5 py-1 rounded-full">
                    {p.name}
                    <button onClick={() => setPicked((prev) => prev.filter((x) => x.id !== p.id))}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Input value={search} onChange={setSearch} placeholder="Search exercises to add..." />
            <div className="max-h-48 overflow-y-auto mt-2 space-y-1">
              {(exercises ?? [])
                .filter((ex) => !picked.some((p) => p.id === ex.id))
                .map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setPicked((prev) => [...prev, { id: ex.id, name: ex.name }])}
                    className="w-full text-left p-2 rounded-lg hover:bg-purple-500/10 text-sm text-fnf-secondary flex items-center gap-2"
                  >
                    <Plus size={13} /> {ex.name}
                  </button>
                ))}
            </div>
          </div>

          <Button onClick={() => createMutation.mutate()} disabled={!name || picked.length === 0 || createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Saving...' : 'Save Template'}
          </Button>
        </Card>
      )}

      {(templates ?? []).length === 0 && !showCreate && (
        <EmptyState icon="📋" title="No templates yet" message="Save a reusable workout like Push Day or Leg Day." action={<Button onClick={() => setShowCreate(true)}>Create Template</Button>} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(templates ?? []).map((t) => (
          <Card key={t.id}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-fnf-text font-medium">{t.name}</p>
                <p className="text-fnf-muted text-xs">{WORKOUT_TYPE_LABELS[t.workout_type]} · {t.exercises?.length ?? 0} exercises</p>
              </div>
              <button onClick={() => setDeleteId(t.id)} className="text-fnf-muted hover:text-red-400">
                <Trash2 size={15} />
              </button>
            </div>
            <ul className="text-fnf-secondary text-xs mb-3 space-y-0.5">
              {(t.exercises ?? []).slice(0, 4).map((te) => (
                <li key={te.id}>· {te.exercise.name}</li>
              ))}
              {(t.exercises?.length ?? 0) > 4 && <li className="text-fnf-muted">+{t.exercises!.length - 4} more</li>}
            </ul>
            <Button variant="secondary" className="w-full" onClick={() => startMutation.mutate(t.id)} disabled={startMutation.isPending}>
              Start Workout
            </Button>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete template?"
        message="This can't be undone."
      />
    </div>
  );
}
