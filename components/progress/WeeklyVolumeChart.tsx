import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { WorkoutSession } from '../../types';
import { COLORS, FONT, SPACING } from '../../constants/theme';

const SCREEN_W = Dimensions.get('window').width;

function getWeekLabel(weeksAgo: number): string {
  if (weeksAgo === 0) return 'Hoy';
  if (weeksAgo === 1) return '-1s';
  return `-${weeksAgo}s`;
}

function getWeeklyVolumes(sessions: WorkoutSession[], weeks = 8): number[] {
  const volumes: number[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - (i + 1) * 7);
    const end = new Date();
    end.setDate(end.getDate() - i * 7);

    const weekSessions = sessions.filter((s) => {
      const d = new Date(s.date);
      return d >= start && d < end;
    });

    const vol = weekSessions.reduce(
      (t, s) => t + s.sets.reduce((st, set) => st + set.reps * set.weight_kg, 0),
      0
    );
    volumes.push(Math.round(vol));
  }
  return volumes;
}

interface WeeklyVolumeChartProps {
  sessions: WorkoutSession[];
}

export function WeeklyVolumeChart({ sessions }: WeeklyVolumeChartProps) {
  const volumes = getWeeklyVolumes(sessions, 8);
  const hasData = volumes.some((v) => v > 0);

  const labels = Array.from({ length: 8 }, (_, i) => getWeekLabel(7 - i));

  if (!hasData) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Completa entrenamientos para ver tu volumen semanal</Text>
      </View>
    );
  }

  const chartWidth = Math.min(SCREEN_W - SPACING.lg * 2, 600);

  return (
    <View style={styles.container}>
      <BarChart
        data={{
          labels,
          datasets: [{ data: volumes.map((v) => Math.max(v, 0)) }],
        }}
        width={chartWidth}
        height={180}
        yAxisLabel=""
        yAxisSuffix="kg"
        chartConfig={{
          backgroundColor: COLORS.card,
          backgroundGradientFrom: COLORS.card,
          backgroundGradientTo: COLORS.card,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 196, 180, ${opacity})`,
          labelColor: () => COLORS.textMuted,
          style: { borderRadius: 12 },
          barPercentage: 0.6,
          propsForLabels: { fontSize: 10 },
        }}
        style={styles.chart}
        showValuesOnTopOfBars={false}
        withInnerLines={false}
        fromZero
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  chart: { borderRadius: 12 },
  empty: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyText: { color: COLORS.textMuted, fontSize: FONT.sm, textAlign: 'center' },
});
