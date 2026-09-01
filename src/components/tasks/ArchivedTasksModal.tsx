import React, { useState } from 'react'
import type { TaskWithDetails } from '../../types'
import { taskService } from '../../services/taskService'
import {
  X,
  Archive,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface ArchivedTasksModalProps {
  isOpen: boolean
  tasks: TaskWithDetails[]
  onClose: () => void
  onTaskRestored?: () => void
}

export const ArchivedTasksModal: React.FC<ArchivedTasksModalProps> = ({
  isOpen,
  tasks,
  onClose,
  onTaskRestored
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  if (!isOpen) return null

  const archivedTasks = tasks.filter(t => Boolean(t.archived_at))
  const filtered = archivedTasks.filter(t => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return t.title.toLowerCase().includes(q) || (t.area?.name && t.area.name.toLowerCase().includes(q))
  })

  const handleRestore = async (taskId: string) => {
    setActionError(null)
    setIsRestoringId(taskId)
    const res = await taskService.restoreTask(taskId)
    setIsRestoringId(null)
    if (res.success) {
      onTaskRestored?.()
    } else {
      setActionError(res.error || 'No se pudo restaurar la tarea.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-[#E8E2D9] overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#F0EBE1] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-700 text-white flex items-center justify-center shadow-md">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#18181B]">Tareas Archivadas</h2>
              <p className="text-xs text-[#71717A]">{archivedTasks.length} tareas archivadas en el historial</p>
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

        {/* Search Bar */}
        <div className="p-5 border-b border-[#F0EBE1]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar entre tareas archivadas..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-xs text-[#18181B] focus:ring-2 focus:ring-[#C92A2A] outline-none"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#71717A] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
              <p className="font-bold text-[#18181B]">No hay tareas archivadas coincidentes</p>
              <p className="text-[11px]">Las tareas archivadas no se eliminan y pueden ser restauradas en cualquier momento.</p>
            </div>
          ) : (
            filtered.map(t => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {t.area && (
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
                        style={{ backgroundColor: t.area.color || '#C92A2A' }}
                      >
                        {t.area.name}
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold text-zinc-500">
                      {t.priority}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#18181B] truncate">{t.title}</h4>
                  <p className="text-[11px] text-[#71717A]">
                    Archivada el {t.archived_at ? new Date(t.archived_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRestore(t.id)}
                  disabled={isRestoringId === t.id}
                  className="px-3 py-2 bg-white hover:bg-amber-50 border border-[#E8E2D9] text-amber-900 font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Restaurar tarea al tablero principal"
                >
                  {isRestoringId === t.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Restaurar</span>
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
