import React, { useState } from 'react'
import type { TaskStatus } from '../../types'
import { AlertCircle, Lock, Users, XCircle, Clock } from 'lucide-react'

interface StateChangeModalProps {
  isOpen: boolean
  targetStatus: TaskStatus
  taskTitle: string
  onConfirm: (extraData: {
    blocked_reason?: string
    third_party_name?: string
    third_party_reason?: string
    third_party_promised_date?: string
    third_party_contact?: string
    cancel_reason?: string
  }) => void
  onCancel: () => void
  isLoading?: boolean
}

export const StateChangeModal: React.FC<StateChangeModalProps> = ({
  isOpen,
  targetStatus,
  taskTitle,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const [blockedReason, setBlockedReason] = useState('')
  const [tpName, setTpName] = useState('')
  const [tpReason, setTpReason] = useState('')
  const [tpDate, setTpDate] = useState('')
  const [tpContact, setTpContact] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (targetStatus === 'bloqueada') {
      if (!blockedReason.trim()) {
        setValidationError('Por favor ingresa el motivo del bloqueo.')
        return
      }
      onConfirm({ blocked_reason: blockedReason.trim() })
      return
    }

    if (targetStatus === 'esperando_tercero') {
      if (!tpName.trim() || !tpReason.trim()) {
        setValidationError('Debes indicar el nombre del tercero y qué se está esperando.')
        return
      }
      onConfirm({
        third_party_name: tpName.trim(),
        third_party_reason: tpReason.trim(),
        third_party_promised_date: tpDate || undefined,
        third_party_contact: tpContact.trim() || undefined
      })
      return
    }

    if (targetStatus === 'cancelada') {
      if (!cancelReason.trim()) {
        setValidationError('Indica el motivo por el cual se cancela la tarea.')
        return
      }
      onConfirm({ cancel_reason: cancelReason.trim() })
      return
    }

    onConfirm({})
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#E8E2D9] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-zinc-100 text-[#18181B] flex-shrink-0">
            {targetStatus === 'bloqueada' && <Lock className="w-6 h-6 text-[#DC2626]" />}
            {targetStatus === 'esperando_tercero' && <Users className="w-6 h-6 text-[#4F46E5]" />}
            {targetStatus === 'cancelada' && <XCircle className="w-6 h-6 text-[#71717A]" />}
            {targetStatus === 'en_revision' && <Clock className="w-6 h-6 text-[#7C3AED]" />}
          </div>
          <div>
            <h3 className="text-xl font-black text-[#18181B]">
              {targetStatus === 'bloqueada' && 'Marcar Tarea como Bloqueada'}
              {targetStatus === 'esperando_tercero' && 'Esperando a un Tercero'}
              {targetStatus === 'cancelada' && 'Cancelar Tarea'}
              {targetStatus === 'en_revision' && 'Enviar a Revisión'}
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5 line-clamp-1">
              {taskTitle}
            </p>
          </div>
        </div>

        {validationError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#C92A2A]" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Bloqueada Fields */}
          {targetStatus === 'bloqueada' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-2">
                Motivo del Bloqueo <span className="text-[#C92A2A]">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                placeholder="Ej: Falta que el electricista coloque la térmica antes de conectar la máquina."
                className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white resize-none"
              />
            </div>
          )}

          {/* Esperando Tercero Fields */}
          {targetStatus === 'esperando_tercero' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">
                  Nombre del Proveedor o Profesional <span className="text-[#C92A2A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tpName}
                  onChange={(e) => setTpName(e.target.value)}
                  placeholder="Ej: Carpintería San Martín / Distribuidora X"
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">
                  ¿Qué se está esperando? <span className="text-[#C92A2A]">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={tpReason}
                  onChange={(e) => setTpReason(e.target.value)}
                  placeholder="Ej: Entrega de las mesadas de acero inoxidable pulidas."
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">
                    Fecha Prometida (Opcional)
                  </label>
                  <input
                    type="date"
                    value={tpDate}
                    onChange={(e) => setTpDate(e.target.value)}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">
                    Teléfono / Contacto
                  </label>
                  <input
                    type="text"
                    value={tpContact}
                    onChange={(e) => setTpContact(e.target.value)}
                    placeholder="+54 9 351 ..."
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>
              </div>
            </>
          )}

          {/* Cancelada Fields */}
          {targetStatus === 'cancelada' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-2">
                Motivo de Cancelación <span className="text-[#C92A2A]">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ej: Se reemplazó por otro modelo de equipo / no es necesario para la apertura."
                className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:bg-white resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-4 border-t border-[#F0EBE1]">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-[#E8E2D9] hover:bg-[#FAF7F2] text-[#71717A] hover:text-[#18181B] font-bold text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-[#18181B] hover:bg-black text-white font-bold text-sm shadow-md transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Confirmar Estado'}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
