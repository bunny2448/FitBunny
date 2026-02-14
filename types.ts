
export enum ExerciseType {
  SETS_REPS = 'Sets & Reps',
  TIME = 'Time',
  SETS_TIME = 'Sets & Time'
}

// Tier 1: The Ingredients
export interface Exercise {
  id: string;
  name: string;
  description: string;
  type: ExerciseType;
  videoPath?: string;
}

// Tier 2: The Recipes (Workout Templates)
export interface ExerciseEntry {
  exerciseId: string;
  exerciseName: string; 
  sets: number;
  reps: number;
  time: string;
  restTime: number; // in seconds
  isRepeat: boolean;
  isSuperset: boolean;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: ExerciseEntry[];
}

// Tier 3: The Schedule
export interface ScheduledWorkout {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  templateId: string;
}

// Performance tracking
export interface SetRecord {
  weight: number;
  reps: number;
  time: string;
}

export interface ExercisePerformance {
  exerciseId: string;
  date: string;
  sets: SetRecord[];
}

export interface WorkoutLog {
  id: string;
  workoutTemplateId: string;
  workoutName: string;
  dateCompleted: string;
  rating: 'Super Easy' | 'Easy' | 'Moderate' | 'Hard' | 'Very Hard';
  exercisePerformances: ExercisePerformance[];
}

// CSV Row Definitions
export interface CSVExerciseRow {
  Name: string;
  Description: string;
  Type: string;
}

export interface CSVWorkoutTemplateRow {
  WorkoutName: string;
  ExerciseName: string;
  Sets: string;
  Reps: string;
  Time: string;
  RestTime: string;
  isRepeat: string;
  isSuperset: string;
}

export interface CSVScheduleRow {
  Date: string;
  WorkoutName: string;
}
