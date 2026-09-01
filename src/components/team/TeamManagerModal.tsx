import React, { useState, useEffect } from 'react'
import type { Profile, UserRole } from '../../types'
import { profileService } from '../../services/profileService'
import { X, UserPlus, Users, Loader2, AlertCircle, CheckCircle2, UserCheck, UserX } from 'lucide-react'

interface TeamManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onTeamUpdated?: () => void
}

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({
  isOpen,
  onClose,
  onTeamUpdated
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Invitation Form
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('responsable')
  const [phone, setPhone] = useState('')

  const loadProfiles = async () => {
    setIsLoading(true)
    const data = await profileService.getProfiles(false)
    setProfiles(data)
    setIsLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadProfiles()
      setErrorMsg(null)
      setSuccessMsg(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!email.trim() || !fullName.trim()) {
      setErrorMsg('El correo y el nombre son obligatorios.')
      return
    }

    setIsSubmitting(true)
    const result = await profileService.inviteUser({
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      role,
      phone: phone.trim() || undefined
    })
    setIsSubmitting(false)

    if (result.success) {
      setSuccessMsg(`Invitación enviada con éxito a ${email.trim()}.`)
      setEmail('')
      setFullName('')
      setPhone('')
      loadProfiles()
      onTeamUpdated?.()
    } else {
      setErrorMsg(result.error || 'Error al enviar la invitación.')
    }
  }

  const handleToggleActive = async (profileId: string, currentStatus: boolean) => {
    await profileService.toggleUserActive(profileId, !currentStatus)
    loadProfiles()
    onTeamUpdated?.()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E8E2D9] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#F0EBE1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFECEC] text-[#C92A2A] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#18181B]">Equipo de Punto Burger</h2>
              <p className="text-xs text-[#71717A]">Invitaciones y roles de acceso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#18181B] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#C92A2A]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Invitation Form */}
          <form onSubmit={handleInvite} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#18181B]">
              <UserPlus className="w-4 h-4 text-[#C92A2A]" />
              <span>Invitar Nuevo Integrante</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre completo (ej: Responsable Punto Burger)"
                className="w-full p-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A]"
              />

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                className="w-full p-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full p-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs font-bold text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A]"
              >
                <option value="responsable">Responsable (Gestión operativa)</option>
                <option value="colaborador">Colaborador (Ejecución de tareas)</option>
                <option value="admin">Administrador (Control total)</option>
              </select>

              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Teléfono / WhatsApp (opcional)"
                className="w-full p-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#C92A2A] hover:bg-[#B02525] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando invitación oficial...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Enviar Invitación por Correo</span>
                </>
              )}
            </button>
          </form>

          {/* Members List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
              Integrantes Registrados ({profiles.length})
            </h3>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#71717A] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#C92A2A]" />
                <span>Cargando integrantes...</span>
              </div>
            ) : profiles.length === 0 ? (
              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 text-center text-xs text-[#71717A]">
                No hay otros integrantes registrados aún.
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map(p => (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                      !p.is_active
                        ? 'bg-zinc-100 border-zinc-200 text-zinc-500'
                        : 'bg-white border-[#E8E2D9] text-[#18181B]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#C92A2A] text-white text-xs flex items-center justify-center font-black flex-shrink-0">
                        {p.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <span className="font-bold block truncate">{p.full_name}</span>
                        <span className="text-[11px] text-[#71717A] block truncate">{p.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.role === 'admin'
                          ? 'bg-red-100 text-[#C92A2A]'
                          : p.role === 'responsable'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {p.role}
                      </span>

                      {p.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p.id, p.is_active)}
                          className="p-1.5 rounded-lg hover:bg-[#FAF7F2] text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                          title={p.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {p.is_active ? <UserX className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-600" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
