import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { WorkoutSession, WorkoutSet } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { formatDuration, formatWeight } from '../../utils/formatters';
import { getExerciseById } from '../../data/exercises';

const MOODS = [
  { emoji: '😞', label: 'Mal' },
  { emoji: '😕', label: 'Regular' },
  { emoji: '😐', label: 'Bien' },
  { emoji: '🙂', label: 'Muy bien' },
  { emoji: '🔥', label: '¡Épico!' },
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
      <Text style={styles.title}>¡Entrenamiento completado! 🎉</Text>

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
          <Text style={styles.prTitle}>🏆 Nuevos récords personales</Text>
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
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
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
  title: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800', textAlign: 'center', marginBottom: SPACING.sm },

  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { color: COLORS.primary, fontSize: FONT.xl, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },

  prCard: { borderColor: COLORS.success, borderWidth: 1.5 },
  prTitle: { color: COLORS.success, fontSize: FONT.md, fontWeight: '700', marginBottom: 8 },
  prItem: { color: COLORS.textPrimary, fontSize: FONT.base, marginTop: 4 },

  sectionTitle: { color: COLORS.textSecondary, fontSize: FONT.base, fontWeight: '600', marginTop: SPACING.sm },

  exName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700', marginBottom: 8 },
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
  moodEmoji: { fontSize: 26 },
  moodLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  moodLabelActive: { color: COLORS.primary },

  finishBtn: { marginTop: SPACING.sm },
});
