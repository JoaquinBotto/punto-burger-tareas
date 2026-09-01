import React, { useState } from 'react'
import type { TaskWithDetails, Area, Profile } from '../../types'
import { TaskCard } from './TaskCard'
import { formatDueDate } from '../../lib/dateUtils'
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  Folder,
  RotateCcw,
  Sparkles
} from 'lucide-react'

interface TaskListProps {
  tasks: TaskWithDetails[]
  areas: Area[]
  profiles?: Profile[]
  onTaskClick: (task: TaskWithDetails) => void
  onNewTaskClick: () => void
  onOpenAreaManager?: () => void
  isAdmin?: boolean
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  areas,
  onTaskClick,
  onNewTaskClick,
  onOpenAreaManager,
  isAdmin
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [viewFormat, setViewFormat] = useState<'cards' | 'table'>('cards')
  const [showArchived, setShowArchived] = useState(false)

  // Filter tasks in-memory
  const filteredTasks = tasks.filter(task => {
    if (!showArchived && task.archived_at) return false
    if (showArchived && !task.archived_at) return false

    if (selectedAreaId !== 'all' && task.area_id !== selectedAreaId) return false
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false
    if (selectedStatus !== 'all' && task.status !== selectedStatus) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesTitle = task.title.toLowerCase().includes(q)
      const matchesDesc = task.description?.toLowerCase().includes(q)
      const matchesArea = task.area?.name.toLowerCase().includes(q)
      const matchesAssignee = task.main_assignee?.full_name.toLowerCase().includes(q)
      return matchesTitle || matchesDesc || matchesArea || matchesAssignee
    }

    return true
  })

  const hasActiveFilters = searchQuery.trim() !== '' || selectedAreaId !== 'all' || selectedPriority !== 'all' || selectedStatus !== 'all'

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedAreaId('all')
    setSelectedPriority('all')
    setSelectedStatus('all')
  }

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#E8E2D9] shadow-sm space-y-4">
        
        {/* Search & Main Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A1A1AA]">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por tarea, responsable, área o detalle..."
              className="w-full pl-11 pr-4 py-3 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] focus:bg-white transition-all placeholder-[#A1A1AA]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            
            {/* View switcher */}
            <div className="flex items-center bg-[#FAF7F2] p-1 rounded-2xl border border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setViewFormat('cards')}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewFormat === 'cards'
                    ? 'bg-white text-[#18181B] shadow-xs'
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
                title="Vista en tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewFormat('table')}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewFormat === 'table'
                    ? 'bg-white text-[#18181B] shadow-xs'
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
                title="Vista compacta en lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Area Manager button (admin only) */}
            {isAdmin && onOpenAreaManager && (
              <button
                type="button"
                onClick={onOpenAreaManager}
                className="px-3.5 py-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#F0EBE1] text-xs font-bold text-[#18181B] border border-[#E8E2D9] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Folder className="w-4 h-4 text-[#C92A2A]" />
                <span className="hidden md:inline">Áreas</span>
              </button>
            )}

            {/* New Task Primary Button */}
            <button
              type="button"
              onClick={onNewTaskClick}
              className="py-3 px-5 bg-[#C92A2A] hover:bg-[#B02525] active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-md shadow-[#C92A2A]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Tarea</span>
            </button>
          </div>

        </div>

        {/* Filter Dropdowns & Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0EBE1] text-xs">
          
          {/* Area Filter */}
          <select
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value)}
            className="p-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A]"
          >
            <option value="all">Todas las áreas ({areas.length})</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="p-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A]"
          >
            <option value="all">Todas las prioridades</option>
            <option value="critica">🔥 Crítica</option>
            <option value="alta">⚡ Alta</option>
            <option value="media">📌 Media</option>
            <option value="baja">🌱 Baja</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A]"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="bloqueada">Bloqueada</option>
            <option value="esperando_tercero">Esperando tercero</option>
            <option value="en_revision">En revisión</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          {/* Admin Archive Filter */}
          {isAdmin && (
            <label className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#71717A] cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded text-[#C92A2A]"
              />
              <span>Archivadas</span>
            </label>
          )}

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 rounded-xl text-xs font-bold text-[#C92A2A] hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}

        </div>

      </div>

      {/* Task List / Grid Display */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E2D9] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF0F0] text-[#C92A2A] flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#18181B]">No se encontraron tareas</h3>
          <p className="text-sm text-[#71717A] max-w-md mx-auto">
            {hasActiveFilters
              ? 'Prueba modificando o limpiando los filtros seleccionados para ver más tareas.'
              : 'Aún no hay tareas creadas en este panel. Comienza agregando la primera.'}
          </p>
          <button
            onClick={onNewTaskClick}
            className="px-5 py-3 bg-[#C92A2A] hover:bg-[#B02525] text-white font-bold text-sm rounded-2xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primera Tarea</span>
          </button>
        </div>
      ) : viewFormat === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      ) : (
        /* Table Compact View */
        <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#E8E2D9] font-bold text-[#71717A] uppercase tracking-wider">
                <tr>
                  <th className="p-4">Tarea</th>
                  <th className="p-4">Área</th>
                  <th className="p-4">Responsable</th>
                  <th className="p-4">Vencimiento</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Avance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {filteredTasks.map(task => (
                  <tr
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-bold text-[#18181B] max-w-xs truncate">
                      {task.title}
                    </td>
                    <td className="p-4">
                      {task.area && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white shadow-xs"
                          style={{ backgroundColor: task.area.color || '#C92A2A' }}
                        >
                          {task.area.name}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-[#71717A] font-semibold">
                      {task.main_assignee?.full_name || '(Sin asignar)'}
                    </td>
                    <td className="p-4 font-medium text-[#71717A]">
                      {formatDueDate(task.due_date, task.due_time)}
                    </td>
                    <td className="p-4">
                      <span className="capitalize font-bold text-[#18181B]">
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-[#18181B]">
                      {task.progress_percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
