import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[App] Uncaught render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh bg-surface px-6 py-16 text-ink dark:bg-dark-bg dark:text-cream">
          <div className="mx-auto max-w-lg rounded-2xl border border-rose/30 bg-white p-8 shadow-soft dark:border-rose/20 dark:bg-dark-elevated dark:shadow-soft-dark">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep dark:text-rose">
              Something broke
            </p>
            <h1 className="mt-3 font-display text-2xl font-semibold">
              The app hit an unexpected error
            </h1>
            <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-cream/50 p-3 text-xs text-ink/90 dark:bg-dark-surface dark:text-cream/90">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              className="mt-6 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-cream dark:bg-cream dark:text-ink"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
