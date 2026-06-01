import { render, screen } from '@testing-library/react';
import { HistoryTable } from './HistoryTable';
import { WorkoutLogResponse } from '../api/types';

const LOGS: WorkoutLogResponse[] = [
  {
    id: '1',
    exercise: 'Squat',
    weightLbs: 100,
    sets: 3,
    reps: 5,
    createdAt: '2026-06-01T10:05:00Z',
  },
  {
    id: '2',
    exercise: 'Bench Press',
    weightLbs: 80.5,
    sets: 4,
    reps: 8,
    createdAt: '2026-06-01T09:50:00Z',
  },
];

describe('HistoryTable', () => {
  it('renders column headers', () => {
    render(<HistoryTable logs={LOGS} isLoading={false} isError={false} />);
    expect(screen.getByRole('columnheader', { name: /date/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /exercise/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /weight/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /sets/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /reps/i })).toBeInTheDocument();
  });

  it('renders a row for each log entry', () => {
    render(<HistoryTable logs={LOGS} isLoading={false} isError={false} />);
    // 2 data rows + 1 header row = 3
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('cell', { name: 'Squat' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Bench Press' })).toBeInTheDocument();
  });

  it('renders empty state when logs is empty', () => {
    render(<HistoryTable logs={[]} isLoading={false} isError={false} />);
    expect(screen.getByText(/no workouts logged yet/i)).toBeInTheDocument();
  });

  it('renders loading indicator when isLoading is true', () => {
    render(<HistoryTable logs={[]} isLoading={true} isError={false} />);
    expect(screen.getByText(/loading history/i)).toBeInTheDocument();
  });

  it('renders error banner when isError is true', () => {
    render(<HistoryTable logs={[]} isLoading={false} isError={true} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/failed to load/i);
  });

  it('shows newest entry first (first log in array appears first in table)', () => {
    render(<HistoryTable logs={LOGS} isLoading={false} isError={false} />);
    const rows = screen.getAllByRole('row');
    // rows[0] is header, rows[1] is first data row
    expect(rows[1]).toHaveTextContent('Squat');
  });
});
