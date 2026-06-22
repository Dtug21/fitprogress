import { View, StyleSheet,Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { useUserStore } from '../../stores/useUserStore';
import { StartWorkout } from '../../components/workout/StartWorkout';
import { ExerciseView } from '../../components/workout/ExerciseView';
import { RestTimerOverlay } from '../../components/workout/RestTimerOverlay';
import { AlternativesPicker } from '../../components/workout/AlternativesPicker';
import { ExercisePickerModal } from '../../components/workout/ExercisePickerModal';
import { WorkoutSummary } from '../../components/workout/WorkoutSummary';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { Routine, WorkoutSet, WorkoutSession, PersonalRecord, RIR, RoutineExercise, Exercise } from '../../types';
import { generateId } from '../../utils/calculations';
import { getExerciseById } from '../../data/exercises';
import { suggestNextWeight, adaptSessionsToHistory, parseRepRange, exercisePRScore } from '../../lib/progression';
import { buildRoutineFromSession } from '../../lib/workoutHistory';

const FREESTYLE_ROUTINE_ID = 'freestyle';

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
    addExerciseToSession,
    incrementCurrentExerciseSets,
    removeSet,
    nextSet,
    nextExercise,
    prevExercise,
    startRest,
    stopRest,
    replaceSessionExercise,
    skipExercise } = useWorkoutStore();

  const { routines, addRoutine } = useRoutineStore();
  const { sessions, saveSession, updatePersonalRecord, personalRecords, bodyWeight, lastDeloadDate } = useProgressStore();
  const { profile } = useUserStore();

  // Peso corporal más reciente (para PRs y volumen de calistenia)
  const latestBodyweight =
    bodyWeight.length > 0 ? bodyWeight[bodyWeight.length - 1].weight_kg : profile.weight_kg;

  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [finishedSession, setFinishedSession] = useState<WorkoutSession | null>(null);
  const [finishedExercises, setFinishedExercises] = useState<RoutineExercise[]>([]);
  const [newPRs, setNewPRs] = useState<string[]>([]);
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);

  const isFreestyle = activeSession?.routine_id === FREESTYLE_ROUTINE_ID;

  // ─── Iniciar sesión ───────────────────────────────────────────────
  function handleStartRoutine(routine: Routine) {
    if (routine.exercises.length === 0) {
      Alert.alert('Rutina vacía', 'Esta rutina no tiene ejercicios. Agrégalos en el editor.');
      return;
    }
    const session: WorkoutSession = {
      id: generateId(),
      routine_id: routine.id,
      routine_name: routine.name,
      date: new Date().toISOString().split('T')[0],
      mode: routine.mode,
      started_at: new Date().toISOString(),
      sets: [] };
    startSession(session, routine.exercises);
  }

  // ─── Iniciar entrenamiento libre ──────────────────────────────────
  function handleStartFreestyle() {
    const session: WorkoutSession = {
      id: generateId(),
      routine_id: FREESTYLE_ROUTINE_ID,
      routine_name: 'Entrenamiento libre',
      date: new Date().toISOString().split('T')[0],
      mode: profile.mode,
      started_at: new Date().toISOString(),
      sets: [] };
    startSession(session, []); // sin ejercicios: se agregan sobre la marcha
    setShowAddExercise(true);
  }

  // ─── Agregar un ejercicio a la sesión en curso ────────────────────
  function handleAddExerciseToSession(exercise: Exercise) {
    const re: RoutineExercise = {
      exercise_id: exercise.id,
      order: sessionExercises.length,
      target_sets: 3,
      target_reps: exercise.exercise_type === 'cardio' ? 'AMRAP' : '8-12',
      rest_seconds: exercise.exercise_type === 'compound' ? 120 : 90 };
    addExerciseToSession(re);
    setShowAddExercise(false);
  }

  // ─── Completar una serie ──────────────────────────────────────────
  function handleCompleteSet(weight: number, reps: number, rir: RIR = 2) {
    if (!activeSession) return;

    const routineEx = sessionExercises[currentExerciseIndex];
    if (!routineEx) return;

    const workoutSet: WorkoutSet = {
      id: generateId(),
      exercise_id: routineEx.exercise_id,
      set_number: currentSetIndex + 1,
      reps,
      weight_kg: weight,
      rir,
      completed: true,
      rest_seconds: routineEx.rest_seconds };
    addSet(workoutSet);

    // Verificar PR — funciona para peso libre y peso corporal (incluye lastre)
    const exerciseData = getExerciseById(routineEx.exercise_id);
    if (exerciseData) {
      const existingPR = personalRecords[routineEx.exercise_id];
      const newScore = exercisePRScore(exerciseData, weight, reps, latestBodyweight);
      const existingScore = existingPR
        ? exercisePRScore(exerciseData, existingPR.weight_kg, existingPR.reps, latestBodyweight)
        : 0;
      if (newScore > existingScore) {
        const pr: PersonalRecord = { exercise_id: routineEx.exercise_id, weight_kg: weight, reps, date: new Date().toISOString() };
        updatePersonalRecord(routineEx.exercise_id, pr);
        if (!newPRs.includes(routineEx.exercise_id)) {
          setNewPRs((prev) => [...prev, routineEx.exercise_id]);
        }
      }
    }

    const isLastSet = currentSetIndex + 1 >= routineEx.target_sets;
    const hasNextExercise = currentExerciseIndex + 1 < sessionExercises.length;

    if (isLastSet && hasNextExercise) {
      // Terminó este ejercicio, hay más: descansa y avanza
      startRest(routineEx.rest_seconds);
      setTimeout(() => { nextExercise(); }, 0);
    } else if (isLastSet && !hasNextExercise) {
      // Terminó el último ejercicio: va al hub (agregar otro o terminar), sin descanso
      nextExercise();
    } else {
      nextSet();
      startRest(routineEx.rest_seconds);
    }
  }

  // ─── Saltar ejercicio (lo deja registrado como no completado) ─────
  function handleSkipExercise() {
    const routineEx = sessionExercises[currentExerciseIndex];
    if (routineEx) {
      const alreadyLogged = activeSession?.sets.some((s) => s.exercise_id === routineEx.exercise_id);
      if (!alreadyLogged) {
        // Marca el ejercicio como presente pero no completado, para no perder el dato
        addSet({
          id: generateId(),
          exercise_id: routineEx.exercise_id,
          set_number: 0,
          reps: 0,
          weight_kg: 0,
          completed: false,
          rest_seconds: routineEx.rest_seconds });
      }
    }
    skipExercise();
  }

  // ─── Fin del entrenamiento ────────────────────────────────────────
  function handleFinishWorkout() {
    const routineName = activeSession?.routine_name;
    const exercisesSnapshot = [...sessionExercises];
    const finished = endSession(mood);
    if (!finished) return;

    const withTime = {
      ...finished,
      routine_name: routineName ?? finished.routine_name,
      finished_at: new Date().toISOString(),
    };
    setFinishedExercises(exercisesSnapshot);
    setFinishedSession(withTime);
    saveSession(withTime);

    setShowSummary(true);
  }

  function handleFinalFinish() {
    setShowSummary(false);
    setFinishedSession(null);
    setFinishedExercises([]);
    setNewPRs([]);
    setMood(3);
  }

  function handleSaveAsRoutine() {
    if (!finishedSession) return;
    const routine = buildRoutineFromSession(finishedSession, finishedExercises, routines);
    addRoutine(routine);
    Alert.alert('Rutina guardada', `"${routine.name}" está en Mis Rutinas → Manuales.`);
  }

  function handleEndEarly() {
    const completedCount = activeSession?.sets.filter((s) => s.completed).length ?? 0;
    if (completedCount === 0) {
      Alert.alert(
        'Sin series registradas',
        'Aún no completaste ninguna serie. Si sales, no se guardará esta sesión.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir sin guardar', style: 'destructive', onPress: () => { endSession(); } },
        ],
      );
      return;
    }
    Alert.alert(
      'Terminar rutina anticipada',
      `Se guardará tu progreso (${completedCount} series registradas). Ideal si tienes que irte por una urgencia.`,
      [
        { text: 'Seguir entrenando', style: 'cancel' },
        {
          text: 'Terminar y guardar',
          onPress: () => {
            stopRest();
            handleFinishWorkout();
          },
        },
      ],
    );
  }

  function handleAbandon() {
    Alert.alert(
      'Abandonar sin guardar',
      '¿Salir y descartar todo? Usa "Terminar rutina anticipada" si quieres guardar lo que ya hiciste.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => { endSession(); setShowSummary(false); } },
      ],
    );
  }

  const screenVariant = activeSession ? 'stack' : 'tab';

  // ─── Render: Resumen ──────────────────────────────────────────────
  if (showSummary && finishedSession) {
    return (
      <Screen variant={screenVariant}>
        <WorkoutSummary
          session={finishedSession}
          newPRs={newPRs}
          mood={mood}
          onMoodChange={setMood}
          onFinish={handleFinalFinish}
          onSaveRoutine={handleSaveAsRoutine}
          canSaveRoutine={finishedExercises.length > 0 || finishedSession.sets.some((s) => s.completed)}
        />
      </Screen>
    );
  }

  // ─── Render: Sin sesión activa ────────────────────────────────────
  if (!activeSession) {
    return (
      <Screen variant={screenVariant}>
        <View style={styles.headerBar}>
          <Text style={styles.pageTitle}>Entrenamiento</Text>
        </View>
        <StartWorkout
          routines={routines}
          profile={profile}
          sessions={sessions}
          lastDeloadDate={lastDeloadDate}
          onStart={handleStartRoutine}
          onStartFreestyle={handleStartFreestyle}
        />
      </Screen>
    );
  }

  // ─── Render: Sesión activa ────────────────────────────────────────
  const routineEx = sessionExercises[currentExerciseIndex];
  const exercise = routineEx ? getExerciseById(routineEx.exercise_id) : null;

  // Historial de este ejercicio para la sugerencia de progresión
  const exerciseHistory = routineEx
    ? adaptSessionsToHistory(sessions, routineEx.exercise_id)
    : [];

  const suggestion = exercise && routineEx
    ? suggestNextWeight(exerciseHistory, parseRepRange(routineEx.target_reps), exercise.muscle_group)
    : { action: 'maintain_more_reps' as const, new_weight_kg: 0, message: '', reasoning: '' };

  // ─── Hub de sesión: terminó los ejercicios, puede agregar otro o cerrar ──
  if (!exercise || !routineEx) {
    const completedSetsCount = activeSession.sets.length;
    const trainedExercises = sessionExercises
      .map((re) => getExerciseById(re.exercise_id)?.name)
      .filter(Boolean) as string[];

    return (
      <Screen variant={screenVariant}>
        <View style={styles.activeHeader}>
          <TouchableOpacity onPress={handleAbandon} style={styles.abandonBtn}>
            <Text style={styles.abandonText}>✕ Salir</Text>
          </TouchableOpacity>
          <Text style={styles.activeTitle} numberOfLines={1}>Sesión en curso</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.hubScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hubIconChip}>
            <Ionicons name="checkmark-done" size={30} color={COLORS.primary} />
          </View>
          <Text style={styles.hubTitle}>
            {trainedExercises.length === 0 ? 'Comienza tu sesión' : '¿Algo más?'}
          </Text>
          <Text style={styles.hubSub}>
            {trainedExercises.length === 0
              ? 'Agrega el primer ejercicio para empezar a registrar.'
              : `Llevas ${trainedExercises.length} ejercicio${trainedExercises.length > 1 ? 's' : ''} · ${completedSetsCount} series.`}
          </Text>

          {trainedExercises.length > 0 && (
            <View style={styles.hubList}>
              {sessionExercises.map((re, i) => {
                const name = getExerciseById(re.exercise_id)?.name ?? re.exercise_id;
                const setsLogged = activeSession.sets.filter((set) => set.exercise_id === re.exercise_id).length;
                return (
                  <View key={`${re.exercise_id}-${i}`} style={styles.hubRow}>
                    <View style={styles.hubRowNum}>
                      <Text style={styles.hubRowNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.hubRowName}>{name}</Text>
                    <Text style={styles.hubRowSets}>{setsLogged} series</Text>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity style={styles.hubAddBtn} onPress={() => setShowAddExercise(true)} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={COLORS.accentText} />
            <Text style={styles.hubAddText}>Agregar ejercicio</Text>
          </TouchableOpacity>

          {trainedExercises.length > 0 && (
            <TouchableOpacity style={styles.hubFinishBtn} onPress={handleEndEarly} activeOpacity={0.8}>
              <Ionicons name="flag-outline" size={18} color={COLORS.warning} />
              <Text style={styles.hubFinishText}>Terminar rutina anticipada</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <ExercisePickerModal
          visible={showAddExercise}
          mode={activeSession.mode}
          excludeIds={sessionExercises.map((re) => re.exercise_id)}
          onSelect={handleAddExerciseToSession}
          onClose={() => setShowAddExercise(false)}
        />
      </Screen>
    );
  }

  return (
    <Screen variant={screenVariant}>
      {/* Header con abandon + agregar */}
      <View style={styles.activeHeader}>
        <TouchableOpacity onPress={handleAbandon} style={styles.abandonBtn}>
          <Text style={styles.abandonText}>✕ Salir</Text>
        </TouchableOpacity>
        <Text style={styles.activeTitle} numberOfLines={1}>
          {isFreestyle ? 'Libre' : 'Ejercicio'} {currentExerciseIndex + 1}/{sessionExercises.length}
        </Text>
        <TouchableOpacity onPress={() => setShowAddExercise(true)} style={styles.addExerciseBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="add" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.workoutBody}>
      <ExerciseView
        key={currentExerciseIndex}
        exercise={exercise}
        routineExercise={routineEx}
        currentSet={currentSetIndex + 1}
        totalSets={routineEx.target_sets}
        totalExercises={sessionExercises.length}
        currentExerciseIndex={currentExerciseIndex}
        suggestion={suggestion}
        loggedSets={activeSession.sets.filter((s) => s.exercise_id === routineEx.exercise_id && s.completed)}
        canGoPrev={currentExerciseIndex > 0}
        onPrevExercise={prevExercise}
        onAddSet={incrementCurrentExerciseSets}
        onDeleteSet={(setId) => removeSet(setId)}
        onCompleteSet={handleCompleteSet}
        onSwapExercise={() => setShowAlternatives(true)}
        onSkipExercise={() => {
          Alert.alert('Saltar ejercicio', '¿Saltar este ejercicio? Quedará registrado como no completado.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Saltar', onPress: handleSkipExercise },
          ]);
        }}
        onEndEarly={handleEndEarly}
      />

      {isResting && (
        <RestTimerOverlay
          onSkip={stopRest}
          totalSeconds={routineEx.rest_seconds ?? 90}
          onEndEarly={handleEndEarly}
        />
      )}
      </View>

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

      <ExercisePickerModal
        visible={showAddExercise}
        mode={activeSession.mode}
        excludeIds={sessionExercises.map((re) => re.exercise_id)}
        onSelect={handleAddExerciseToSession}
        onClose={() => setShowAddExercise(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm },
  pageTitle: { color: COLORS.textPrimary, fontSize: FONT.xxl, fontWeight: '800' },
  workoutBody: { flex: 1, position: 'relative' },

  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm },
  abandonBtn: { padding: 4 },
  abandonText: { color: COLORS.danger, fontSize: FONT.base, fontWeight: '600' },
  activeTitle: { color: COLORS.textSecondary, fontSize: FONT.base, fontWeight: '600', flex: 1, textAlign: 'center' },
  addExerciseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryDim, alignItems: 'center', justifyContent: 'center' },

  // Hub de sesión
  hubScroll: { padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.xl },
  hubIconChip: {
    width: 72, height: 72, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryDim, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm },
  hubTitle: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '600' },
  hubSub: { color: COLORS.textMuted, fontSize: FONT.base, textAlign: 'center', lineHeight: 20 },
  hubList: {
    alignSelf: 'stretch', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.sm, overflow: 'hidden' },
  hubRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border },
  hubRowNum: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primaryDim,
    alignItems: 'center', justifyContent: 'center' },
  hubRowNumText: { color: COLORS.primary, fontSize: FONT.sm, fontWeight: '700' },
  hubRowName: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '500' },
  hubRowSets: { color: COLORS.textMuted, fontSize: FONT.sm, fontVariant: ['tabular-nums'] },
  hubAddBtn: {
    alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 56, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, marginTop: SPACING.md },
  hubAddText: { color: COLORS.accentText, fontSize: FONT.md, fontWeight: '600' },
  hubFinishBtn: {
    alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 52, borderRadius: RADIUS.lg, backgroundColor: COLORS.warningDim,
    borderWidth: 1, borderColor: COLORS.warning, marginTop: SPACING.sm },
  hubFinishText: { color: COLORS.warning, fontSize: FONT.base, fontWeight: '600' } });
