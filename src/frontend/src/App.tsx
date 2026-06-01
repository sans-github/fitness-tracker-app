import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkoutPage } from './features/workout/WorkoutPage';
import logger from './lib/logger';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('react_error_boundary', error, {
      componentStack: info.componentStack ?? '',
      page: window.location.pathname,
    });
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">Something went wrong. Please refresh the page.</div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <WorkoutPage />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
