import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface Props {
  children: ReactNode
  /** Cuando cambia, se limpia el error (p. ej. al navegar a otra ruta). */
  resetKey?: string
}

interface Estado {
  error: Error | null
}

/**
 * Atrapa los errores de renderizado de React: sin esto, un fallo en cualquier componente
 * deja la pantalla en blanco. Muestra un aviso con opción de reintentar o volver al inicio.
 */
export default class ErrorBoundary extends Component<Props, Estado> {
  state: Estado = { error: null }

  static getDerivedStateFromError(error: Error): Estado {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error de renderizado:', error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="container py-5 text-center" role="alert">
        <i className="bi bi-exclamation-triangle-fill text-danger fs-1" />
        <h1 className="h4 fw-bold mt-3">Algo salió mal</h1>
        <p className="text-muted mb-4">
          Ocurrió un error inesperado al mostrar esta pantalla. Puedes intentarlo de nuevo o volver al inicio.
        </p>
        <button type="button" className="btn btn-primary me-2" onClick={() => this.setState({ error: null })}>
          Reintentar
        </button>
        <a className="btn btn-outline-secondary" href="/">Ir al inicio</a>
      </div>
    )
  }
}

/** Boundary que se reinicia sola al cambiar de ruta (necesita estar dentro del BrowserRouter). */
export function ErrorBoundaryRuta({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
}
