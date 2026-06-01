import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/setup';
import { ExerciseCard } from './ExerciseCard';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function renderCard(name = 'Squat') {
  return render(<ExerciseCard exerciseName={name} />, { wrapper });
}

describe('ExerciseCard', () => {
  it('renders exercise name, three labeled inputs, and Log button', () => {
    renderCard();
    expect(screen.getByText('Squat')).toBeInTheDocument();
    expect(screen.getByLabelText(/weight \(lbs\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sets/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reps/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log/i })).toBeInTheDocument();
  });

  it('shows all three errors when Log clicked with empty inputs', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole('button', { name: /log/i }));
    expect(screen.getByText(/weight is required/i)).toBeInTheDocument();
    expect(screen.getByText(/sets is required/i)).toBeInTheDocument();
    expect(screen.getByText(/reps is required/i)).toBeInTheDocument();
  });

  it('shows only weight error when weight is 0', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.type(screen.getByLabelText(/weight \(lbs\)/i), '0');
    await user.type(screen.getByLabelText(/sets/i), '3');
    await user.type(screen.getByLabelText(/reps/i), '5');
    await user.click(screen.getByRole('button', { name: /log/i }));
    expect(screen.getByText(/weight is required/i)).toBeInTheDocument();
    expect(screen.queryByText(/sets is required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reps is required/i)).not.toBeInTheDocument();
  });

  it('shows only sets error when sets < 1', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.type(screen.getByLabelText(/weight \(lbs\)/i), '100');
    await user.type(screen.getByLabelText(/sets/i), '0');
    await user.type(screen.getByLabelText(/reps/i), '5');
    await user.click(screen.getByRole('button', { name: /log/i }));
    expect(screen.queryByText(/weight is required/i)).not.toBeInTheDocument();
    expect(screen.getByText(/sets is required/i)).toBeInTheDocument();
    expect(screen.queryByText(/reps is required/i)).not.toBeInTheDocument();
  });

  it('shows only reps error when reps < 1', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.type(screen.getByLabelText(/weight \(lbs\)/i), '100');
    await user.type(screen.getByLabelText(/sets/i), '3');
    await user.type(screen.getByLabelText(/reps/i), '0');
    await user.click(screen.getByRole('button', { name: /log/i }));
    expect(screen.queryByText(/weight is required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sets is required/i)).not.toBeInTheDocument();
    expect(screen.getByText(/reps is required/i)).toBeInTheDocument();
  });

  it('fires POST mutation and clears form on success', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.type(screen.getByLabelText(/weight \(lbs\)/i), '100');
    await user.type(screen.getByLabelText(/sets/i), '3');
    await user.type(screen.getByLabelText(/reps/i), '5');
    await user.click(screen.getByRole('button', { name: /log/i }));
    await waitFor(() => {
      expect((screen.getByLabelText(/weight \(lbs\)/i) as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText(/sets/i) as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText(/reps/i) as HTMLInputElement).value).toBe('');
    });
  });

  it('shows loading state while mutation is pending', async () => {
    // Hold the POST response open so we can observe the pending state
    server.use(
      http.post('/api/v1/workout-logs', async () => {
        await new Promise(() => {/* never resolves */});
        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();
    renderCard();
    await user.type(screen.getByLabelText(/weight \(lbs\)/i), '100');
    await user.type(screen.getByLabelText(/sets/i), '3');
    await user.type(screen.getByLabelText(/reps/i), '5');
    await user.click(screen.getByRole('button', { name: /^log$/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logging\.\.\./i })).toBeDisabled();
    });
  });

  it('shows error banner when mutation fails', async () => {
    server.use(
      http.post('/api/v1/workout-logs', () => HttpResponse.json({}, { status: 500 })),
    );
    const user = userEvent.setup();
    renderCard();
    await user.type(screen.getByLabelText(/weight \(lbs\)/i), '100');
    await user.type(screen.getByLabelText(/sets/i), '3');
    await user.type(screen.getByLabelText(/reps/i), '5');
    await user.click(screen.getByRole('button', { name: /log/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert', { name: undefined })).toHaveTextContent(/failed to log/i);
    });
  });

  it('sets aria-invalid and aria-describedby on weight input when error present', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole('button', { name: /log/i }));
    const input = screen.getByLabelText(/weight \(lbs\)/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'squat-weight-err');
  });
});
