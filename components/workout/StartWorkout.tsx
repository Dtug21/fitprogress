import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Routine, RoutineExercise } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { getDayIndex } from '../../utils/formatters';
import { exercises } from '../../data/exercises';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio', full_body: 'Full Body',
};

interface StartWorkoutProps {
  routines: Routine[];
  onStart: (routine: Routine) => void;
}

export function StartWorkout({ routines, onStart }: StartWorkoutProps) {
  const todayIndex = getDayIndex();
  const todayRoutine = routines.find((r) => r.day_of_week.includes(todayIndex));
  const otherRoutines = routines.filter((r) => r.id !== todayRoutine?.id);

  if (routines.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconChip}>
          <Ionicons name="clipboard-outline" size={28} color={COLORS.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Sin rutinas creadas</Text>
        <Text style={styles.emptySub}>
          Ve a la pestaña Rutinas y crea tu primera rutina para poder comenzar.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>¿Qué entrenamos hoy?</Text>

      {todayRoutine && (
        <>
          <Text style={styles.sectionLabel}>Rutina de hoy</Text>
          <RoutineCard routine={todayRoutine} onStart={onStart} highlight />
        </>
      )}

      {otherRoutines.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Otras rutinas</Text>
          {otherRoutines.map((r) => (
            <RoutineCard key={r.id} routine={r} onStart={onStart} />
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function RoutineCard({
  routine,
  onStart,
  highlight,
}: {
  routine: Routine;
  onStart: (r: Routine) => void;
  highlight?: boolean;
}) {
  const muscleGroups = [
    ...new Set(
      routine.exercises
        .map((re) => exercises.find((e) => e.id === re.exercise_id)?.muscle_group)
        .filter(Boolean)
    ),
  ].slice(0, 4);

  const estimatedMinutes = routine.exercises.reduce((total, re) => {
    const setTime = re.target_sets * (30 + re.rest_seconds);
    return total + Math.round(setTime / 60);
  }, 0);

  return (
    <Card
      padding={SPACING.lg}
      style={[styles.routineCard, highlight && styles.routineCardHighlight]}
    >
      <View style={styles.routineHeader}>
        <View style={styles.routineInfo}>
          <Text style={styles.routineName}>{routine.name}</Text>
          <View style={styles.routineMeta}>
            <Text style={styles.metaText}>
              {routine.exercises.length} ejercicios
            </Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>~{estimatedMinutes} min</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>
              {routine.mode === 'home' ? 'Casa' : 'Gym'}
            </Text>
          </View>
        </View>
        {highlight && <Badge label="Hoy" variant="success" />}
      </View>

      {muscleGroups.length > 0 && (
        <View style={styles.muscleRow}>
          {muscleGroups.map((m) => (
            <Badge key={m} label={MUSCLE_LABELS[m as string] ?? (m as string)} variant="neutral" />
          ))}
        </View>
      )}

      <Button
        label="Comenzar"
        onPress={() => onStart(routine)}
        fullWidth
        style={styles.startBtn}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, gap: SPACING.sm },
  heading: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '600', marginBottom: SPACING.sm },
  sectionLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: SPACING.sm },

  routineCard: {},
  routineCardHighlight: {
    borderColor: COLORS.success,
    borderWidth: 1.5,
  },
  routineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  routineInfo: { flex: 1 },
  routineName: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '600' },
  routineMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  metaText: { color: COLORS.textMuted, fontSize: FONT.sm },
  metaDot: { color: COLORS.textMuted, fontSize: FONT.sm },
  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.md },
  startBtn: {},

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyIconChip: {
    width: 72, height: 72, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '600', marginBottom: 8 },
  emptySub: { color: COLORS.textMuted, fontSize: FONT.base, textAlign: 'center' },
});
