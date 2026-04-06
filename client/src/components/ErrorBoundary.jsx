import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            const isDev = import.meta.env?.DEV;
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '100vh', padding: '2rem',
                    textAlign: 'center', background: 'var(--bg-base)', color: 'var(--text-primary)',
                    fontFamily: 'var(--font-primary)',
                }}>
                    {/* Error Icon */}
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2.2rem', marginBottom: '1.5rem',
                        boxShadow: '0 0 30px rgba(239,68,68,0.2)',
                    }}>
                        ⚠️
                    </div>

                    {/* Title */}
                    <h1 style={{
                        fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem',
                        color: 'var(--text-primary)',
                    }}>
                        Something went wrong
                    </h1>
                    <p style={{
                        marginBottom: '0.5rem', maxWidth: '480px',
                        color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem',
                    }}>
                        The application encountered an unexpected error. Don't worry — your data is safe.
                    </p>

                    {/* Suggestions */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 12, padding: '1rem 1.5rem', marginBottom: '2rem',
                        maxWidth: '400px', textAlign: 'left',
                    }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Try these steps:
                        </p>
                        {['Refresh the page', 'Clear your browser cache', 'Check your internet connection', 'Contact support if this persists'].map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <span style={{ color: 'var(--brand-primary)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span> {step}
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
                        <button onClick={this.handleRetry} style={{
                            padding: '0.6rem 1.5rem', background: 'var(--brand-primary)', color: '#000',
                            border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem',
                            cursor: 'pointer', transition: 'all 0.2s',
                        }}
                            onMouseOver={e => e.target.style.opacity = '0.85'}
                            onMouseOut={e => e.target.style.opacity = '1'}
                        >
                            🔄 Refresh Page
                        </button>
                        <button onClick={this.handleGoHome} style={{
                            padding: '0.6rem 1.5rem', background: 'transparent',
                            color: 'var(--text-secondary)', border: '1px solid var(--border-default)',
                            borderRadius: 10, fontWeight: 600, fontSize: '0.9rem',
                            cursor: 'pointer', transition: 'all 0.2s',
                        }}
                            onMouseOver={e => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.color = 'var(--brand-primary)'; }}
                            onMouseOut={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.color = 'var(--text-secondary)'; }}
                        >
                            🏠 Go to Dashboard
                        </button>
                    </div>

                    {/* Dev-only stack trace */}
                    {isDev && this.state.error && (
                        <details style={{
                            maxWidth: '800px', width: '100%', textAlign: 'left',
                            background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
                            borderRadius: 12, padding: '1rem', marginTop: '1rem', overflow: 'auto',
                        }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#fca5a5', marginBottom: '0.75rem', userSelect: 'none' }}>
                                🛠️ Developer Info (hidden in production)
                            </summary>
                            <pre style={{ fontSize: '0.75rem', color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                                {this.state.error.toString()}
                                {'\n\n'}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

