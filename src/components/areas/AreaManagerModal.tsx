import React, { useState } from 'react'
import type { Area } from '../../types'
import { areaService } from '../../services/areaService'
import { X, Plus, Archive, RotateCcw, Folder, Loader2, AlertCircle } from 'lucide-react'

interface AreaManagerModalProps {
  isOpen: boolean
  areas: Area[]
  onClose: () => void
  onAreasUpdated: () => void
}

export const AreaManagerModal: React.FC<AreaManagerModalProps> = ({
  isOpen,
  areas,
  onClose,
  onAreasUpdated
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#C92A2A')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  if (!isOpen) return null

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!name.trim()) {
      setErrorMsg('Ingresa el nombre del área.')
      return
    }

    setIsSubmitting(true)
    const result = await areaService.createArea({
      name: name.trim(),
      description: description.trim() || null,
      color,
      icon: 'Folder',
      display_order: areas.length + 1,
      is_archived: false
    })
    setIsSubmitting(false)

    if (result.success) {
      setName('')
      setDescription('')
      onAreasUpdated()
    } else {
      setErrorMsg(result.error || 'No se pudo crear el área.')
    }
  }

  const handleToggleArchive = async (areaId: string, currentArchived: boolean) => {
    await areaService.toggleArchiveArea(areaId, !currentArchived)
    onAreasUpdated()
  }

  const filteredAreas = showArchived ? areas : areas.filter(a => !a.is_archived)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E8E2D9] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#F0EBE1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFECEC] text-[#C92A2A] flex items-center justify-center">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#18181B]">Gestión de Áreas del Proyecto</h2>
              <p className="text-xs text-[#71717A]">Punto Burger • Administrador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#18181B] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#C92A2A]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* New Area Form */}
          <form onSubmit={handleCreateArea} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#18181B] block">
              Agregar Nueva Área
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del área (ej: Sonido y Luces)"
                  className="w-full p-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-9 p-0.5 rounded-lg border border-[#E8E2D9] cursor-pointer bg-white"
                  title="Color representativo"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-3 bg-[#C92A2A] hover:bg-[#B02525] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Agregar</span>
                </button>
              </div>
            </div>

            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción breve (opcional)"
              className="w-full p-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A]"
            />
          </form>

          {/* Area List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                Áreas Registradas ({filteredAreas.length})
              </h3>
              <label className="flex items-center gap-1.5 text-xs text-[#71717A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="rounded text-[#C92A2A] focus:ring-[#C92A2A]"
                />
                <span>Ver archivadas</span>
              </label>
            </div>

            <div className="space-y-2">
              {filteredAreas.map(a => (
                <div
                  key={a.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                    a.is_archived
                      ? 'bg-zinc-100 border-zinc-200 text-zinc-500'
                      : 'bg-white border-[#E8E2D9] text-[#18181B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: a.color || '#C92A2A' }}
                    />
                    <div className="truncate">
                      <span className="font-bold block truncate">{a.name}</span>
                      {a.description && <span className="text-[11px] text-[#71717A] block truncate">{a.description}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(a.id, a.is_archived)}
                      className="p-1.5 rounded-lg hover:bg-[#FAF7F2] text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                      title={a.is_archived ? 'Restaurar área' : 'Archivar área'}
                    >
                      {a.is_archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
