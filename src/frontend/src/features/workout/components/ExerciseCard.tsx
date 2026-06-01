import { useState } from 'react';
import { useLogWorkout } from '../api/useLogWorkout';
import logger from '../../../lib/logger';
import { sessionId } from '../../../lib/logger';

interface ExerciseCardProps {
  exerciseName: string;
}

interface FormErrors {
  weight?: string;
  sets?: string;
  reps?: string;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

function validate(weight: string, sets: string, reps: string): FormErrors {
  const errors: FormErrors = {};
  const w = parseFloat(weight);
  if (!weight.trim() || isNaN(w) || w <= 0) {
    errors.weight = 'Weight is required and must be greater than 0';
  }
  const s = parseInt(sets, 10);
  if (!sets.trim() || isNaN(s) || s < 1) {
    errors.sets = 'Sets is required and must be at least 1';
  }
  const r = parseInt(reps, 10);
  if (!reps.trim() || isNaN(r) || r < 1) {
    errors.reps = 'Reps is required and must be at least 1';
  }
  return errors;
}

export function ExerciseCard({ exerciseName }: ExerciseCardProps) {
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const mutation = useLogWorkout();
  const id = slugify(exerciseName);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate(weight, sets, reps);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      logger.warn('workout_log_validation_failed', {
        exerciseName,
        errorFields: Object.keys(validationErrors),
        sessionId,
      });
      return;
    }
    setErrors({});
    logger.info('workout_log_submitted', { exerciseName, sessionId });
    mutation.mutate(
      {
        exercise: exerciseName,
        weightLbs: parseFloat(weight),
        sets: parseInt(sets, 10),
        reps: parseInt(reps, 10),
      },
      {
        onSuccess: () => {
          setWeight('');
          setSets('');
          setReps('');
        },
      },
    );
  }

  return (
    <article className="exercise-card">
      <h3>{exerciseName}</h3>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field-label" htmlFor={`${id}-weight`}>
            Weight (lbs)
          </label>
          <input
            id={`${id}-weight`}
            className={`field-input${errors.weight ? ' is-error' : ''}`}
            type="number"
            min="0.01"
            step="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            aria-describedby={errors.weight ? `${id}-weight-err` : undefined}
            aria-invalid={errors.weight ? 'true' : undefined}
          />
          {errors.weight && (
            <span id={`${id}-weight-err`} className="field-error" role="alert">
              {errors.weight}
            </span>
          )}
        </div>

        <div className="field">
          <label className="field-label" htmlFor={`${id}-sets`}>
            Sets
          </label>
          <input
            id={`${id}-sets`}
            className={`field-input${errors.sets ? ' is-error' : ''}`}
            type="number"
            min="1"
            step="1"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            aria-describedby={errors.sets ? `${id}-sets-err` : undefined}
            aria-invalid={errors.sets ? 'true' : undefined}
          />
          {errors.sets && (
            <span id={`${id}-sets-err`} className="field-error" role="alert">
              {errors.sets}
            </span>
          )}
        </div>

        <div className="field">
          <label className="field-label" htmlFor={`${id}-reps`}>
            Reps
          </label>
          <input
            id={`${id}-reps`}
            className={`field-input${errors.reps ? ' is-error' : ''}`}
            type="number"
            min="1"
            step="1"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            aria-describedby={errors.reps ? `${id}-reps-err` : undefined}
            aria-invalid={errors.reps ? 'true' : undefined}
          />
          {errors.reps && (
            <span id={`${id}-reps-err`} className="field-error" role="alert">
              {errors.reps}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary"
        >
          {mutation.isPending ? 'Logging...' : 'Log'}
        </button>

        {mutation.isError && (
          <div role="alert" className="banner-error">
            Failed to log workout. Please try again.
          </div>
        )}
      </form>
    </article>
  );
}
