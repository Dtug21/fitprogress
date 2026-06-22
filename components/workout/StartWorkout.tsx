import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Routine, UserProfile, WorkoutSession } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { getDayIndex } from '../../utils/formatters';
import { exercises } from '../../data/exercises';
import { buildGeneratedRoutine } from '../../lib/routineOptimizer';
import {
  SessionRecommendation,
  getSessionRecommendations,
  IntensityMeta,
} from '../../lib/sessionRecommendations';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio', full_body: 'Full Body',
};

interface StartWorkoutProps {
  routines: Routine[];
  profile: UserProfile;
  sessions: WorkoutSession[];
  lastDeloadDate: string | null;
  onStart: (routine: Routine) => void;
  onStartFreestyle: () => void;
}

export function StartWorkout({
  routines,
  profile,
  sessions,
  lastDeloadDate,
  onStart,
  onStartFreestyle,
}: StartWorkoutProps) {
  const todayIndex = getDayIndex();
  const todayRoutine = routines.find((r) => r.day_of_week.includes(todayIndex));
  const otherRoutines = routines.filter((r) => r.id !== todayRoutine?.id);
  const sessionOptions = getSessionRecommendations(profile, sessions, lastDeloadDate);
  const idealOption = sessionOptions.find((o) => o.isIdeal);
  const alternativeOptions = sessionOptions.filter((o) => !o.isIdeal);

  function handleStartRecommendation(rec: SessionRecommendation) {
    const routine = buildGeneratedRoutine(
      rec.split,
      profile,
      `session_${rec.id}_${Date.now()}`,
      rec.volumeFactor,
    );
    onStart(routine);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>¿Qué entrenamos hoy?</Text>

      {idealOption && (
        <>
          <Text style={styles.sectionLabel}>Tu rutina ideal</Text>
          <Text style={styles.sectionSub}>
            Calculada con tus objetivos, historial y volumen de la semana.
          </Text>
          <SessionRecommendationCard
            rec={idealOption}
            onStart={() => handleStartRecommendation(idealOption)}
            highlighted
          />
        </>
      )}

      {alternativeOptions.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Opciones similares · menos intensas</Text>
          <Text style={styles.sectionSub}>
            Misma línea de entrenamiento con menor carga si hoy prefieres ir más suave.
          </Text>
          {alternativeOptions.map((rec) => (
            <SessionRecommendationCard
              key={rec.id}
              rec={rec}
              onStart={() => handleStartRecommendation(rec)}
            />
          ))}
        </>
      )}

      {routines.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Tus rutinas guardadas</Text>
          {todayRoutine && (
            <>
              <Text style={styles.sectionSub}>Programada para hoy</Text>
              <RoutineCard routine={todayRoutine} onStart={onStart} highlight />
            </>
          )}
          {otherRoutines.map((r) => (
            <RoutineCard key={r.id} routine={r} onStart={onStart} />
          ))}
        </>
      )}

      {routines.length === 0 && sessionOptions.length === 0 && (
        <View style={styles.emptyInline}>
          <View style={styles.emptyIconChip}>
            <Ionicons name="clipboard-outline" size={28} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Sin rutinas guardadas</Text>
          <Text style={styles.emptySub}>
            Configura tus objetivos en el perfil para ver recomendaciones, o entrena libre abajo.
          </Text>
        </View>
      )}

      <Text style={[styles.sectionLabel, styles.freestyleSectionLabel]}>Rutina libre</Text>
      <TouchableOpacity style={styles.freestyleCard} onPress={onStartFreestyle} activeOpacity={0.85}>
        <View style={styles.freestyleIcon}>
          <Ionicons name="flash-outline" size={22} color={COLORS.textSecondary} />
        </View>
        <View style={styles.freestyleInfo}>
          <Text style={styles.freestyleTitle}>Entrenamiento libre</Text>
          <Text style={styles.freestyleSub}>
            Sin rutina fija. Agrega ejercicios sobre la marcha.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function IntensityIndicator({ intensity }: { intensity: IntensityMeta }) {
  return (
    <View style={styles.intensityWrap}>
      <View style={styles.intensityBars}>
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <View
            key={n}
            style={[
              styles.intensityBar,
              { height: 6 + n * 3 },
              n <= intensity.level
                ? { backgroundColor: intensity.color }
                : { backgroundColor: COLORS.border },
            ]}
          />
        ))}
      </View>
      <Ionicons name={intensity.icon} size={14} color={intensity.color} />
      <Text style={[styles.intensityLabel, { color: intensity.color }]}>{intensity.label}</Text>
    </View>
  );
}

