import React, { useState, useEffect } from 'react'
import type { RecurringTaskRule, Area, Profile, TaskPriority } from '../../types'
import { recurringTaskService, type CreateRecurringRulePayload } from '../../services/recurringTaskService'
import {
  X,
  Plus,
  Repeat,
  Clock,
  Play,
  Pause,
  Trash2,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react'

interface RecurringManagerModalProps {
  isOpen: boolean
  areas: Area[]
  profiles: Profile[]
  onClose: () => void
  onRulesUpdated?: () => void
}

export const RecurringManagerModal: React.FC<RecurringManagerModalProps> = ({
  isOpen,
  areas,
  profiles,
  onClose,
  onRulesUpdated
}) => {
  const [rules, setRules] = useState<(RecurringTaskRule & { area?: Area; main_assignee?: Profile | null })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [areaId, setAreaId] = useState(areas[0]?.id || '')
  const [mainAssigneeId, setMainAssigneeId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('media')
  const [frequency, setFrequency] = useState<'daily' | 'specific_days' | 'weekly' | 'monthly'>('daily')
  const [createTime, setCreateTime] = useState('08:00')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri default

  const loadRules = async () => {
    setIsLoading(true)
    const data = await recurringTaskService.getRules()
    setRules(data)
    setIsLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadRules()
      setShowCreateForm(false)
      setActionError(null)
      if (areas.length > 0 && !areaId) {
        setAreaId(areas[0].id)
      }
    }
  }, [isOpen, areas])

  if (!isOpen) return null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !areaId) {
      setActionError('Completa el título y el área.')
      return
    }

    setIsSubmitting(true)
    setActionError(null)

    const payload: CreateRecurringRulePayload = {
      template_title: title.trim(),
      template_description: description.trim() || undefined,
      area_id: areaId,
      main_assignee_id: mainAssigneeId || null,
      priority,
      frequency,
      create_time: createTime + ':00',
      start_date: startDate,
      days_of_week: frequency === 'specific_days' ? daysOfWeek : undefined,
      is_active: true
    }

    const res = await recurringTaskService.createRule(payload)
    setIsSubmitting(false)

    if (res.success) {
      setTitle('')
      setDescription('')
      setShowCreateForm(false)
      loadRules()
      onRulesUpdated?.()
    } else {
      setActionError(res.error || 'No se pudo crear la regla.')
    }
  }

  const handleToggleStatus = async (ruleId: string, currentStatus: boolean) => {
    setActionError(null)
    const res = await recurringTaskService.toggleRuleStatus(ruleId, !currentStatus)
    if (res.success) {
      loadRules()
      onRulesUpdated?.()
    } else {
      setActionError(res.error || 'Error al cambiar estado de la regla.')
    }
  }

  const handleDelete = async (ruleId: string) => {
    setActionError(null)
    const res = await recurringTaskService.deleteRule(ruleId)
    if (res.success) {
      loadRules()
      onRulesUpdated?.()
    } else {
      setActionError(res.error || 'Error al eliminar la regla.')
    }
  }

  const toggleDay = (dayIndex: number) => {
    if (daysOfWeek.includes(dayIndex)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== dayIndex))
    } else {
      setDaysOfWeek([...daysOfWeek, dayIndex].sort())
    }
  }

  const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-[#E8E2D9] overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#F0EBE1] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C92A2A] text-white flex items-center justify-center shadow-md shadow-[#C92A2A]/20">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#18181B]">Tareas Recurrentes</h2>
              <p className="text-xs text-[#71717A]">Automatización de rutinas operativas diarias y semanales</p>
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4">
          
          {/* Top Actions */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
              Reglas Activas ({rules.length})
            </span>
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-3.5 py-1.5 bg-[#C92A2A] hover:bg-[#B02525] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showCreateForm ? 'Ver Reglas' : 'Nueva Rutina'}</span>
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm ? (
            <form onSubmit={handleCreate} className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D9] space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#18181B]">Configurar Nueva Rutina</h3>
              
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                  Título de la Plantilla *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Control diario de temperaturas y freezers"
                  className="w-full p-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#18181B] focus:ring-2 focus:ring-[#C92A2A] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                  Detalle / Instrucciones
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Pasos específicos que debe verificar el equipo..."
                  className="w-full p-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs text-[#18181B] focus:ring-2 focus:ring-[#C92A2A] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">Área *</label>
                  <select
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">Responsable</label>
                  <select
                    value={mainAssigneeId}
                    onChange={(e) => setMainAssigneeId(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
                  >
                    <option value="">Sin asignar</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">Prioridad</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full p-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">Frecuencia</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full p-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
                  >
                    <option value="daily">Todos los días</option>
                    <option value="specific_days">Días específicos</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1">Hora de Creación</label>
                  <input
                    type="time"
                    value={createTime}
                    onChange={(e) => setCreateTime(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
                  />
                </div>
              </div>

              {frequency === 'specific_days' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#71717A] mb-1.5">
                    Días de la semana
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAY_NAMES.map((name, idx) => {
                      const isSelected = daysOfWeek.includes(idx)
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toggleDay(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#C92A2A] text-white shadow-xs'
                              : 'bg-white border border-[#E8E2D9] text-[#71717A]'
                          }`}
                        >
                          {name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#C92A2A] hover:bg-[#B02525] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar Rutina'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Rules List */
            <div className="space-y-3">
              {isLoading ? (
                <div className="p-12 text-center text-[#71717A] flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#C92A2A]" />
                  <span className="text-xs font-semibold">Cargando rutinas recurrentes...</span>
                </div>
              ) : rules.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-zinc-300 text-xs text-[#71717A] space-y-2">
                  <Repeat className="w-8 h-8 text-zinc-400 mx-auto" />
                  <p className="font-bold text-[#18181B]">No hay tareas recurrentes configuradas</p>
                  <p className="max-w-xs mx-auto text-[11px]">
                    Las rutinas permiten que el sistema genere automáticamente tareas diarias como limpieza, revisión de stock o control de cajas.
                  </p>
                </div>
              ) : (
                rules.map(rule => (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      rule.is_active
                        ? 'bg-white border-[#E8E2D9] shadow-2xs'
                        : 'bg-zinc-50 border-zinc-200 opacity-60'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {rule.area && (
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
                            style={{ backgroundColor: rule.area.color || '#C92A2A' }}
                          >
                            {rule.area.name}
                          </span>
                        )}
                        <span className="text-[10px] font-black uppercase text-zinc-500">
                          {rule.frequency === 'daily' ? 'Diaria' : rule.frequency === 'weekly' ? 'Semanal' : 'Personalizada'}
                        </span>
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${rule.is_active ? 'bg-green-100 text-green-900' : 'bg-zinc-200 text-zinc-800'}`}>
                          {rule.is_active ? 'Activa' : 'Pausada'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#18181B] truncate">{rule.template_title}</h4>

                      <div className="flex items-center gap-3 text-[11px] text-[#71717A]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{rule.create_time} hs</span>
                        </span>
                        {rule.main_assignee && (
                          <span>Resp: {rule.main_assignee.full_name}</span>
                        )}
                        <span>Próx: {rule.next_run_date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(rule.id, rule.is_active)}
                        className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                          rule.is_active
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                            : 'bg-green-100 hover:bg-green-200 text-green-900'
                        }`}
                        title={rule.is_active ? 'Pausar regla' : 'Reanudar regla'}
                      >
                        {rule.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{rule.is_active ? 'Pausar' : 'Activar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar regla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
