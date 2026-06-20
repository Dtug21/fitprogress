import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { exercises } from '../../data/exercises';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { Exercise, MuscleGroup } from '../../types';

// ─── Configuración de filtros ─────────────────────────────────────────────────

const MUSCLE_FILTERS: { id: MuscleGroup | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'chest', label: 'Pecho' },
  { id: 'back', label: 'Espalda' },
  { id: 'shoulders', label: 'Hombros' },
  { id: 'biceps', label: 'Bíceps' },
  { id: 'triceps', label: 'Tríceps' },
  { id: 'legs', label: 'Piernas' },
  { id: 'quads', label: 'Cuádriceps' },
  { id: 'hamstrings', label: 'Isquios' },
  { id: 'glutes', label: 'Glúteos' },
  { id: 'core', label: 'Core' },
  { id: 'cardio', label: 'Cardio' },
];

const MODE_FILTERS: { id: 'all' | 'home' | 'gym'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'Todos', icon: 'apps-outline' },
  { id: 'home', label: 'Casa', icon: 'home-outline' },
  { id: 'gym', label: 'Gym', icon: 'barbell-outline' },
];

const DIFFICULTY_COLORS = ['', COLORS.success, '#84CC16', COLORS.warning, '#F97316', COLORS.danger];
const DIFFICULTY_LABELS = ['', 'Principiante', 'Básico', 'Intermedio', 'Avanzado', 'Experto'];

const TYPE_LABELS: Record<string, string> = {
  compound: 'Compuesto',
  isolation: 'Aislamiento',
  cardio: 'Cardio',
  mobility: 'Movilidad',
};

// ─── Componente tarjeta de ejercicio ─────────────────────────────────────────

function ExerciseCard({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  const diffColor = DIFFICULTY_COLORS[exercise.difficulty];
  const modeIcon: keyof typeof Ionicons.glyphMap =
    exercise.mode === 'home' ? 'home-outline' : exercise.mode === 'gym' ? 'barbell-outline' : 'swap-horizontal-outline';
  const modeLabel = exercise.mode === 'home' ? 'Casa' : exercise.mode === 'gym' ? 'Gym' : 'Ambos';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Línea de color por dificultad */}
      <View style={[styles.cardAccent, { backgroundColor: diffColor }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardName} numberOfLines={1}>{exercise.name}</Text>
            <View style={styles.cardMeta}>
              <Ionicons name={modeIcon} size={13} color={COLORS.textMuted} />
              <Text style={styles.cardType}>{modeLabel} · {TYPE_LABELS[exercise.exercise_type] ?? exercise.exercise_type}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </View>

        {/* Dificultad + tips count */}
        <View style={styles.cardBottom}>
          <View style={styles.diffRow}>
            {Array.from({ length: 5 }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.diffDot,
                  { backgroundColor: i < exercise.difficulty ? diffColor : COLORS.border },
                ]}
              />
            ))}
            <Text style={[styles.diffLabel, { color: diffColor }]}>
              {DIFFICULTY_LABELS[exercise.difficulty]}
            </Text>
          </View>
          {exercise.tips.length > 0 && (
            <View style={styles.tipsRow}>
              <Ionicons name="bulb-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.tipsCount}>{exercise.tips.length} tips</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function LibraryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'all'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'home' | 'gym'>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return exercises.filter((ex) => {
      const matchSearch = !q || ex.name.toLowerCase().includes(q);
      const matchMuscle = muscleFilter === 'all' || ex.muscle_group === muscleFilter;
      const matchMode = modeFilter === 'all' || ex.mode === modeFilter || ex.mode === 'both';
      return matchSearch && matchMuscle && matchMode;
    });
  }, [search, muscleFilter, modeFilter]);

  const totalCount = exercises.length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.pageTitle}>Biblioteca</Text>
          <Text style={styles.pageSubtitle}>{totalCount} ejercicios · aprende y domina cada uno</Text>
        </View>
      </View>

      {/* Buscador */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar ejercicio…"
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros de modo */}
      <View style={styles.modeRow}>
        {MODE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.modeChip, modeFilter === f.id && styles.modeChipActive]}
            onPress={() => setModeFilter(f.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={f.icon}
              size={15}
              color={modeFilter === f.id ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.modeChipLabel, modeFilter === f.id && styles.modeChipLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filtros de músculo */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.muscleScrollView}
        contentContainerStyle={styles.muscleScrollContent}
      >
        {MUSCLE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.muscleChip, muscleFilter === f.id && styles.muscleChipActive]}
            onPress={() => setMuscleFilter(f.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.muscleChipLabel, muscleFilter === f.id && styles.muscleChipLabelActive]}
              numberOfLines={1}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista */}
      <FlatList
        style={styles.list}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExerciseCard
            exercise={item}
            onPress={() => router.push(`/exercise/${item.id}` as never)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={32} color={COLORS.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>Sin resultados</Text>
            <Text style={styles.emptySub}>Intenta con otro filtro o búsqueda.</Text>
          </View>
        }
        ListHeaderComponent={
          filtered.length > 0 ? (
            <Text style={styles.resultCount}>{filtered.length} ejercicios</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  headerBar: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  pageTitle: { color: COLORS.textPrimary, fontSize: FONT.xxl, fontWeight: '600', letterSpacing: -0.4 },
  pageSubtitle: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 46,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base },
  clearBtn: { padding: 4 },

  modeRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  modeChipLabel: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '500' },
  modeChipLabelActive: { color: COLORS.primary },

  muscleScrollView: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: SPACING.sm,
  },
  muscleScrollContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    paddingVertical: 2,
  },
  muscleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    marginRight: 8,
  },
  muscleChipActive: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primary },
  muscleChipLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.base,
    fontWeight: '600',
    lineHeight: 18,
  },
  muscleChipLabelActive: { color: COLORS.primary },

  list: { flex: 1 },
  resultCount: { color: COLORS.textMuted, fontSize: FONT.sm, paddingHorizontal: SPACING.lg, paddingBottom: 4 },

  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100, gap: 8 },

  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: SPACING.md, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  cardLeft: { flex: 1 },
  cardName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  cardType: { color: COLORS.textMuted, fontSize: FONT.sm },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  diffDot: { width: 7, height: 7, borderRadius: 4 },
  diffLabel: { fontSize: FONT.sm, fontWeight: '500', marginLeft: 4 },
  tipsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tipsCount: { color: COLORS.textMuted, fontSize: FONT.sm },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { marginBottom: SPACING.md },
  emptyText: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700' },
  emptySub: { color: COLORS.textMuted, fontSize: FONT.base, marginTop: 6 },
});
