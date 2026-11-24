import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): State {
    let displayMessage = error.message || 'An unexpected error occurred.'
    try {
      const parsed = JSON.parse(displayMessage) as { error?: string; operationType?: string }
      if (parsed?.error) {
        displayMessage = parsed.error.includes('Quota exceeded')
          ? 'Daily database quota exceeded. Please try again tomorrow.'
          : parsed.error
      }
    } catch {
      // keep raw message when not JSON
    }
    return { hasError: true, message: displayMessage }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary caught error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '1.5rem',
            background: '#060010',
            color: '#f8fafc',
          }}
        >
          <div
            style={{
              maxWidth: 460,
              width: '100%',
              padding: '2rem',
              borderRadius: 20,
              background: 'rgba(18, 15, 28, 0.9)',
              border: '1px solid rgba(248, 113, 113, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'grid', placeItems: 'center', color: '#f87171' }}>
              <AlertTriangle size={34} />
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.35rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
              {this.state.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 1.15rem',
                  borderRadius: 12,
                  background: '#a78bfa',
                  color: '#0a0014',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                <RotateCcw size={16} />
                Try again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
