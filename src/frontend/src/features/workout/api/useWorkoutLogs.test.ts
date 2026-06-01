import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { server } from '../../../test/setup';
import { useWorkoutLogs } from './useWorkoutLogs';
import { FIXTURE_LOGS } from '../../../test/handlers';

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('useWorkoutLogs', () => {
  it('returns data on successful GET 200', async () => {
    const { result } = renderHook(() => useWorkoutLogs(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(FIXTURE_LOGS.length);
    expect(result.current.data?.[0].exercise).toBe('Squat');
  });

  it('returns error state on GET non-200', async () => {
    server.use(
      http.get('/api/v1/workout-logs', () => HttpResponse.json({}, { status: 500 })),
    );
    const { result } = renderHook(() => useWorkoutLogs(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
