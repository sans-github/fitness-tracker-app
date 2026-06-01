const API_BASE = 'http://localhost:8080/api/v1';

async function postWorkout(body: object): Promise<void> {
  const res = await fetch(`${API_BASE}/workout-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Seed POST failed: ${res.status} ${await res.text()}`);
  }
}

export default async function globalSetup(): Promise<void> {
  // Seed 2 known rows for deterministic AC-4 order tests.
  // Older row first so newest-first ordering is verifiable.
  await postWorkout({ exercise: 'Bench Press', weightLbs: 100.0, sets: 3, reps: 8 });
  // Small delay so createdAt timestamps are guaranteed distinct
  await new Promise((r) => setTimeout(r, 150));
  await postWorkout({ exercise: 'Squat', weightLbs: 135.75, sets: 3, reps: 5 });
}
