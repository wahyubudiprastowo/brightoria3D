import React from 'react';

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '', stack: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error && error.stack ? error.stack : '';
    return { hasError: true, message, stack };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Brightoria AppErrorBoundary caught:', error);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '', stack: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-crash-screen">
          <div className="app-crash-box">
            <h2>Terjadi kendala teknis</h2>
            <p>
              Aplikasi mengalami error dan berhenti sementara. Progres Anda tetap tersimpan
              otomatis di perangkat ini.
            </p>
            <button className="primary" onClick={this.handleReload}>
              Muat ulang aplikasi
            </button>
            <details>
              <summary>Detail teknis (untuk dilaporkan)</summary>
              <pre>
                {this.state.message}
                {'\n\n'}
                {this.state.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
