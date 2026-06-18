import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSession, MuscleGroup } from '../../types';
import { Card } from '../ui/Card';
import { COLORS, FONT, SPACING, RADIUS } from '../../constants/theme';
import { exercises, getExerciseById } from '../../data/exercises';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio',
};

const MUSCLE_ICONS: Record<string, string> = {
  chest: '🫁', back: '🔙', shoulders: '💪', biceps: '💪',
  triceps: '💪', legs: '🦵', quads: '🦵', hamstrings: '🦵',
  glutes: '🍑', calves: '🦵', core: '🎯', cardio: '❤️',
};

interface MuscleGroupCardProps {
  muscle: MuscleGroup;
  sessions: WorkoutSession[];
}

function getWeeklyVolumeForMuscle(sessions: WorkoutSession[], muscle: string): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return sessions
    .filter((s) => new Date(s.date) >= cutoff)
    .reduce((total, s) => {
      const muscleSets = s.sets.filter((set) => {
        const ex = getExerciseById(set.exercise_id);
        return ex?.muscle_group === muscle;
      });
      return total + muscleSets.reduce((t, set) => t + set.reps * set.weight_kg, 0);
    }, 0);
}

function getBestExercise(sessions: WorkoutSession[], muscle: string): string | null {
  const volumes: Record<string, number> = {};
  for (const s of sessions) {
    for (const set of s.sets) {
      const ex = getExerciseById(set.exercise_id);
      if (ex?.muscle_group === muscle) {
        volumes[set.exercise_id] = (volumes[set.exercise_id] ?? 0) + set.reps * set.weight_kg;
      }
    }
  }
  const sorted = Object.entries(volumes).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;
  return getExerciseById(sorted[0][0])?.name ?? null;
}

function getTrend(sessions: WorkoutSession[], muscle: string): 'up' | 'stable' | 'down' | 'none' {
  const cutoff2 = new Date(); cutoff2.setDate(cutoff2.getDate() - 14);
  const cutoff1 = new Date(); cutoff1.setDate(cutoff1.getDate() - 7);
  const now = new Date();

  const vol1 = sessions
    .filter((s) => { const d = new Date(s.date); return d >= cutoff2 && d < cutoff1; })
    .reduce((t, s) => t + s.sets.filter((set) => getExerciseById(set.exercise_id)?.muscle_group === muscle)
      .reduce((tt, set) => tt + set.reps * set.weight_kg, 0), 0);

  const vol2 = sessions
    .filter((s) => { const d = new Date(s.date); return d >= cutoff1 && d <= now; })
    .reduce((t, s) => t + s.sets.filter((set) => getExerciseById(set.exercise_id)?.muscle_group === muscle)
      .reduce((tt, set) => tt + set.reps * set.weight_kg, 0), 0);

  if (vol1 === 0 && vol2 === 0) return 'none';
  if (vol1 === 0) return 'up';
  const pct = (vol2 - vol1) / vol1;
  if (pct > 0.05) return 'up';
  if (pct < -0.05) return 'down';
  return 'stable';
}

export function MuscleGroupCard({ muscle, sessions }: MuscleGroupCardProps) {
  const weeklyVol = getWeeklyVolumeForMuscle(sessions, muscle);
  const bestEx = getBestExercise(sessions, muscle);
  const trend = getTrend(sessions, muscle);

  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : trend === 'stable' ? '→' : '—';
  const trendColor = trend === 'up' ? COLORS.success : trend === 'down' ? COLORS.danger : COLORS.textMuted;

  return (
    <Card padding={SPACING.md} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{MUSCLE_ICONS[muscle] ?? '💪'}</Text>
        <View style={styles.info}>
          <Text style={styles.muscleName}>{MUSCLE_LABELS[muscle] ?? muscle}</Text>
          {weeklyVol > 0 ? (
            <Text style={styles.volume}>{Math.round(weeklyVol).toLocaleString()} kg esta semana</Text>
          ) : (
            <Text style={styles.noData}>Sin datos esta semana</Text>
          )}
        </View>
        <Text style={[styles.trend, { color: trendColor }]}>{trendIcon}</Text>
      </View>
      {bestEx && (
        <Text style={styles.bestEx} numberOfLines={1}>
          ⭐ {bestEx}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: '47%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  muscleName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700' },
  volume: { color: COLORS.primary, fontSize: FONT.sm, marginTop: 2 },
  noData: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  trend: { fontSize: 20, fontWeight: '700' },
  bestEx: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 6 },
});