function SessionRecommendationCard({
  rec,
  onStart,
  highlighted = false,
}: {
  rec: SessionRecommendation;
  onStart: () => void;
  highlighted?: boolean;
}) {
  return (
    <View style={[styles.cardGlowWrap, highlighted && styles.cardGlowWrapActive]}>
      <Card
        padding={SPACING.lg}
        style={[styles.sessionCard, highlighted && styles.sessionCardIdeal]}
      >
        {highlighted && (
          <View style={styles.idealRibbon}>
            <Ionicons name="star" size={12} color={COLORS.accentText} />
            <Text style={styles.idealRibbonText}>RUTINA IDEAL</Text>
          </View>
        )}

        <View style={styles.sessionHeader}>
          <View style={[styles.sessionIconBox, highlighted && styles.sessionIconBoxIdeal]}>
            <Text style={styles.sessionEmoji}>{rec.split.emoji}</Text>
          </View>
          <View style={styles.sessionInfo}>
            <Text style={[styles.sessionTitle, highlighted && styles.sessionTitleIdeal]}>
              {rec.title}
            </Text>
            <Text style={styles.sessionSubtitle}>{rec.subtitle}</Text>
          </View>
        </View>

        <IntensityIndicator intensity={rec.intensity} />

        <Text style={styles.sessionRationale} numberOfLines={highlighted ? 4 : 3}>
          {rec.rationale}
        </Text>

        <View style={styles.sessionMetaRow}>
          <MetaChip icon="barbell-outline" text={`${rec.exerciseCount} ej.`} />
          <MetaChip icon="layers-outline" text={`${rec.totalSets} series`} />
          <MetaChip icon="time-outline" text={`~${rec.estimatedMinutes} min`} />
          <MetaChip
            icon={profileModeIcon(rec)}
            text={rec.split.daysPerWeek ? `${rec.split.daysPerWeek} d/sem` : 'Hoy'}
          />
        </View>

        <Button
          label={highlighted ? 'Comenzar rutina ideal' : 'Comenzar'}
          icon="play"
          onPress={onStart}
          fullWidth
          style={styles.startBtn}
        />
      </Card>
    </View>
  );
}

function profileModeIcon(rec: SessionRecommendation): keyof typeof Ionicons.glyphMap {
  return rec.split.id === 'core_cardio' ? 'heart-outline' : 'calendar-outline';
}

function MetaChip({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={12} color={COLORS.textMuted} />
      <Text style={styles.metaChipText}>{text}</Text>
    </View>
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
            <Text style={styles.metaText}>{routine.exercises.length} ejercicios</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>~{estimatedMinutes} min</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{routine.mode === 'home' ? 'Casa' : 'Gym'}</Text>
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

      <Button label="Comenzar" onPress={() => onStart(routine)} fullWidth style={styles.startBtn} />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, gap: SPACING.sm },
  heading: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '600', marginBottom: SPACING.sm },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: SPACING.sm,
  },
  sectionSub: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2, marginBottom: SPACING.xs, lineHeight: 18 },
  freestyleSectionLabel: { marginTop: SPACING.lg },

  cardGlowWrap: { borderRadius: RADIUS.lg },
  cardGlowWrapActive: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 12,
  },
  sessionCard: { borderWidth: 1, borderColor: COLORS.border },
  sessionCardIdeal: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primaryDim,
  },
  idealRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  idealRibbonText: {
    color: COLORS.accentText,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sessionHeader: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  sessionIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionIconBoxIdeal: { backgroundColor: COLORS.bg },
  sessionEmoji: { fontSize: 22 },
  sessionInfo: { flex: 1, gap: 3 },
  sessionTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '600' },
  sessionTitleIdeal: { color: COLORS.primary, fontWeight: '700' },
  sessionSubtitle: { color: COLORS.textSecondary, fontSize: FONT.sm },

  intensityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
  intensityBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 22 },
  intensityBar: { width: 5, borderRadius: 2 },
  intensityLabel: { fontSize: FONT.sm, fontWeight: '700' },

  sessionRationale: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  sessionMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.md },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cardElevated,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  metaChipText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },

  routineCard: {},
  routineCardHighlight: { borderColor: COLORS.success, borderWidth: 1.5 },
  routineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  routineInfo: { flex: 1 },
  routineName: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '600' },
  routineMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  metaText: { color: COLORS.textMuted, fontSize: FONT.sm },
  metaDot: { color: COLORS.textMuted, fontSize: FONT.sm },
  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.md },
  startBtn: {},

  freestyleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  freestyleIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freestyleInfo: { flex: 1 },
  freestyleTitle: { color: COLORS.textPrimary, fontSize: FONT.md, fontWeight: '600' },
  freestyleSub: { color: COLORS.textSecondary, fontSize: FONT.sm, marginTop: 2 },

  emptyInline: { alignItems: 'center', paddingVertical: SPACING.lg },
  emptyIconChip: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '600', marginBottom: 8 },
  emptySub: { color: COLORS.textMuted, fontSize: FONT.base, textAlign: 'center' },
});
