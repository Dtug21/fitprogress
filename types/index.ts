export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'cardio'
  | 'full_body';

export type Equipment =
  | 'dumbbells'
  | 'adjustable_bench'
  | 'straight_barbell'
  | 'ez_bar'
  | 'w_bar'
  | 'long_bands'
  | 'short_bands'
  | 'ab_wheel'
  | 'jump_rope'
  | 'hand_grippers'
  | 'bodyweight'
  | 'barbell'
  | 'cable'
  | 'machine'
  | 'pull_up_bar'
  | 'dip_bars'
  | 'rack'
  | 'leg_press'
  | 'smith_machine';

export type ExerciseMode = 'home' | 'gym' | 'both';
export type ExerciseType = 'compound' | 'isolation' | 'cardio' | 'mobility';
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** Repeticiones en reserva: 0 = al fallo, 4 = muy fácil */
export type RIR = 0 | 1 | 2 | 3 | 4;

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  secondary_muscles: MuscleGroup[];
  equipment_required: Equipment[];
  mode: ExerciseMode;
  difficulty: Difficulty;
  exercise_type: ExerciseType;
  instructions: string;
  tips: string[];
  alternatives: string[];
  video_cue?: string;
  progression_from?: string;
  progression_to?: string;
  gifSource?: number;
}

export interface WorkoutSet {
  id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rir?: RIR;
  rpe?: number;
  completed: boolean;
  rest_seconds: number;
}

export interface WorkoutSession {
  id: string;
  routine_id: string;
  date: string;
  mode: 'home' | 'gym';
  started_at: string;
  finished_at?: string;
  sets: WorkoutSet[];
  notes?: string;
  mood?: 1 | 2 | 3 | 4 | 5;
}

export interface RoutineExercise {
  exercise_id: string;
  order: number;
  target_sets: number;
  target_reps: string;
  target_weight_kg?: number;
  rest_seconds: number;
  superset_group?: string;
  notes?: string;
}

export interface Routine {
  id: string;
  name: string;
  day_of_week: number[];
  mode: 'home' | 'gym';
  exercises: RoutineExercise[];
  created_at: string;
  updated_at: string;
}

export type Goal =
  | 'fat_loss'
  | 'muscle_gain'
  | 'strength'
  | 'endurance'
  | 'mixed'
  | 'health';

export interface UserProfile {
  name: string;
  mode: 'home' | 'gym';
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  goals: Goal[];
  home_equipment: Equipment[];
  onboarding_completed: boolean;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  days_per_week?: number;
  current_situation?: string;
  // legacy
  goal?: 'fat_loss' | 'strength' | 'mixed';
}

export interface PersonalRecord {
  exercise_id: string;
  weight_kg: number;
  reps: number;
  date: string;
}

export type ProgressionAction =
  | 'increase_weight'
  | 'maintain_high_effort'
  | 'maintain_more_reps'
  | 'deload';

export interface ProgressionSuggestion {
  action: ProgressionAction;
  new_weight_kg: number;
  message: string;
  reasoning: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlocked_at?: string;
}
