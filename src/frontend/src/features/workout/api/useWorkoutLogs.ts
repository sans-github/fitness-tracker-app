import { useQuery } from '@tanstack/react-query';
import { WorkoutLogResponse } from './types';
import logger from '../../../lib/logger';
import { generateTraceId } from '../../../lib/traceId';

export const workoutLogKeys = {
  all: ['workoutLogs'] as const,
  list: () => [...workoutLogKeys.all, 'list'] as const,
};

async function fetchWorkoutLogs(): Promise<WorkoutLogResponse[]> {
  const traceId = generateTraceId();
  const endpoint = '/api/v1/workout-logs';
  logger.info('api_call_start', { endpoint, method: 'GET', traceId });
  const start = Date.now();
  const res = await fetch(endpoint, {
    headers: { 'X-Trace-Id': traceId },
  });
  const durationMs = Date.now() - start;
  if (!res.ok) {
    logger.error('api_call_failed', new Error(res.statusText), {
      endpoint,
      method: 'GET',
      status: res.status,
      durationMs,
      traceId,
    });
    throw new Error(`GET ${endpoint} failed: ${res.status}`);
  }
  logger.info('api_call_complete', {
    endpoint,
    method: 'GET',
    status: res.status,
    durationMs,
    traceId,
  });
  return res.json() as Promise<WorkoutLogResponse[]>;
}

export function useWorkoutLogs() {
  return useQuery<WorkoutLogResponse[], Error>({
    queryKey: workoutLogKeys.list(),
    queryFn: fetchWorkoutLogs,
    staleTime: 0,
  });
}
