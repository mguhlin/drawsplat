import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('GridSplat recovered from a render error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-shell" role="alert">
          <h1>Oops. Your work is still in this browser.</h1>
          <p>
            GridSplat can reload the app and restore the latest autosaved sheet.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload GridSplat
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
