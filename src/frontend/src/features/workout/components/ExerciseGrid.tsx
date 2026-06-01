import { ExerciseCard } from './ExerciseCard';

const EXERCISES = [
  'Squat',
  'Bench Press',
  'Deadlift',
  'Overhead Press',
  'Bent-over Row',
] as const;

export function ExerciseGrid() {
  return (
    <section aria-label="Log a workout">
      <div className="exercise-grid">
        {EXERCISES.map((name) => (
          <ExerciseCard key={name} exerciseName={name} />
        ))}
      </div>
    </section>
  );
}
