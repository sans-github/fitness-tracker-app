import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { server } from '../../../test/setup';
import { useLogWorkout } from './useLogWorkout';
import { workoutLogKeys } from './useWorkoutLogs';

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return {
    qc,
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: qc }, children);
    },
  };
}

describe('useLogWorkout', () => {
  it('calls POST and invalidates list query on 201', async () => {
    const { qc, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useLogWorkout(), { wrapper });
    act(() => {
      result.current.mutate({ exercise: 'Squat', weightLbs: 100, sets: 3, reps: 5 });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: workoutLogKeys.all }),
    );
  });

  it('returns error state on POST non-201', async () => {
    server.use(
      http.post('/api/v1/workout-logs', () => HttpResponse.json({}, { status: 400 })),
    );
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useLogWorkout(), { wrapper });
    act(() => {
      result.current.mutate({ exercise: 'Squat', weightLbs: 100, sets: 3, reps: 5 });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
