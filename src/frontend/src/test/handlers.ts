import { http, HttpResponse } from 'msw';
import { WorkoutLogResponse } from '../features/workout/api/types';

export const FIXTURE_LOGS: WorkoutLogResponse[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    exercise: 'Squat',
    weightLbs: 100,
    sets: 3,
    reps: 5,
    createdAt: '2026-06-01T10:05:00Z',
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    exercise: 'Bench Press',
    weightLbs: 80.5,
    sets: 4,
    reps: 8,
    createdAt: '2026-06-01T09:50:00Z',
  },
];

export const handlers = [
  http.get('/api/v1/workout-logs', () => HttpResponse.json(FIXTURE_LOGS)),
  http.post('/api/v1/workout-logs', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const created: WorkoutLogResponse = {
      id: 'new-id-0000',
      exercise: body['exercise'] as string,
      weightLbs: body['weightLbs'] as number,
      sets: body['sets'] as number,
      reps: body['reps'] as number,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(created, { status: 201 });
  }),
];
