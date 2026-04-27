import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ""}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="border border-danger/40 bg-danger/5 text-danger rounded-md p-3 text-xs font-mono">
          <div className="font-semibold mb-1">Bir hata oluştu</div>
          <div className="opacity-80 break-words">{this.state.error?.message ?? "Unknown error"}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
