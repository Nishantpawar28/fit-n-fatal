import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Screen, Heading, Subtext, Card, Button, HeroCard, Badge } from '@/components/ui';
import { getActiveSession, getPersonalRecords } from '@fit-n-fatal/db';
import { colors, formatDate } from '@fit-n-fatal/utils';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  const { data: activeSession } = useQuery({
    queryKey: ['activeSession', user?.id],
    queryFn: () => getActiveSession(user!.id),
    enabled: !!user,
  });

  const { data: prs } = useQuery({
    queryKey: ['prs', user?.id],
    queryFn: () => getPersonalRecords(user!.id),
    enabled: !!user,
  });

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <View>
          <Heading>Fit N Fatal</Heading>
          <Subtext>Welcome back, {user?.email?.split('@')[0]}</Subtext>
        </View>
        <TouchableOpacity onPress={signOut}>
          <Text style={{ color: colors.textMuted, fontFamily: 'DMSans', fontSize: 12 }}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <HeroCard
        title="Dark · Purple · Deadly"
        subtitle="Background #0D0D14 · Purple gradient · Pink accents"
      />

      {activeSession ? (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: colors.text, fontFamily: 'DMSans', fontWeight: '600', fontSize: 15 }}>
                Workout in progress
              </Text>
              <Text style={{ color: colors.textMuted, fontFamily: 'DMSans', fontSize: 12, marginTop: 4 }}>
                Started {formatDate(activeSession.started_at)}
              </Text>
            </View>
            <Badge text="Active" color="pink" />
          </View>
          <View style={{ marginTop: 12 }}>
            <Button title="Continue Workout" onPress={() => router.push('/workout/active')} />
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={{ color: colors.text, fontFamily: 'DMSans', fontWeight: '600', fontSize: 15, marginBottom: 8 }}>
            Ready to train?
          </Text>
          <Subtext>Start a new session and log your sets</Subtext>
          <View style={{ marginTop: 12 }}>
            <Button title="Start Workout" onPress={() => router.push('/(tabs)/workout')} />
          </View>
        </Card>
      )}

      <Text style={{ color: colors.textMuted, fontFamily: 'DMSans', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8, marginBottom: 12 }}>
        Recent PRs
      </Text>

      {(prs ?? []).slice(0, 3).map((pr) => (
        <Card key={pr.exercise_id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.text, fontFamily: 'DMSans', fontSize: 14 }}>{pr.exercise_name}</Text>
            <Text style={{ color: colors.violet, fontFamily: 'DMSans', fontWeight: '600', fontSize: 14 }}>
              {pr.max_weight} kg
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontFamily: 'DMSans', fontSize: 11, marginTop: 4 }}>
            {pr.reps_at_max} reps · Est. 1RM {pr.estimated_1rm} kg
          </Text>
        </Card>
      ))}

      {(!prs || prs.length === 0) && (
        <Card>
          <Subtext>No PRs yet. Complete a workout to see your records.</Subtext>
        </Card>
      )}
    </Screen>
  );
}
