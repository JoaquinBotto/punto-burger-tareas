import React, { useState, useEffect } from 'react'
import type { TaskWithDetails, TaskStatus, TaskPriority, Area, Profile } from '../../types'
import { taskService } from '../../services/taskService'
import { attachmentService } from '../../services/attachmentService'
import { useAuth } from '../../contexts/AuthContext'
import { formatDueDate, getTimeDifferenceDescription } from '../../lib/dateUtils'
import { ConfirmationModal } from '../common/ConfirmationModal'
import { StateChangeModal } from '../common/StateChangeModal'
import {
  X,
  CheckCircle2,
  Clock,
  Lock,
  Users,
  Plus,
  Trash2,
  Paperclip,
  MessageSquare,
  Archive,
  RotateCcw,
  CheckSquare,
  Square,
  Send,
  Camera,
  Link,
  Edit3,
  Check,
  Calendar,
  AlertCircle
} from 'lucide-react'

interface TaskDetailDrawerProps {
  task: TaskWithDetails | null
  allTasks: TaskWithDetails[]
  areas?: Area[]
  profiles?: Profile[]
  isOpen: boolean
  onClose: () => void
  onTaskUpdated: () => void
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  allTasks,
  areas = [],
  profiles = [],
  isOpen,
  onClose,
  onTaskUpdated
}) => {
  const { user, isAdmin } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'checklist' | 'comments' | 'attachments' | 'dependencies'>('checklist')
  
  // Edit mode state
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAreaId, setEditAreaId] = useState('')
  const [editPriority, setEditPriority] = useState<TaskPriority>('alta')
  const [editDueDate, setEditDueDate] = useState('')
  const [editDueTime, setEditDueTime] = useState('')
  const [editMainAssigneeId, setEditMainAssigneeId] = useState('')

  // Modals state
  const [showConfirmCritical, setShowConfirmCritical] = useState(false)
  const [showConfirmArchive, setShowConfirmArchive] = useState(false)
  const [showConfirmRestore, setShowConfirmRestore] = useState(false)
  const [stateModalTarget, setStateModalTarget] = useState<TaskStatus | null>(null)

  // Inputs
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [newComment, setNewComment] = useState('')
  const [selectedBlockingTaskId, setSelectedBlockingTaskId] = useState('')
  const [manualProgress, setManualProgress] = useState(task?.progress_percentage || 0)
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (task) {
      setEditTitle(task.title || '')
      setEditDescription(task.description || '')
      setEditAreaId(task.area_id || '')
      setEditPriority(task.priority || 'alta')
      setEditDueDate(task.due_date || '')
      setEditDueTime(task.due_time || '')
      setEditMainAssigneeId(task.main_assignee_id || '')
      setManualProgress(task.progress_percentage || 0)
      setIsEditingDetails(false)
      setActionError(null)
    }
  }, [task?.id, task?.version, task?.updated_at])

  // Checklist filtering & search
  const [checklistFilter, setChecklistFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [subtaskSearch, setSubtaskSearch] = useState('')

  if (!isOpen || !task) return null

  const isAssigned = task.main_assignee_id === user?.id || task.assignees?.some(a => a.id === user?.id)
  const canEdit = isAdmin || isAssigned
  const totalSubtasks = task.subtasks?.length || 0
  const isCompleted = task.status === 'completada'

  const displayedSubtasks = (task.subtasks || []).filter(st => {
    if (checklistFilter === 'pending' && st.is_completed) return false
    if (checklistFilter === 'completed' && !st.is_completed) return false
    if (subtaskSearch.trim()) {
      return st.title.toLowerCase().includes(subtaskSearch.toLowerCase())
    }
    return true
  })

  // Dependency Type state
  const [selectedDependencyType, setSelectedDependencyType] = useState<'blocking' | 'coordination'>('blocking')

  // Save Task Details (Title, Description, Area, Priority, Dates, Assignee)
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim()) {
      setActionError('El título no puede estar vacío.')
      return
    }
    if (!editAreaId) {
      setActionError('Debes seleccionar un área válida.')
      return
    }

    setActionError(null)
    setIsSaving(true)

    const res = await taskService.updateTaskDetails(
      task.id,
      {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        area_id: editAreaId,
        priority: editPriority,
        due_date: editDueDate || null,
        due_time: editDueTime || null,
        main_assignee_id: editMainAssigneeId || null
      },
      task.version
    )

    setIsSaving(false)

    if (res.success) {
      setIsEditingDetails(false)
      onTaskUpdated()
    } else {
      setActionError(res.error || 'No se pudo guardar la información de la tarea.')
    }
  }

  // Subtask Toggle
  const handleToggleSubtask = async (subtaskId: string, isCompletedVal: boolean) => {
    if (!canEdit) return
    setActionError(null)
    const res = await taskService.toggleSubtask(task.id, subtaskId, isCompletedVal)
    if (res.success) {
      onTaskUpdated()
    } else {
      setActionError(res.error || 'No se pudo actualizar el paso.')
    }
  }

  // Add Subtask
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim() || !canEdit) return
    setActionError(null)
    const res = await taskService.addSubtask(task.id, newSubtaskTitle.trim(), totalSubtasks + 1)
    if (res.success) {
      setNewSubtaskTitle('')
      onTaskUpdated()
    } else {
      setActionError(res.error || 'No se pudo agregar la subtarea.')
    }
  }

  // Delete Subtask
  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!canEdit) return
    setActionError(null)
    const res = await taskService.deleteSubtask(task.id, subtaskId)
    if (res.success) {
      onTaskUpdated()
    } else {
      setActionError(res.error || 'No se pudo eliminar la subtarea.')
    }
  }

  // Manual Progress Change
  const handleManualProgressCommit = async (val: number) => {
    if (!canEdit || totalSubtasks > 0) return
    setActionError(null)
    setManualProgress(val)
    const res = await taskService.updateTaskProgress(task.id, val)
    if (res.success) {
      onTaskUpdated()
    } else {
      setActionError(res.error || 'No se pudo actualizar el avance.')
    }
  }

  // Complete Task Action
  const handleCompleteClick = () => {
    if (task.priority === 'critica') {
      setShowConfirmCritical(true)
    } else {
      executeStatusChange('completada')
    }
  }

  const executeStatusChange = async (
    newStatus: TaskStatus,
    extra?: {
      blocked_reason?: string
      related_party?: string
      estimated_resolution_at?: string
      resolution_comment?: string
      third_party_name?: string
      third_party_reason?: string
      third_party_promised_date?: string
      third_party_contact?: string
    }
  ) => {
    setActionError(null)
    setIsSaving(true)
    const res = await taskService.updateTaskStatus(task.id, newStatus, undefined, extra, task.version)
    setIsSaving(false)
    if (res.success) {
      setShowConfirmCritical(false)
      setStateModalTarget(null)
      onTaskUpdated()
    } else {
      setActionError(res.error || 'No se pudo cambiar el estado de la tarea.')
    }
  }

  // Archive & Restore
  const handleArchive = async () => {
    if (!isAdmin) return
    setActionError(null)
    setIsSaving(true)
    const res = await taskService.archiveTask(task.id)
    setIsSaving(false)
    if (res.success) {
      setShowConfirmArchive(false)
      onTaskUpdated()
      onClose()
    } else {
      setActionError(res.error || 'No se pudo archivar la tarea.')
    }
  }

  const handleRestore = async () => {
    if (!isAdmin) return
    setActionError(null)
    setIsSaving(true)
    const res = await taskService.restoreTask(task.id)
    setIsSaving(false)
    if (res.success) {
      setShowConfirmRestore(false)
      onTaskUpdated()
    } else {
      setActionError(res.error || 'No se pudo restaurar la tarea.')
    }
  }

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setActionError(null)
    const res = await taskService.addComment(task.id, user?.id || '', newComment.trim())
    if (res.success) {
      setNewComment('')
      onTaskUpdated()
    } else {
      setActionError(res.error || 'No se pudo publicar el comentario.')
    }
  }

  // Add Dependency
  const handleAddDependency = async () => {
    if (!selectedBlockingTaskId || !canEdit) return
    setActionError(null)
    const res = await taskService.addDependency(task.id, selectedBlockingTaskId, selectedDependencyType)
    if (res.success) {
      setSelectedBlockingTaskId('')
      onTaskUpdated()
    } else {
      setActionError(res.error || 'No se pudo vincular la dependencia.')
    }
  }

  const handleRemoveDependency = async (depId: string) => {
    if (!canEdit) return
    setActionError(null)
    const res = await taskService.removeDependency(depId)
    if (res.success) {
      onTaskUpdated()
    } else {
      setActionError(res.error || 'No se pudo eliminar la dependencia.')
    }
  }

  // Attachment state
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeLightboxUrl, setActiveLightboxUrl] = useState<string | null>(null)

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !canEdit) return

    setActionError(null)
    setIsUploadingAttachment(true)
    setUploadProgress(10)

    const res = await attachmentService.uploadTaskAttachment(task.id, file, (p: number) => setUploadProgress(p))
    setIsUploadingAttachment(false)
    setUploadProgress(0)

    if (res.success) {
      onTaskUpdated()
    } else {
      setActionError(res.error || 'No se pudo subir el archivo adjunto.')
    }
  }

  const handleOpenAttachment = async (storagePath: string, mimeType?: string) => {
    const res = await attachmentService.getSignedUrl(storagePath, 3600)
    if (res.url) {
      if (mimeType?.startsWith('image/')) {
        setActiveLightboxUrl(res.url)
      } else {
        window.open(res.url, '_blank', 'noopener,noreferrer')
      }
    } else {
      setActionError(res.error || 'No se pudo generar el enlace seguro de descarga.')
    }
  }

  const handleDeleteAttachment = async (attId: string, storagePath: string) => {
    if (!canEdit) return
    setActionError(null)
    setIsSaving(true)
    const res = await attachmentService.deleteAttachment(attId, storagePath)
    setIsSaving(false)
    if (res.success) {
      onTaskUpdated()
    } else {
      setActionError(res.error || 'No se pudo eliminar el archivo adjunto.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl border-l border-[#E8E2D9] animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#F0EBE1] flex items-start justify-between gap-4 bg-[#FAF7F2]">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {task.area && (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: task.area.color || '#C92A2A' }}
                >
                  {task.area.name}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-[#C92A2A] border border-red-200">
                Prioridad {task.priority}
              </span>
              {task.archived_at && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-200 text-zinc-700">
                  Archivada
                </span>
              )}
            </div>

            {!isEditingDetails ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl sm:text-2xl font-black text-[#18181B] leading-tight">
                    {task.title}
                  </h2>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setIsEditingDetails(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-[#18181B] text-xs font-bold border border-[#E8E2D9] transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                      title="Editar información"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#C92A2A]" />
                      <span>Editar</span>
                    </button>
                  )}
                </div>

                {task.description && (
                  <p className="text-xs text-[#52525B] leading-relaxed whitespace-pre-line bg-white/70 p-3 rounded-xl border border-[#E8E2D9]">
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#71717A]">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{formatDueDate(task.due_date, task.due_time)}</span>
                    {task.due_date && (
                      <span className="font-semibold text-[#18181B]">
                        ({getTimeDifferenceDescription(task.due_date, task.due_time)})
                      </span>
                    )}
                  </p>

                  {task.main_assignee && (
                    <p className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-semibold text-[#18181B]">{task.main_assignee.full_name}</span>
                    </p>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveDetails} className="space-y-3 bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                    Título de la Tarea
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-bold text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                    Descripción / Detalle
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    placeholder="Detalles específicos para la apertura..."
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                      Área
                    </label>
                    <select
                      value={editAreaId}
                      onChange={(e) => setEditAreaId(e.target.value)}
                      className="w-full p-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
                    >
                      {areas.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                      Prioridad
                    </label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                      className="w-full p-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
                    >
                      <option value="critica">Crítica (Bloqueante)</option>
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                      Fecha Vencimiento
                    </label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full p-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#18181B]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                      Responsable Principal
                    </label>
                    <select
                      value={editMainAssigneeId}
                      onChange={(e) => setEditMainAssigneeId(e.target.value)}
                      className="w-full p-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#18181B]"
                    >
                      <option value="">Sin asignar</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D9]">
                  <button
                    type="button"
                    onClick={() => setIsEditingDetails(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-xl bg-[#C92A2A] hover:bg-[#B02525] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#18181B] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Error Banner if any */}
        {actionError && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="font-semibold">{actionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-xs text-red-600 hover:text-red-900 font-bold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Quick Action Bar */}
        <div className="p-3 sm:px-6 bg-white border-b border-[#F0EBE1] flex items-center gap-2 overflow-x-auto">
          {task.status !== 'en_progreso' && !isCompleted && (
            <button
              type="button"
              onClick={() => executeStatusChange('en_progreso')}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Comenzar Tarea</span>
            </button>
          )}

          {!isCompleted ? (
            <button
              type="button"
              onClick={handleCompleteClick}
              className="px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer flex-shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => executeStatusChange('en_progreso')}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reabrir Tarea</span>
            </button>
          )}

          {task.status !== 'bloqueada' && !isCompleted && (
            <button
              type="button"
              onClick={() => setStateModalTarget('bloqueada')}
              className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Marcar Bloqueada</span>
            </button>
          )}

          {task.status !== 'esperando_tercero' && !isCompleted && (
            <button
              type="button"
              onClick={() => setStateModalTarget('esperando_tercero')}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Esperando Tercero</span>
            </button>
          )}

          {isAdmin && (
            !task.archived_at ? (
              <button
                type="button"
                onClick={() => setShowConfirmArchive(true)}
                className="px-3 py-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ml-auto"
                title="Archivar tarea"
              >
                <Archive className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Archivar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmRestore(true)}
                className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar</span>
              </button>
            )
          )}
        </div>

        {/* Status Warnings */}
        {task.status === 'bloqueada' && task.blocked_reason && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-xs text-red-800 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Tarea Bloqueada: </span>
              <span>{task.blocked_reason}</span>
            </div>
          </div>
        )}

        {task.status === 'esperando_tercero' && task.third_party_name && (
          <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-200 text-xs text-indigo-900 flex items-start gap-2.5">
            <Users className="w-4 h-4 text-[#4F46E5] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Esperando a {task.third_party_name}: </span>
              <span>{task.third_party_reason}</span>
              {task.third_party_contact && <span className="block mt-0.5 font-semibold">Contacto: {task.third_party_contact}</span>}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-3 flex items-center gap-4 border-b border-[#F0EBE1] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'checklist' ? 'border-[#C92A2A] text-[#C92A2A]' : 'border-transparent text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Checklist ({task.subtasks?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'comments' ? 'border-[#C92A2A] text-[#C92A2A]' : 'border-transparent text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comentarios ({task.comments?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attachments')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'attachments' ? 'border-[#C92A2A] text-[#C92A2A]' : 'border-transparent text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>Adjuntos ({task.attachments?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dependencies')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dependencies' ? 'border-[#C92A2A] text-[#C92A2A]' : 'border-transparent text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Bloqueos ({task.dependencies?.length || 0})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* TAB 1: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-5">
              {/* Progress Summary Card */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9]">
                <div className="flex items-center justify-between text-xs font-bold text-[#18181B] mb-2">
                  <span>Progreso de la Tarea</span>
                  <span>{task.progress_percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#16A34A] rounded-full transition-all duration-300"
                    style={{ width: `${task.progress_percentage}%` }}
                  />
                </div>

                {/* Manual Slider if 0 Subtasks */}
                {totalSubtasks === 0 && (
                  <div className="mt-4 pt-3 border-t border-[#E8E2D9]">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-[#71717A] font-semibold">Ajustar avance manual:</span>
                      <span className="font-bold text-[#18181B]">{manualProgress}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      disabled={!canEdit}
                      value={manualProgress}
                      onChange={(e) => setManualProgress(Number(e.target.value))}
                      onMouseUp={() => handleManualProgressCommit(manualProgress)}
                      onTouchEnd={() => handleManualProgressCommit(manualProgress)}
                      className="w-full accent-[#C92A2A] cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Subtasks List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                    Pasos a Realizar ({task.subtasks?.filter(s => s.is_completed).length || 0}/{totalSubtasks})
                  </h4>

                  {/* Subtasks filter tabs */}
                  {totalSubtasks > 0 && (
                    <div className="flex items-center gap-1 self-start sm:self-auto bg-zinc-100 p-1 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setChecklistFilter('all')}
                        className={`px-2 py-0.5 rounded-lg transition-all ${
                          checklistFilter === 'all' ? 'bg-white text-[#18181B] shadow-2xs' : 'text-zinc-600'
                        }`}
                      >
                        Todas ({totalSubtasks})
                      </button>
                      <button
                        type="button"
                        onClick={() => setChecklistFilter('pending')}
                        className={`px-2 py-0.5 rounded-lg transition-all ${
                          checklistFilter === 'pending' ? 'bg-white text-[#C92A2A] shadow-2xs' : 'text-zinc-600'
                        }`}
                      >
                        Pendientes ({totalSubtasks - (task.subtasks?.filter(s => s.is_completed).length || 0)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setChecklistFilter('completed')}
                        className={`px-2 py-0.5 rounded-lg transition-all ${
                          checklistFilter === 'completed' ? 'bg-white text-green-700 shadow-2xs' : 'text-zinc-600'
                        }`}
                      >
                        Completadas ({task.subtasks?.filter(s => s.is_completed).length || 0})
                      </button>
                    </div>
                  )}
                </div>

                {/* Subtask search input for long checklists */}
                {totalSubtasks > 6 && (
                  <div className="relative">
                    <input
                      type="text"
                      value={subtaskSearch}
                      onChange={(e) => setSubtaskSearch(e.target.value)}
                      placeholder="Filtrar pasos dentro de la tarea..."
                      className="w-full pl-3 pr-8 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#C92A2A]"
                    />
                    {subtaskSearch && (
                      <button
                        type="button"
                        onClick={() => setSubtaskSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {totalSubtasks === 0 ? (
                  <div className="p-6 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center text-xs text-[#71717A]">
                    No hay subtareas registradas. Puedes agregar pasos a continuación para guiar al equipo.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                    {displayedSubtasks.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => handleToggleSubtask(st.id, !st.is_completed)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          st.is_completed
                            ? 'bg-green-50/50 border-green-200 text-green-900'
                            : 'bg-white border-[#E8E2D9] text-[#18181B] hover:border-[#C92A2A]/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {st.is_completed ? (
                            <CheckSquare className="w-5 h-5 text-[#16A34A] flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-[#A1A1AA] flex-shrink-0" />
                          )}
                          <span className={`text-xs sm:text-sm font-semibold leading-snug ${st.is_completed ? 'line-through text-zinc-500' : ''}`}>
                            {st.title}
                          </span>
                        </div>

                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSubtask(st.id)
                            }}
                            className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer flex-shrink-0"
                            title="Eliminar subtarea"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {displayedSubtasks.length === 0 && (
                      <div className="p-4 text-center text-xs text-zinc-400">
                        No hay pasos en este filtro.
                      </div>
                    )}
                  </div>
                )}

                {/* Add Subtask input */}
                {canEdit && (
                  <form onSubmit={handleAddSubtask} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Agregar nuevo paso al checklist..."
                      className="flex-1 p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-3 bg-[#C92A2A] hover:bg-[#B02525] text-white text-xs font-bold rounded-2xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COMMENTS */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {(!task.comments || task.comments.length === 0) ? (
                  <div className="p-8 text-center text-xs text-[#71717A]">
                    No hay comentarios en esta tarea. Agrega una nota o novedad para el equipo.
                  </div>
                ) : (
                  task.comments.map(c => (
                    <div key={c.id} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#18181B]">{c.profile?.full_name || 'Usuario'}</span>
                        <span className="text-[#A1A1AA] text-[11px]">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-[#3F3F46] leading-relaxed">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario o actualización..."
                  className="flex-1 p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-[#18181B] hover:bg-black text-white text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: ATTACHMENTS */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-[#71717A]">
                  Adjunta fotografías de avance, comprobantes o planos (Storage Privado).
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className={`flex-1 sm:flex-initial px-3.5 py-2.5 bg-[#C92A2A] hover:bg-[#B02525] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all ${isUploadingAttachment ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Camera className="w-4 h-4" />
                    <span>{isUploadingAttachment ? `Subiendo (${uploadProgress}%)...` : 'Tomar Foto / Subir'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleFileUpload}
                      disabled={isUploadingAttachment || !canEdit}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploadingAttachment && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-red-900">
                    <span>Subiendo y procesando archivo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C92A2A] rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {(!task.attachments || task.attachments.length === 0) ? (
                <div className="p-8 text-center text-xs text-[#71717A]">
                  No hay archivos adjuntos en esta tarea.
                </div>
              ) : (
                <div className="space-y-2">
                  {task.attachments.map(att => {
                    const isImg = att.file_type?.startsWith('image/')
                    return (
                      <div
                        key={att.id}
                        className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-between gap-3 text-xs"
                      >
                        <div
                          onClick={() => handleOpenAttachment(att.storage_path, att.file_type)}
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-white border border-[#E8E2D9] flex items-center justify-center flex-shrink-0 text-[#C92A2A] group-hover:scale-105 transition-transform">
                            {isImg ? <Camera className="w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-[#18181B] group-hover:text-[#C92A2A] transition-colors block truncate">
                              {att.file_name}
                            </span>
                            <span className="text-[#71717A] text-[11px] block">
                              {Math.round(att.file_size / 1024)} KB • {new Date(att.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenAttachment(att.storage_path, att.file_type)}
                            className="px-2.5 py-1.5 rounded-xl bg-white border border-[#E8E2D9] hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
                          >
                            Abrir
                          </button>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.id, att.storage_path)}
                              className="p-1.5 rounded-xl text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Eliminar adjunto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DEPENDENCIES */}
          {activeTab === 'dependencies' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                  Tareas que Bloquean esta Tarea
                </h4>

                {(!task.dependencies || task.dependencies.length === 0) ? (
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center text-xs text-[#71717A]">
                    Esta tarea no tiene dependencias previas obligatorias.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {task.dependencies.map(dep => (
                      <div
                        key={dep.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                          dep.dependency_type === 'coordination'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Lock
                            className={`w-4 h-4 flex-shrink-0 ${
                              dep.dependency_type === 'coordination' ? 'text-blue-700' : 'text-amber-700'
                            }`}
                          />
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`font-bold block truncate ${
                                  dep.dependency_type === 'coordination' ? 'text-blue-900' : 'text-amber-900'
                                }`}
                              >
                                {dep.blocking_task?.title || 'Tarea vinculada'}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                  dep.dependency_type === 'coordination'
                                    ? 'bg-blue-200/70 text-blue-800'
                                    : 'bg-amber-200/70 text-amber-900'
                                }`}
                              >
                                {dep.dependency_type === 'coordination' ? 'Coordinación' : 'Bloqueante'}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-medium block ${
                                dep.dependency_type === 'coordination' ? 'text-blue-700' : 'text-amber-700'
                              }`}
                            >
                              Estado: {dep.blocking_task?.status || 'pendiente'}
                            </span>
                          </div>
                        </div>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDependency(dep.id)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer flex-shrink-0"
                            title="Desvincular dependencia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Downstream Tasks Blocked by This Task */}
              <div className="space-y-2 pt-2 border-t border-[#F0EBE1]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                  Tareas Posteriores (Bloqueadas por esta tarea)
                </h4>

                {allTasks.filter(t => t.dependencies?.some(d => d.blocking_task_id === task.id)).length === 0 ? (
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center text-xs text-[#71717A]">
                    Ninguna otra tarea depende directamente de la finalización de esta.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allTasks
                      .filter(t => t.dependencies?.some(d => d.blocking_task_id === task.id))
                      .map(downstream => (
                        <div key={downstream.id} className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-200 flex items-center justify-between text-xs">
                          <span className="font-bold text-indigo-950 truncate">{downstream.title}</span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full uppercase">
                            {downstream.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Block History Log */}
              {task.blocks && task.blocks.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#F0EBE1]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                    Historial de Bloqueos ({task.blocks.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {task.blocks.map(b => (
                      <div key={b.id} className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${b.resolved_at ? 'text-zinc-700' : 'text-red-700'}`}>
                            {b.resolved_at ? 'Bloqueo Resuelto' : 'Bloqueo Activo'}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {new Date(b.blocked_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-zinc-700"><strong className="text-zinc-900">Motivo:</strong> {b.reason}</p>
                        {b.related_party && (
                          <p className="text-zinc-500 text-[11px]">Proveedor / Tercero: {b.related_party}</p>
                        )}
                        {b.resolved_at && (
                          <div className="text-[11px] text-green-700 pt-1 border-t border-zinc-200/60 flex items-center justify-between">
                            <span>Resuelto: {b.resolution_comment || 'Desbloqueada'}</span>
                            <span>{new Date(b.resolved_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canEdit && (
                <div className="pt-2 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A]">
                    Declarar nueva dependencia
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <select
                        value={selectedBlockingTaskId}
                        onChange={(e) => setSelectedBlockingTaskId(e.target.value)}
                        className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
                      >
                        <option value="">Seleccionar tarea vinculada...</option>
                        {allTasks
                          .filter(t => t.id !== task.id && !t.archived_at)
                          .map(t => (
                            <option key={t.id} value={t.id}>
                              {t.title} ({t.status})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={selectedDependencyType}
                        onChange={(e) => setSelectedDependencyType(e.target.value as any)}
                        className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
                      >
                        <option value="blocking">Bloqueante (Estricta)</option>
                        <option value="coordination">Coordinación (Informativa)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddDependency}
                      disabled={!selectedBlockingTaskId}
                      className="px-4 py-2 bg-[#18181B] hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      Vincular Dependencia
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showConfirmCritical}
        title="¿Completar Tarea Crítica?"
        message={`"${task.title}" es una tarea prioritaria para la apertura de Punto Burger. ¿Confirmas que todos los trabajos fueron completados e inspeccionados correctamente?`}
        confirmText="Sí, Completar Tarea"
        variant="danger"
        isLoading={isSaving}
        onConfirm={() => executeStatusChange('completada')}
        onCancel={() => setShowConfirmCritical(false)}
      />

      <ConfirmationModal
        isOpen={showConfirmArchive}
        title="¿Archivar Tarea?"
        message={`"${task.title}" será archivada. No aparecerá en las vistas operativas principales pero podrá ser consultada por el Administrador.`}
        confirmText="Archivar Tarea"
        variant="warning"
        isLoading={isSaving}
        onConfirm={handleArchive}
        onCancel={() => setShowConfirmArchive(false)}
      />

      <ConfirmationModal
        isOpen={showConfirmRestore}
        title="¿Restaurar Tarea?"
        message={`"${task.title}" volverá a estar activa en el tablero general.`}
        confirmText="Restaurar Tarea"
        variant="success"
        isLoading={isSaving}
        onConfirm={handleRestore}
        onCancel={() => setShowConfirmRestore(false)}
      />

      {stateModalTarget && (
        <StateChangeModal
          isOpen={Boolean(stateModalTarget)}
          targetStatus={stateModalTarget}
          taskTitle={task.title}
          isLoading={isSaving}
          onConfirm={(extra) => executeStatusChange(stateModalTarget, extra)}
          onCancel={() => setStateModalTarget(null)}
        />
      )}

      {/* Lightbox Modal for Image Preview */}
      {activeLightboxUrl && (
        <div
          onClick={() => setActiveLightboxUrl(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={activeLightboxUrl}
              alt="Evidencia adjunta"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setActiveLightboxUrl(null)}
              className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
