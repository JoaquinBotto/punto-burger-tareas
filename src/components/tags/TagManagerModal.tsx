import React, { useState, useEffect } from 'react'
import type { Tag } from '../../types'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import {
  X,
  Tag as TagIcon,
  Plus,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface TagManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onTagsUpdated?: () => void
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  onTagsUpdated
}) => {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#C92A2A')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadTags = async () => {
    setIsLoading(true)
    if (!isSupabaseConfigured) {
      setTags([])
      setIsLoading(false)
      return
    }

    const { data } = await (supabase.from('tags') as any)
      .select('*')
      .order('name', { ascending: true })

    setTags(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadTags()
      setNewTagName('')
      setActionError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newTagName.trim()
    if (!trimmed) return

    // Case-insensitive duplicate check
    if (tags.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setActionError('Ya existe una etiqueta con este nombre.')
      return
    }

    setIsSubmitting(true)
    setActionError(null)

    const { error } = await (supabase.from('tags') as any)
      .insert({
        name: trimmed,
        color: newTagColor
      })

    setIsSubmitting(false)

    if (error) {
      setActionError(error.message || 'No se pudo crear la etiqueta.')
    } else {
      setNewTagName('')
      loadTags()
      onTagsUpdated?.()
    }
  }

  const handleDelete = async (tagId: string) => {
    setActionError(null)
    const { error } = await supabase.from('tags').delete().eq('id', tagId)
    if (error) {
      setActionError(error.message || 'No se pudo eliminar la etiqueta.')
    } else {
      loadTags()
      onTagsUpdated?.()
    }
  }

  const PRESET_COLORS = ['#C92A2A', '#E03131', '#F76707', '#FCC419', '#51CF66', '#20C997', '#228BE6', '#7048E8', '#BE4BDB', '#868E96']

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-[#E8E2D9] overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#F0EBE1] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C92A2A] text-white flex items-center justify-center shadow-md shadow-[#C92A2A]/20">
              <TagIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#18181B]">Administrador de Etiquetas</h2>
              <p className="text-xs text-[#71717A]">Clasificación transversal de tareas operativas</p>
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

        {/* Action Error Alert */}
        {actionError && (
          <div className="m-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Create Form */}
        <form onSubmit={handleCreate} className="p-5 border-b border-[#F0EBE1] space-y-3 bg-[#FAF7F2]/50">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A]">
            Crear Nueva Etiqueta
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Nombre de la etiqueta..."
              className="flex-1 p-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#18181B] focus:ring-2 focus:ring-[#C92A2A] outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newTagName.trim()}
              className="px-4 py-2.5 bg-[#C92A2A] hover:bg-[#B02525] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Guardando...' : 'Agregar'}</span>
            </button>
          </div>

          {/* Color Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewTagColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${newTagColor === c ? 'scale-115 border-zinc-900 ring-2 ring-[#C92A2A]/20' : 'border-white'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </form>

        {/* Tags List */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#71717A] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#C92A2A]" />
              <span>Cargando etiquetas...</span>
            </div>
          ) : tags.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#71717A]">
              No hay etiquetas registradas.
            </div>
          ) : (
            tags.map(t => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.color || '#C92A2A' }} />
                  <span className="font-bold text-[#18181B]">{t.name}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Eliminar etiqueta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
