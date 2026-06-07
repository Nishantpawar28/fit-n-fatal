import { useState } from 'react';
import { View, Text, FlatList, Alert, StyleSheet } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Screen, Heading, Subtext, Input, Button, Badge } from '@/components/ui';
import { getExercises, createCustomExercise } from '@fit-n-fatal/db';
import { colors } from '@fit-n-fatal/utils';

export default function ExercisesScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('');
  const [equipment, setEquipment] = useState('');

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises', search],
    queryFn: () => getExercises(search),
  });

  const createMutation = useMutation({
    mutationFn: () => createCustomExercise(user!.id, name, muscle, equipment || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      setShowAdd(false);
      setName('');
      setMuscle('');
      setEquipment('');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  return (
    <Screen>
      <Heading>Exercises</Heading>
      <Subtext>50+ pre-loaded exercises. Add your own custom moves.</Subtext>

      <Input value={search} onChangeText={setSearch} placeholder="Search exercises..." style={{ marginVertical: 12 }} />

      <Button
        title={showAdd ? 'Cancel' : 'Add Custom Exercise'}
        onPress={() => setShowAdd(!showAdd)}
        variant="secondary"
        style={{ marginBottom: 12 }}
      />

      {showAdd && (
        <View style={styles.addForm}>
          <Input value={name} onChangeText={setName} placeholder="Exercise name" />
          <Input value={muscle} onChangeText={setMuscle} placeholder="Muscle group" style={{ marginTop: 8 }} />
          <Input value={equipment} onChangeText={setEquipment} placeholder="Equipment (optional)" style={{ marginTop: 8 }} />
          <Button
            title="Save Exercise"
            onPress={() => createMutation.mutate()}
            loading={createMutation.isPending}
            style={{ marginTop: 12 }}
          />
        </View>
      )}

      {isLoading ? (
        <Subtext>Loading...</Subtext>
      ) : (
        <FlatList
          data={exercises ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.muscle_group} · {item.equipment ?? 'N/A'}</Text>
              </View>
              {item.is_custom ? <Badge text="Custom" color="pink" /> : <Badge text="System" color="neutral" />}
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addForm: { marginBottom: 16 },
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
