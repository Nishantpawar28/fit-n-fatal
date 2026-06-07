'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { getExercises, createCustomExercise } from '@fit-n-fatal/db';
import { Card, Button, Input, Badge } from '@/components/ui';

export default function ExercisesPage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('');
  const [equipment, setEquipment] = useState('');

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: exercises } = useQuery({
    queryKey: ['exercises', search],
    queryFn: () => getExercises(search),
  });

  const createMutation = useMutation({
    mutationFn: () => createCustomExercise(userId!, name, muscle, equipment || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setShowAdd(false);
      setName('');
      setMuscle('');
      setEquipment('');
    },
  });

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-fnf-text mb-6">Exercise Library</h2>

      <div className="flex gap-3 mb-6">
        <Input value={search} onChange={setSearch} placeholder="Search 50+ exercises..." className="max-w-md" />
        <Button variant="secondary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : 'Add Custom'}
        </Button>
      </div>

      {showAdd && (
        <Card className="max-w-md mb-6 space-y-3">
          <Input value={name} onChange={setName} placeholder="Exercise name" />
          <Input value={muscle} onChange={setMuscle} placeholder="Muscle group" />
          <Input value={equipment} onChange={setEquipment} placeholder="Equipment" />
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            Save Exercise
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(exercises ?? []).map((ex) => (
          <Card key={ex.id} className="flex justify-between items-start">
            <div>
              <p className="text-fnf-text font-medium">{ex.name}</p>
              <p className="text-fnf-muted text-xs">{ex.muscle_group} · {ex.equipment ?? 'N/A'}</p>
            </div>
            <Badge color={ex.is_custom ? 'pink' : 'neutral'}>
              {ex.is_custom ? 'Custom' : 'System'}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
