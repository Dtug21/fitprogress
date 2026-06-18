import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../stores/useUserStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { ModeToggle } from '../../components/ui/ModeToggle';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { getDayIndex, getDayName, formatDate } from '../../utils/formatters';
import { exercises } from '../../data/exercises';

const MOOD_LABELS = ['😞', '😕', '😐', '🙂', '🔥'];

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
  const greeting = profile.name ? `Hola, ${profile.name}` : 'Bienvenido';
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('es-CL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
          <ModeToggle mode={profile.mode} onChange={setMode} />
        </View>

        {/* Stats rápidas */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} padding={SPACING.md}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Racha 🔥</Text>
          </Card>
          <Card style={styles.statCard} padding={SPACING.md}>
            <Text style={styles.statValue}>{thisWeekSessions.length}</Text>
            <Text style={styles.statLabel}>Esta semana</Text>
          </Card>
          <Card style={styles.statCard} padding={SPACING.md}>
            <Text style={styles.statValue}>
              {weeklyVolume > 0 ? `${Math.round(weeklyVolume / 1000)}t` : '—'}
            </Text>
            <Text style={styles.statLabel}>Volumen</Text>
          </Card>
        </View>

        {/* Entrenamiento de hoy */}
        <Text style={styles.sectionTitle}>Hoy — {dayNames[todayIndex]}</Text>
        {todayRoutine ? (
          <Card padding={SPACING.lg}>
            <View style={styles.routineHeader}>
              <View>
                <Text style={styles.routineName}>{todayRoutine.name}</Text>
                <Text style={styles.routineMeta}>
                  {todayRoutine.exercises.length} ejercicios ·{' '}
                  {todayRoutine.mode === 'home' ? '🏠 Casa' : '🏋️ Gym'}
                </Text>
              </View>
              <Badge
                label={todayRoutine.mode === 'home' ? 'Casa' : 'Gym'}
                variant={todayRoutine.mode === 'home' ? 'primary' : 'success'}
              />
            </View>

            {/* Grupos musculares */}
            <View style={styles.muscleRow}>
              {[
                ...new Set(
                  todayRoutine.exercises
                    .slice(0, 4)
                    .map(
                      (re) =>
                        exercises.find((e) => e.id === re.exercise_id)?.muscle_group
                    )
                    .filter(Boolean)
                ),
              ].map((m) => (
                <Badge key={m} label={m as string} variant="neutral" />
              ))}
            </View>

            <Button
              label="Comenzar entrenamiento"
              onPress={() => router.push('/workout')}
              fullWidth
              style={styles.startBtn}
            />
          </Card>
        ) : (
          <Card padding={SPACING.lg}>
            <Text style={styles.noRoutineTitle}>Sin rutina para hoy</Text>
            <Text style={styles.noRoutineSub}>
              Hoy es día de descanso o puedes crear una rutina para {dayNames[todayIndex]}.
            </Text>
            <Button
              label="Ver rutinas"
              variant="secondary"
              onPress={() => router.push('/routines')}
              fullWidth
              style={{ marginTop: SPACING.md }}
            />
          </Card>
        )}

        {/* Última sesión */}
        {lastSession && (
          <>
            <Text style={styles.sectionTitle}>Último entrenamiento</Text>
            <Card padding={SPACING.md}>
              <View style={styles.lastSessionRow}>
                <View>
                  <Text style={styles.lastSessionDate}>
                    {formatDate(lastSession.date)}
                  </Text>
                  <Text style={styles.lastSessionMeta}>
                    {lastSession.sets.length} series ·{' '}
                    {lastSession.mode === 'home' ? 'Casa' : 'Gym'}
                  </Text>
                </View>
                {lastSession.mood && (
                  <Text style={styles.moodEmoji}>
                    {MOOD_LABELS[lastSession.mood - 1]}
                  </Text>
                )}
              </View>
            </Card>
          </>
        )}

        {/* Sin rutinas aún */}
        {routines.length === 0 && (
          <>
            <Text style={styles.sectionTitle}>Primeros pasos</Text>
            <Card padding={SPACING.lg}>
              <Text style={styles.onboardingTitle}>Crea tu primera rutina</Text>
              <Text style={styles.onboardingSub}>
                Ve a la pestaña Rutinas para diseñar tu plan de entrenamiento.
              </Text>
              <Button
                label="Ir a Rutinas"
                onPress={() => router.push('/routines')}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40, gap: SPACING.md },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  greeting: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '700' },
  date: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2, textTransform: 'capitalize' },

  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { color: COLORS.primary, fontSize: FONT.xxl, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },

  sectionTitle: { color: COLORS.textSecondary, fontSize: FONT.base, fontWeight: '600', marginTop: SPACING.sm },

  routineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  routineName: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700' },
  routineMeta: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.md },
  startBtn: { marginTop: SPACING.sm },

  noRoutineTitle: { color: COLORS.textPrimary, fontSize: FONT.md, fontWeight: '700', marginBottom: 6 },
  noRoutineSub: { color: COLORS.textMuted, fontSize: FONT.base },

  lastSessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastSessionDate: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  lastSessionMeta: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  moodEmoji: { fontSize: 28 },

  onboardingTitle: { color: COLORS.textPrimary, fontSize: FONT.md, fontWeight: '700', marginBottom: 6 },
  onboardingSub: { color: COLORS.textMuted, fontSize: FONT.base },
});
