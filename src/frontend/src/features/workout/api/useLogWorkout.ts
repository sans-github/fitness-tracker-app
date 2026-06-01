import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkoutLogRequest, WorkoutLogResponse } from './types';
import { workoutLogKeys } from './useWorkoutLogs';
import logger from '../../../lib/logger';
import { generateTraceId } from '../../../lib/traceId';

async function logWorkout(request: WorkoutLogRequest): Promise<WorkoutLogResponse> {
  const traceId = generateTraceId();
  const endpoint = '/api/v1/workout-logs';
  logger.info('api_call_start', { endpoint, method: 'POST', traceId });
  const start = Date.now();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Trace-Id': traceId,
    },
    body: JSON.stringify(request),
  });
  const durationMs = Date.now() - start;
  if (!res.ok) {
    logger.error('api_call_failed', new Error(res.statusText), {
      endpoint,
      method: 'POST',
      status: res.status,
      durationMs,
      traceId,
    });
    throw new Error(`POST ${endpoint} failed: ${res.status}`);
  }
  logger.info('api_call_complete', {
    endpoint,
    method: 'POST',
    status: res.status,
    durationMs,
    traceId,
  });
  return res.json() as Promise<WorkoutLogResponse>;
}

export function useLogWorkout() {
  const queryClient = useQueryClient();
  return useMutation<WorkoutLogResponse, Error, WorkoutLogRequest>({
    mutationFn: logWorkout,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workoutLogKeys.all });
    },
  });
}
