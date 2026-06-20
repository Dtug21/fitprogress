import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutSession, WorkoutSet } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { formatDuration, formatWeight } from '../../utils/formatters';
import { getExerciseById } from '../../data/exercises';

type MoodOption = { icon: keyof typeof Ionicons.glyphMap; color: string; label: string };
const MOODS: MoodOption[] = [
  { icon: 'sad-outline', color: COLORS.danger, label: 'Mal' },
  { icon: 'sad-outline', color: COLORS.warning, label: 'Regular' },
  { icon: 'happy-outline', color: COLORS.textSecondary, label: 'Bien' },
  { icon: 'happy-outline', color: COLORS.success, label: 'Muy bien' },
  { icon: 'flash', color: COLORS.primary, label: '¡Épico!' },
];

interface WorkoutSummaryProps {
  session: WorkoutSession;
  newPRs: string[]; // exercise IDs con nuevo PR
  mood: 1 | 2 | 3 | 4 | 5;
  onMoodChange: (mood: 1 | 2 | 3 | 4 | 5) => void;
  onFinish: () => void;
}

export function WorkoutSummary({ session, newPRs, mood, onMoodChange, onFinish }: WorkoutSummaryProps) {
  const durationSec = session.finished_at
    ? Math.floor(
        (new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 1000
      )
    : 0;

  const totalVolume = session.sets.reduce((t, s) => t + s.reps * s.weight_kg, 0);
  const completedSets = session.sets.filter((s) => s.completed).length;

  // Agrupar sets por ejercicio
  const byExercise: Record<string, WorkoutSet[]> = {};
  for (const s of session.sets) {
    if (!byExercise[s.exercise_id]) byExercise[s.exercise_id] = [];
    byExercise[s.exercise_id].push(s);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Título */}
      <View style={styles.titleRow}>
        <View style={styles.titleIconChip}>
          <Ionicons name="checkmark-circle" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Entrenamiento completado</Text>
      </View>

      {/* Stats principales */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard} padding={SPACING.md}>
          <Text style={styles.statValue}>{formatDuration(durationSec)}</Text>
          <Text style={styles.statLabel}>Duración</Text>
        </Card>
        <Card style={styles.statCard} padding={SPACING.md}>
          <Text style={styles.statValue}>{completedSets}</Text>
          <Text style={styles.statLabel}>Series</Text>
        </Card>
        <Card style={styles.statCard} padding={SPACING.md}>
          <Text style={styles.statValue}>
            {totalVolume > 0 ? `${Math.round(totalVolume)}kg` : '—'}
          </Text>
          <Text style={styles.statLabel}>Volumen</Text>
        </Card>
      </View>

      {/* PRs nuevos */}
      {newPRs.length > 0 && (
        <Card padding={SPACING.md} style={styles.prCard}>
          <View style={styles.prTitleRow}>
            <Ionicons name="trophy" size={16} color={COLORS.primary} />
            <Text style={styles.prTitle}>Nuevos récords personales</Text>
          </View>
          {newPRs.map((exId) => {
            const ex = getExerciseById(exId);
            return (
              <Text key={exId} style={styles.prItem}>• {ex?.name ?? exId}</Text>
            );
          })}
        </Card>
      )}

      {/* Resumen de ejercicios */}
      <Text style={styles.sectionTitle}>Ejercicios completados</Text>
      {Object.entries(byExercise).map(([exId, sets]) => {
        const ex = getExerciseById(exId);
        return (
          <Card key={exId} padding={SPACING.md}>
            <Text style={styles.exName}>{ex?.name ?? exId}</Text>
            <View style={styles.setsRow}>
              {sets.map((s, i) => (
                <View key={s.id} style={styles.setChip}>
                  <Text style={styles.setChipText}>
                    {s.weight_kg > 0 ? `${s.reps}×${s.weight_kg}kg` : `${s.reps} reps`}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        );
      })}

      {/* Mood */}
      <Text style={styles.sectionTitle}>¿Cómo te sentiste?</Text>
      <Card padding={SPACING.md}>
        <View style={styles.moodRow}>
          {MOODS.map((m, i) => {
            const val = (i + 1) as 1 | 2 | 3 | 4 | 5;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.moodBtn, mood === val && styles.moodBtnActive]}
                onPress={() => onMoodChange(val)}
                activeOpacity={0.7}
              >
                <Ionicons name={m.icon} size={26} color={mood === val ? m.color : COLORS.textMuted} />
                <Text style={[styles.moodLabel, mood === val && styles.moodLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Button
        label="Finalizar"
        onPress={onFinish}
        fullWidth
        style={styles.finishBtn}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: SPACING.lg, gap: SPACING.sm },
  titleRow: { alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  titleIconChip: {
    width: 64, height: 64, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryDim, alignItems: 'center', justifyContent: 'center',
  },
  title: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '600', textAlign: 'center' },

  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { color: COLORS.primary, fontSize: FONT.xl, fontWeight: '600', fontVariant: ['tabular-nums'] },
  statLabel: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },

  prCard: { borderColor: COLORS.primary, borderWidth: 1 },
  prTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  prTitle: { color: COLORS.primary, fontSize: FONT.sm, fontWeight: '600' },
  prItem: { color: COLORS.textPrimary, fontSize: FONT.base, marginTop: 4 },

  sectionTitle: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: SPACING.sm },

  exName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600', marginBottom: 8 },
  setsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  setChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
  },
  setChipText: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '600' },

  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  moodBtnActive: { backgroundColor: COLORS.primaryDim },
  moodLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  moodLabelActive: { color: COLORS.primary },

  finishBtn: { marginTop: SPACING.sm },
});
