import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getExerciseById } from '../../data/exercises';
import { EXERCISE_IMAGES } from '../../data/exerciseImages';
import { MuscleMap } from '../../components/ui/MuscleMap';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';

// ─── Mapas de etiquetas ───────────────────────────────────────────────────────

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio', full_body: 'Cuerpo completo',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  dumbbells: 'Mancuernas', adjustable_bench: 'Banco', straight_barbell: 'Barra plana',
  ez_bar: 'Barra Z', w_bar: 'Barra W', long_bands: 'Bandas largas',
  short_bands: 'Mini bandas', ab_wheel: 'Rueda abdominal', jump_rope: 'Cuerda',
  hand_grippers: 'Hand grippers', bodyweight: 'Peso corporal', barbell: 'Barra',
  cable: 'Polea', machine: 'Máquina', pull_up_bar: 'Barra dominadas',
  dip_bars: 'Paralelas', rack: 'Rack', leg_press: 'Prensa', smith_machine: 'Smith',
};

const TYPE_LABELS: Record<string, string> = {
  compound: 'Compuesto', isolation: 'Aislamiento', cardio: 'Cardio', mobility: 'Movilidad',
};

const TYPE_DESC: Record<string, string> = {
  compound: 'Activa múltiples grupos musculares y articulaciones. Ideal para fuerza e hipertrofia global.',
  isolation: 'Focaliza un músculo específico. Útil para corregir desequilibrios o dar volumen adicional.',
  cardio: 'Trabaja el sistema cardiovascular y quema calorías. Mejora la resistencia.',
  mobility: 'Mejora el rango de movimiento y la flexibilidad. Clave para la longevidad y prevención de lesiones.',
};

const DIFFICULTY_COLORS = ['', COLORS.success, '#84CC16', COLORS.warning, '#F97316', COLORS.danger];
const DIFFICULTY_LABELS = ['', 'Principiante', 'Básico', 'Intermedio', 'Avanzado', 'Experto'];
const DIFFICULTY_DESC = [
  '',
  'Ideal si estás empezando. Requiere poco o ningún equipo y la técnica es sencilla.',
  'Algo de experiencia o coordinación básica. Buen punto de partida para la mayoría.',
  'Requiere dominio de los patrones básicos de movimiento y algo de fuerza de base.',
  'Exige técnica sólida, fuerza desarrollada y buena propiocepción.',
  'Movimiento técnico o con carga muy alta. Solo cuando tengas una base muy sólida.',
];

const SCIENCE_TIPS: Record<string, { title: string; tip: string }[]> = {
  compound: [
    {
      title: 'Rango de movimiento completo',
      tip: 'Bajar hasta el punto de mayor elongación muscular produce más hipertrofia que rangos parciales. No te quedes a medias.',
    },
    {
      title: 'Tensión intencional',
      tip: 'Aprieta el músculo objetivo en toda la fase concéntrica (subida). No solo "levantar el peso" — contraer el músculo.',
    },
    {
      title: 'Fase excéntrica controlada',
      tip: 'Bajar en 2-3 segundos produce más daño muscular productivo que dejar caer. Más hipertrofia con el mismo peso.',
    },
  ],
  isolation: [
    {
      title: 'Conexión mente-músculo',
      tip: 'Visualiza y siente el músculo que trabajas. Los estudios muestran que pensar activamente en el músculo aumenta su activación hasta un 20%.',
    },
    {
      title: 'No uses impulso',
      tip: 'Si necesitas balancearte para levantar, el peso es demasiado. Reduce carga y mantén el control total en todo momento.',
    },
    {
      title: 'Pausa en pico de contracción',
      tip: 'Aguanta 1 segundo en la posición de máxima contracción. Aumenta la tensión muscular y la bomba de sangre al músculo.',
    },
  ],
  cardio: [
    {
      title: 'Calentamiento progresivo',
      tip: 'Los primeros 2-3 minutos a intensidad baja preparan el sistema cardiovascular y reducen el riesgo de lesión.',
    },
    {
      title: 'Respiración rítmica',
      tip: 'Inhala por la nariz, exhala por la boca. Un ritmo constante retrasa la fatiga y mejora la oxigenación muscular.',
    },
  ],
  mobility: [
    {
      title: 'No fuerces el dolor',
      tip: 'Siente el estiramiento, no el dolor. Si duele, retrocede un poco. La movilidad mejora con consistencia, no con fuerza bruta.',
    },
    {
      title: 'Mantén la tensión activa',
      tip: 'En lugar de relajarte completamente, mantén tensión suave en los músculos antagonistas. Mejora más el rango activo.',
    },
  ],
};

