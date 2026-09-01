import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import {
  X,
  Settings,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface AppSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [businessName, setBusinessName] = useState('Punto Burger — food drinks & coffee')
  const [timezone, setTimezone] = useState('America/Argentina/Cordoba')
  const [maxImageMb, setMaxImageMb] = useState(10)
  const [maxDocMb, setMaxDocMb] = useState(20)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIsSaved(false)
      setActionError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setActionError(null)

    if (isSupabaseConfigured) {
      await (supabase.from('app_settings') as any).upsert([
        { key: 'business_name', value: { name: businessName }, description: 'Nombre oficial del local' },
        { key: 'timezone', value: { tz: timezone }, description: 'Zona horaria operativa' },
        { key: 'storage_limits', value: { max_image_mb: maxImageMb, max_doc_mb: maxDocMb }, description: 'Límites de adjuntos' }
      ])
    }

    setIsLoading(false)
    setIsSaved(true)
    setTimeout(() => {
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-[#E8E2D9] overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#F0EBE1] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C92A2A] text-white flex items-center justify-center shadow-md shadow-[#C92A2A]/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#18181B]">Configuración Operativa</h2>
              <p className="text-xs text-[#71717A]">Parámetros globales del negocio y del sistema</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {actionError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {isSaved && (
            <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>¡Configuración guardada exitosamente!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">
              Nombre Oficial del Negocio
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#18181B] focus:ring-2 focus:ring-[#C92A2A] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">
              Zona Horaria de Operación
            </label>
            <div className="relative">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B] outline-none"
              >
                <option value="America/Argentina/Cordoba">America/Argentina/Cordoba (GMT-3)</option>
                <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires (GMT-3)</option>
              </select>
            </div>
            <p className="text-[11px] text-[#71717A] mt-1">
              Todas las fechas de vencimiento y alertas se calculan en base a la hora de Córdoba.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">
                Límite Fotos (MB)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxImageMb}
                onChange={(e) => setMaxImageMb(Number(e.target.value))}
                className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">
                Límite PDFs (MB)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={maxDocMb}
                onChange={(e) => setMaxDocMb(Number(e.target.value))}
                className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#C92A2A] hover:bg-[#B02525] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{isLoading ? 'Guardando...' : 'Guardar Ajustes'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
