import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../stores/useUserStore';
import { COLORS, SPACING, FONT, RADIUS } from '../constants/theme';
import { Goal, Equipment } from '../types';

// ─── Datos de configuración ───────────────────────────────────────────────────

type IconName = keyof typeof Ionicons.glyphMap;

const GOALS: { id: Goal; label: string; icon: IconName; desc: string }[] = [
  { id: 'fat_loss',     label: 'Perder grasa',      icon: 'flame-outline',    desc: 'Reducir grasa corporal manteniendo músculo' },
  { id: 'muscle_gain',  label: 'Ganar músculo',      icon: 'barbell-outline',  desc: 'Aumentar masa muscular e hipertrofia' },
  { id: 'strength',     label: 'Ganar fuerza',       icon: 'fitness-outline',  desc: 'Levantar más peso en los movimientos clave' },
  { id: 'endurance',    label: 'Mejorar resistencia',icon: 'heart-outline',    desc: 'Aguantar más tiempo y cansarte menos' },
  { id: 'health',       label: 'Salud general',      icon: 'leaf-outline',     desc: 'Moverse mejor, sentirse bien, longevidad' },
  { id: 'mixed',        label: 'Todo un poco',       icon: 'flash-outline',    desc: 'Balance entre fuerza, músculo y salud' },
];

const LEVELS: { id: 'beginner' | 'intermediate' | 'advanced'; label: string; desc: string; icon: IconName }[] = [
  { id: 'beginner',     label: 'Principiante', icon: 'leaf-outline',  desc: 'Menos de 6 meses entrenando' },
  { id: 'intermediate', label: 'Intermedio',   icon: 'flame-outline', desc: '6 meses a 2 años de experiencia' },
  { id: 'advanced',     label: 'Avanzado',     icon: 'flash-outline', desc: 'Más de 2 años entrenando consistentemente' },
];

const EQUIPMENT_OPTIONS: { id: Equipment; label: string; icon: IconName }[] = [
  { id: 'dumbbells',       label: 'Mancuernas',       icon: 'barbell-outline' },
  { id: 'adjustable_bench',label: 'Banco',            icon: 'bed-outline' },
  { id: 'straight_barbell',label: 'Barra plana',      icon: 'remove-outline' },
  { id: 'ez_bar',          label: 'Barra Z',          icon: 'git-commit-outline' },
  { id: 'long_bands',      label: 'Bandas largas',    icon: 'pulse-outline' },
  { id: 'short_bands',     label: 'Mini bandas',      icon: 'ellipse-outline' },
  { id: 'ab_wheel',        label: 'Rueda abdominal',  icon: 'disc-outline' },
  { id: 'jump_rope',       label: 'Cuerda para saltar', icon: 'infinite-outline' },
  { id: 'pull_up_bar',     label: 'Barra dominadas',  icon: 'reorder-two-outline' },
  { id: 'bodyweight',      label: 'Solo peso corporal', icon: 'body-outline' },
  { id: 'cable',           label: 'Polea / Cable',    icon: 'link-outline' },
  { id: 'machine',         label: 'Máquinas',         icon: 'settings-outline' },
  { id: 'barbell',         label: 'Barra + Rack',     icon: 'construct-outline' },
  { id: 'leg_press',       label: 'Prensa',           icon: 'walk-outline' },
];

const DAYS = [2, 3, 4, 5, 6];

// ─── Componente sección ───────────────────────────────────────────────────────