// ─── Sección colapsable ───────────────────────────────────────────────────────

function SectionBlock({
  title,
  icon,
  children,
  accentColor,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  accentColor?: string;
}) {
  const [open, setOpen] = useState(true);
  const tint = accentColor ?? COLORS.primary;

  return (
    <View style={sectionStyles.container}>
      <TouchableOpacity style={sectionStyles.header} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
        <View style={[sectionStyles.iconBox, { backgroundColor: tint + '20' }]}>
          <Ionicons name={icon} size={17} color={tint} />
        </View>
        <Text style={sectionStyles.title}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
      {open && <View style={sectionStyles.body}>{children}</View>}
    </View>
  );
}

function ErrorRow({ text }: { text: string }) {
  return (
    <View style={styles.errorRow}>
      <Text style={styles.errorBullet}>✗</Text>
      <Text style={styles.errorText}>{text}</Text>
    </View>
  );
}

// ─── Pantalla de detalle ──────────────────────────────────────────────────────

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const exercise = getExerciseById(id);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.notFound}>Ejercicio no encontrado</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const diffColor = DIFFICULTY_COLORS[exercise.difficulty];
  const modeText = exercise.mode === 'home' ? 'Casa' : exercise.mode === 'gym' ? 'Gym' : 'Casa y Gym';
  const progressionFrom = exercise.progression_from ? getExerciseById(exercise.progression_from) : null;
  const progressionTo = exercise.progression_to ? getExerciseById(exercise.progression_to) : null;
  const scienceTips = SCIENCE_TIPS[exercise.exercise_type] ?? [];

  const steps = exercise.instructions
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{exercise.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={[styles.hero, { borderColor: diffColor + '40' }]}>
          <View style={styles.heroLeft}>
            <Text style={[styles.musclePrimary, { color: diffColor }]}>
              {MUSCLE_LABELS[exercise.muscle_group] ?? exercise.muscle_group}
            </Text>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <View style={styles.heroBadges}>
              <View style={[styles.badge, { backgroundColor: diffColor + '20', borderColor: diffColor + '40' }]}>
                <Text style={[styles.badgeText, { color: diffColor }]}>{modeText}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{TYPE_LABELS[exercise.exercise_type]}</Text>
              </View>
            </View>
          </View>

          <View style={styles.diffBox}>
            <View style={styles.diffDots}>
              {Array.from({ length: 5 }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.diffDot,
                    { backgroundColor: i < exercise.difficulty ? diffColor : COLORS.border },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.diffLabel, { color: diffColor }]}>
              {DIFFICULTY_LABELS[exercise.difficulty]}
            </Text>
          </View>
        </View>

        {/* GIF animado o imagen estática del ejercicio */}
        {(exercise.gifSource || EXERCISE_IMAGES[exercise.id]) && (
          <View style={styles.imageCard}>
            <Image
              source={exercise.gifSource ?? { uri: EXERCISE_IMAGES[exercise.id] }}
              style={styles.exerciseImage}
              contentFit="cover"
              autoplay
            />
          </View>
        )}

        {/* Mapa muscular */}
        <View style={styles.muscleMapCard}>
          <Text style={styles.muscleMapTitle}>Músculos trabajados</Text>
          <MuscleMap
            primary={exercise.muscle_group}
            secondary={exercise.secondary_muscles}
            primaryLabel={MUSCLE_LABELS[exercise.muscle_group] ?? exercise.muscle_group}
            secondaryLabel={
              exercise.secondary_muscles.length > 0
                ? exercise.secondary_muscles.map((m) => MUSCLE_LABELS[m] ?? m).join(', ')
                : undefined
            }
          />
        </View>

        {/* Dificultad explicada */}
        <View style={[styles.diffDesc, { borderLeftColor: diffColor }]}>
          <Text style={styles.diffDescText}>{DIFFICULTY_DESC[exercise.difficulty]}</Text>
        </View>

        {/* Tipo de ejercicio */}
        <View style={styles.typeDesc}>
          <Text style={styles.typeDescText}>{TYPE_DESC[exercise.exercise_type]}</Text>
        </View>

        {/* Equipamiento */}
        {exercise.equipment_required.length > 0 && (
          <View style={styles.equipRow}>
            <Text style={styles.equipTitle}>Equipamiento:</Text>
            <View style={styles.equipChips}>
              {exercise.equipment_required.map((eq) => (
                <View key={eq} style={styles.equipChip}>
                  <Text style={styles.equipChipText}>{EQUIPMENT_LABELS[eq] ?? eq}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Músculos secundarios */}
        {exercise.secondary_muscles.length > 0 && (
          <View style={styles.equipRow}>
            <Text style={styles.equipTitle}>También trabaja:</Text>
            <View style={styles.equipChips}>
              {exercise.secondary_muscles.map((m) => (
                <View key={m} style={[styles.equipChip, styles.muscleChip]}>
                  <Text style={[styles.equipChipText, styles.muscleChipText]}>
                    {MUSCLE_LABELS[m] ?? m}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {/* Instrucciones paso a paso */}
        <SectionBlock title="Cómo hacerlo" icon="list-outline">
          {steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}{step.endsWith('.') ? '' : '.'}</Text>
            </View>
          ))}
        </SectionBlock>

        {/* Tips del ejercicio */}
        {exercise.tips.length > 0 && (
          <SectionBlock title="Tips clave" icon="bulb-outline" accentColor={COLORS.warning}>
            {exercise.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={styles.tipBullet}>▸</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </SectionBlock>
        )}

        {/* Tips basados en ciencia */}
        {scienceTips.length > 0 && (
          <SectionBlock title="Maximiza cada repetición" icon="flask-outline" accentColor={COLORS.primary}>
            {scienceTips.map((item, i) => (
              <View key={i} style={styles.scienceCard}>
                <Text style={styles.scienceTitle}>{item.title}</Text>
                <Text style={styles.scienceTip}>{item.tip}</Text>
              </View>
            ))}
          </SectionBlock>
        )}

        {/* Cadena de progresión */}
        {(progressionFrom || progressionTo) && (
          <SectionBlock title="Progresión" icon="trending-up-outline" accentColor={COLORS.success}>
            <Text style={styles.progressionInfo}>
              Domina cada variante antes de avanzar. La progresión correcta evita lesiones y construye una base sólida.
            </Text>
            <View style={styles.progressionChain}>
              {progressionFrom && (
                <TouchableOpacity
                  style={styles.progressionCard}
                  onPress={() => router.replace(`/exercise/${progressionFrom.id}` as never)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.progressionDir}>← Más fácil</Text>
                  <Text style={styles.progressionName} numberOfLines={2}>{progressionFrom.name}</Text>
                  <View style={styles.progDiffRow}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <View key={i} style={[styles.progDot, { backgroundColor: i < progressionFrom.difficulty ? COLORS.success : COLORS.border }]} />
                    ))}
                  </View>
                </TouchableOpacity>
              )}
              <View style={styles.progressionCurrent}>
                <Text style={styles.progressionCurrentLabel}>ACTUAL</Text>
                <Text style={styles.progressionCurrentName} numberOfLines={2}>{exercise.name}</Text>
              </View>
              {progressionTo && (
                <TouchableOpacity
                  style={styles.progressionCard}
                  onPress={() => router.replace(`/exercise/${progressionTo.id}` as never)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.progressionDir, { textAlign: 'right' }]}>Más difícil →</Text>
                  <Text style={styles.progressionName} numberOfLines={2}>{progressionTo.name}</Text>
                  <View style={styles.progDiffRow}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <View key={i} style={[styles.progDot, { backgroundColor: i < progressionTo.difficulty ? COLORS.danger : COLORS.border }]} />
                    ))}
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </SectionBlock>
        )}

        {/* Errores frecuentes */}
        <SectionBlock title="Errores frecuentes a evitar" icon="warning-outline" accentColor={COLORS.danger}>
          {exercise.exercise_type === 'compound' && (
            <>
              <ErrorRow text="Usar demasiado peso sacrificando la técnica. Empieza más ligero y aumenta gradualmente." />
              <ErrorRow text="Rango de movimiento incompleto. La mitad del rango = la mitad del beneficio." />
              <ErrorRow text="Aguantar la respiración. Exhala en el esfuerzo, inhala en la recuperación." />
            </>
          )}
          {exercise.exercise_type === 'isolation' && (
            <>
              <ErrorRow text="Usar impulso o momentum. El ejercicio de aislamiento requiere control total." />
              <ErrorRow text="Ignorar la fase negativa (excéntrica). Bajar lento es donde ocurre más crecimiento muscular." />
              <ErrorRow text="No sentir el músculo objetivo. Si no lo sientes, reduce el peso." />
            </>
          )}
          {exercise.exercise_type === 'cardio' && (
            <>
              <ErrorRow text="Arrancar muy fuerte. Los primeros minutos deben ser suaves para preparar el corazón." />
              <ErrorRow text="Intensidad siempre igual. Varía entre días fáciles y difíciles para seguir progresando." />
            </>
          )}
          {exercise.exercise_type === 'mobility' && (
            <>
              <ErrorRow text="Forzar el rango de movimiento con dolor. El estiramiento debe sentirse intenso, nunca doloroso." />
              <ErrorRow text="Mantener la respiración. Exhalar durante el estiramiento ayuda a relajar el músculo." />
            </>
          )}
        </SectionBlock>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  iconText: { fontSize: 16 },
  title: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700' },
  body: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, gap: 10 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 40, gap: SPACING.sm, paddingTop: SPACING.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700' },

  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  heroLeft: { flex: 1, gap: 4 },
  musclePrimary: { fontSize: FONT.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  exerciseName: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800', lineHeight: 28 },
  heroBadges: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '600' },

  diffBox: { alignItems: 'center', gap: 4 },
  diffDots: { flexDirection: 'row', gap: 3 },
  diffDot: { width: 10, height: 10, borderRadius: 5 },
  diffLabel: { fontSize: FONT.sm, fontWeight: '700', textAlign: 'center' },

  diffDesc: {
    borderLeftWidth: 3,
    paddingLeft: SPACING.sm,
    paddingVertical: 4,
  },
  diffDescText: { color: COLORS.textMuted, fontSize: FONT.sm, lineHeight: 18 },

  typeDesc: { paddingVertical: 4 },
  typeDescText: { color: COLORS.textMuted, fontSize: FONT.sm, lineHeight: 18 },

  equipRow: { gap: 6 },
  equipTitle: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '600' },
  equipChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  equipChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  equipChipText: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '600' },
  muscleChip: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primary + '40' },
  muscleChipText: { color: COLORS.primary },

  divider: { height: 1, backgroundColor: COLORS.border },

  stepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumText: { color: '#000', fontSize: FONT.sm, fontWeight: '800' },
  stepText: { flex: 1, color: COLORS.textSecondary, fontSize: FONT.base, lineHeight: 22 },

  tipRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tipBullet: { color: COLORS.warning, fontSize: FONT.base, fontWeight: '800', marginTop: 2 },
  tipText: { flex: 1, color: COLORS.textSecondary, fontSize: FONT.base, lineHeight: 22 },

  scienceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  scienceTitle: { color: COLORS.primary, fontSize: FONT.base, fontWeight: '700' },
  scienceTip: { color: COLORS.textSecondary, fontSize: FONT.base, lineHeight: 22 },

  progressionInfo: { color: COLORS.textMuted, fontSize: FONT.sm, lineHeight: 18 },
  progressionChain: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  progressionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  progressionDir: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  progressionName: { color: COLORS.textPrimary, fontSize: FONT.sm, fontWeight: '700', lineHeight: 17 },
  progDiffRow: { flexDirection: 'row', gap: 3, marginTop: 2 },
  progDot: { width: 6, height: 6, borderRadius: 3 },
  progressionCurrent: {
    flex: 1,
    backgroundColor: COLORS.primaryDim,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  progressionCurrentLabel: { color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  progressionCurrentName: { color: COLORS.textPrimary, fontSize: FONT.sm, fontWeight: '700', textAlign: 'center', lineHeight: 17 },

  errorRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  errorBullet: { color: COLORS.danger, fontSize: FONT.base, fontWeight: '800', marginTop: 2 },
  errorText: { flex: 1, color: COLORS.textSecondary, fontSize: FONT.base, lineHeight: 22 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  notFound: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700' },
  backLink: { color: COLORS.primary, fontSize: FONT.base },

  imageCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exerciseImage: {
    width: '100%',
    height: 220,
  },

  muscleMapCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    width: '100%',
    overflow: 'hidden',
  },
  muscleMapTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    fontWeight: '800',
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
});
