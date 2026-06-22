import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Exercise, RoutineExercise, ProgressionSuggestion, RIR, WorkoutSet } from '../../types';
import { RIR_LABELS } from '../../lib/progression';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { formatWeight } from '../../utils/formatters';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio',
};

const RIR_OPTIONS: { value: RIR; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 4, icon: 'happy-outline' },
  { value: 3, icon: 'happy-outline' },
  { value: 2, icon: 'barbell-outline' },
  { value: 1, icon: 'sad-outline' },
  { value: 0, icon: 'flame-outline' },
];

/** Mínimo de reps del rango objetivo ("8-12" -> 8, "10" -> 10, "AMRAP" -> 1) */
function parseRepMin(target: string): number {
  if (target === 'AMRAP') return 1;
  const first = parseInt(target.split('-')[0], 10);
  return Number.isFinite(first) ? first : 1;
}

interface ExerciseViewProps {
  exercise: Exercise;
  routineExercise: RoutineExercise;
  currentSet: number;
  totalSets: number;
  totalExercises: number;
  currentExerciseIndex: number;
  suggestion: ProgressionSuggestion;
  loggedSets: WorkoutSet[];
  canGoPrev: boolean;
  onPrevExercise: () => void;
  onAddSet: () => void;
  onDeleteSet: (setId: string) => void;
  onCompleteSet: (weight: number, reps: number, rir: RIR) => void;
  onSwapExercise: () => void;
  onSkipExercise: () => void;
  onEndEarly?: () => void;
}

