import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface ForgotPasswordModalProps {
  onBack: () => void
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onBack }) => {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email.trim()) {
      setErrorMsg('Ingresa tu correo electrónico.')
      return
    }

    setIsSubmitting(true)
    const result = await sendPasswordReset(email.trim())
    setIsSubmitting(false)

    if (result.success) {
      setIsSuccess(true)
    } else {
      setErrorMsg(result.error || 'No se pudo enviar el enlace de recuperación.')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#71717A] hover:text-[#18181B] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio de sesión</span>
        </button>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/5 border border-[#E8E2D9]">
          <h2 className="text-2xl font-black text-[#18181B] mb-2">Recuperar Contraseña</h2>
          <p className="text-sm text-[#71717A] mb-6">
            Ingresa tu correo institucional de Punto Burger y te enviaremos un enlace seguro para restablecer tu clave.
          </p>

          {isSuccess ? (
            <div className="p-6 rounded-2xl bg-green-50 border border-green-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#16A34A] mx-auto" />
              <h3 className="text-base font-bold text-green-900">¡Enlace enviado!</h3>
              <p className="text-sm text-green-700">
                Hemos enviado un correo a <strong className="font-semibold">{email}</strong> con las instrucciones. Revisa tu bandeja de entrada o spam.
              </p>
              <button
                onClick={onBack}
                className="mt-4 w-full py-3 bg-[#18181B] hover:bg-black text-white text-sm font-bold rounded-xl transition-all"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#C92A2A]" />
                  <div className="font-medium">{errorMsg}</div>
                </div>
              )}

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
                    placeholder="usuario@puntoburger.com"
                    className="w-full pl-11 pr-4 py-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-[#18181B] text-base placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-[#C92A2A] hover:bg-[#B02525] text-white font-bold text-base rounded-2xl shadow-lg shadow-[#C92A2A]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando enlace...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Enviar Enlace de Recuperación</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
