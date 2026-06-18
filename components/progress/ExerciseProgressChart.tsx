import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { WorkoutSession } from '../../types';
import { COLORS, FONT, SPACING } from '../../constants/theme';

const SCREEN_W = Dimensions.get('window').width;

interface ExerciseProgressChartProps {
  sessions: WorkoutSession[];
  exerciseId: string;
}

export function ExerciseProgressChart({ sessions, exerciseId }: ExerciseProgressChartProps) {
  // Filtrar sesiones que tienen este ejercicio y tomar el peso máximo de cada sesión
  const dataPoints = sessions
    .filter((s) => s.sets.some((set) => set.exercise_id === exerciseId))
    .slice(-10) // últimas 10 sesiones
    .map((s) => {
      const sets = s.sets.filter((set) => set.exercise_id === exerciseId);
      const maxWeight = Math.max(...sets.map((set) => set.weight_kg));
      return { date: s.date, weight: maxWeight };
    });

  if (dataPoints.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Necesitas al menos 2 sesiones con este ejercicio para ver el gráfico de progresión.
        </Text>
      </View>
    );
  }

  const labels = dataPoints.map((d) => {
    const date = new Date(d.date);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });

  const data = dataPoints.map((d) => d.weight);
  const chartWidth = Math.min(SCREEN_W - SPACING.lg * 2, 600);

  return (
    <View style={styles.container}>
      <LineChart
        data={{
          labels,
          datasets: [{ data, color: () => COLORS.primary, strokeWidth: 2 }],
        }}
        width={chartWidth}
        height={180}
        yAxisSuffix="kg"
        chartConfig={{
          backgroundColor: COLORS.card,
          backgroundGradientFrom: COLORS.card,
          backgroundGradientTo: COLORS.card,
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 196, 180, ${opacity})`,
          labelColor: () => COLORS.textMuted,
          propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
          propsForLabels: { fontSize: 10 },
        }}
        bezier
        style={styles.chart}
        withInnerLines={false}
        withOuterLines={false}
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
