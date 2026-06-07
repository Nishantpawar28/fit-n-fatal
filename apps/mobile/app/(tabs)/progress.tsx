import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Screen, Heading, Subtext, Card, Button } from '@/components/ui';
import { LineChart } from '@/components/line-chart';
import { getPersonalRecords, getStrengthCurve, getExercises } from '@fit-n-fatal/db';
import { colors, getDateRangeStart } from '@fit-n-fatal/utils';
import type { DateRange } from '@fit-n-fatal/utils';

const RANGES: DateRange[] = ['week', 'month', 'quarter', 'year'];

export default function ProgressScreen() {
  const { user } = useAuth();
  const [range, setRange] = useState<DateRange>('month');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const fromDate = getDateRangeStart(range)?.toISOString();

  const { data: prs } = useQuery({
    queryKey: ['prs', user?.id],
    queryFn: () => getPersonalRecords(user!.id),
    enabled: !!user,
  });

  const { data: exercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => getExercises(),
  });

  const { data: curve } = useQuery({
    queryKey: ['strengthCurve', user?.id, selectedExercise, range],
    queryFn: () => getStrengthCurve(user!.id, selectedExercise!, fromDate ?? undefined),
    enabled: !!user && !!selectedExercise,
  });

  const chartData = (curve ?? []).map((p) => ({
    label: p.date,
    value: p.max_weight,
  }));

  return (
    <Screen>
      <Heading>Progress</Heading>
      <Subtext>PRs and strength curves over time</Subtext>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
        {RANGES.map((r) => (
          <Button
            key={r}
            title={r}
            onPress={() => setRange(r)}
            variant={range === r ? 'primary' : 'secondary'}
            style={{ marginRight: 8, minWidth: 70 }}
          />
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>Personal Records</Text>
      {(prs ?? []).slice(0, 5).map((pr) => (
        <Card key={pr.exercise_id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.prName}>{pr.exercise_name}</Text>
            <Text style={styles.prWeight}>{pr.max_weight} kg</Text>
          </View>
          <Text style={styles.prMeta}>Est. 1RM: {pr.estimated_1rm} kg</Text>
        </Card>
      ))}

      <Text style={styles.sectionLabel}>Strength Curve</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {(exercises ?? []).slice(0, 8).map((ex) => (
          <Button
            key={ex.id}
            title={ex.name.split(' ').slice(0, 2).join(' ')}
            onPress={() => setSelectedExercise(ex.id)}
            variant={selectedExercise === ex.id ? 'primary' : 'ghost'}
            style={{ marginRight: 8 }}
          />
        ))}
      </ScrollView>

      {selectedExercise && chartData.length > 0 ? (
        <Card>
          <LineChart data={chartData} />
        </Card>
      ) : (
        <Card><Subtext>Select an exercise with logged data to see your strength curve</Subtext></Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: 'DMSans',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  prName: { color: colors.text, fontFamily: 'DMSans', fontSize: 14 },
  prWeight: { color: colors.violet, fontFamily: 'DMSans', fontWeight: '600', fontSize: 14 },
  prMeta: { color: colors.textMuted, fontFamily: 'DMSans', fontSize: 11, marginTop: 4 },
});
