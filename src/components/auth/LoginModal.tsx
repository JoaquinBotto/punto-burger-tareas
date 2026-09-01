import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Lock, Mail, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import puntoBurgerLogo from '../../assets/brand/punto-burger-logo.png'

interface LoginModalProps {
  onForgotPassword?: () => void
}

export const LoginModal: React.FC<LoginModalProps> = ({ onForgotPassword }) => {
  const { login, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!email.trim() || !password) {
      setLocalError('Por favor completa todos los campos.')
      return
    }

    setIsSubmitting(true)
    const result = await login(email.trim().toLowerCase(), password)
    setIsSubmitting(false)

    if (!result.success && result.error) {
      setLocalError(result.error)
    }
  }

  const activeError = localError || error

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8">
      {/* Container */}
      <div className="w-full max-w-md">
        
        {/* Official Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src={puntoBurgerLogo}
              alt="Punto Burger — food drinks & coffee"
              className="h-16 sm:h-20 w-auto object-contain max-w-full drop-shadow-xs"
            />
          </div>
          <div className="inline-block mt-1 px-3.5 py-0.5 bg-[#FAF0F0] text-[#C92A2A] rounded-full text-xs font-bold tracking-wider uppercase border border-[#F5D0D0]">
            Tablero Operativo & Tareas
          </div>
          <p className="mt-2 text-xs sm:text-sm text-[#71717A]">
            Ingresa con tus credenciales de equipo para continuar
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/5 border border-[#E8E2D9]">
          
          {/* Active Error Alert */}
          {activeError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#C92A2A]" />
              <div className="flex-1 font-medium">{activeError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A1A1AA]">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@puntoburger.com"
                  className="w-full pl-11 pr-4 py-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-[#18181B] text-sm sm:text-base placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A]">
                  Contraseña
                </label>
                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs font-semibold text-[#C92A2A] hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu clave?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A1A1AA]">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-[#18181B] text-sm sm:text-base placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white transition-all"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-4 px-6 bg-[#C92A2A] hover:bg-[#B02525] active:scale-[0.99] text-white font-bold text-base rounded-2xl shadow-lg shadow-[#C92A2A]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Invitation Notice */}
          <div className="mt-6 pt-6 border-t border-[#F0EBE1] text-center">
            <p className="text-xs text-[#71717A] leading-relaxed">
              El acceso es <strong className="text-[#18181B]">exclusivo por invitación</strong> del administrador. Si aún no tienes usuario, solicita que te envíen la invitación por correo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-[#A1A1AA]">
          © {new Date().getFullYear()} Punto Burger • food drinks & coffee
        </p>
      </div>
    </div>
  )
}
