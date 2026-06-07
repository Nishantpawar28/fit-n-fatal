import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Screen, Heading, Subtext, Card, Input } from '@/components/ui';
import { getWorkoutHistory } from '@fit-n-fatal/db';
import { colors, formatDate, formatDuration } from '@fit-n-fatal/utils';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: history, isLoading } = useQuery({
    queryKey: ['history', user?.id],
    queryFn: () => getWorkoutHistory(user!.id),
    enabled: !!user,
  });

  const filtered = (history ?? []).filter((session) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return session.workout_exercises.some((we) =>
      we.exercise.name.toLowerCase().includes(q)
    );
  });

  return (
    <Screen>
      <Heading>History</Heading>
      <Subtext>Past workouts and session details</Subtext>

      <Input
        value={search}
        onChangeText={setSearch}
        placeholder="Filter by exercise name..."
        style={{ marginVertical: 12 }}
      />

      {isLoading ? (
        <Subtext>Loading...</Subtext>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Subtext>No workouts yet</Subtext>}
          renderItem={({ item }) => {
            const isOpen = expanded === item.id;
            const totalSets = item.workout_exercises.reduce((sum, we) => sum + we.sets.length, 0);
            return (
              <TouchableOpacity onPress={() => setExpanded(isOpen ? null : item.id)}>
                <Card>
                  <View style={styles.row}>
                    <Text style={styles.date}>{formatDate(item.started_at)}</Text>
                    <Text style={styles.duration}>{formatDuration(item.started_at, item.ended_at)}</Text>
                  </View>
                  <Text style={styles.meta}>
                    {item.workout_exercises.length} exercises · {totalSets} sets
                  </Text>
                  {isOpen && item.workout_exercises.map((we) => (
                    <View key={we.id} style={styles.detail}>
                      <Text style={styles.exercise}>{we.exercise.name}</Text>
                      {we.sets.map((s) => (
                        <Text key={s.id} style={styles.set}>
                          Set {s.set_number}: {s.reps} × {s.weight} kg{s.rpe ? ` @ RPE ${s.rpe}` : ''}
                        </Text>
                      ))}
                    </View>
                  ))}
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { color: colors.text, fontFamily: 'DMSans', fontSize: 15, fontWeight: '600' },
  duration: { color: colors.violet, fontFamily: 'DMSans', fontSize: 13 },
  meta: { color: colors.textMuted, fontFamily: 'DMSans', fontSize: 11, marginTop: 4 },
  detail: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  exercise: { color: colors.textSecondary, fontFamily: 'DMSans', fontSize: 13, fontWeight: '500', marginBottom: 4 },
  set: { color: colors.textMuted, fontFamily: 'DMSans', fontSize: 11, marginLeft: 8 },
});
