import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useProgressStore } from '../../stores/useProgressStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { WeeklyVolumeChart } from '../../components/progress/WeeklyVolumeChart';
import { ExerciseProgressChart } from '../../components/progress/ExerciseProgressChart';
import { BodyWeightTracker } from '../../components/progress/BodyWeightTracker';
import { MuscleGroupCard } from '../../components/progress/MuscleGroupCard';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { formatDate, formatWeight } from '../../utils/formatters';
import { getExerciseById, exercises } from '../../data/exercises';
import { MuscleGroup } from '../../types';

type Tab = 'general' | 'ejercicio' | 'musculos';

const ALL_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'quads', 'hamstrings', 'glutes', 'calves', 'core',
];

export default function ProgressScreen() {
  const { sessions, personalRecords, streak, bestStreak, achievements } = useProgressStore();
  const [tab, setTab] = useState<Tab>('general');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [exPickerVisible, setExPickerVisible] = useState(false);
  const [exSearch, setExSearch] = useState('');

  const totalVolume = sessions.reduce(
    (total, s) => total + s.sets.reduce((t, set) => t + set.reps * set.weight_kg, 0),
    0
  );

  const thisMonthSessions = useMemo(() => {
    const now = new Date();
    return sessions.filter((s) => {
      const d = new Date(s.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [sessions]);

  const prEntries = Object.entries(personalRecords);
  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  // Ejercicios que tienen historial
  const exercisesWithHistory = useMemo(() => {
    const ids = new Set(sessions.flatMap((s) => s.sets.map((set) => set.exercise_id)));
    return [...ids].map((id) => getExerciseById(id)).filter(Boolean);
  }, [sessions]);

  // Filtrado del picker de ejercicios
  const filteredExercises = useMemo(() => {
    const q = exSearch.toLowerCase();
    return exercisesWithHistory.filter((ex) => ex!.name.toLowerCase().includes(q));
  }, [exercisesWithHistory, exSearch]);

  const selectedExercise = selectedExerciseId ? getExerciseById(selectedExerciseId) : null;

  // Últimas 5 sesiones del ejercicio seleccionado
  const exerciseHistory = useMemo(() => {
    if (!selectedExerciseId) return [];
    return sessions
      .filter((s) => s.sets.some((set) => set.exercise_id === selectedExerciseId))
      .slice(-5)
      .reverse();
  }, [sessions, selectedExerciseId]);

  const pr = selectedExerciseId ? personalRecords[selectedExerciseId] : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <Text style={styles.pageTitle}>Mi Progreso</Text>
      </View>

      {/* Pestañas */}
      <View style={styles.tabBar}>
        {(['general', 'ejercicio', 'musculos'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === 'general' ? 'General' : t === 'ejercicio' ? 'Ejercicio' : 'Músculos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ====== TAB: GENERAL ====== */}
      {tab === 'general' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <Card style={styles.statCard} padding={SPACING.md}>
              <Text style={styles.statValue}>{sessions.length}</Text>
              <Text style={styles.statLabel}>Sesiones totales</Text>
            </Card>
            <Card style={styles.statCard} padding={SPACING.md}>
              <Text style={[styles.statValue, { color: '#F97316' }]}>{streak}</Text>
              <Text style={styles.statLabel}>Racha actual 🔥</Text>
            </Card>
            <Card style={styles.statCard} padding={SPACING.md}>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>{bestStreak}</Text>
              <Text style={styles.statLabel}>Mejor racha 🏆</Text>
            </Card>
            <Card style={styles.statCard} padding={SPACING.md}>
              <Text style={styles.statValue}>{thisMonthSessions}</Text>
              <Text style={styles.statLabel}>Este mes</Text>
            </Card>
          </View>

          {/* Volumen semanal */}
          <Text style={styles.sectionTitle}>Volumen semanal (8 semanas)</Text>
          <Card padding={SPACING.md}>
            <WeeklyVolumeChart sessions={sessions} />
          </Card>

          {/* Peso corporal */}
          <Text style={styles.sectionTitle}>Peso corporal</Text>
          <BodyWeightTracker />

          {/* PRs */}
          {prEntries.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Récords personales</Text>
              {prEntries.slice(0, 6).map(([exId, prRecord]) => {
                const ex = getExerciseById(exId);
                return (
                  <Card key={exId} padding={SPACING.md}>
                    <View style={styles.prRow}>
                      <View style={styles.prInfo}>
                        <Text style={styles.prExName} numberOfLines={1}>{ex?.name ?? exId}</Text>
                        <Text style={styles.prDate}>{formatDate(prRecord.date)}</Text>
                      </View>
                      <Text style={styles.prWeight}>{formatWeight(prRecord.weight_kg)} × {prRecord.reps}</Text>
                      <Badge label="PR" variant="success" />
                    </View>
                  </Card>
                );
              })}
            </>
          )}

          {/* Logros */}
          <Text style={styles.sectionTitle}>
            Logros ({unlockedAchievements.length}/{achievements.length})
          </Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((a) => (
              <Card
                key={a.id}
                padding={SPACING.md}
                style={[styles.achievementCard, !a.unlocked && styles.achievementLocked]}
              >
                <Text style={styles.achievementIcon}>{a.unlocked ? '🏆' : '🔒'}</Text>
                <Text style={[styles.achievementTitle, !a.unlocked && { color: COLORS.textMuted }]}>
                  {a.title}
                </Text>
                <Text style={styles.achievementDesc}>{a.description}</Text>
              </Card>
            ))}
          </View>

          {sessions.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📈</Text>
              <Text style={styles.emptyTitle}>Sin entrenamientos aún</Text>
              <Text style={styles.emptySub}>
                Completa tu primera sesión para ver tu progreso aquí.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ====== TAB: EJERCICIO ====== */}
      {tab === 'ejercicio' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Selector de ejercicio */}
          <TouchableOpacity
            style={styles.exercisePicker}
            onPress={() => setExPickerVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.exercisePickerText} numberOfLines={1}>
              {selectedExercise ? selectedExercise.name : 'Selecciona un ejercicio…'}
            </Text>
            <Text style={styles.exercisePickerChevron}>›</Text>
          </TouchableOpacity>

          {exercisesWithHistory.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💪</Text>
              <Text style={styles.emptyTitle}>Sin historial</Text>
              <Text style={styles.emptySub}>Completa entrenamientos para ver la progresión por ejercicio.</Text>
            </View>
          )}

          {selectedExercise && (
            <>
              {/* PR del ejercicio */}
              {pr && (
                <Card padding={SPACING.md} style={styles.prHighlight}>
                  <Text style={styles.prHighlightLabel}>Récord personal</Text>
                  <Text style={styles.prHighlightValue}>{formatWeight(pr.weight_kg)} × {pr.reps} reps</Text>
                  <Text style={styles.prHighlightDate}>{formatDate(pr.date)}</Text>
                </Card>
              )}

              {/* Gráfico de progresión */}
              <Text style={styles.sectionTitle}>Progresión de peso</Text>
              <Card padding={SPACING.md}>
                <ExerciseProgressChart sessions={sessions} exerciseId={selectedExercise.id} />
              </Card>

              {/* Últimas 5 sesiones */}
              {exerciseHistory.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Últimas sesiones</Text>
                  {exerciseHistory.map((s) => {
                    const exSets = s.sets.filter((set) => set.exercise_id === selectedExerciseId);
                    const maxWeight = Math.max(...exSets.map((set) => set.weight_kg));
                    const totalReps = exSets.reduce((t, set) => t + set.reps, 0);
                    return (
                      <Card key={s.id} padding={SPACING.md}>
                        <View style={styles.histRow}>
                          <View>
                            <Text style={styles.histDate}>{formatDate(s.date)}</Text>
                            <Text style={styles.histMeta}>{exSets.length} series · {totalReps} reps</Text>
                          </View>
                          <Text style={styles.histWeight}>{formatWeight(maxWeight)}</Text>
                        </View>
                        <View style={styles.setsRow}>
                          {exSets.map((set, i) => (
                            <View key={i} style={styles.setChip}>
                              <Text style={styles.setChipText}>{formatWeight(set.weight_kg)}×{set.reps}</Text>
                            </View>
                          ))}
                        </View>
                      </Card>
                    );
                  })}
                </>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ====== TAB: MÚSCULOS ====== */}
      {tab === 'musculos' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionSubtitle}>Volumen semanal por grupo muscular</Text>
          <View style={styles.muscleGrid}>
            {ALL_MUSCLES.map((muscle) => (
              <MuscleGroupCard key={muscle} muscle={muscle} sessions={sessions} />
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Modal: selector de ejercicio */}
      <Modal visible={exPickerVisible} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar ejercicio</Text>
              <TouchableOpacity onPress={() => { setExPickerVisible(false); setExSearch(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              value={exSearch}
              onChangeText={setExSearch}
              placeholder="Buscar ejercicio…"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
            {filteredExercises.length === 0 ? (
              <View style={styles.emptyPicker}>
                <Text style={styles.emptyPickerText}>Sin resultados</Text>
              </View>
            ) : (
              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item!.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.exerciseItem, item!.id === selectedExerciseId && styles.exerciseItemActive]}
                    onPress={() => {
                      setSelectedExerciseId(item!.id);
                      setExPickerVisible(false);
                      setExSearch('');
                    }}
                  >
                    <Text style={styles.exerciseItemName}>{item!.name}</Text>
                    <Text style={styles.exerciseItemMeta}>{item!.muscle_group} · {item!.mode}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingTop: SPACING.sm },

  headerBar: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  pageTitle: { color: COLORS.textPrimary, fontSize: FONT.xxl, fontWeight: '800' },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: RADIUS.md },
  tabActive: { backgroundColor: COLORS.primary },
  tabLabel: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '600' },
  tabLabelActive: { color: '#000' },

  sectionTitle: { color: COLORS.textSecondary, fontSize: FONT.base, fontWeight: '600', marginTop: SPACING.sm },
  sectionSubtitle: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: SPACING.sm },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statCard: { width: '47.5%', alignItems: 'center' },
  statValue: { color: COLORS.primary, fontSize: FONT.xxl, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2, textAlign: 'center' },

  prRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  prInfo: { flex: 1 },
  prExName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  prDate: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  prWeight: { color: COLORS.success, fontSize: FONT.base, fontWeight: '700' },

  prHighlight: { borderWidth: 1, borderColor: COLORS.success + '40', alignItems: 'center', gap: 2 },
  prHighlightLabel: { color: COLORS.success, fontSize: FONT.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  prHighlightValue: { color: COLORS.textPrimary, fontSize: FONT.xxl, fontWeight: '800' },
  prHighlightDate: { color: COLORS.textMuted, fontSize: FONT.sm },

  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  achievementCard: { width: '47.5%', alignItems: 'center' },
  achievementLocked: { opacity: 0.45 },
  achievementIcon: { fontSize: 28, marginBottom: 6 },
  achievementTitle: { color: COLORS.textPrimary, fontSize: FONT.sm, fontWeight: '700', textAlign: 'center' },
  achievementDesc: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyIcon: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700', marginBottom: 8 },
  emptySub: { color: COLORS.textMuted, fontSize: FONT.base, textAlign: 'center', paddingHorizontal: SPACING.xl },

  exercisePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  exercisePickerText: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  exercisePickerChevron: { color: COLORS.primary, fontSize: 24, fontWeight: '700' },

  histRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  histDate: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  histMeta: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  histWeight: { color: COLORS.primary, fontSize: FONT.lg, fontWeight: '800' },
  setsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  setChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  setChipText: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '600' },

  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700' },
  modalClose: { color: COLORS.textMuted, fontSize: FONT.xl, padding: 4 },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: FONT.base,
    marginBottom: SPACING.md,
  },
  emptyPicker: { height: 120, alignItems: 'center', justifyContent: 'center' },
  emptyPickerText: { color: COLORS.textMuted, fontSize: FONT.base },
  exerciseItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  exerciseItemActive: { backgroundColor: COLORS.primary + '20' },
  exerciseItemName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  exerciseItemMeta: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
});
