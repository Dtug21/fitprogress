import {
  View, Text, StyleSheet,ScrollView,
  TouchableOpacity, Alert } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../stores/useUserStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import {
  SPLIT_OPTIONS, SplitOption,
  getTrainingParams, generateRoutine, getRecommendedSplits } from '../../lib/routineOptimizer';
import { generateId } from '../../utils/calculations';
import { Goal } from '../../types';

const GOAL_LABELS: Record<string, string> = {
  fat_loss: 'Perder grasa', muscle_gain: 'Ganar músculo',
  strength: 'Fuerza', endurance: 'Resistencia',
  health: 'Salud', mixed: 'Balance' };

export default function NewRoutineWizard() {
  const router = useRouter();
  const { manual } = useLocalSearchParams<{ manual?: string }>();
  const { profile } = useUserStore();
  const { addRoutine } = useRoutineStore();

  const userGoals = profile.goals?.length ? profile.goals : [];
  const effectiveGoals: Goal[] = userGoals.length > 0 ? userGoals : ['mixed'];
  const params = getTrainingParams(effectiveGoals, profile.experience_level);

  const [step, setStep] = useState<'split' | 'preview'>('split');
  const [selectedSplit, setSelectedSplit] = useState<SplitOption | null>(null);

  const recommended = getRecommendedSplits(profile, 6);
  const recommendedIds = new Set(recommended.map((s) => s.id));
  const sortedSplits = [
    ...recommended,
    ...SPLIT_OPTIONS.filter((s) => !recommendedIds.has(s.id)),
  ];

  function handleSelectSplit(split: SplitOption) {
    setSelectedSplit(split);
    setStep('preview');
  }

  function handleGenerate() {
    if (!selectedSplit) return;
    const generated = generateRoutine(
      selectedSplit,
      profile.mode,
      effectiveGoals,
      profile.experience_level,
      profile.home_equipment,
    );
    const now = new Date().toISOString();
    const newRoutine = {
      id: generateId(),
      name: generated.name,
      day_of_week: [] as number[],
      mode: profile.mode,
      exercises: generated.exercises,
      created_at: now,
      updated_at: now,
      source: 'algorithm' as const };
    addRoutine(newRoutine);
    router.replace(`/routine/${newRoutine.id}`);
  }

  function handleManual() {
    const now = new Date().toISOString();
    const newRoutine = {
      id: generateId(),
      name: 'Nueva rutina',
      day_of_week: [] as number[],
      mode: profile.mode,
      exercises: [],
      created_at: now,
      updated_at: now,
      source: 'manual' as const };
    addRoutine(newRoutine);
    router.replace(`/routine/${newRoutine.id}`);
  }

  useEffect(() => {
    if (manual === '1') {
      handleManual();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual]);

  // ── Paso: elegir split ────────────────────────────────────────────────────
  if (step === 'split') {
    return (
      <Screen variant="stack">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva rutina</Text>
          <TouchableOpacity onPress={handleManual} activeOpacity={0.7}>
            <Text style={styles.manualLink}>Manual</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Objetivos activos del usuario */}
          <View style={styles.goalsCard}>
            <Text style={styles.goalsTitle}>Tus objetivos actuales</Text>
            <View style={styles.goalsRow}>
              {(userGoals.length > 0 ? userGoals : ['mixed' as Goal]).map((g) => (
                <View key={g} style={styles.goalChip}>
                  <Text style={styles.goalChipText}>{GOAL_LABELS[g] ?? g}</Text>
                </View>
              ))}
            </View>
            <View style={styles.paramsBox}>
              <Text style={styles.paramsTitle}>{params.label}</Text>
              <View style={styles.paramsRow}>
                <ParamBadge label="Series" value={`${params.sets}`} />
                <ParamBadge label="Reps" value={params.reps} />
                <ParamBadge label="Descanso" value={`${params.rest_seconds}s`} />
                <ParamBadge label="RIR" value={`${params.rir}`} />
              </View>
              <Text style={styles.paramsRationale}>{params.rationale}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>¿Qué vas a entrenar hoy?</Text>
          <Text style={styles.sectionSub}>Los marcados con estrella están recomendados para tus objetivos</Text>

          {sortedSplits.map((split) => {
            const isRecommended = recommendedIds.has(split.id);
            return (
              <TouchableOpacity
                key={split.id}
                style={[styles.splitCard, isRecommended && styles.splitCardRecommended]}
                onPress={() => handleSelectSplit(split)}
                activeOpacity={0.8}
              >
                <View style={styles.splitLeft}>
                  <View style={[styles.splitIconBox, isRecommended && styles.splitIconBoxRec]}>
                    <Ionicons name="barbell-outline" size={20} color={isRecommended ? COLORS.primary : COLORS.textSecondary} />
                  </View>
                  <View style={styles.splitInfo}>
                    <View style={styles.splitTitleRow}>
                      <Text style={styles.splitLabel}>{split.label}</Text>
                      {isRecommended && (
                        <View style={styles.starBadge}>
                          <Ionicons name="star" size={11} color={COLORS.primary} />
                          <Text style={styles.starBadgeText}>Recomendado</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.splitDesc}>{split.desc}</Text>
                    {split.daysPerWeek && (
                      <View style={styles.splitDaysRow}>
                        <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
                        <Text style={styles.splitDays}>{split.daysPerWeek} días/semana</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isRecommended ? COLORS.primary : COLORS.textMuted} />
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Screen>
    );
  }

  // ── Paso: preview de la rutina generada ──────────────────────────────────
  const preview = selectedSplit
    ? generateRoutine(selectedSplit, profile.mode, effectiveGoals, profile.experience_level, profile.home_equipment)
    : null;

  return (
    <Screen variant="stack">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('split')} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedSplit?.label}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Parámetros óptimos */}
        <View style={styles.paramsCardBig}>
          <Text style={styles.paramsCardTitle}>Parámetros optimizados</Text>
          <Text style={styles.paramsCardSub}>{preview?.params.label}</Text>
          <View style={styles.paramsRow}>
            <ParamBadge label="Series" value={`${preview?.params.sets}`} big />
            <ParamBadge label="Reps" value={preview?.params.reps ?? ''} big />
            <ParamBadge label="Descanso" value={`${preview?.params.rest_seconds}s`} big />
            <ParamBadge label="RIR" value={`${preview?.params.rir}`} big />
          </View>
          <Text style={styles.rationaleText}>{preview?.params.rationale}</Text>
        </View>

        {/* Por qué esta rutina */}
        <View style={styles.whyCard}>
          <Text style={styles.whyTitle}>Por qué esta estructura</Text>
          <Text style={styles.whyText}>{preview?.rationale}</Text>
        </View>

        {/* Lista de ejercicios */}
        <Text style={styles.sectionLabel}>Ejercicios generados ({preview?.exercises.length})</Text>
        {preview?.exercises.map((re, idx) => {
          const ex = require('../../data/exercises').exercises.find((e: { id: string }) => e.id === re.exercise_id);
          if (!ex) return null;
          return (
            <View key={re.exercise_id} style={styles.exRow}>
              <View style={styles.exNum}>
                <Text style={styles.exNumText}>{idx + 1}</Text>
              </View>
              <View style={styles.exInfo}>
                <Text style={styles.exName}>{ex.name}</Text>
                <Text style={styles.exMeta}>
                  {re.target_sets} series × {re.target_reps} reps · {re.rest_seconds}s descanso
                </Text>
                {ex.exercise_type === 'compound' && (
                  <Text style={styles.compoundBadge}>Compuesto</Text>
                )}
              </View>
            </View>
          );
        })}

        <View style={{ height: 16 }} />

        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} activeOpacity={0.85}>
          <Ionicons name="flash" size={20} color="#000" />
          <Text style={styles.generateBtnText}>Crear esta rutina</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backToSplitsBtn} onPress={() => setStep('split')} activeOpacity={0.7}>
          <Text style={styles.backToSplitsText}>Elegir otro split</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </Screen>
  );
}

function ParamBadge({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={[styles.paramBadge, big && styles.paramBadgeBig]}>
      <Text style={[styles.paramValue, big && styles.paramValueBig]}>{value}</Text>
      <Text style={styles.paramLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700' },
  manualLink: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '600' },

  scroll: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingBottom: 40 },

  goalsCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: SPACING.sm },
  goalsTitle: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '600' },
  goalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  goalChip: {
    backgroundColor: COLORS.primaryDim, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.primary },
  goalChipText: { color: COLORS.primary, fontSize: FONT.sm, fontWeight: '700' },

  paramsBox: { gap: 8 },
  paramsTitle: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '700' },
  paramsRow: { flexDirection: 'row', gap: 8 },
  paramsRationale: { color: COLORS.textMuted, fontSize: 12, lineHeight: 17 },

  paramBadge: {
    flex: 1, alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md, paddingVertical: 8 },
  paramBadgeBig: { paddingVertical: 12, backgroundColor: COLORS.primaryDim },
  paramValue: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '800' },
  paramValueBig: { color: COLORS.primary, fontSize: FONT.lg },
  paramLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },

  sectionLabel: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700', marginTop: SPACING.sm },
  sectionSub: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },

  splitCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: SPACING.sm },
  splitCardRecommended: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  splitLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  splitIconBox: {
    width: 40, height: 40, borderRadius: RADIUS.md, marginTop: 2,
    backgroundColor: COLORS.cardElevated, alignItems: 'center', justifyContent: 'center' },
  splitIconBoxRec: { backgroundColor: COLORS.primaryDim },
  splitInfo: { flex: 1, gap: 4 },
  splitTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  splitLabel: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  starBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryDim, borderRadius: RADIUS.sm,
    paddingHorizontal: 7, paddingVertical: 3 },
  starBadgeText: { color: COLORS.primary, fontSize: 11, fontWeight: '500' },
  splitDesc: { color: COLORS.textMuted, fontSize: FONT.sm, lineHeight: 18 },
  splitDaysRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  splitDays: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '500' },

  paramsCardBig: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.primary, padding: SPACING.md, gap: SPACING.sm },
  paramsCardTitle: { color: COLORS.primary, fontSize: FONT.base, fontWeight: '800' },
  paramsCardSub: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '600' },
  rationaleText: { color: COLORS.textMuted, fontSize: FONT.sm, lineHeight: 19 },

  whyCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, gap: 8 },
  whyTitle: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '700' },
  whyText: { color: COLORS.textMuted, fontSize: FONT.sm, lineHeight: 19 },

  exRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm },
  exNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryDim, alignItems: 'center', justifyContent: 'center' },
  exNumText: { color: COLORS.primary, fontSize: FONT.sm, fontWeight: '800' },
  exInfo: { flex: 1, gap: 3 },
  exName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700' },
  exMeta: { color: COLORS.textMuted, fontSize: FONT.sm },
  compoundBadge: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 16 },
  generateBtnText: { color: '#000', fontSize: FONT.base, fontWeight: '800' },
  backToSplitsBtn: { alignItems: 'center', paddingVertical: 12 },
  backToSplitsText: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '600' } });
