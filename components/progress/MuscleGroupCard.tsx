import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const MUSCLE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  chest: 'body-outline',
  back: 'body-outline',
  shoulders: 'barbell-outline',
  biceps: 'barbell-outline',
  triceps: 'barbell-outline',
  legs: 'walk-outline',
  quads: 'walk-outline',
  hamstrings: 'walk-outline',
  glutes: 'walk-outline',
  calves: 'walk-outline',
  core: 'disc-outline',
  cardio: 'heart-outline',
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

  const trendIcon: keyof typeof Ionicons.glyphMap =
    trend === 'up' ? 'arrow-up-outline' :
    trend === 'down' ? 'arrow-down-outline' :
    trend === 'stable' ? 'arrow-forward-outline' : 'remove-outline';
  const trendColor = trend === 'up' ? COLORS.success : trend === 'down' ? COLORS.danger : COLORS.textMuted;

  const muscleIcon = MUSCLE_ICONS[muscle] ?? 'barbell-outline';

  return (
    <Card padding={SPACING.md} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconChip}>
          <Ionicons name={muscleIcon} size={18} color={COLORS.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.muscleName}>{MUSCLE_LABELS[muscle] ?? muscle}</Text>
          {weeklyVol > 0 ? (
            <Text style={styles.volume}>{Math.round(weeklyVol).toLocaleString()} kg</Text>
          ) : (
            <Text style={styles.noData}>Sin datos</Text>
          )}
        </View>
        <Ionicons name={trendIcon} size={18} color={trendColor} />
      </View>
      {bestEx && (
        <View style={styles.bestExRow}>
          <Ionicons name="star" size={11} color={COLORS.primary} />
          <Text style={styles.bestEx} numberOfLines={1}>{bestEx}</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: '47%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  iconChip: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryDim, alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  muscleName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  volume: { color: COLORS.primary, fontSize: FONT.sm, marginTop: 2, fontVariant: ['tabular-nums'] },
  noData: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  bestExRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  bestEx: { color: COLORS.textMuted, fontSize: FONT.sm, flex: 1 },
});
