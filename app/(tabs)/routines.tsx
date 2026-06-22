import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useUserStore } from '../../stores/useUserStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { getRoutineSource } from '../../lib/routineOptimizer';
import { exercises } from '../../data/exercises';
import { Routine } from '../../types';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio', full_body: 'Full Body',
};

type RoutineTab = 'recommended' | 'manual';

export default function RoutinesScreen() {
  const router = useRouter();
  const { routines, deleteRoutine } = useRoutineStore();
  const { profile } = useUserStore();
  const [tab, setTab] = useState<RoutineTab>('recommended');

  const recommendedRoutines = routines.filter((r) => getRoutineSource(r) !== 'manual');
  const manualRoutines = routines.filter((r) => getRoutineSource(r) === 'manual');
  const visibleRoutines = tab === 'manual' ? manualRoutines : recommendedRoutines;

  function handleNewRoutine() {
    router.push('/routine/new');
  }

  function handleNewManual() {
    router.push({ pathname: '/routine/new', params: { manual: '1' } });
  }

  function handleDelete(id: string, name: string) {
    Alert.alert(
      'Eliminar rutina',
      `¿Seguro que quieres eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteRoutine(id) },
      ]
    );
  }

  const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <Screen>
      <View style={styles.headerBar}>
        <Text style={styles.pageTitle}>Mis Rutinas</Text>
        <Text style={styles.pageCount}>{routines.length} rutinas</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'recommended' && styles.tabBtnActive]}
          onPress={() => setTab('recommended')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'recommended' && styles.tabTextActive]}>
            Para ti
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'manual' && styles.tabBtnActive]}
          onPress={() => setTab('manual')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'manual' && styles.tabTextActive]}>
            Manuales ({manualRoutines.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'recommended' && (
          <Text style={styles.tabHint}>
            Rutinas del algoritmo y plantillas según tus objetivos ({profile.days_per_week ?? 4} días/sem).
          </Text>
        )}
        {tab === 'manual' && (
          <Text style={styles.tabHint}>
            Rutinas que creaste a mano, sin el generador automático.
          </Text>
        )}

        {visibleRoutines.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconChip}>
              <Ionicons
                name={tab === 'manual' ? 'create-outline' : 'sparkles'}
                size={28}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {tab === 'manual' ? 'Sin rutinas manuales' : 'Sin rutinas recomendadas'}
            </Text>
            <Text style={styles.emptySub}>
              {tab === 'manual'
                ? 'Crea una rutina libre y personalízala ejercicio por ejercicio.'
                : 'Genera una rutina desde Entreno o desde el botón + con el asistente.'}
            </Text>
            {tab === 'manual' && (
              <TouchableOpacity style={styles.emptyAction} onPress={handleNewManual} activeOpacity={0.85}>
                <Text style={styles.emptyActionText}>Crear rutina manual</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          visibleRoutines.map((routine) => (
            <RoutineListCard
              key={routine.id}
              routine={routine}
              dayNames={DAY_NAMES}
              onOpen={() => router.push(`/routine/${routine.id}`)}
              onDelete={() => handleDelete(routine.id, routine.name)}
            />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleNewRoutine} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>
    </Screen>
  );
}

function RoutineListCard({
  routine,
  dayNames,
  onOpen,
  onDelete,
}: {
  routine: Routine;
  dayNames: string[];
  onOpen: () => void;
  onDelete: () => void;
}) {
  const source = getRoutineSource(routine);
  const muscleGroups = [
    ...new Set(
      routine.exercises
        .map((re) => exercises.find((e) => e.id === re.exercise_id)?.muscle_group)
        .filter(Boolean)
    ),
  ].slice(0, 4);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onOpen} onLongPress={onDelete}>
      <Card padding={SPACING.md} style={styles.routineCard}>
        <View style={styles.routineTop}>
          <View style={styles.routineInfo}>
            <Text style={styles.routineName}>{routine.name}</Text>
            <View style={styles.routineMeta}>
              <Text style={styles.metaText}>{routine.exercises.length} ejercicios</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{routine.mode === 'home' ? 'Casa' : 'Gym'}</Text>
            </View>
          </View>
          <View style={styles.routineActions}>
            <Badge
              label={source === 'manual' ? 'Manual' : source === 'algorithm' ? 'Algoritmo' : 'Plantilla'}
              variant={source === 'manual' ? 'neutral' : 'primary'}
            />
            <TouchableOpacity
              onPress={onDelete}
              style={styles.deleteBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {routine.day_of_week.length > 0 && (
          <View style={styles.daysRow}>
            {dayNames.map((d, i) => (
              <View
                key={i}
                style={[styles.dayPill, routine.day_of_week.includes(i) && styles.dayPillActive]}
              >
                <Text style={[styles.dayText, routine.day_of_week.includes(i) && styles.dayTextActive]}>
                  {d}
                </Text>
              </View>
            ))}
          </View>
        )}

        {muscleGroups.length > 0 && (
          <View style={styles.muscleRow}>
            {muscleGroups.map((m) => (
              <Badge key={m} label={MUSCLE_LABELS[m as string] ?? (m as string)} variant="neutral" />
            ))}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  pageTitle: { color: COLORS.textPrimary, fontSize: FONT.xxl, fontWeight: '800' },
  pageCount: { color: COLORS.textMuted, fontSize: FONT.base },

  tabRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  tabText: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  tabHint: { color: COLORS.textMuted, fontSize: FONT.sm, lineHeight: 18, marginBottom: SPACING.xs },

  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingTop: SPACING.xs },

  empty: { alignItems: 'center', paddingTop: 48 },
  emptyIconChip: {
    width: 64, height: 64, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700', marginBottom: 8 },
  emptySub: { color: COLORS.textMuted, fontSize: FONT.base, textAlign: 'center', paddingHorizontal: SPACING.xl },
  emptyAction: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
  },
  emptyActionText: { color: COLORS.accentText, fontSize: FONT.base, fontWeight: '700' },

  routineCard: { marginBottom: 0 },
  routineTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  routineInfo: { flex: 1 },
  routineName: { color: COLORS.textPrimary, fontSize: FONT.md, fontWeight: '700' },
  routineMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  metaText: { color: COLORS.textMuted, fontSize: FONT.sm },
  metaDot: { color: COLORS.textMuted, fontSize: FONT.sm },
  routineActions: { alignItems: 'flex-end', gap: 4 },

  daysRow: { flexDirection: 'row', gap: 4, marginTop: SPACING.sm },
  dayPill: {
    width: 36, height: 28, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  dayPillActive: { backgroundColor: COLORS.primaryDim },
  dayText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  dayTextActive: { color: COLORS.primary },
  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm },

  fab: {
    position: 'absolute',
    bottom: 100,
    right: SPACING.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.danger + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
