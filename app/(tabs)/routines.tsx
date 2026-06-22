import {
  View,
  Text,
  StyleSheet,ScrollView,
  TouchableOpacity,
  Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useUserStore } from '../../stores/useUserStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { getDayName } from '../../utils/formatters';
import { exercises } from '../../data/exercises';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio', full_body: 'Full Body' };

export default function RoutinesScreen() {
  const router = useRouter();
  const { routines, addRoutine, deleteRoutine } = useRoutineStore();
  const { profile } = useUserStore();

  function handleNewRoutine() {
    router.push('/routine/new');
  }

  function handleDelete(id: string, name: string) {
    Alert.alert(
      'Eliminar rutina',
      `¿Seguro que quieres eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteRoutine(id) },
      ]
    );
  }

  const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <Text style={styles.pageTitle}>Mis Rutinas</Text>
        <Text style={styles.pageCount}>{routines.length} rutinas</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {routines.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconChip}>
              <Ionicons name="clipboard-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Sin rutinas todavía</Text>
            <Text style={styles.emptySub}>
              Toca el botón + para crear tu primera rutina de entrenamiento.
            </Text>
          </View>
        ) : (
          routines.map((routine) => {
            const muscleGroups = [
              ...new Set(
                routine.exercises
                  .map((re) => exercises.find((e) => e.id === re.exercise_id)?.muscle_group)
                  .filter(Boolean)
              ),
            ].slice(0, 4);

            return (
              <TouchableOpacity
                key={routine.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/routine/${routine.id}`)}
                onLongPress={() => handleDelete(routine.id, routine.name)}
              >
                <Card padding={SPACING.md} style={styles.routineCard}>
                  <View style={styles.routineTop}>
                    <View style={styles.routineInfo}>
                      <Text style={styles.routineName}>{routine.name}</Text>
                      <View style={styles.routineMeta}>
                        <Text style={styles.metaText}>
                          {routine.exercises.length} ejercicios
                        </Text>
                        <Text style={styles.metaDot}>·</Text>
                        <Text style={styles.metaText}>
                          {routine.mode === 'home' ? 'Casa' : 'Gym'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.routineActions}>
                      <Badge
                        label={routine.mode === 'home' ? 'Casa' : 'Gym'}
                        variant={routine.mode === 'home' ? 'primary' : 'success'}
                      />
                      <TouchableOpacity
                        onPress={() => handleDelete(routine.id, routine.name)}
                        style={styles.deleteBtn}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Días */}
                  {routine.day_of_week.length > 0 && (
                    <View style={styles.daysRow}>
                      {DAY_NAMES.map((d, i) => (
                        <View
                          key={i}
                          style={[
                            styles.dayPill,
                            routine.day_of_week.includes(i) && styles.dayPillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              routine.day_of_week.includes(i) && styles.dayTextActive,
                            ]}
                          >
                            {d}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Músculos */}
                  {muscleGroups.length > 0 && (
                    <View style={styles.muscleRow}>
                      {muscleGroups.map((m) => (
                        <Badge
                          key={m}
                          label={MUSCLE_LABELS[m as string] ?? (m as string)}
                          variant="neutral"
                        />
                      ))}
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleNewRoutine} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm },
  pageTitle: { color: COLORS.textPrimary, fontSize: FONT.xxl, fontWeight: '800' },
  pageCount: { color: COLORS.textMuted, fontSize: FONT.base },

  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingTop: SPACING.sm },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIconChip: {
    width: 64, height: 64, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700', marginBottom: 8 },
  emptySub: { color: COLORS.textMuted, fontSize: FONT.base, textAlign: 'center', paddingHorizontal: SPACING.xl },

  routineCard: { marginBottom: 0 },
  routineTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  routineInfo: { flex: 1 },
  routineName: { color: COLORS.textPrimary, fontSize: FONT.md, fontWeight: '700' },
  routineMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  metaText: { color: COLORS.textMuted, fontSize: FONT.sm },
  metaDot: { color: COLORS.textMuted, fontSize: FONT.sm },
  routineActions: { alignItems: 'flex-end', gap: 4 },

  daysRow: { flexDirection: 'row', gap: 4, marginTop: SPACING.sm },
  dayPill: {
    width: 36,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center' },
  dayPillActive: { backgroundColor: COLORS.primaryDim },
  dayText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  dayTextActive: { color: COLORS.primary },
  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm },

  fab: {
    position: 'absolute',
    bottom: 100,
    right: SPACING.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.danger + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4 } });
