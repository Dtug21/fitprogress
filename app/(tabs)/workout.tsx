import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { useUserStore } from '../../stores/useUserStore';
import { StartWorkout } from '../../components/workout/StartWorkout';
import { ExerciseView } from '../../components/workout/ExerciseView';
import { RestTimerOverlay } from '../../components/workout/RestTimerOverlay';
import { AlternativesPicker } from '../../components/workout/AlternativesPicker';
import { WorkoutSummary } from '../../components/workout/WorkoutSummary';
import { COLORS, SPACING, FONT } from '../../constants/theme';
import { Routine, WorkoutSet, WorkoutSession, PersonalRecord } from '../../types';
import { generateId } from '../../utils/calculations';
import { getExerciseById } from '../../data/exercises';
import { suggestNextWeight } from '../../lib/progression';

export default function WorkoutScreen() {
  const {
    activeSession,
    sessionExercises,
    currentExerciseIndex,
    currentSetIndex,
    isResting,
    startSession,
    endSession,
    addSet,
    nextSet,
    nextExercise,
    startRest,
    stopRest,
    replaceSessionExercise,
    skipExercise,
  } = useWorkoutStore();

  const { routines } = useRoutineStore();
  const { sessions, saveSession, updatePersonalRecord, personalRecords, unlockAchievement } = useProgressStore();
  const { profile } = useUserStore();

  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [finishedSession, setFinishedSession] = useState<WorkoutSession | null>(null);
  const [newPRs, setNewPRs] = useState<string[]>([]);
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);

  // ─── Iniciar sesión ───────────────────────────────────────────────
  function handleStartRoutine(routine: Routine) {
    if (routine.exercises.length === 0) {
      Alert.alert('Rutina vacía', 'Esta rutina no tiene ejercicios. Agrégalos en el editor.');
      return;
    }
    const session: WorkoutSession = {
      id: generateId(),
      routine_id: routine.id,
      date: new Date().toISOString().split('T')[0],
      mode: routine.mode,
      started_at: new Date().toISOString(),
      sets: [],
    };
    startSession(session, routine.exercises);
  }

  // ─── Completar una serie ──────────────────────────────────────────
  function handleCompleteSet(weight: number, reps: number) {
    if (!activeSession) return;

    const routineEx = sessionExercises[currentExerciseIndex];
    if (!routineEx) return;

    const workoutSet: WorkoutSet = {
      id: generateId(),
      exercise_id: routineEx.exercise_id,
      set_number: currentSetIndex + 1,
      reps,
      weight_kg: weight,
      completed: true,
      rest_seconds: routineEx.rest_seconds,
    };
    addSet(workoutSet);

    // Verificar PR
    const existingPR = personalRecords[routineEx.exercise_id];
    const volume1RM = weight * (1 + reps / 30); // estimación simple
    const existingVolume = existingPR ? existingPR.weight_kg * (1 + existingPR.reps / 30) : 0;
    if (volume1RM > existingVolume) {
      const pr: PersonalRecord = { exercise_id: routineEx.exercise_id, weight_kg: weight, reps, date: new Date().toISOString() };
      updatePersonalRecord(routineEx.exercise_id, pr);
      if (!newPRs.includes(routineEx.exercise_id)) {
        setNewPRs((prev) => [...prev, routineEx.exercise_id]);
        unlockAchievement('first_pr');
      }
    }

    const isLastSet = currentSetIndex + 1 >= routineEx.target_sets;
    const isLastExercise = currentExerciseIndex + 1 >= sessionExercises.length;

    if (isLastSet && isLastExercise) {
      // Fin del entrenamiento
      handleFinishWorkout();
    } else if (isLastSet) {
      startRest(routineEx.rest_seconds);
      setTimeout(() => { nextExercise(); }, 0);
    } else {
      nextSet();
      startRest(routineEx.rest_seconds);
    }
  }

  // ─── Fin del entrenamiento ────────────────────────────────────────
  function handleFinishWorkout() {
    const finished = endSession(mood);
    if (!finished) return;

    const withTime = { ...finished, finished_at: new Date().toISOString() };
    setFinishedSession(withTime);
    saveSession(withTime);
    unlockAchievement('first_workout');

    const total = sessions.length + 1;
    if (total >= 10) unlockAchievement('workouts_10');

    setShowSummary(true);
  }

  function handleFinalFinish() {
    setShowSummary(false);
    setFinishedSession(null);
    setNewPRs([]);
    setMood(3);
  }

  function handleAbandon() {
    Alert.alert(
      'Abandonar entrenamiento',
      '¿Seguro que quieres salir? Se perderá el progreso de la sesión actual.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => { endSession(); setShowSummary(false); } },
      ]
    );
  }

  // ─── Render: Resumen ──────────────────────────────────────────────
  if (showSummary && finishedSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <WorkoutSummary
          session={finishedSession}
          newPRs={newPRs}
          mood={mood}
          onMoodChange={setMood}
          onFinish={handleFinalFinish}
        />
      </SafeAreaView>
    );
  }

  // ─── Render: Sin sesión activa ────────────────────────────────────
  if (!activeSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerBar}>
          <Text style={styles.pageTitle}>Entrenamiento</Text>
        </View>
        <StartWorkout routines={routines} onStart={handleStartRoutine} />
      </SafeAreaView>
    );
  }

  // ─── Render: Sesión activa ────────────────────────────────────────
  const routineEx = sessionExercises[currentExerciseIndex];
  const exercise = routineEx ? getExerciseById(routineEx.exercise_id) : null;

  // Historial de este ejercicio para la sugerencia de progresión
  const exerciseHistory = sessions
    .filter((s) => s.sets.some((set) => set.exercise_id === routineEx?.exercise_id))
    .map((s) => s.sets.filter((set) => set.exercise_id === routineEx?.exercise_id));

  const suggestion = exercise && routineEx
    ? suggestNextWeight(exerciseHistory, routineEx.target_reps, exercise.muscle_group)
    : { action: 'maintain' as const, new_weight: 0, message: '' };

  // Descanso activo
  if (isResting) {
    return (
      <SafeAreaView style={styles.safe}>
        <RestTimerOverlay onSkip={stopRest} />
      </SafeAreaView>
    );
  }

  if (!exercise || !routineEx) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.doneText}>¡Todos los ejercicios completados!</Text>
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinishWorkout}>
            <Text style={styles.finishBtnText}>Ver resumen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header con abandon */}
      <View style={styles.activeHeader}>
        <TouchableOpacity onPress={handleAbandon} style={styles.abandonBtn}>
          <Text style={styles.abandonText}>✕ Salir</Text>
        </TouchableOpacity>
        <Text style={styles.activeTitle} numberOfLines={1}>
          Ejercicio {currentExerciseIndex + 1}/{sessionExercises.length}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ExerciseView
        exercise={exercise}
        routineExercise={routineEx}
        currentSet={currentSetIndex + 1}
        totalSets={routineEx.target_sets}
        totalExercises={sessionExercises.length}
        currentExerciseIndex={currentExerciseIndex}
        suggestion={suggestion}
        onCompleteSet={handleCompleteSet}
        onSwapExercise={() => setShowAlternatives(true)}
        onSkipExercise={() => {
          Alert.alert('Saltar ejercicio', '¿Saltar este ejercicio?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Saltar', onPress: () => skipExercise() },
          ]);
        }}
      />

      <AlternativesPicker
        visible={showAlternatives}
        currentExerciseId={routineEx.exercise_id}
        mode={activeSession.mode}
        availableEquipment={profile.home_equipment as string[]}
        onSelect={(newId) => {
          replaceSessionExercise(currentExerciseIndex, newId);
          setShowAlternatives(false);
        }}
        onClose={() => setShowAlternatives(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  headerBar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  pageTitle: { color: COLORS.textPrimary, fontSize: FONT.xxl, fontWeight: '800' },

  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  abandonBtn: { padding: 4 },
  abandonText: { color: COLORS.danger, fontSize: FONT.base, fontWeight: '600' },
  activeTitle: { color: COLORS.textSecondary, fontSize: FONT.base, fontWeight: '600', flex: 1, textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.lg },
  doneText: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700' },
  finishBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  finishBtnText: { color: '#000', fontSize: FONT.md, fontWeight: '800' },
});
