  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../stores/useUserStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { ModeToggle } from '../../components/ui/ModeToggle';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { COLORS, SPACING, FONT, RADIUS, WEIGHT, TRACKING, TEXT } from '../../constants/theme';
import { getDayIndex, formatDate } from '../../utils/formatters';
import { exercises } from '../../data/exercises';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio', full_body: 'Full Body',
};

export default function HomeScreen() {
  const router = useRouter();
  const { profile, setMode } = useUserStore();
  const { routines } = useRoutineStore();
  const { sessions, streak } = useProgressStore();

  const todayIndex = getDayIndex();
  const todayRoutine = routines.find((r) => r.day_of_week.includes(todayIndex));

  const thisWeekSessions = sessions.filter((s) => {
    const d = new Date(s.date);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  });

  const weeklyVolume = thisWeekSessions.reduce(
    (total, s) => total + s.sets.reduce((t, set) => t + set.reps * set.weight_kg, 0),
    0
  );

  const lastSession = sessions[sessions.length - 1];
  const firstName = profile.name ? profile.name.split(' ')[0] : null;
  const greeting = firstName ? `Buenas, ${firstName}` : 'Buenas';
  const daysTarget = profile.days_per_week ?? 4;

  const dateLabel = new Date()
    .toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace('.', '');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dateLabel}>{dateLabel}</Text>
            <Text style={styles.greeting}>{greeting}</Text>
          </View>
          <ModeToggle mode={profile.mode} onChange={setMode} compact />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatTile icon="flame" label="Racha" value={String(streak)} unit="días" highlight={streak > 0} />
          <StatTile icon="calendar" label="Semana" value={String(thisWeekSessions.length)} unit={`/${daysTarget}`} />
          <StatTile
            icon="barbell"
            label="Volumen"
            value={weeklyVolume > 0 ? `${Math.round(weeklyVolume / 1000)}` : '—'}
            unit={weeklyVolume > 0 ? 't' : ''}
          />
        </View>

        {/* Entrenamiento de hoy */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Hoy</Text>
          <Text style={styles.sectionMeta}>{dateLabel}</Text>
        </View>

        {todayRoutine ? (
          <Card padding={SPACING.lg}>
            <View style={styles.routineHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineName}>{todayRoutine.name}</Text>
                <Text style={styles.routineMeta}>
                  {todayRoutine.exercises.length} ejercicios · {todayRoutine.mode === 'home' ? 'Casa' : 'Gym'}
                </Text>
              </View>
              <Badge
                label={todayRoutine.mode === 'home' ? 'Casa' : 'Gym'}
                variant={todayRoutine.mode === 'home' ? 'neutral' : 'primary'}
              />
            </View>

            <View style={styles.muscleRow}>
              {[
                ...new Set(
                  todayRoutine.exercises
                    .slice(0, 4)
                    .map((re) => exercises.find((e) => e.id === re.exercise_id)?.muscle_group)
                    .filter(Boolean)
                ),
              ].map((m) => (
                <Badge key={m} label={MUSCLE_LABELS[m as string] ?? (m as string)} variant="neutral" />
              ))}
            </View>

            <Button
              label="Comenzar entrenamiento"
              icon="play"
              onPress={() => router.push('/workout')}
              fullWidth
              style={styles.startBtn}
            />
          </Card>
        ) : (
          <Card padding={SPACING.lg}>
            <View style={styles.iconChip}>
              <Ionicons name="moon" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.noRoutineTitle}>Día de descanso</Text>
            <Text style={styles.noRoutineSub}>
              No tienes rutina asignada para hoy. Puedes crear una o descansar.
            </Text>
            <Button
              label="Ver rutinas"
              variant="secondary"
              icon="list"
              onPress={() => router.push('/routines')}
              fullWidth
              style={{ marginTop: SPACING.md }}
            />
          </Card>
        )}

        {/* Última sesión */}
        {lastSession && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Último entrenamiento</Text>
            </View>
            <Card padding={SPACING.md}>
              <View style={styles.lastSessionRow}>
                <View style={styles.lastSessionLeft}>
                  <View style={styles.iconChipSm}>
                    <Ionicons name="checkmark-done" size={18} color={COLORS.success} />
                  </View>
                  <View>
                    <Text style={styles.lastSessionDate}>{formatDate(lastSession.date)}</Text>
                    <Text style={styles.lastSessionMeta}>
                      {lastSession.sets.length} series · {lastSession.mode === 'home' ? 'Casa' : 'Gym'}
                    </Text>
                  </View>
                </View>
                {lastSession.mood && <MoodDot mood={lastSession.mood} />}
              </View>
            </Card>
          </>
        )}

        {/* Sin rutinas aún */}
        {routines.length === 0 && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Primeros pasos</Text>
            </View>
            <Card padding={SPACING.lg}>
              <View style={styles.iconChip}>
                <Ionicons name="add-circle" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.noRoutineTitle}>Crea tu primera rutina</Text>
              <Text style={styles.noRoutineSub}>
                Diseña un plan adaptado a tus objetivos en unos segundos.
              </Text>
              <Button
                label="Crear rutina"
                icon="add"
                onPress={() => router.push('/routine/new')}
                fullWidth
                style={{ marginTop: SPACING.md }}
              />
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({
  icon, label, value, unit, highlight,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statTop}>
        <Ionicons name={icon} size={13} color={highlight ? COLORS.primary : COLORS.textMuted} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function MoodDot({ mood }: { mood: number }) {
  const colors = [COLORS.danger, COLORS.warning, COLORS.textMuted, COLORS.success, COLORS.primary];
  const labels = ['Mal', 'Flojo', 'Normal', 'Bien', 'Top'];
  return (
    <View style={styles.moodChip}>
      <View style={[styles.moodDotInner, { backgroundColor: colors[mood - 1] }]} />
      <Text style={styles.moodText}>{labels[mood - 1]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40, gap: SPACING.md },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  dateLabel: { ...TEXT.overline },
  greeting: {
    color: COLORS.textPrimary,
    fontSize: FONT.xl,
    fontWeight: WEIGHT.semibold,
    letterSpacing: TRACKING.tight,
    marginTop: 3,
  },

  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  statTile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  statLabel: { ...TEXT.overline, fontSize: 10 },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: FONT.xxl,
    ...TEXT.numeric,
  },
  statUnit: { color: COLORS.textMuted, fontSize: FONT.base, fontWeight: WEIGHT.regular },

  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: WEIGHT.semibold,
    letterSpacing: TRACKING.tight,
  },
  sectionMeta: { color: COLORS.textMuted, fontSize: FONT.sm },

  routineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  routineName: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: WEIGHT.semibold, letterSpacing: TRACKING.tight },
  routineMeta: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 3 },
  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.md },
  startBtn: { marginTop: SPACING.xs },

  iconChip: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  iconChipSm: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  noRoutineTitle: { color: COLORS.textPrimary, fontSize: FONT.md, fontWeight: WEIGHT.semibold, marginBottom: 6 },
  noRoutineSub: { color: COLORS.textSecondary, fontSize: FONT.base, lineHeight: 20 },

  lastSessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastSessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lastSessionDate: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: WEIGHT.medium },
  lastSessionMeta: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },

  moodChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.cardElevated,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill,
  },
  moodDotInner: { width: 8, height: 8, borderRadius: 4 },
  moodText: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: WEIGHT.medium },
});