function NumberInput({
  value,
  onChange,
  step,
  min,
  max,
  label,
  suffix,
  decimals = 1,
  btnSize = 44,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max?: number;
  label: string;
  suffix: string;
  decimals?: number;
  btnSize?: number;
}) {
  const valueRef = useRef(value);
  valueRef.current = value;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ticksRef = useRef(0);
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);

  function clamp(v: number) {
    const rounded = Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals);
    const floored = Math.max(min, rounded);
    return max != null ? Math.min(max, floored) : floored;
  }

  function applyStep(dir: 1 | -1, multiplier: number) {
    onChange(clamp(valueRef.current + dir * step * multiplier));
    Haptics.selectionAsync();
  }

  function startHold(dir: 1 | -1) {
    applyStep(dir, 1);
    ticksRef.current = 0;
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        ticksRef.current += 1;
        const mult = ticksRef.current > 18 ? 5 : ticksRef.current > 8 ? 2 : 1;
        applyStep(dir, mult);
      }, 110);
    }, 380);
  }

  function endHold() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }

  function commitDraft() {
    const parsed = parseFloat(draft.replace(',', '.'));
    if (Number.isFinite(parsed)) {
      onChange(clamp(parsed));
    }
    setDraft('');
    setFocused(false);
  }

  useEffect(() => endHold, []);

  const displayValue = focused ? draft : String(value);
  const fontSize = btnSize <= 40 ? 26 : 30;

  return (
    <View style={inputStyles.container}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={inputStyles.row}>
        <TouchableOpacity
          style={[inputStyles.btn, { width: btnSize, height: btnSize }]}
          onPressIn={() => startHold(-1)}
          onPressOut={endHold}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        >
          <Text style={inputStyles.btnText}>−</Text>
        </TouchableOpacity>
        <View style={inputStyles.valueBox}>
          <TextInput
            style={[inputStyles.valueInput, { fontSize }]}
            value={displayValue}
            onChangeText={(t) => {
              setDraft(t.replace(/[^0-9.,]/g, ''));
              setFocused(true);
            }}
            onFocus={() => {
              setFocused(true);
              setDraft(String(value));
            }}
            onBlur={commitDraft}
            onSubmitEditing={commitDraft}
            keyboardType="decimal-pad"
            returnKeyType="done"
            selectTextOnFocus
            maxLength={6}
          />
          <Text style={inputStyles.suffix}>{suffix}</Text>
        </View>
        <TouchableOpacity
          style={[inputStyles.btn, { width: btnSize, height: btnSize }]}
          onPressIn={() => startHold(1)}
          onPressOut={endHold}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        >
          <Text style={inputStyles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  container: { width: '100%', alignSelf: 'stretch', minWidth: 0 },
  label: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  btn: {
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
  },
  btnText: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '300' },
  valueBox: {
    flex: 1,
    minWidth: 0,
    maxWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueInput: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
    minWidth: 0,
    paddingVertical: 2,
    paddingHorizontal: 2,
    fontVariant: ['tabular-nums'],
  },
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
  loggedSets,
  canGoPrev,
  onPrevExercise,
  onAddSet,
  onDeleteSet,
  onCompleteSet,
  onSwapExercise,
  onSkipExercise,
  onEndEarly,
}: ExerciseViewProps) {
  const { width } = useWindowDimensions();
  const stackedInputs = width < 520;
  const inputBtnSize = width < 380 ? 40 : 44;

  const defaultReps = parseInt(routineExercise.target_reps.split('-')[0]) || 8;
  const repMin = parseRepMin(routineExercise.target_reps);

  function valuesFromLogged() {
    const last = [...loggedSets].filter((s) => s.completed).pop();
    if (last) {
      return {
        weight: last.weight_kg,
        reps: last.reps > 0 ? last.reps : defaultReps,
        rir: (last.rir ?? 2) as RIR,
      };
    }
    return {
      weight: suggestion.new_weight_kg > 0
        ? suggestion.new_weight_kg
        : (routineExercise.target_weight_kg ?? 0),
      reps: defaultReps,
      rir: 2 as RIR,
    };
  }

  const [weight, setWeight] = useState(() => valuesFromLogged().weight);
  const [reps, setReps] = useState(() => valuesFromLogged().reps);
  const [rir, setRir] = useState<RIR>(() => valuesFromLogged().rir);
  const [showInstructions, setShowInstructions] = useState(false);

  // Tras cada serie reutiliza peso/reps de la anterior (incluye ajuste por RIR).
  useEffect(() => {
    const completed = loggedSets.filter((s) => s.completed);
    const last = completed[completed.length - 1];
    if (!last) return;

    let nextWeight = last.weight_kg;
    let nextReps = last.reps > 0 ? last.reps : defaultReps;

    if (last.rir === 0 && nextWeight > 0) {
      const drop = Math.max(1, Math.round(nextWeight * 0.05));
      nextWeight = Math.max(0, Math.round((nextWeight - drop) * 10) / 10);
      nextReps = Math.max(repMin, nextReps - 1);
    } else if (last.rir === 1) {
      nextReps = Math.max(repMin, nextReps - 1);
    }

    setWeight(nextWeight);
    setReps(nextReps);
    setRir(2);
  }, [currentSet, loggedSets.length, routineExercise.exercise_id]);

  const progressionIcon: keyof typeof Ionicons.glyphMap =
    suggestion.action === 'increase_weight' ? 'arrow-up-outline' :
    suggestion.action === 'deload' ? 'arrow-down-outline' : 'arrow-forward-outline';
  const progressionColor =
    suggestion.action === 'increase_weight' ? COLORS.success :
    suggestion.action === 'deload' ? COLORS.danger : COLORS.warning;

  const lowReserve = rir <= 1; // esfuerzo muy alto

  function handleComplete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCompleteSet(weight, reps, rir);
    setRir(2);
  }

  return (
    <View style={styles.container}>
      {/* Barra de progreso */}
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.muscleTag}>
              {MUSCLE_LABELS[exercise.muscle_group] ?? exercise.muscle_group}
            </Text>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.setCounter}>{currentSet}/{totalSets}</Text>
            <Text style={styles.setLabel}>series</Text>
          </View>
        </View>

        {/* Badge de progresión */}
        {suggestion.message ? (
          <View style={[styles.suggestionBadge, { backgroundColor: `${progressionColor}20` }]}>
            <Ionicons name={progressionIcon} size={16} color={progressionColor} />
            <Text style={[styles.suggestionText, { color: progressionColor }]}>{suggestion.message}</Text>
          </View>
        ) : null}

        {/* Instrucciones */}
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

        {/* Inputs peso y reps */}
        <View style={styles.inputsCard}>
          <View style={[styles.inputsRow, stackedInputs && styles.inputsRowStacked]}>
            <NumberInput
              value={weight}
              onChange={setWeight}
              step={0.5}
              min={0}
              label="Peso"
              suffix="kg"
              decimals={1}
              btnSize={inputBtnSize}
            />
            {!stackedInputs && <View style={styles.inputDivider} />}
            <NumberInput
              value={reps}
              onChange={setReps}
              step={1}
              min={1}
              max={999}
              label="Reps"
              suffix="reps"
              decimals={0}
              btnSize={inputBtnSize}
            />
          </View>
          {routineExercise.target_reps && (
            <Text style={styles.targetReps}>
              Objetivo: {routineExercise.target_reps} reps · toca el número · ±0.5 kg
            </Text>
          )}
        </View>

        {/* Selector de RIR */}
        <View style={styles.rirCard}>
          <Text style={styles.rirTitle}>¿Cuántas reps te quedaban en el tanque?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rirRow}>
            {RIR_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.rirBtn, stackedInputs && styles.rirBtnNarrow, rir === opt.value && styles.rirBtnActive]}
                onPress={() => { setRir(opt.value); Haptics.selectionAsync(); }}
                activeOpacity={0.7}
              >
                <Ionicons name={opt.icon} size={18} color={rir === opt.value ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.rirLabel, rir === opt.value && styles.rirLabelActive]}>
                  {RIR_LABELS[opt.value]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {lowReserve && (
            <View style={styles.rirHint}>
              <Ionicons name="information-circle-outline" size={15} color={COLORS.warning} />
              <Text style={styles.rirHintText}>
                {rir === 0
                  ? 'Llegaste al fallo. Bajaremos algo el peso y las reps para la próxima serie.'
                  : 'Esfuerzo alto. Ajustaremos las reps de la próxima serie.'}
              </Text>
            </View>
          )}
        </View>

        {/* Series ya registradas en este ejercicio */}
        {loggedSets.length > 0 && (
          <View style={styles.loggedCard}>
            <Text style={styles.loggedTitle}>Series registradas</Text>
            {loggedSets.map((set, i) => (
              <View key={set.id} style={styles.loggedRow}>
                <View style={styles.loggedNum}>
                  <Text style={styles.loggedNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.loggedData}>
                  {set.weight_kg > 0 ? `${formatWeight(set.weight_kg)} × ` : ''}{set.reps} reps
                </Text>
                {set.rir != null && (
                  <Text style={styles.loggedRir}>RIR {set.rir}</Text>
                )}
                <TouchableOpacity
                  onPress={() => onDeleteSet(set.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.loggedDelete}
                >
                  <Ionicons name="close" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Botón completar (acción principal) */}
        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle" size={22} color={COLORS.accentText} />
          <Text style={styles.completeBtnText} numberOfLines={1}>
            Completar serie {currentSet}
          </Text>
        </TouchableOpacity>

        {/* Agregar serie extra a este ejercicio */}
        <TouchableOpacity style={styles.addSetBtn} onPress={() => { onAddSet(); Haptics.selectionAsync(); }} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color={COLORS.primary} />
          <Text style={styles.addSetText}>Agregar serie</Text>
        </TouchableOpacity>

        {/* Navegación entre ejercicios */}
        <View style={styles.navRow}>
          {canGoPrev && (
            <TouchableOpacity style={styles.navBtn} onPress={onPrevExercise} activeOpacity={0.75}>
              <Ionicons name="arrow-back" size={18} color={COLORS.textSecondary} />
              <Text style={styles.navBtnText}>Anterior</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.navBtn} onPress={onSkipExercise} activeOpacity={0.75}>
            <Ionicons name="play-skip-forward-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.navBtnText}>Saltar</Text>
          </TouchableOpacity>
        </View>

        {/* Sustituir ejercicio */}
        <TouchableOpacity style={styles.swapBtn} onPress={onSwapExercise} activeOpacity={0.75}>
          <Ionicons name="swap-horizontal-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.swapBtnText}>No puedo hacerlo — cambiar ejercicio</Text>
        </TouchableOpacity>

        {onEndEarly && (
          <TouchableOpacity style={styles.endEarlyBtn} onPress={onEndEarly} activeOpacity={0.8}>
            <Ionicons name="flag-outline" size={18} color={COLORS.warning} />
            <Text style={styles.endEarlyText}>Terminar rutina anticipada</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  progressBar: { flexDirection: 'row', gap: 4, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  progressDone: { backgroundColor: COLORS.success },
  progressCurrent: { backgroundColor: COLORS.primary },

  scroll: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: 48, gap: SPACING.md },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: SPACING.sm },
  headerLeft: { flex: 1, minWidth: 0 },
  muscleTag: { color: COLORS.primary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  exerciseName: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '600', lineHeight: 28 },
  headerRight: { alignItems: 'center', paddingLeft: SPACING.xs, flexShrink: 0 },
  setCounter: { color: COLORS.primary, fontSize: 32, fontWeight: '600', lineHeight: 36, fontVariant: ['tabular-nums'] },
  setLabel: { color: COLORS.textMuted, fontSize: FONT.sm },

  suggestionBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: RADIUS.md },
  suggestionText: { fontSize: FONT.base, fontWeight: '600', flex: 1 },

  instructionsToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  instructionsToggleText: { color: COLORS.textMuted, fontSize: FONT.sm },
  instructionsBox: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, gap: 6 },
  instructionsText: { color: COLORS.textSecondary, fontSize: FONT.base, lineHeight: 22 },
  tipsTitle: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '700', marginTop: 8 },
  tipItem: { color: COLORS.textMuted, fontSize: FONT.sm, lineHeight: 20 },

  inputsCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    gap: SPACING.sm,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  inputsRow: { flexDirection: 'row', alignItems: 'stretch', width: '100%' },
  inputsRowStacked: { flexDirection: 'column', gap: SPACING.md },
  inputDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.xs, alignSelf: 'stretch' },
  targetReps: { color: COLORS.textMuted, fontSize: FONT.sm, textAlign: 'center', lineHeight: 18 },

  rirCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  rirTitle: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '600', textAlign: 'center' },
  rirRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  rirBtn: {
    width: 72,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 3,
  },
  rirBtnNarrow: { width: 68 },
  rirBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  rirLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  rirLabelActive: { color: COLORS.primary },
  rirHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: COLORS.warningDim, borderRadius: RADIUS.md, padding: SPACING.sm,
  },
  rirHintText: { flex: 1, color: COLORS.warning, fontSize: FONT.sm, lineHeight: 18 },

  loggedCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: 8,
  },
  loggedTitle: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5 },
  loggedRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  loggedNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.successDim,
    alignItems: 'center', justifyContent: 'center',
  },
  loggedNumText: { color: COLORS.success, fontSize: 11, fontWeight: '700' },
  loggedData: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '500', fontVariant: ['tabular-nums'] },
  loggedRir: { color: COLORS.textMuted, fontSize: FONT.sm, fontVariant: ['tabular-nums'] },
  loggedDelete: { padding: 2 },

  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignSelf: 'stretch',
  },
  completeBtnText: {
    color: COLORS.accentText,
    fontSize: FONT.md,
    fontWeight: '600',
    flexShrink: 1,
  },

  addSetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 48, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: COLORS.primary,
  },
  addSetText: { color: COLORS.primary, fontSize: FONT.base, fontWeight: '600' },

  navRow: { flexDirection: 'row', gap: SPACING.sm },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  navBtnText: { color: COLORS.textSecondary, fontSize: FONT.base, fontWeight: '600' },

  swapBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 44, borderRadius: RADIUS.md, backgroundColor: 'transparent',
  },
  swapBtnText: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '600' },

  endEarlyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, borderRadius: RADIUS.lg, marginTop: SPACING.xs,
    backgroundColor: COLORS.warningDim, borderWidth: 1, borderColor: COLORS.warning,
  },
  endEarlyText: { color: COLORS.warning, fontSize: FONT.base, fontWeight: '600' },
});
