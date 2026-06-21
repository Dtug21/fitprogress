import {
  View, Text, StyleSheet, Modal, SafeAreaView,
  TextInput, ScrollView, TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { exercises } from '../../data/exercises';
import { Exercise } from '../../types';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio',
};

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'cardio',
];

interface Props {
  visible: boolean;
  mode?: 'home' | 'gym';
  excludeIds?: string[];
  title?: string;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePickerModal({
  visible, mode, excludeIds = [], title = 'Agregar ejercicio', onSelect, onClose,
}: Props) {
  const [searchText, setSearchText] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);

  const filtered = exercises.filter((e) => {
    const modeOk = !mode || e.mode === mode || e.mode === 'both';
    const muscleOk = !filterMuscle || e.muscle_group === filterMuscle;
    const searchOk = !searchText || e.name.toLowerCase().includes(searchText.toLowerCase());
    const notExcluded = !excludeIds.includes(e.id);
    return modeOk && muscleOk && searchOk && notExcluded;
  });

  function handleClose() {
    setSearchText('');
    setFilterMuscle(null);
    onClose();
  }

  function handleSelect(ex: Exercise) {
    setSearchText('');
    setFilterMuscle(null);
    onSelect(ex);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={handleClose} style={s.backBtn}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={s.title}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        <TextInput
          style={s.searchInput}
          placeholder="Buscar ejercicio..."
          placeholderTextColor={COLORS.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.muscleFilter} contentContainerStyle={s.muscleFilterContent}>
          <TouchableOpacity
            style={[s.muscleChip, !filterMuscle && s.muscleChipActive]}
            onPress={() => setFilterMuscle(null)}
          >
            <Text style={[s.muscleChipText, !filterMuscle && s.muscleChipTextActive]}>Todos</Text>
          </TouchableOpacity>
          {MUSCLE_GROUPS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[s.muscleChip, filterMuscle === m && s.muscleChipActive]}
              onPress={() => setFilterMuscle(filterMuscle === m ? null : m)}
            >
              <Text style={[s.muscleChipText, filterMuscle === m && s.muscleChipTextActive]}>
                {MUSCLE_LABELS[m] ?? m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={s.scroll} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <Text style={s.noResults}>No se encontraron ejercicios</Text>
          ) : (
            filtered.map((ex) => (
              <TouchableOpacity key={ex.id} onPress={() => handleSelect(ex)} activeOpacity={0.75} style={s.exCard}>
                <View style={s.exInfo}>
                  <Text style={s.exName}>{ex.name}</Text>
                  <Text style={s.exMeta}>
                    {MUSCLE_LABELS[ex.muscle_group] ?? ex.muscle_group} · Dificultad {ex.difficulty}/5
                  </Text>
                </View>
                <Ionicons name="add-circle" size={26} color={COLORS.primary} />
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  title: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700' },
  searchInput: {
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    color: COLORS.textPrimary, fontSize: FONT.base, padding: SPACING.md, height: 48,
  },
  muscleFilter: { flexGrow: 0, marginBottom: SPACING.sm },
  muscleFilterContent: { paddingHorizontal: SPACING.lg, gap: 8 },
  muscleChip: {
    paddingHorizontal: 14, height: 34, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  muscleChipActive: { backgroundColor: COLORS.primary },
  muscleChipText: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '600' },
  muscleChipTextActive: { color: COLORS.accentText },
  scroll: { flex: 1 },
  listContent: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  exCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
  },
  exInfo: { flex: 1 },
  exName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  exMeta: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  noResults: { color: COLORS.textMuted, textAlign: 'center', marginTop: 40, fontSize: FONT.base },
});
