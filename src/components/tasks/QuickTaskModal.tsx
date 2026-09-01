import React, { useState } from 'react'
import type { Area, Profile, TaskPriority } from '../../types'
import { taskService } from '../../services/taskService'
import { useAuth } from '../../contexts/AuthContext'
import { getTodayDateString } from '../../lib/dateUtils'
import { X, Plus, Trash2, ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2, User, Calendar, Clock, Flag, Folder } from 'lucide-react'

interface QuickTaskModalProps {
  isOpen: boolean
  areas: Area[]
  profiles: Profile[]
  onClose: () => void
  onTaskCreated: (newTask: any) => void
}

export const QuickTaskModal: React.FC<QuickTaskModalProps> = ({
  isOpen,
  areas,
  profiles,
  onClose,
  onTaskCreated
}) => {
  const { user } = useAuth()
  const todayStr = getTodayDateString()

  // Form core fields
  const [title, setTitle] = useState('')
  const [areaId, setAreaId] = useState(areas[0]?.id || '')
  const [mainAssigneeId, setMainAssigneeId] = useState<string>('')
  const [priority, setPriority] = useState<TaskPriority>('alta')
  const [dueDate, setDueDate] = useState<string>(todayStr)

  // More details accordion
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [description, setDescription] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [subtasks, setSubtasks] = useState<string[]>([])
  const [newSubtaskInput, setNewSubtaskInput] = useState('')
  const [additionalAssignees] = useState<string[]>([])
  const [tpName, setTpName] = useState('')
  const [tpReason, setTpReason] = useState('')
  const [tpDate, setTpDate] = useState('')
  const [tpContact, setTpContact] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return
    setSubtasks([...subtasks, newSubtaskInput.trim()])
    setNewSubtaskInput('')
  }

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!title.trim()) {
      setErrorMsg('Ingresa el título de la tarea.')
      return
    }

    if (!areaId) {
      setErrorMsg('Selecciona un área para la tarea.')
      return
    }

    setIsSubmitting(true)
    const result = await taskService.createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      area_id: areaId,
      main_assignee_id: mainAssigneeId || null,
      priority,
      due_date: dueDate || null,
      due_time: dueTime || null,
      created_by: user?.id || 'u1',
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      additional_assignees: additionalAssignees,
      third_party_name: tpName.trim() || undefined,
      third_party_reason: tpReason.trim() || undefined,
      third_party_promised_date: tpDate || undefined,
      third_party_contact: tpContact.trim() || undefined
    })
    setIsSubmitting(false)

    if (result.success && result.data) {
      onTaskCreated(result.data)
      onClose()
    } else {
      setErrorMsg(result.error || 'No se pudo crear la tarea.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E8E2D9] animate-in slide-in-from-bottom-5 sm:zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#F0EBE1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFECEC] text-[#C92A2A] flex items-center justify-center font-black shadow-xs">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#18181B]">Nueva Tarea Operativa</h2>
              <p className="text-xs text-[#71717A]">Creación rápida para Punto Burger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#18181B] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#C92A2A]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5">
              Título de la Tarea <span className="text-[#C92A2A]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Instalar comandera en la barra"
              className="w-full p-3.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-base font-semibold text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white transition-all placeholder-[#A1A1AA]"
            />
          </div>

          {/* 2. Area & Assignee (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-[#C92A2A]" />
                Área <span className="text-[#C92A2A]">*</span>
              </label>
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-sm font-bold text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white"
              >
                {areas.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#C92A2A]" />
                Responsable
              </label>
              <select
                value={mainAssigneeId}
                onChange={(e) => setMainAssigneeId(e.target.value)}
                className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-sm font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white"
              >
                <option value="">(Sin asignar)</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-[#C92A2A]" />
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-sm font-bold text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white"
              >
                <option value="critica">🔥 Crítica</option>
                <option value="alta">⚡ Alta</option>
                <option value="media">📌 Media</option>
                <option value="baja">🌱 Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#C92A2A]" />
                Fecha Límite
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-sm font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white"
              />
            </div>
          </div>

          {/* Accordion: Agregar más detalles */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="w-full py-2.5 px-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#F3EFE9] text-xs font-bold text-[#71717A] hover:text-[#18181B] flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>{showMoreDetails ? 'Ocultar detalles adicionales' : '➕ Agregar más detalles (Checklist, horario, notas)'}</span>
              {showMoreDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showMoreDetails && (
              <div className="mt-4 space-y-4 pt-2 border-t border-[#F0EBE1] animate-in fade-in">
                
                {/* Description & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">
                      Descripción o Especificaciones
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detalles sobre medidas, proveedores o instrucciones..."
                      className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#71717A]" />
                      Hora Límite
                    </label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Subtasks Checklist */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1.5">
                    Subtareas / Pasos del Checklist
                  </label>
                  
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSubtaskInput}
                      onChange={(e) => setNewSubtaskInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddSubtask()
                        }
                      }}
                      placeholder="Ej: Confirmar medidas con el carpintero..."
                      className="flex-1 p-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      className="px-3.5 py-2.5 bg-[#18181B] hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Agregar
                    </button>
                  </div>

                  {subtasks.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto p-1">
                      {subtasks.map((st, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs">
                          <span className="font-medium text-[#18181B] line-clamp-1">{i + 1}. {st}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtask(i)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Third Party Details */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
                  <span className="text-xs font-bold text-indigo-900 block">
                    ¿Depende de un Tercero? (Opcional)
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={tpName}
                      onChange={(e) => setTpName(e.target.value)}
                      placeholder="Nombre del proveedor o profesional"
                      className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                    <input
                      type="text"
                      value={tpContact}
                      onChange={(e) => setTpContact(e.target.value)}
                      placeholder="Teléfono / Contacto"
                      className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={tpReason}
                      onChange={(e) => setTpReason(e.target.value)}
                      placeholder="¿Qué se está esperando? (Ej: Entrega de cartel)"
                      className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                    <input
                      type="date"
                      value={tpDate}
                      onChange={(e) => setTpDate(e.target.value)}
                      className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-xs text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Submit Button (Extra large touch target for mobile) */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-[#C92A2A] hover:bg-[#B02525] active:scale-[0.99] text-white font-bold text-base rounded-2xl shadow-lg shadow-[#C92A2A]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Guardando tarea...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Crear Tarea</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
