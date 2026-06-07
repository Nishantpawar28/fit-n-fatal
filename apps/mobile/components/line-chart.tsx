import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { colors } from '@fit-n-fatal/utils';

interface DataPoint {
  label: string;
  value: number;
}

export function LineChart({ data, height = 180 }: { data: DataPoint[]; height?: number }) {
  if (data.length === 0) return null;

  const width = 300;
  const padding = { top: 16, right: 16, bottom: 28, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padding.top + chartH - ((d.value - min) / range) * chartH;
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View>
      <Svg width={width} height={height}>
        <Line
          x1={padding.left}
          y1={padding.top + chartH}
          x2={padding.left + chartW}
          y2={padding.top + chartH}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />
        <Polyline
          points={polyline}
          fill="none"
          stroke={colors.violet}
          strokeWidth={2}
        />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.purple} />
        ))}
      </Svg>
      <View style={styles.labels}>
        <Text style={styles.axisLabel}>{min} kg</Text>
        <Text style={styles.axisLabel}>{max} kg</Text>
      </View>
      <View style={styles.dateRow}>
        {data.length <= 5
          ? data.map((d, i) => (
              <Text key={i} style={styles.dateLabel}>
                {d.label.slice(5)}
              </Text>
            ))
          : (
              <>
                <Text style={styles.dateLabel}>{data[0].label.slice(5)}</Text>
                <Text style={styles.dateLabel}>{data[data.length - 1].label.slice(5)}</Text>
              </>
            )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: -24,
  },
  axisLabel: {
    color: colors.textMuted,
    fontFamily: 'DMSans',
    fontSize: 9,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: 4,
  },
  dateLabel: {
    color: colors.textMuted,
    fontFamily: 'DMSans',
    fontSize: 9,
  },
});
