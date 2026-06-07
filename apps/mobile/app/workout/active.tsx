import { useState } from 'react';
import { View, Text, ScrollView, Alert, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Screen, Heading, Button, Card, Badge } from '@/components/ui';
import {
  getActiveSession,
  addExerciseToSession,
  logSet,
  endWorkoutSession,
  getLastUsedWeight,
} from '@fit-n-fatal/db';
import { colors } from '@fit-n-fatal/utils';

export default function ActiveWorkoutScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [setInputs, setSetInputs] = useState<Record<string, { reps: string; weight: string; rpe: string }>>({});

  const { data: session, isLoading } = useQuery({
    queryKey: ['activeSession', user?.id],
    queryFn: () => getActiveSession(user!.id),
    enabled: !!user,
  });

  const endMutation = useMutation({
    mutationFn: () => endWorkoutSession(session!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['prs'] });
      router.replace('/(tabs)');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
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
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const handleLogSet = async (workoutExerciseId: string, exerciseId: string, currentSets: number) => {
    const input = setInputs[workoutExerciseId] ?? { reps: '', weight: '', rpe: '' };
    const reps = parseInt(input.reps, 10);
    const weight = parseFloat(input.weight);
    const rpe = input.rpe ? parseFloat(input.rpe) : undefined;

    if (!reps || reps <= 0 || isNaN(weight)) {
      Alert.alert('Error', 'Enter valid reps and weight');
      return;
    }

    await logSetMutation.mutateAsync({
      workoutExerciseId,
      setNumber: currentSets + 1,
      reps,
      weight,
      rpe,
    });

    const lastWeight = await getLastUsedWeight(user!.id, exerciseId);
    setSetInputs((prev) => ({
      ...prev,
      [workoutExerciseId]: { reps: '', weight: lastWeight?.toString() ?? input.weight, rpe: '' },
    }));
  };

  const updateInput = (id: string, field: 'reps' | 'weight' | 'rpe', value: string) => {
    setSetInputs((prev) => ({
      ...prev,
      [id]: { ...prev[id], reps: prev[id]?.reps ?? '', weight: prev[id]?.weight ?? '', rpe: prev[id]?.rpe ?? '', [field]: value },
    }));
  };

  if (isLoading || !session) {
    return (
      <Screen>
        <Heading>Active Workout</Heading>
        <Button title="Go Back" onPress={() => router.back()} variant="ghost" />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Heading>Active Workout</Heading>
        <Badge text={`${session.workout_exercises.length} exercises`} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {session.workout_exercises.map((we) => {
          const input = setInputs[we.id] ?? { reps: '', weight: '', rpe: '' };
          return (
            <Card key={we.id}>
              <Text style={styles.exerciseName}>{we.exercise.name}</Text>
              <Text style={styles.muscle}>{we.exercise.muscle_group}</Text>

              {we.sets.map((set) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setText}>Set {set.set_number}</Text>
                  <Text style={styles.setText}>{set.reps} × {set.weight} kg</Text>
                  {set.rpe && <Text style={styles.rpeText}>RPE {set.rpe}</Text>}
                </View>
              ))}

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.setInput}
                  placeholder="Reps"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={input.reps}
                  onChangeText={(v) => updateInput(we.id, 'reps', v)}
                />
                <TextInput
                  style={styles.setInput}
                  placeholder="kg"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={input.weight}
                  onChangeText={(v) => updateInput(we.id, 'weight', v)}
                />
                <TextInput
                  style={styles.setInput}
                  placeholder="RPE"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={input.rpe}
                  onChangeText={(v) => updateInput(we.id, 'rpe', v)}
                />
              </View>
              <Button
                title="Log Set"
                onPress={() => handleLogSet(we.id, we.exercise_id, we.sets.length)}
                loading={logSetMutation.isPending}
                style={{ marginTop: 8 }}
              />
            </Card>
          );
        })}

        <Button
          title="Add Exercise"
          onPress={() => router.push('/workout/add-exercise')}
          variant="secondary"
          style={{ marginBottom: 12 }}
        />
        <Button
          title="Finish Workout"
          onPress={() => {
            Alert.alert('Finish Workout', 'End this session?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Finish', onPress: () => endMutation.mutate() },
            ]);
          }}
          loading={endMutation.isPending}
          style={{ marginBottom: 40 }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  exerciseName: { color: colors.text, fontFamily: 'DMSans', fontSize: 16, fontWeight: '600' },
  muscle: { color: colors.textMuted, fontFamily: 'DMSans', fontSize: 11, marginBottom: 8 },
  setRow: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  setText: { color: colors.textSecondary, fontFamily: 'DMSans', fontSize: 13 },
  rpeText: { color: colors.pink, fontFamily: 'DMSans', fontSize: 12 },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  setInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: 'rgba(180,100,255,0.15)',
    borderRadius: 8,
    padding: 10,
    color: colors.text,
    fontFamily: 'DMSans',
    textAlign: 'center',
  },
});
