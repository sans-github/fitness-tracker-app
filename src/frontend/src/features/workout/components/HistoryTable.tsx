import { WorkoutLogResponse } from '../api/types';

interface HistoryTableProps {
  logs: WorkoutLogResponse[];
  isLoading: boolean;
  isError: boolean;
}

export function HistoryTable({ logs, isLoading, isError }: HistoryTableProps) {
  return (
    <section aria-label="Workout history">
      <h2>History</h2>
      {isError && (
        <div role="alert" className="banner-error">
          Failed to load workout history. Please refresh the page.
        </div>
      )}
      {isLoading && <p aria-live="polite">Loading history...</p>}
      {!isLoading && (
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Exercise</th>
              <th scope="col">Weight (lbs)</th>
              <th scope="col">Sets</th>
              <th scope="col">Reps</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  No workouts logged yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.exercise}</td>
                  <td>{log.weightLbs}</td>
                  <td>{log.sets}</td>
                  <td>{log.reps}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
