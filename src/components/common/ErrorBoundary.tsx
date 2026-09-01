import { Component, type ErrorInfo, type ReactNode } from 'react'
import puntoBurgerLogo from '../../assets/brand/punto-burger-logo.png'
import { RotateCcw, AlertTriangle, LogOut } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught React exception:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleLogout = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } finally {
      window.location.href = '/'
    }
  }

  public render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV

      return (
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 selection:bg-[#C92A2A] selection:text-white">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-[#E8E2D9] text-center space-y-5 animate-in fade-in">
            
            <div className="flex justify-center mb-1">
              <img
                src={puntoBurgerLogo}
                alt="Punto Burger"
                className="h-14 w-auto object-contain"
              />
            </div>

            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#C92A2A] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-[#18181B]">
                {this.props.fallbackTitle || 'Ocurrió un error inesperado'}
              </h2>
              <p className="text-xs text-[#71717A] leading-relaxed">
                No pudimos completar la operación. Podés intentar recargar o reintentar sin perder tus datos.
              </p>
            </div>

            {isDev && this.state.error && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-left text-[11px] font-mono text-red-900 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-[#C92A2A] hover:bg-[#B02525] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Recargar Aplicación</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-[#FAF7F2] hover:bg-[#F0EBE1] text-[#18181B] font-bold text-xs rounded-xl transition-all cursor-pointer border border-[#E8E2D9]"
              >
                Reintentar Render
              </button>

              <button
                type="button"
                onClick={this.handleLogout}
                className="w-full py-2 px-4 text-xs font-semibold text-[#71717A] hover:text-[#C92A2A] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>

          </div>
        </div>
      )
    }

    return this.props.children
  }
}
