import React from 'react';

interface CanvasErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches WebGL / React Three Fiber initialization errors and renders the 2D fallback cleanly.
 */
export class CanvasErrorBoundary extends React.Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  public constructor(props: CanvasErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
