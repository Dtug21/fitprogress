import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Exercise, RoutineExercise } from '../../types';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio', full_body: 'Full Body',
};

interface Props {
  index: number;
  total: number;
  routineExercise: RoutineExercise;
  exercise: Exercise;
  onUpdate: (updates: Partial<RoutineExercise>) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
}

/** Stepper compacto para series, descanso y peso */
function Stepper({
  label, value, suffix, step, min, max, onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  step: number;
  min: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={s.stepperBlock}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={s.stepperRow}>
        <TouchableOpacity
          style={s.stepBtn}
          onPress={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}
          activeOpacity={0.7}
        >
          <Text style={s.stepBtnText}>−</Text>
        </TouchableOpacity>
        <View style={s.stepValueBox}>
          <Text style={s.stepValue}>{value}</Text>
          {suffix ? <Text style={s.stepSuffix}>{suffix}</Text> : null}
        </View>
        <TouchableOpacity
          style={s.stepBtn}
          onPress={() => onChange(max ? Math.min(max, Math.round((value + step) * 10) / 10) : Math.round((value + step) * 10) / 10)}
          activeOpacity={0.7}
        >
          <Text style={s.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function RoutineExerciseCard({
  index, total, routineExercise, exercise, onUpdate, onRemove, onMove,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const re = routineExercise;

  return (
    <View style={s.card}>
      {/* Cabecera siempre visible */}
      <TouchableOpacity
        style={s.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.75}
      >
        <View style={s.indexChip}>
          <Text style={s.indexText}>{index + 1}</Text>
        </View>
        <View style={s.headerInfo}>
          <Text style={s.exName}>{exercise.name}</Text>
          <Text style={s.exMeta}>
            {re.target_sets} × {re.target_reps}
            {re.target_weight_kg ? ` · ${re.target_weight_kg} kg` : ''} · {re.rest_seconds}s
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.textMuted}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={s.body}>
          <Text style={s.muscleTag}>
            {MUSCLE_LABELS[exercise.muscle_group] ?? exercise.muscle_group}
          </Text>

          {/* Series y descanso */}
          <View style={s.stepperRowWrap}>
            <Stepper
              label="Series" value={re.target_sets} step={1} min={1} max={10}
              onChange={(v) => onUpdate({ target_sets: v })}
            />
            <Stepper
              label="Descanso" value={re.rest_seconds} suffix="s" step={15} min={0} max={300}
              onChange={(v) => onUpdate({ rest_seconds: v })}
            />
          </View>

          {/* Reps objetivo (texto libre: "8-12", "AMRAP", "10") */}
          <View style={s.repsBlock}>
            <Text style={s.stepperLabel}>Reps objetivo</Text>
            <TextInput
              style={s.repsInput}
              value={re.target_reps}
              onChangeText={(t) => onUpdate({ target_reps: t })}
              placeholder="8-12"
              placeholderTextColor={COLORS.textMuted}
              maxLength={10}
              autoCapitalize="characters"
            />
            <Text style={s.repsHint}>Ej: 8-12, 5, AMRAP</Text>
          </View>

          {/* Peso objetivo opcional */}
          <View style={s.repsBlock}>
            <View style={s.weightHeader}>
              <Text style={s.stepperLabel}>Peso objetivo (opcional)</Text>
              {re.target_weight_kg ? (
                <TouchableOpacity onPress={() => onUpdate({ target_weight_kg: undefined })}>
                  <Text style={s.clearWeight}>Quitar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={s.weightInputRow}>
              <TextInput
                style={s.weightInput}
                value={re.target_weight_kg != null ? String(re.target_weight_kg) : ''}
                onChangeText={(t) => {
                  const parsed = parseFloat(t.replace(',', '.'));
                  if (t.trim() === '') onUpdate({ target_weight_kg: undefined });
                  else if (Number.isFinite(parsed) && parsed >= 0) onUpdate({ target_weight_kg: parsed });
                }}
                placeholder="Ej: 22.5"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
              />
              <Text style={s.weightUnit}>kg</Text>
            </View>
            <Stepper
              label=""
              value={re.target_weight_kg ?? 0}
              suffix="kg"
              step={0.5}
              min={0}
              onChange={(v) => onUpdate({ target_weight_kg: v === 0 ? undefined : v })}
            />
          </View>

          {/* Acciones: mover y quitar */}
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.actionBtn, index === 0 && s.actionBtnDisabled]}
              onPress={() => onMove('up')}
              disabled={index === 0}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-up" size={16} color={index === 0 ? COLORS.textMuted : COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, index === total - 1 && s.actionBtnDisabled]}
              onPress={() => onMove('down')}
              disabled={index === total - 1}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-down" size={16} color={index === total - 1 ? COLORS.textMuted : COLORS.textSecondary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={s.removeBtn} onPress={onRemove} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              <Text style={s.removeText}>Quitar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md },
  indexChip: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryDim, alignItems: 'center', justifyContent: 'center',
  },
  indexText: { color: COLORS.primary, fontSize: FONT.sm, fontWeight: '700' },
  headerInfo: { flex: 1 },
  exName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  exMeta: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2, fontVariant: ['tabular-nums'] },

  body: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  muscleTag: {
    color: COLORS.primary, fontSize: 11, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1.5,
  },

  stepperRowWrap: { flexDirection: 'row', gap: SPACING.md },
  stepperBlock: { flex: 1, gap: 6 },
  stepperLabel: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '600' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '300' },
  stepValueBox: { flex: 1, alignItems: 'center' },
  stepValue: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700', fontVariant: ['tabular-nums'] },
  stepSuffix: { color: COLORS.textMuted, fontSize: 10 },

  repsBlock: { gap: 6 },
  repsInput: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    color: COLORS.textPrimary, fontSize: FONT.md, fontWeight: '600',
    padding: SPACING.sm, height: 46, textAlign: 'center',
  },
  repsHint: { color: COLORS.textMuted, fontSize: 11 },
  weightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearWeight: { color: COLORS.danger, fontSize: FONT.sm, fontWeight: '600' },
  weightInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weightInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '600',
    paddingHorizontal: SPACING.sm,
    height: 46,
    fontVariant: ['tabular-nums'],
  },
  weightUnit: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '600', width: 24 },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnDisabled: { opacity: 0.4 },
  removeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerDim,
  },
  removeText: { color: COLORS.danger, fontSize: FONT.sm, fontWeight: '600' },
});
