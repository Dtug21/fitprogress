import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Exercise, RoutineExercise, ProgressionSuggestion } from '../../types';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { formatWeight } from '../../utils/formatters';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio',
};

interface ExerciseViewProps {
  exercise: Exercise;
  routineExercise: RoutineExercise;
  currentSet: number; // 1-based
  totalSets: number;
  totalExercises: number;
  currentExerciseIndex: number;
  suggestion: ProgressionSuggestion;
  onCompleteSet: (weight: number, reps: number) => void;
  onSwapExercise: () => void;
  onSkipExercise: () => void;
}

function NumberInput({
  value,
  onChange,
  step,
  min,
  label,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  label: string;
  suffix: string;
}) {
  return (
    <View style={inputStyles.container}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={inputStyles.row}>
        <TouchableOpacity
          style={inputStyles.btn}
          onPress={() => {
            const next = Math.max(min, Math.round((value - step) * 10) / 10);
            onChange(next);
            Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <Text style={inputStyles.btnText}>−</Text>
        </TouchableOpacity>

        <View style={inputStyles.valueBox}>
          <Text style={inputStyles.value}>{value}</Text>
          <Text style={inputStyles.suffix}>{suffix}</Text>
        </View>

        <TouchableOpacity
          style={inputStyles.btn}
          onPress={() => {
            const next = Math.round((value + step) * 10) / 10;
            onChange(next);
            Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <Text style={inputStyles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  label: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '600', marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  btn: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnText: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '300' },
  valueBox: { alignItems: 'center', minWidth: 80 },
  value: { color: COLORS.textPrimary, fontSize: 36, fontWeight: '800' },
  suffix: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
});

export function ExerciseView({
  exercise,
  routineExercise,
  currentSet,
  totalSets,
  totalExercises,
  currentExerciseIndex,
  suggestion,
  onCompleteSet,
  onSwapExercise,
  onSkipExercise,
}: ExerciseViewProps) {
  const defaultReps = parseInt(routineExercise.target_reps.split('-')[0]) || 8;

  const [weight, setWeight] = useState(
    suggestion.new_weight > 0 ? suggestion.new_weight : routineExercise.target_weight_kg ?? 0
  );
  const [reps, setReps] = useState(defaultReps);
  const [showInstructions, setShowInstructions] = useState(false);

  const isBodyweight = exercise.equipment_required.includes('bodyweight') && weight === 0;
  const weightStep = exercise.muscle_group === 'legs' || exercise.muscle_group === 'glutes' || exercise.muscle_group === 'hamstrings' ? 5 : 2.5;

  const progressionIcon =
    suggestion.action === 'increase_weight' ? '↑' :
    suggestion.action === 'deload' ? '↓' : '→';
  const progressionColor =
    suggestion.action === 'increase_weight' ? COLORS.success :
    suggestion.action === 'deload' ? COLORS.danger : COLORS.warning;

  function handleComplete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCompleteSet(weight, reps);
  }

  return (
    <View style={styles.container}>
      {/* Barra de progreso de la rutina */}
      <View style={styles.progressBar}>
        {Array.from({ length: totalExercises }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i < currentExerciseIndex && styles.progressDone,
              i === currentExerciseIndex && styles.progressCurrent,
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header del ejercicio */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.muscleTag}>
              {MUSCLE_LABELS[exercise.muscle_group] ?? exercise.muscle_group}
            </Text>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.setCounter}>
              {currentSet}/{totalSets}
            </Text>
            <Text style={styles.setLabel}>series</Text>
          </View>
        </View>

        {/* Badge de progresión */}
        {suggestion.message ? (
          <TouchableOpacity style={[styles.suggestionBadge, { backgroundColor: `${progressionColor}20` }]} activeOpacity={1}>
            <Text style={[styles.suggestionIcon, { color: progressionColor }]}>{progressionIcon}</Text>
            <Text style={[styles.suggestionText, { color: progressionColor }]}>{suggestion.message}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Instrucciones colapsables */}
        <TouchableOpacity
          style={styles.instructionsToggle}
          onPress={() => setShowInstructions((v) => !v)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showInstructions ? 'chevron-up' : 'information-circle-outline'}
            size={18}
            color={COLORS.textMuted}
          />
          <Text style={styles.instructionsToggleText}>
            {showInstructions ? 'Ocultar instrucciones' : 'Ver instrucciones'}
          </Text>
        </TouchableOpacity>

        {showInstructions && (
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsText}>{exercise.instructions}</Text>
            {exercise.tips.length > 0 && (
              <>
                <Text style={styles.tipsTitle}>Tips:</Text>
                {exercise.tips.map((tip, i) => (
                  <Text key={i} style={styles.tipItem}>• {tip}</Text>
                ))}
              </>
            )}
          </View>
        )}

        {/* Inputs de peso y reps */}
        <View style={styles.inputsCard}>
          <View style={styles.inputsRow}>
            <NumberInput
              value={weight}
              onChange={setWeight}
              step={weightStep}
              min={0}
              label="Peso"
              suffix="kg"
            />
            <View style={styles.inputDivider} />
            <NumberInput
              value={reps}
              onChange={setReps}
              step={1}
              min={1}
              label="Reps"
              suffix="reps"
            />
          </View>

          {routineExercise.target_reps && (
            <Text style={styles.targetReps}>
              Objetivo: {routineExercise.target_reps} reps
            </Text>
          )}
        </View>

        {/* Botón completar */}
        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle" size={24} color="#000" />
          <Text style={styles.completeBtnText}>Completar serie {currentSet}</Text>
        </TouchableOpacity>

        {/* Acciones secundarias */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onSwapExercise} activeOpacity={0.7}>
            <Ionicons name="swap-horizontal-outline" size={18} color={COLORS.textMuted} />
            <Text style={styles.secondaryBtnText}>No puedo hacerlo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onSkipExercise} activeOpacity={0.7}>
            <Ionicons name="play-skip-forward-outline" size={18} color={COLORS.textMuted} />
            <Text style={styles.secondaryBtnText}>Saltar ejercicio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  progressBar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  progressDone: { backgroundColor: COLORS.success },
  progressCurrent: { backgroundColor: COLORS.primary },

  scroll: { padding: SPACING.lg, paddingTop: SPACING.sm, gap: SPACING.md },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1 },
  muscleTag: {
    color: COLORS.primary,
    fontSize: FONT.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  exerciseName: { color: COLORS.textPrimary, fontSize: FONT.xxl, fontWeight: '800', lineHeight: 32 },
  headerRight: { alignItems: 'center', paddingLeft: SPACING.md },
  setCounter: { color: COLORS.primary, fontSize: 40, fontWeight: '800', lineHeight: 44 },
  setLabel: { color: COLORS.textMuted, fontSize: FONT.sm },

  suggestionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  suggestionIcon: { fontSize: 18, fontWeight: '800' },
  suggestionText: { fontSize: FONT.base, fontWeight: '600', flex: 1 },

  instructionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructionsToggleText: { color: COLORS.textMuted, fontSize: FONT.sm },
  instructionsBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 6,
  },
  instructionsText: { color: COLORS.textSecondary, fontSize: FONT.base, lineHeight: 22 },
  tipsTitle: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '700', marginTop: 8 },
  tipItem: { color: COLORS.textMuted, fontSize: FONT.sm, lineHeight: 20 },

  inputsCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  inputsRow: { flexDirection: 'row', alignItems: 'center' },
  inputDivider: { width: 1, height: 60, backgroundColor: COLORS.border, marginHorizontal: SPACING.sm },
  targetReps: { color: COLORS.textMuted, fontSize: FONT.sm, textAlign: 'center' },

  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 60,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  completeBtnText: { color: '#000', fontSize: FONT.lg, fontWeight: '800' },

  secondaryActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '600' },
});