function SectionTitle({ icon, title, subtitle }: { icon: IconName; title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconBox}>
        <Ionicons name={icon} size={17} color={COLORS.primary} />
      </View>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, setGoals } = useUserStore();

  const [name, setName] = useState(profile.name);
  const [mode, setMode] = useState<'home' | 'gym'>(profile.mode);
  const [goals, setGoalsLocal] = useState<Goal[]>(profile.goals ?? ['mixed']);
  const [level, setLevel] = useState(profile.experience_level);
  const [equipment, setEquipment] = useState<Equipment[]>(profile.home_equipment);
  const [days, setDays] = useState(profile.days_per_week ?? 4);
  const [weight, setWeight] = useState(profile.weight_kg?.toString() ?? '');
  const [height, setHeight] = useState(profile.height_cm?.toString() ?? '');
  const [age, setAge] = useState(profile.age?.toString() ?? '');
  const [situation, setSituation] = useState(profile.current_situation ?? '');

  function toggleGoal(id: Goal) {
    setGoalsLocal((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  function toggleEquipment(id: Equipment) {
    setEquipment((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Falta tu nombre', 'Agrega tu nombre para continuar.');
      return;
    }
    if (goals.length === 0) {
      Alert.alert('Selecciona un objetivo', 'Elige al menos un objetivo.');
      return;
    }
    updateProfile({
      name: name.trim(),
      mode,
      experience_level: level,
      goals,
      home_equipment: equipment,
      days_per_week: days,
      weight_kg: weight ? parseFloat(weight) : undefined,
      height_cm: height ? parseFloat(height) : undefined,
      age: age ? parseInt(age) : undefined,
      current_situation: situation.trim() || undefined,
    });
    setGoals(goals);
    Alert.alert('Guardado', 'Tu perfil fue actualizado. La app adaptará tus rutinas y ejercicios.');
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil y Objetivos</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Nombre ── */}
        <SectionTitle icon="person-outline" title="¿Cómo te llamas?" />
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          placeholderTextColor={COLORS.textMuted}
        />

        {/* ── Dónde entrenas ── */}
        <SectionTitle icon="location-outline" title="¿Dónde entrenas?" subtitle="Filtra los ejercicios según tu lugar de entrenamiento" />
        <View style={styles.modeRow}>
          {(['home', 'gym'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeCard, mode === m && styles.modeCardActive]}
              onPress={() => setMode(m)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={m === 'home' ? 'home-outline' : 'barbell-outline'}
                size={26}
                color={mode === m ? COLORS.primary : COLORS.textSecondary}
                style={styles.modeEmoji}
              />
              <Text style={[styles.modeLabel, mode === m && styles.modeLabelActive]}>
                {m === 'home' ? 'Casa' : 'Gimnasio'}
              </Text>
              <Text style={styles.modeDesc}>
                {m === 'home' ? 'Entreno en mi casa con mi equipamiento' : 'Tengo acceso a un gym completo'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Objetivos ── */}
        <SectionTitle icon="locate-outline" title="¿Cuáles son tus objetivos?" subtitle="Puedes seleccionar varios" />
        {GOALS.map((g) => {
          const active = goals.includes(g.id);
          return (
            <TouchableOpacity
              key={g.id}
              style={[styles.goalCard, active && styles.goalCardActive]}
              onPress={() => toggleGoal(g.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.goalIconBox, active && styles.goalIconBoxActive]}>
                <Ionicons name={g.icon} size={20} color={active ? COLORS.primary : COLORS.textSecondary} />
              </View>
              <View style={styles.goalText}>
                <Text style={[styles.goalLabel, active && styles.goalLabelActive]}>{g.label}</Text>
                <Text style={styles.goalDesc}>{g.desc}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
            </TouchableOpacity>
          );
        })}

        {/* ── Nivel ── */}
        <SectionTitle icon="stats-chart-outline" title="¿Cuál es tu nivel actual?" />
        {LEVELS.map((l) => (
          <TouchableOpacity
            key={l.id}
            style={[styles.levelCard, level === l.id && styles.levelCardActive]}
            onPress={() => setLevel(l.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.goalIconBox, level === l.id && styles.goalIconBoxActive]}>
              <Ionicons name={l.icon} size={20} color={level === l.id ? COLORS.primary : COLORS.textSecondary} />
            </View>
            <View style={styles.goalText}>
              <Text style={[styles.goalLabel, level === l.id && styles.goalLabelActive]}>{l.label}</Text>
              <Text style={styles.goalDesc}>{l.desc}</Text>
            </View>
            {level === l.id && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
          </TouchableOpacity>
        ))}

        {/* ── Días por semana ── */}
        <SectionTitle icon="calendar-outline" title="¿Cuántos días por semana entrenas?" />
        <View style={styles.daysRow}>
          {DAYS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayBtn, days === d && styles.dayBtnActive]}
              onPress={() => setDays(d)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayNum, days === d && styles.dayNumActive]}>{d}</Text>
              <Text style={[styles.dayLabel, days === d && styles.dayLabelActive]}>días</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Medidas corporales ── */}
        <SectionTitle icon="resize-outline" title="Datos físicos" subtitle="Opcional — ayuda a personalizar mejor las sugerencias" />
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Edad</Text>
            <TextInput
              style={styles.metricInput}
              value={age}
              onChangeText={setAge}
              placeholder="años"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Peso</Text>
            <TextInput
              style={styles.metricInput}
              value={weight}
              onChangeText={setWeight}
              placeholder="kg"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Altura</Text>
            <TextInput
              style={styles.metricInput}
              value={height}
              onChangeText={setHeight}
              placeholder="cm"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* ── Situación actual ── */}
        <SectionTitle icon="create-outline" title="¿Cómo estás ahora?" subtitle="Describe tu situación actual, lesiones, limitaciones o metas específicas" />
        <TextInput
          style={styles.textArea}
          value={situation}
          onChangeText={setSituation}
          placeholder="Ej: Tengo dolor de rodilla, quiero bajar 5kg antes de diciembre, llevo 2 meses sin entrenar..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={4}
        />

        {/* ── Equipamiento en casa ── */}
        {mode === 'home' && (
          <>
            <SectionTitle icon="construct-outline" title="Equipamiento en casa" subtitle="Marca todo lo que tienes disponible" />
            <View style={styles.equipGrid}>
              {EQUIPMENT_OPTIONS.map((eq) => {
                const active = equipment.includes(eq.id);
                return (
                  <TouchableOpacity
                    key={eq.id}
                    style={[styles.equipChip, active && styles.equipChipActive]}
                    onPress={() => toggleEquipment(eq.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={eq.icon} size={15} color={active ? COLORS.primary : COLORS.textMuted} />
                    <Text style={[styles.equipLabel, active && styles.equipLabelActive]}>{eq.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Botón guardar abajo */}
        <TouchableOpacity style={styles.saveButtonBig} onPress={handleSave} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle" size={22} color={COLORS.accentText} />
          <Text style={styles.saveButtonBigText}>Guardar perfil</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 40, gap: SPACING.md, paddingTop: SPACING.sm },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  saveBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
  },
  saveBtnText: { color: COLORS.accentText, fontSize: FONT.sm, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: SPACING.sm },
  sectionIconBox: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  sectionSubtitle: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 1 },

  input: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 50,
    color: COLORS.textPrimary, fontSize: FONT.base,
  },

  modeRow: { flexDirection: 'row', gap: SPACING.sm },
  modeCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, alignItems: 'center', gap: 4,
  },
  modeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  modeEmoji: { marginBottom: 2 },
  modeLabel: { color: COLORS.textSecondary, fontSize: FONT.base, fontWeight: '600' },
  modeLabelActive: { color: COLORS.primary },
  modeDesc: { color: COLORS.textMuted, fontSize: FONT.sm, textAlign: 'center', lineHeight: 16 },

  goalCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
  },
  goalCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  goalIconBox: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardElevated, alignItems: 'center', justifyContent: 'center',
  },
  goalIconBoxActive: { backgroundColor: COLORS.bg },
  goalText: { flex: 1 },
  goalLabel: { color: COLORS.textSecondary, fontSize: FONT.base, fontWeight: '600' },
  goalLabelActive: { color: COLORS.primary },
  goalDesc: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },

  levelCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
  },
  levelCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },

  daysRow: { flexDirection: 'row', gap: 8 },
  dayBtn: {
    flex: 1, alignItems: 'center', paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  dayBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  dayNum: { color: COLORS.textSecondary, fontSize: FONT.xl, fontWeight: '600', fontVariant: ['tabular-nums'] },
  dayNumActive: { color: COLORS.primary },
  dayLabel: { color: COLORS.textMuted, fontSize: 10 },
  dayLabelActive: { color: COLORS.primary },

  metricsRow: { flexDirection: 'row', gap: SPACING.sm },
  metricBox: { flex: 1 },
  metricLabel: { color: COLORS.textMuted, fontSize: FONT.sm, marginBottom: 4, fontWeight: '600' },
  metricInput: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm, height: 46,
    color: COLORS.textPrimary, fontSize: FONT.base, textAlign: 'center',
  },

  textArea: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    color: COLORS.textPrimary, fontSize: FONT.base,
    minHeight: 100, textAlignVertical: 'top',
  },

  equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  equipChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: COLORS.card, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  equipChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  equipLabel: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '500' },
  equipLabelActive: { color: COLORS.primary },

  saveButtonBig: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 16, marginTop: SPACING.sm,
  },
  saveButtonBigText: { color: COLORS.accentText, fontSize: FONT.base, fontWeight: '600' },
});
