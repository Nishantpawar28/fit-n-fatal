import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Screen, Heading, Input, Button, Badge } from '@/components/ui';
import { getActiveSession, getExercises, addExerciseToSession } from '@fit-n-fatal/db';
import { colors } from '@fit-n-fatal/utils';

export default function AddExerciseScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: session } = useQuery({
    queryKey: ['activeSession', user?.id],
    queryFn: () => getActiveSession(user!.id),
    enabled: !!user,
  });

  const { data: exercises } = useQuery({
    queryKey: ['exercises', search],
    queryFn: () => getExercises(search),
  });

  const addMutation = useMutation({
    mutationFn: (exerciseId: string) =>
      addExerciseToSession(session!.id, exerciseId, session!.workout_exercises.length),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
      router.back();
    },
  });

  return (
    <Screen>
      <Heading>Add Exercise</Heading>
      <Input value={search} onChangeText={setSearch} placeholder="Search exercises..." style={{ marginBottom: 16 }} />

      <FlatList
        data={exercises ?? []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => addMutation.mutate(item.id)}
            disabled={addMutation.isPending}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.muscle_group} · {item.equipment}</Text>
            </View>
            {item.is_custom && <Badge text="Custom" color="pink" />}
          </TouchableOpacity>
        )}
      />

      <Button title="Cancel" onPress={() => router.back()} variant="ghost" style={{ marginTop: 12 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(180,100,255,0.1)',
    padding: 14,
    marginBottom: 8,
  },
  name: { color: colors.text, fontFamily: 'DMSans', fontSize: 14, fontWeight: '500' },
  meta: { color: colors.textMuted, fontFamily: 'DMSans', fontSize: 11, marginTop: 2 },
});
