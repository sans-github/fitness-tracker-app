import { useEffect } from 'react';
import { useWorkoutLogs } from './api/useWorkoutLogs';
import { ExerciseGrid } from './components/ExerciseGrid';
import { HistoryTable } from './components/HistoryTable';
import logger, { sessionId } from '../../lib/logger';

export function WorkoutPage() {
  const { data: logs = [], isLoading, isError } = useWorkoutLogs();

  useEffect(() => {
    logger.info('page_view', { page: '/', sessionId });
  }, []);

  return (
    <main>
      <h1>Fitness Tracker</h1>
      <ExerciseGrid />
      <HistoryTable logs={logs} isLoading={isLoading} isError={isError} />
    </main>
  );
}
