import {
  View,
  Text,
  StyleSheet,TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Animated } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../stores/useUserStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { Equipment, Goal } from '../../types';
import { buildHomeFullBody, buildGymUpperLower } from '../../lib/defaultRoutines';

type Step = 'welcome' | 'name' | 'mode' | 'equipment' | 'goals' | 'experience' | 'days' | 'metrics' | 'done';
type IconName = keyof typeof Ionicons.glyphMap;
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

const GOAL_OPTIONS: { id: Goal; label: string; desc: string; icon: IconName }[] = [
  { id: 'fat_loss', label: 'Perder grasa', desc: 'Definición y déficit', icon: 'flame-outline' },
  { id: 'muscle_gain', label: 'Ganar músculo', desc: 'Hipertrofia', icon: 'barbell-outline' },
  { id: 'strength', label: 'Fuerza', desc: 'Levantar más peso', icon: 'fitness-outline' },
  { id: 'health', label: 'Salud general', desc: 'Bienestar y hábito', icon: 'heart-outline' },
  { id: 'endurance', label: 'Resistencia', desc: 'Aguante muscular', icon: 'pulse-outline' },
];

const EXPERIENCE_OPTIONS: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Principiante', desc: 'Menos de 6 meses entrenando' },
  { id: 'intermediate', label: 'Intermedio', desc: '6 meses a 2 años de experiencia' },
  { id: 'advanced', label: 'Avanzado', desc: 'Más de 2 años entrenando' },
];

