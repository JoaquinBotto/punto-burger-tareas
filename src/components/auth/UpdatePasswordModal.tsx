import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Lock, CheckCircle2, AlertCircle, Loader2, KeyRound, ArrowLeft } from 'lucide-react'
import puntoBurgerLogo from '../../assets/brand/punto-burger-logo.png'

interface UpdatePasswordModalProps {
  onSuccess: () => void
  onCancel?: () => void
  initialError?: string | null
}

export const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({
  onSuccess,
  onCancel,
  initialError
}) => {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdatedSuccess, setIsUpdatedSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError || null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifícalas.')
      return
    }

    setIsSubmitting(true)
    const result = await updatePassword(password)
    setIsSubmitting(false)

    if (result.success) {
      setIsUpdatedSuccess(true)
    } else {
      setErrorMsg(result.error || 'No se pudo actualizar la contraseña. Solicitá un nuevo enlace.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8E2D9] animate-in zoom-in-95 space-y-5">
        
        <div className="flex justify-center mb-1">
          <img
            src={puntoBurgerLogo}
            alt="Punto Burger"
            className="h-12 w-auto object-contain"
          />
        </div>

        {isUpdatedSuccess ? (
          <div className="p-6 rounded-2xl bg-green-50 border border-green-200 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-[#16A34A] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-black text-green-950">¡Contraseña actualizada!</h3>
              <p className="text-xs sm:text-sm text-green-800 leading-relaxed">
                Tu clave ha sido reestablecida exitosamente. Ya puedes acceder al sistema.
              </p>
            </div>
            <button
              type="button"
              onClick={onSuccess}
              className="w-full py-3.5 bg-[#18181B] hover:bg-black text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Ingresar al Tablero Operativo
            </button>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFECEC] text-[#C92A2A] mb-2 mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#18181B]">Establecer Nueva Contraseña</h2>
              <p className="text-xs sm:text-sm text-[#71717A]">
                Ingresa una contraseña segura para tu cuenta de Punto Burger.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#C92A2A]" />
                <div className="font-medium leading-snug">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5">
                  Nueva Contraseña (mínimo 6 caracteres)
                </label>
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
                    className="w-full pl-11 pr-4 py-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-[#18181B] text-base placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A1A1AA]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-[#18181B] text-base placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-4 px-6 bg-[#C92A2A] hover:bg-[#B02525] text-white font-bold text-base rounded-2xl shadow-lg shadow-[#C92A2A]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Guardando contraseña...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Guardar y Continuar</span>
                  </>
                )}
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full py-2.5 text-xs font-semibold text-[#71717A] hover:text-[#18181B] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al inicio de sesión</span>
                </button>
              )}
            </form>
          </>
        )}

      </div>
    </div>
  )
}
