import React from 'react'
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'success'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
          btn: 'bg-[#C92A2A] hover:bg-[#B02525] text-white shadow-red-500/25',
          bgIcon: 'bg-red-100'
        }
      case 'success':
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-green-600" />,
          btn: 'bg-[#16A34A] hover:bg-green-700 text-white shadow-green-500/25',
          bgIcon: 'bg-green-100'
        }
      default:
        return {
          icon: <ShieldAlert className="w-8 h-8 text-amber-600" />,
          btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/25',
          bgIcon: 'bg-amber-100'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8E2D9] animate-in zoom-in-95">
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${styles.bgIcon} mb-4`}>
          {styles.icon}
        </div>
        
        <h3 className="text-xl font-black text-[#18181B] mb-2">{title}</h3>
        <p className="text-sm text-[#71717A] mb-6 leading-relaxed">{message}</p>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-[#E8E2D9] hover:bg-[#FAF7F2] text-[#71717A] hover:text-[#18181B] font-bold text-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-1/2 py-3 px-4 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 ${styles.btn}`}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
