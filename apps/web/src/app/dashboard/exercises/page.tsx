'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Pencil, Trash2 } from 'lucide-react';
import {
  getExercises,
  getFavoriteExerciseIds,
  toggleFavoriteExercise,
  createCustomExercise,
  updateExercise,
  deleteExercise,
} from '@fit-n-fatal/db';
import type { Exercise, ExerciseType } from '@fit-n-fatal/db';
import { Card, Button, Input, Badge, Select, Textarea, Modal, ConfirmDialog, EmptyState } from '@/components/ui';
import { useProfile } from '@/lib/use-profile';
import { MUSCLE_GROUPS, EQUIPMENT_OPTIONS, EXERCISE_TYPE_LABELS } from '@fit-n-fatal/utils';

const emptyForm = {
  name: '',
  muscle_group: MUSCLE_GROUPS[0] as string,
  secondary_muscle_group: '',
  equipment: '',
  exercise_type: 'strength' as ExerciseType,
  description: '',
  personal_notes: '',
};

function ExercisesInner() {
  const searchParams = useSearchParams();
  const { userId } = useProfile();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showForm, setShowForm] = useState<'create' | Exercise | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearch(q);
  }, [searchParams]);

  const { data: exercises } = useQuery({
    queryKey: ['exercises', search, muscleFilter],
    queryFn: () => getExercises(search, muscleFilter || undefined),
  });

  const { data: favorites } = useQuery({
    queryKey: ['favoriteExercises', userId],
    queryFn: () => getFavoriteExerciseIds(userId!),
    enabled: !!userId,
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ id, fav }: { id: string; fav: boolean }) => toggleFavoriteExercise(userId!, id, fav),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favoriteExercises'] }),
  });

  const createMutation = useMutation({
    mutationFn: () => createCustomExercise(userId!, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setShowForm(null);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) => updateExercise(id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setShowForm(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });

  const openEdit = (ex: Exercise) => {
    setForm({
      name: ex.name,
      muscle_group: ex.muscle_group,
      secondary_muscle_group: ex.secondary_muscle_group ?? '',
      equipment: ex.equipment ?? '',
      exercise_type: ex.exercise_type,
      description: ex.description ?? '',
      personal_notes: ex.personal_notes ?? '',
    });
    setShowForm(ex);
  };

  const filtered = (exercises ?? []).filter((ex) => !favoritesOnly || favorites?.has(ex.id));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold text-fnf-text">Exercise Library</h2>
        <Button onClick={() => { setForm(emptyForm); setShowForm('create'); }}>+ Add Exercise</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <Input value={search} onChange={setSearch} placeholder="Search exercises..." className="max-w-xs" />
        <Select value={muscleFilter} onChange={setMuscleFilter} placeholder="All muscle groups" options={MUSCLE_GROUPS.map((m) => ({ value: m, label: m }))} className="max-w-[200px]" />
        <button
          onClick={() => setFavoritesOnly((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm border ${favoritesOnly ? 'border-fnf-violet text-fnf-violet bg-purple-500/10' : 'border-purple-500/15 text-fnf-muted'}`}
        >
          <Star size={14} fill={favoritesOnly ? 'currentColor' : 'none'} /> Favorites
        </button>
      </div>

      {filtered.length === 0 && <EmptyState icon="🏋️" title="No exercises found" message="Try a different search or add a custom exercise." />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((ex) => {
          const isFav = favorites?.has(ex.id) ?? false;
          return (
            <Card key={ex.id}>
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <p className="text-fnf-text font-medium truncate">{ex.name}</p>
                  <p className="text-fnf-muted text-xs mt-0.5">
                    {ex.muscle_group}
                    {ex.secondary_muscle_group ? ` + ${ex.secondary_muscle_group}` : ''} · {ex.equipment ?? 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => userId && favoriteMutation.mutate({ id: ex.id, fav: !isFav })}
                  className={isFav ? 'text-fnf-violet' : 'text-fnf-muted hover:text-fnf-violet'}
                >
                  <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
                </button>
              </div>
              {ex.description && <p className="text-fnf-secondary text-xs mt-2 line-clamp-2">{ex.description}</p>}
              <div className="flex justify-between items-center mt-3">
                <Badge color={ex.is_custom ? 'pink' : 'neutral'}>{ex.is_custom ? 'Custom' : EXERCISE_TYPE_LABELS[ex.exercise_type]}</Badge>
                {ex.is_custom && (
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(ex)} className="text-fnf-muted hover:text-fnf-violet">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(ex)} className="text-fnf-muted hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!showForm} onClose={() => setShowForm(null)} title={showForm === 'create' ? 'Add Exercise' : 'Edit Exercise'}>
        <div className="space-y-3">
          <Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Exercise name" />
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.muscle_group} onChange={(v) => setForm((f) => ({ ...f, muscle_group: v }))} options={MUSCLE_GROUPS.map((m) => ({ value: m, label: m }))} />
            <Select value={form.secondary_muscle_group} onChange={(v) => setForm((f) => ({ ...f, secondary_muscle_group: v }))} placeholder="Secondary (optional)" options={MUSCLE_GROUPS.map((m) => ({ value: m, label: m }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.equipment} onChange={(v) => setForm((f) => ({ ...f, equipment: v }))} placeholder="Equipment" options={EQUIPMENT_OPTIONS.map((m) => ({ value: m, label: m }))} />
            <Select value={form.exercise_type} onChange={(v) => setForm((f) => ({ ...f, exercise_type: v as ExerciseType }))} options={Object.entries(EXERCISE_TYPE_LABELS).map(([value, label]) => ({ value, label }))} />
          </div>
          <Textarea value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Description / instructions" />
          <Textarea value={form.personal_notes} onChange={(v) => setForm((f) => ({ ...f, personal_notes: v }))} placeholder="Personal notes" rows={2} />
          <Button
            className="w-full"
            disabled={!form.name || !form.muscle_group || createMutation.isPending || updateMutation.isPending}
            onClick={() => (showForm === 'create' ? createMutation.mutate() : updateMutation.mutate((showForm as Exercise).id))}
          >
            {showForm === 'create' ? 'Save Exercise' : 'Save Changes'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete exercise?"
        message={`${deleteTarget?.name ?? ''} will be permanently removed.`}
      />
    </div>
  );
}

export default function ExercisesPage() {
  return (
    <Suspense fallback={null}>
      <ExercisesInner />
    </Suspense>
  );
}
