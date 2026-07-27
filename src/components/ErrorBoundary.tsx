import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  declare props: Props;

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-red-50 text-red-900 border border-red-200 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Ocorreu um erro inesperado!</h2>
          <p className="font-mono text-sm mb-4">{this.state.error?.message}</p>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
            onClick={() => window.location.reload()}
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
