import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Lock, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react'

interface UpdatePasswordModalProps {
  onSuccess: () => void
}

export const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({ onSuccess }) => {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)
    const result = await updatePassword(password)
    setIsSubmitting(false)

    if (result.success) {
      onSuccess()
    } else {
      setErrorMsg(result.error || 'No se pudo actualizar la contraseña.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8E2D9] animate-in zoom-in-95">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFECEC] text-[#C92A2A] mb-4">
          <KeyRound className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#18181B] mb-2">Establecer Nueva Contraseña</h2>
        <p className="text-sm text-[#71717A] mb-6">
          Por favor ingresa tu nueva contraseña segura para acceder a Punto Burger | Tareas.
        </p>

        {errorMsg && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#C92A2A]" />
            <div className="font-medium">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-2">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-2">
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
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Guardar y Continuar</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