const HOME_EQUIPMENT_LIST: { id: Equipment; label: string; icon: IconName }[] = [
  { id: 'dumbbells', label: 'Mancuernas regulables', icon: 'barbell-outline' },
  { id: 'adjustable_bench', label: 'Banco inclinable', icon: 'bed-outline' },
  { id: 'straight_barbell', label: 'Barra plana', icon: 'remove-outline' },
  { id: 'ez_bar', label: 'Barra Z (EZ)', icon: 'git-commit-outline' },
  { id: 'w_bar', label: 'Barra W', icon: 'git-commit-outline' },
  { id: 'long_bands', label: 'Bandas elásticas largas', icon: 'pulse-outline' },
  { id: 'short_bands', label: 'Mini bandas', icon: 'ellipse-outline' },
  { id: 'ab_wheel', label: 'Rueda abdominal', icon: 'disc-outline' },
  { id: 'jump_rope', label: 'Cuerda para saltar', icon: 'infinite-outline' },
  { id: 'hand_grippers', label: 'Hand grippers', icon: 'hand-left-outline' },
  { id: 'bodyweight', label: 'Peso corporal', icon: 'body-outline' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setName, setMode, setEquipment, setGoals, updateProfile, completeOnboarding } = useUserStore();
  const { addRoutine } = useRoutineStore();
  const { addBodyWeight } = useProgressStore();

  const [step, setStep] = useState<Step>('welcome');
  const [name, setNameLocal] = useState('');
  const [mode, setModeLocal] = useState<'home' | 'gym'>('gym');
  const [equipment, setEquipmentLocal] = useState<Equipment[]>([
    'dumbbells', 'adjustable_bench', 'bodyweight', 'long_bands',
  ]);
  const [goals, setGoalsLocal] = useState<Goal[]>([]);
  const [experience, setExperience] = useState<ExperienceLevel>('intermediate');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [age, setAge] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  function animateToStep(next: Step) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(next), 150);
  }

  function toggleEquipment(equip: Equipment) {
    setEquipmentLocal((prev) =>
      prev.includes(equip) ? prev.filter((e) => e !== equip) : [...prev, equip]
    );
  }

  function toggleGoal(goal: Goal) {
    setGoalsLocal((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  function handleFinish() {
    // Guardar perfil completo
    setName(name.trim() || 'Atleta');
    setMode(mode);
    setEquipment(equipment);
    setGoals(goals);

    const parsedWeight = parseFloat(weightKg);
    const parsedHeight = parseFloat(heightCm);
    const parsedAge = parseInt(age, 10);

    updateProfile({
      goals,
      experience_level: experience,
      days_per_week: daysPerWeek,
      ...(parsedWeight > 0 ? { weight_kg: parsedWeight } : {}),
      ...(parsedHeight > 0 ? { height_cm: parsedHeight } : {}),
      ...(parsedAge > 0 ? { age: parsedAge } : {}) });

    // Si dio peso corporal, lo registra como primer punto del historial
    if (parsedWeight > 0) {
      addBodyWeight({ date: new Date().toISOString().split('T')[0], weight_kg: parsedWeight });
    }

    // Generar rutinas predeterminadas
    if (mode === 'home') {
      addRoutine(buildHomeFullBody(equipment));
    } else {
      const [upper, lower] = buildGymUpperLower();
      addRoutine(upper);
      addRoutine(lower);
    }

    completeOnboarding();
    router.replace('/(tabs)');
  }

  // Orden de pasos (equipment solo aplica en modo casa)
  const steps: Step[] = mode === 'home'
    ? ['welcome', 'name', 'mode', 'equipment', 'goals', 'experience', 'days', 'metrics', 'done']
    : ['welcome', 'name', 'mode', 'goals', 'experience', 'days', 'metrics', 'done'];
  const currentIdx = steps.indexOf(step);
  const progress = (currentIdx / (steps.length - 1)) * 100;

  // Navegación relativa: siguiente/anterior según el orden actual
  function goNext() {
    const next = steps[currentIdx + 1];
    if (next) animateToStep(next);
  }
  function goPrev() {
    const prev = steps[currentIdx - 1];
    if (prev) animateToStep(prev);
  }

  return (
    <Screen variant="stack">
      {/* Barra de progreso */}
      {step !== 'welcome' && step !== 'done' && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      )}

      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

        {/* ===== BIENVENIDA ===== */}
        {step === 'welcome' && (
          <View style={styles.centered}>
            <View style={styles.logoChip}>
              <Ionicons name="barbell" size={44} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>FitProgress</Text>
            <Text style={styles.tagline}>Tu entrenamiento. Tu progreso.</Text>
            <Text style={styles.description}>
              Registra tus rutinas, sigue la progresión de tus pesos y alcanza tus metas con una app diseñada para ti.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={goNext}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Comenzar →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===== NOMBRE ===== */}
        {step === 'name' && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconChip}>
              <Ionicons name="person-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.stepTitle}>¿Cómo te llamas?</Text>
            <Text style={styles.stepSub}>
              Te llamaremos así en la app. Puedes cambiarlo después.
            </Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setNameLocal}
              placeholder="Tu nombre"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
              maxLength={30}
              returnKeyType="next"
              onSubmitEditing={goNext}
            />
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={goPrev}>
                <Text style={styles.secondaryBtnText}>← Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnSmall]}
                onPress={goNext}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Siguiente →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== MODO ===== */}
        {step === 'mode' && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconChip}>
              <Ionicons name="location-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.stepTitle}>¿Dónde entrenas principalmente?</Text>
            <Text style={styles.stepSub}>Esto filtrará los ejercicios sugeridos. Puedes cambiarlo en cualquier momento.</Text>

            <View style={styles.modeOptions}>
              <TouchableOpacity
                style={[styles.modeCard, mode === 'home' && styles.modeCardActive]}
                onPress={() => setModeLocal('home')}
                activeOpacity={0.8}
              >
                <Ionicons name="home-outline" size={34} color={mode === 'home' ? COLORS.primary : COLORS.textSecondary} style={styles.modeIcon} />
                <Text style={[styles.modeLabel, mode === 'home' && styles.modeLabelActive]}>En casa</Text>
                <Text style={styles.modeDesc}>Mancuernas, bandas,{'\n'}peso corporal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeCard, mode === 'gym' && styles.modeCardActive]}
                onPress={() => setModeLocal('gym')}
                activeOpacity={0.8}
              >
                <Ionicons name="barbell-outline" size={34} color={mode === 'gym' ? COLORS.primary : COLORS.textSecondary} style={styles.modeIcon} />
                <Text style={[styles.modeLabel, mode === 'gym' && styles.modeLabelActive]}>Gimnasio</Text>
                <Text style={styles.modeDesc}>Máquinas, barras,{'\n'}poleas y más</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={goPrev}>
                <Text style={styles.secondaryBtnText}>← Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnSmall]}
                onPress={goNext}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Siguiente →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== EQUIPAMIENTO ===== */}
        {step === 'equipment' && (
          <View style={styles.stepContainerScroll}>
            <View style={styles.stepIconChip}>
              <Ionicons name="construct-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.stepTitle}>¿Qué equipo tienes en casa?</Text>
            <Text style={styles.stepSub}>Marca lo que tienes para que los ejercicios sean compatibles.</Text>

            <ScrollView style={styles.equipList} showsVerticalScrollIndicator={false}>
              {HOME_EQUIPMENT_LIST.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.equipRow, idx < HOME_EQUIPMENT_LIST.length - 1 && styles.equipBorder]}
                  onPress={() => toggleEquipment(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={19} color={COLORS.textSecondary} style={styles.equipIcon} />
                  <Text style={styles.equipLabel}>{item.label}</Text>
                  <Switch
                    value={equipment.includes(item.id)}
                    onValueChange={() => toggleEquipment(item.id)}
                    trackColor={{ false: COLORS.border, true: COLORS.primaryDim }}
                    thumbColor={equipment.includes(item.id) ? COLORS.primary : COLORS.textMuted}
                  />
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={goPrev}>
                <Text style={styles.secondaryBtnText}>← Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnSmall]}
                onPress={goNext}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Siguiente →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== OBJETIVOS ===== */}
        {step === 'goals' && (
          <View style={styles.stepContainerScroll}>
            <View style={styles.stepIconChip}>
              <Ionicons name="flag-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.stepTitle}>¿Cuál es tu objetivo?</Text>
            <Text style={styles.stepSub}>Elige uno o varios. Con esto la app calcula tus series, reps y descansos.</Text>

            <ScrollView style={styles.optionsScroll} showsVerticalScrollIndicator={false}>
              {GOAL_OPTIONS.map((g) => {
                const selected = goals.includes(g.id);
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.selectCard, selected && styles.selectCardActive]}
                    onPress={() => toggleGoal(g.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={g.icon} size={22} color={selected ? COLORS.primary : COLORS.textSecondary} />
                    <View style={styles.selectInfo}>
                      <Text style={[styles.selectLabel, selected && styles.selectLabelActive]}>{g.label}</Text>
                      <Text style={styles.selectDesc}>{g.desc}</Text>
                    </View>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={selected ? COLORS.primary : COLORS.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 16 }} />
            </ScrollView>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={goPrev}>
                <Text style={styles.secondaryBtnText}>← Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnSmall, goals.length === 0 && styles.primaryBtnDisabled]}
                onPress={goNext}
                disabled={goals.length === 0}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Siguiente →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== EXPERIENCIA ===== */}
        {step === 'experience' && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconChip}>
              <Ionicons name="trending-up-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.stepTitle}>¿Cuánta experiencia tienes?</Text>
            <Text style={styles.stepSub}>Ajusta el volumen y la velocidad de progresión a tu nivel.</Text>

            <View style={styles.expList}>
              {EXPERIENCE_OPTIONS.map((e) => {
                const selected = experience === e.id;
                return (
                  <TouchableOpacity
                    key={e.id}
                    style={[styles.selectCard, selected && styles.selectCardActive]}
                    onPress={() => setExperience(e.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.selectInfo}>
                      <Text style={[styles.selectLabel, selected && styles.selectLabelActive]}>{e.label}</Text>
                      <Text style={styles.selectDesc}>{e.desc}</Text>
                    </View>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={selected ? COLORS.primary : COLORS.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={goPrev}>
                <Text style={styles.secondaryBtnText}>← Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, styles.primaryBtnSmall]} onPress={goNext} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>Siguiente →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== DÍAS POR SEMANA ===== */}
        {step === 'days' && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconChip}>
              <Ionicons name="calendar-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.stepTitle}>¿Cuántos días entrenas por semana?</Text>
            <Text style={styles.stepSub}>Lo usamos como meta semanal y para sugerir el tipo de rutina.</Text>

            <View style={styles.daysGrid}>
              {[2, 3, 4, 5, 6].map((d) => {
                const selected = daysPerWeek === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayBig, selected && styles.dayBigActive]}
                    onPress={() => setDaysPerWeek(d)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dayBigNum, selected && styles.dayBigNumActive]}>{d}</Text>
                    <Text style={[styles.dayBigLabel, selected && styles.dayBigLabelActive]}>días</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={goPrev}>
                <Text style={styles.secondaryBtnText}>← Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, styles.primaryBtnSmall]} onPress={goNext} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>Siguiente →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== MÉTRICAS CORPORALES ===== */}
        {step === 'metrics' && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconChip}>
              <Ionicons name="body-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.stepTitle}>Tus medidas (opcional)</Text>
            <Text style={styles.stepSub}>
              El peso nos deja registrar récords de calistenia y tu progreso corporal. Puedes saltarlo.
            </Text>

            <View style={styles.metricsList}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Peso corporal</Text>
                <View style={styles.metricInputWrap}>
                  <TextInput
                    style={styles.metricInput}
                    value={weightKg}
                    onChangeText={setWeightKg}
                    placeholder="70"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                  <Text style={styles.metricUnit}>kg</Text>
                </View>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Altura</Text>
                <View style={styles.metricInputWrap}>
                  <TextInput
                    style={styles.metricInput}
                    value={heightCm}
                    onChangeText={setHeightCm}
                    placeholder="175"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Text style={styles.metricUnit}>cm</Text>
                </View>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Edad</Text>
                <View style={styles.metricInputWrap}>
                  <TextInput
                    style={styles.metricInput}
                    value={age}
                    onChangeText={setAge}
                    placeholder="28"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.metricUnit}>años</Text>
                </View>
              </View>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={goPrev}>
                <Text style={styles.secondaryBtnText}>← Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, styles.primaryBtnSmall]} onPress={goNext} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>Siguiente →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== LISTO ===== */}
        {step === 'done' && (
          <View style={styles.centered}>
            <View style={styles.logoChip}>
              <Ionicons name="checkmark-circle" size={44} color={COLORS.primary} />
            </View>
            <Text style={styles.stepTitle}>
              ¡Todo listo{name.trim() ? `, ${name.trim()}` : ''}!
            </Text>
            <Text style={styles.description}>
              Creamos {mode === 'home' ? 'una rutina Full Body para casa' : 'dos rutinas Upper/Lower para gimnasio'} como punto de partida. Puedes editarlas cuando quieras.
            </Text>
            <View style={styles.summaryCard}>
              <SummaryRow icon={mode === 'home' ? 'home-outline' : 'barbell-outline'} label="Modo" value={mode === 'home' ? 'Casa' : 'Gimnasio'} />
              <SummaryRow icon="flag-outline" label="Objetivos" value={`${goals.length}`} />
              <SummaryRow icon="trending-up-outline" label="Nivel" value={EXPERIENCE_OPTIONS.find((e) => e.id === experience)?.label ?? ''} />
              <SummaryRow icon="calendar-outline" label="Días/semana" value={`${daysPerWeek}`} />
              <SummaryRow icon="list-outline" label="Rutinas creadas" value={mode === 'home' ? '1' : '2'} />
            </View>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Empezar a entrenar →</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </Screen>
  );
}

function SummaryRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon} size={18} color={COLORS.textSecondary} style={styles.summaryIcon} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.lg },

  progressBar: {
    height: 3,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: COLORS.primary, borderRadius: 2 },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingBottom: 40 },
  logoChip: {
    width: 88, height: 88, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryDim, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  appName: { color: COLORS.primary, fontSize: 40, fontWeight: '600', letterSpacing: -1 },
  tagline: { color: COLORS.textSecondary, fontSize: FONT.lg, fontWeight: '600' },
  description: {
    color: COLORS.textMuted,
    fontSize: FONT.base,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.lg },

  stepContainer: { flex: 1, paddingTop: SPACING.xl, gap: SPACING.md },
  stepContainerScroll: { flex: 1, paddingTop: SPACING.xl, gap: SPACING.sm },
  stepIconChip: {
    width: 64, height: 64, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepTitle: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '600' },
  stepSub: { color: COLORS.textMuted, fontSize: FONT.base, lineHeight: 22 },

  nameInput: {
    height: 56,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    fontSize: FONT.lg,
    fontWeight: '600',
    marginTop: SPACING.sm },

  modeOptions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  modeCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 6 },
  modeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  modeIcon: { marginBottom: 4 },
  modeLabel: { color: COLORS.textSecondary, fontSize: FONT.base, fontWeight: '700' },
  modeLabelActive: { color: COLORS.primary },
  modeDesc: { color: COLORS.textMuted, fontSize: FONT.sm, textAlign: 'center', lineHeight: 18 },

  primaryBtnDisabled: { opacity: 0.4 },

  optionsScroll: { flex: 1, marginTop: SPACING.sm },
  expList: { gap: SPACING.sm, marginTop: SPACING.md },
  selectCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm },
  selectCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  selectInfo: { flex: 1 },
  selectLabel: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  selectLabelActive: { color: COLORS.primary },
  selectDesc: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md, justifyContent: 'center' },
  dayBig: {
    width: 88, height: 88, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center' },
  dayBigActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  dayBigNum: { color: COLORS.textSecondary, fontSize: 32, fontWeight: '600', fontVariant: ['tabular-nums'] },
  dayBigNumActive: { color: COLORS.primary },
  dayBigLabel: { color: COLORS.textMuted, fontSize: FONT.sm },
  dayBigLabelActive: { color: COLORS.primary },

  metricsList: { gap: SPACING.sm, marginTop: SPACING.md },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  metricLabel: {
    flex: 1,
    flexShrink: 1,
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    fontWeight: '500',
  },
  metricInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  metricInput: {
    width: 56,
    height: 40,
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontSize: FONT.lg,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 0,
  },
  metricUnit: { color: COLORS.textMuted, fontSize: FONT.sm, flexShrink: 0 },

  equipList: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg },
  equipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: SPACING.sm },
  equipBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  equipIcon: { width: 28, alignItems: 'center' },
  equipLabel: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.lg,
    marginTop: SPACING.sm },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    alignSelf: 'stretch' },
  primaryBtnSmall: { alignSelf: 'auto', paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  primaryBtnText: { color: COLORS.accentText, fontSize: FONT.base, fontWeight: '600' },
  secondaryBtn: { paddingVertical: 14, paddingHorizontal: SPACING.sm },
  secondaryBtnText: { color: COLORS.textMuted, fontSize: FONT.base, fontWeight: '600' },

  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    overflow: 'hidden',
    marginBottom: SPACING.sm },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm },
  summaryIcon: { width: 28 },
  summaryLabel: { flex: 1, color: COLORS.textSecondary, fontSize: FONT.base },
  summaryValue: { color: COLORS.primary, fontSize: FONT.base, fontWeight: '700' } });
