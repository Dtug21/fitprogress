import {
  View,
  Text,
  StyleSheet,ScrollView,
  TouchableOpacity,
  TextInput,
  Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useUserStore } from '../../stores/useUserStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ModeToggle } from '../../components/ui/ModeToggle';
import { RoutineExerciseCard } from '../../components/routine/RoutineExerciseCard';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { exercises, getExerciseById } from '../../data/exercises';
import { Exercise, RoutineExercise } from '../../types';
import { generateId } from '../../utils/calculations';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio', full_body: 'Full Body' };

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'cardio',
];

export default function RoutineEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getRoutineById, updateRoutine, removeExerciseFromRoutine, addExerciseToRoutine,
    updateRoutineExercise, moveExercise } = useRoutineStore();
  const { profile } = useUserStore();

  const routine = getRoutineById(id);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  if (!routine) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Rutina no encontrada</Text>
      </SafeAreaView>
    );
  }

  function toggleDay(day: number) {
    const current = routine!.day_of_week;
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    updateRoutine(id, { day_of_week: updated });
  }

  function handleNameChange(name: string) {
    updateRoutine(id, { name });
  }

  function handleModeChange(mode: 'home' | 'gym') {
    updateRoutine(id, { mode });
  }

  function handleAddExercise(exercise: Exercise) {
    const re: RoutineExercise = {
      exercise_id: exercise.id,
      order: routine!.exercises.length,
      target_sets: 3,
      target_reps: '8-12',
      rest_seconds: 90 };
    addExerciseToRoutine(id, re);
    setShowExercisePicker(false);
    setSearchText('');
    setFilterMuscle(null);
  }

  function handleRemoveExercise(exerciseId: string) {
    Alert.alert('Eliminar ejercicio', '¿Quitar este ejercicio de la rutina?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => removeExerciseFromRoutine(id, exerciseId) },
    ]);
  }

  const totalSets = routine.exercises.reduce((t, re) => t + re.target_sets, 0);
  const estimatedMin = routine.exercises.reduce(
    (t, re) => t + Math.round((re.target_sets * (35 + re.rest_seconds)) / 60),
    0,
  );

  const filteredExercises = exercises.filter((e) => {
    const modeOk = e.mode === routine.mode || e.mode === 'both';
    const muscleOk = !filterMuscle || e.muscle_group === filterMuscle;
    const searchOk =
      !searchText ||
      e.name.toLowerCase().includes(searchText.toLowerCase());
    const notAdded = !routine.exercises.find((re) => re.exercise_id === e.id);
    return modeOk && muscleOk && searchOk && notAdded;
  });

  if (showExercisePicker) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pickerHeader}>
          <TouchableOpacity onPress={() => { setShowExercisePicker(false); setSearchText(''); setFilterMuscle(null); }} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.pickerTitle}>Agregar ejercicio</Text>
          <View style={{ width: 40 }} />
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ejercicio..."
          placeholderTextColor={COLORS.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.muscleFilter} contentContainerStyle={styles.muscleFilterContent}>
          <TouchableOpacity
            style={[styles.muscleChip, !filterMuscle && styles.muscleChipActive]}
            onPress={() => setFilterMuscle(null)}
          >
            <Text style={[styles.muscleChipText, !filterMuscle && styles.muscleChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          {MUSCLE_GROUPS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.muscleChip, filterMuscle === m && styles.muscleChipActive]}
              onPress={() => setFilterMuscle(filterMuscle === m ? null : m)}
            >
              <Text style={[styles.muscleChipText, filterMuscle === m && styles.muscleChipTextActive]}>
                {MUSCLE_LABELS[m] ?? m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.pickerContent} showsVerticalScrollIndicator={false}>
          {filteredExercises.length === 0 ? (
            <Text style={styles.noResults}>No se encontraron ejercicios</Text>
          ) : (
            filteredExercises.map((ex) => (
              <TouchableOpacity key={ex.id} onPress={() => handleAddExercise(ex)} activeOpacity={0.75}>
                <Card padding={SPACING.md} style={styles.exercisePickerCard}>
                  <View style={styles.exercisePickerRow}>
                    <View style={styles.exercisePickerInfo}>
                      <Text style={styles.exercisePickerName}>{ex.name}</Text>
                      <Text style={styles.exercisePickerMeta}>
                        {MUSCLE_LABELS[ex.muscle_group] ?? ex.muscle_group} · Dificultad {ex.difficulty}/5
                      </Text>
                    </View>
                    <Ionicons name="add-circle" size={26} color={COLORS.primary} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle} numberOfLines={1}>
          Editar rutina
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nombre */}
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.nameInput}
          value={routine.name}
          onChangeText={handleNameChange}
          placeholder="Nombre de la rutina"
          placeholderTextColor={COLORS.textMuted}
          maxLength={40}
        />

        {/* Modo */}
        <Text style={styles.label}>Modo</Text>
        <ModeToggle mode={routine.mode} onChange={handleModeChange} />

        {/* Días */}
        <Text style={styles.label}>Días de la semana</Text>
        <View style={styles.daysRow}>
          {DAY_NAMES.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayPill, routine.day_of_week.includes(i) && styles.dayPillActive]}
              onPress={() => toggleDay(i)}
            >
              <Text style={[styles.dayText, routine.day_of_week.includes(i) && styles.dayTextActive]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ejercicios */}
        <View style={styles.exercisesHeader}>
          <Text style={styles.label}>Ejercicios ({routine.exercises.length})</Text>
          <TouchableOpacity onPress={() => setShowExercisePicker(true)} style={styles.addExBtn}>
            <Ionicons name="add" size={18} color={COLORS.primary} />
            <Text style={styles.addExText}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {routine.exercises.length > 0 && (
          <Text style={styles.summaryLine}>
            {totalSets} series totales · ~{estimatedMin} min · toca un ejercicio para editarlo
          </Text>
        )}

        {routine.exercises.length === 0 ? (
          <Card padding={SPACING.lg}>
            <Text style={styles.noExTitle}>Sin ejercicios</Text>
            <Text style={styles.noExSub}>Toca "Agregar" para añadir ejercicios a esta rutina.</Text>
          </Card>
        ) : (
          routine.exercises.map((re, index) => {
            const ex = getExerciseById(re.exercise_id);
            if (!ex) return null;
            return (
              <RoutineExerciseCard
                key={re.exercise_id}
                index={index}
                total={routine.exercises.length}
                routineExercise={re}
                exercise={ex}
                onUpdate={(updates) => updateRoutineExercise(id, re.exercise_id, updates)}
                onRemove={() => handleRemoveExercise(re.exercise_id)}
                onMove={(dir) => moveExercise(id, re.exercise_id, dir)}
              />
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.sm },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  pageTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700', flex: 1, textAlign: 'center' },

  label: { color: COLORS.textSecondary, fontSize: FONT.base, fontWeight: '600', marginTop: SPACING.sm },

  nameInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    padding: SPACING.md,
    height: 52 },

  daysRow: { flexDirection: 'row', gap: 6 },
  dayPill: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center' },
  dayPillActive: { backgroundColor: COLORS.primaryDim },
  dayText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  dayTextActive: { color: COLORS.primary },

  summaryLine: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2, marginBottom: 4 },
  exercisesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addExBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addExText: { color: COLORS.primary, fontSize: FONT.base, fontWeight: '600' },

  noExTitle: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700', marginBottom: 6 },
  noExSub: { color: COLORS.textMuted, fontSize: FONT.base },

  exCard: { marginBottom: 0 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  exIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center',
    justifyContent: 'center' },
  exIndexText: { color: COLORS.primary, fontSize: FONT.sm, fontWeight: '700' },
  exInfo: { flex: 1 },
  exName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  exMeta: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  removeBtn: { padding: 4 },
  exBadgeRow: { flexDirection: 'row', gap: 6, marginTop: SPACING.sm },

  errorText: { color: COLORS.textMuted, textAlign: 'center', marginTop: 40 },

  // Picker
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm },
  pickerTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700' },
  searchInput: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    padding: SPACING.md,
    height: 48 },
  muscleFilter: { flexGrow: 0, marginBottom: SPACING.sm },
  muscleFilterContent: { paddingHorizontal: SPACING.lg, gap: 8 },
  muscleChip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center' },
  muscleChipActive: { backgroundColor: COLORS.primary },
  muscleChipText: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '600' },
  muscleChipTextActive: { color: '#000' },
  pickerContent: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  exercisePickerCard: {},
  exercisePickerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  exercisePickerInfo: { flex: 1 },
  exercisePickerName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  exercisePickerMeta: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  noResults: { color: COLORS.textMuted, textAlign: 'center', marginTop: 40, fontSize: FONT.base } });
