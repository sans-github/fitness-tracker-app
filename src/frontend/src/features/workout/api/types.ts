export interface WorkoutLogResponse {
  id: string;
  exercise: string;
  weightLbs: number;
  sets: number;
  reps: number;
  createdAt: string;
}

export interface WorkoutLogRequest {
  exercise: string;
  weightLbs: number;
  sets: number;
  reps: number;
}
