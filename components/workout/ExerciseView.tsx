import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
  // Mantener pulsado: repite y acelera para saltos grandes sin perder el paso fino.
  const valueRef = useRef(value);
  valueRef.current = value;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ticksRef = useRef(0);

  function clamp(v: number) {
    return Math.max(min, Math.round(v * 10) / 10);
  }

  function applyStep(dir: 1 | -1, multiplier: number) {
    onChange(clamp(valueRef.current + dir * step * multiplier));
    Haptics.selectionAsync();
  }

  function startHold(dir: 1 | -1) {
    applyStep(dir, 1); // primer paso inmediato (= tap)
    ticksRef.current = 0;
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        ticksRef.current += 1;
        // Acelera: paso x1, luego x2, luego x5
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

  useEffect(() => endHold, []);

  return (
    <View style={inputStyles.container}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={inputStyles.row}>
        <TouchableOpacity
          style={inputStyles.btn}
          onPressIn={() => startHold(-1)}
          onPressOut={endHold}
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
          onPressIn={() => startHold(1)}
          onPressOut={endHold}
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
  loggedSets,
  canGoPrev,
  onPrevExercise,
  onAddSet,
  onDeleteSet,
  onCompleteSet,
  onSwapExercise,
  onSkipExercise,
}: ExerciseViewProps) {
  const defaultReps = parseInt(routineExercise.target_reps.split('-')[0]) || 8;
  const repMin = parseRepMin(routineExercise.target_reps);

  const [weight, setWeight] = useState(
    suggestion.new_weight_kg > 0 ? suggestion.new_weight_kg : (routineExercise.target_weight_kg ?? 0)
  );
  const [reps, setReps] = useState(defaultReps);
  const [rir, setRir] = useState<RIR>(2);
  const [showInstructions, setShowInstructions] = useState(false);

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

    // Auto-ajuste por fatiga: si quedó poca reserva, prepara la próxima serie.
    if (rir === 0) {
      // Al fallo: baja el peso ~5% (mínimo 1 kg) y apunta a una rep menos.
      if (weight > 0) {
        const drop = Math.max(1, Math.round(weight * 0.05));
        setWeight(Math.max(0, Math.round((weight - drop) * 10) / 10));
      }
      setReps((r) => Math.max(repMin, r - 1));
    } else if (rir === 1) {
      // Muy difícil: mantiene peso, espera una rep menos.
      setReps((r) => Math.max(repMin, r - 1));
    }
    setRir(2); // reinicia la reserva estimada para la próxima serie
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

        {/* Inputs peso y reps — paso de 1, mantén pulsado para ir más rápido */}
        <View style={styles.inputsCard}>
          <View style={styles.inputsRow}>
            <NumberInput value={weight} onChange={setWeight} step={1} min={0} label="Peso" suffix="kg" />
            <View style={styles.inputDivider} />
            <NumberInput value={reps} onChange={setReps} step={1} min={1} label="Reps" suffix="reps" />
          </View>
          {routineExercise.target_reps && (
            <Text style={styles.targetReps}>Objetivo: {routineExercise.target_reps} reps · mantén ± para saltos</Text>
          )}
        </View>

        {/* Selector de RIR */}
        <View style={styles.rirCard}>
          <Text style={styles.rirTitle}>¿Cuántas reps te quedaban en el tanque?</Text>
          <View style={styles.rirRow}>
            {RIR_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.rirBtn, rir === opt.value && styles.rirBtnActive]}
                onPress={() => { setRir(opt.value); Haptics.selectionAsync(); }}
                activeOpacity={0.7}
              >
                <Ionicons name={opt.icon} size={18} color={rir === opt.value ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.rirLabel, rir === opt.value && styles.rirLabelActive]}>
                  {RIR_LABELS[opt.value]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
          <Ionicons name="checkmark-circle" size={24} color={COLORS.accentText} />
          <Text style={styles.completeBtnText}>Completar serie {currentSet}</Text>
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

  scroll: { padding: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 48, gap: SPACING.md },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1 },
  muscleTag: { color: COLORS.primary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  exerciseName: { color: COLORS.textPrimary, fontSize: FONT.xxl, fontWeight: '600', lineHeight: 32 },
  headerRight: { alignItems: 'center', paddingLeft: SPACING.md },
  setCounter: { color: COLORS.primary, fontSize: 40, fontWeight: '600', lineHeight: 44, fontVariant: ['tabular-nums'] },
  setLabel: { color: COLORS.textMuted, fontSize: FONT.sm },

  suggestionBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: RADIUS.md },
  suggestionText: { fontSize: FONT.base, fontWeight: '600', flex: 1 },

  instructionsToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  instructionsToggleText: { color: COLORS.textMuted, fontSize: FONT.sm },
  instructionsBox: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, gap: 6 },
  instructionsText: { color: COLORS.textSecondary, fontSize: FONT.base, lineHeight: 22 },
  tipsTitle: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '700', marginTop: 8 },
  tipItem: { color: COLORS.textMuted, fontSize: FONT.sm, lineHeight: 20 },

  inputsCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, gap: SPACING.sm },
  inputsRow: { flexDirection: 'row', alignItems: 'center' },
  inputDivider: { width: 1, height: 60, backgroundColor: COLORS.border, marginHorizontal: SPACING.sm },
  targetReps: { color: COLORS.textMuted, fontSize: FONT.sm, textAlign: 'center' },

  rirCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  rirTitle: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '600', textAlign: 'center' },
  rirRow: { flexDirection: 'row', gap: 6 },
  rirBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 3,
  },
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

  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 60, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary },
  completeBtnText: { color: COLORS.accentText, fontSize: FONT.lg, fontWeight: '600' },

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
});
