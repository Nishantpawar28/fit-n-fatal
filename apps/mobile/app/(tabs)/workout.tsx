import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Screen, Heading, Subtext, Card, Button } from '@/components/ui';
import { getActiveSession, startWorkoutSession } from '@fit-n-fatal/db';

export default function WorkoutTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activeSession, isLoading } = useQuery({
    queryKey: ['activeSession', user?.id],
    queryFn: () => getActiveSession(user!.id),
    enabled: !!user,
  });

  const startMutation = useMutation({
    mutationFn: () => startWorkoutSession(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
      router.push('/workout/active');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  if (isLoading) return <Screen><Subtext>Loading...</Subtext></Screen>;

  return (
    <Screen>
      <Heading>Workout</Heading>
      <Subtext>Log exercises, sets, reps, weight, and RPE</Subtext>

      {activeSession ? (
        <Card>
          <Subtext>You have an active workout session</Subtext>
          <Button title="Continue Session" onPress={() => router.push('/workout/active')} style={{ marginTop: 12 }} />
        </Card>
      ) : (
        <Card>
          <Subtext>Start a fresh workout session. Add exercises and log your sets as you go.</Subtext>
          <Button
            title="Start New Workout"
            onPress={() => startMutation.mutate()}
            loading={startMutation.isPending}
            style={{ marginTop: 12 }}
          />
        </Card>
      )}
    </Screen>
  );
}
