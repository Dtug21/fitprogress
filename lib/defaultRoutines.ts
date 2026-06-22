import { Routine, RoutineExercise, Equipment } from '../types';

function makeId() {
  return `default_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function ex(
  exerciseId: string,
  order: number,
  targetSets = 3,
  targetReps = '8-12',
  restSeconds = 90
): RoutineExercise {
  return { exercise_id: exerciseId, order, target_sets: targetSets, target_reps: targetReps, rest_seconds: restSeconds };
}

// Full Body para casa — cuatro días (Lun, Mar, Jue, Sáb)
export function buildHomeFullBody(equipment: Equipment[]): Routine {
  const hasDumbbells = equipment.includes('dumbbells');
  const hasBench = equipment.includes('adjustable_bench');
  const hasBands = equipment.includes('long_bands') || equipment.includes('short_bands');

  const exercises: RoutineExercise[] = [
    ex(hasBench && hasDumbbells ? 'incline_press_db' : 'push_up_standard', 0, 3, '8-15'),
    ex(hasDumbbells ? 'bent_over_row_db' : 'pull_up', 1, 3, '8-12'),
    ex(hasDumbbells ? 'overhead_press_db' : 'band_lateral_raise', 2, 3, '8-12'),
    ex(hasDumbbells ? 'bicep_curl_db' : hasBands ? 'band_curl' : 'hammer_curl_db', 3, 3, '10-15'),
    ex(hasDumbbells ? 'overhead_tricep_extension' : 'diamond_push_up', 4, 3, '10-15'),
    ex(hasDumbbells ? 'goblet_squat' : 'bodyweight_squat', 5, 3, '12-15', 120),
    ex(hasDumbbells ? 'romanian_deadlift_db' : 'glute_bridge', 6, 3, '10-12', 120),
    ex('plank', 7, 3, '30-45', 60),
  ];

  const now = new Date().toISOString();
  return {
    id: makeId(),
    name: 'Full Body Casa',
    mode: 'home',
    day_of_week: [1, 2, 4, 6],
    exercises,
    created_at: now,
    updated_at: now,
    source: 'default',
  };
}

// Upper / Lower para gym — cuatro días
export function buildGymUpperLower(): Routine[] {
  const now = new Date().toISOString();

  const upper: Routine = {
    id: makeId(),
    name: 'Upper — Gym',
    mode: 'gym',
    day_of_week: [1, 4],
    exercises: [
      ex('bench_press_barbell', 0, 4, '5-8', 120),
      ex('bent_over_row_barbell', 1, 4, '5-8', 120),
      ex('overhead_press_db', 2, 3, '8-12'),
      ex('lat_pulldown', 3, 3, '10-12'),
      ex('bicep_curl_db', 4, 3, '10-15'),
      ex('cable_pushdown', 5, 3, '10-15'),
    ],
    created_at: now,
    updated_at: now,
    source: 'default',
  };

  const lower: Routine = {
    id: makeId(),
    name: 'Lower — Gym',
    mode: 'gym',
    day_of_week: [2, 6],
    exercises: [
      ex('barbell_squat', 0, 4, '5-8', 180),
      ex('romanian_deadlift_gym', 1, 3, '8-10', 180),
      ex('leg_press_machine', 2, 3, '10-15', 90),
      ex('leg_curl_machine', 3, 3, '10-15', 90),
      ex('calf_raise_machine', 4, 4, '15-20', 60),
      ex('plank', 5, 3, '30-60', 60),
    ],
    created_at: now,
    updated_at: now,
    source: 'default',
  };

  return [upper, lower];
}
