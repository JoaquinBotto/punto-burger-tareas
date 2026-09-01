import React, { useState } from 'react'
import type { TaskWithDetails, Area, Profile } from '../../types'
import { TaskCard } from './TaskCard'
import {
  Search,
  LayoutGrid,
  Plus,
  RotateCcw,
  Sparkles,
  Filter,
  X,
  Columns3,
  Layers,
  Lock,
  Clock,
  CheckCircle2
} from 'lucide-react'

interface TaskListProps {
  tasks: TaskWithDetails[]
  areas: Area[]
  profiles?: Profile[]
  initialAreaId?: string
  initialStatus?: string
  initialPriority?: string
  initialIsBlockedOnly?: boolean
  onTaskClick: (task: TaskWithDetails) => void
  onNewTaskClick: () => void
  onOpenAreaManager?: () => void
  isAdmin?: boolean
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  areas,
  profiles = [],
  initialAreaId = 'all',
  initialStatus = 'all',
  initialPriority = 'all',
  initialIsBlockedOnly = false,
  onTaskClick,
  onNewTaskClick,
  onOpenAreaManager: _onOpenAreaManager,
  isAdmin
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAreaId, setSelectedAreaId] = useState<string>(initialAreaId)
  const [selectedPriority, setSelectedPriority] = useState<string>(initialPriority)
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus)
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('all')
  const [isBlockedOnly, setIsBlockedOnly] = useState<boolean>(initialIsBlockedOnly)
  const [viewFormat, setViewFormat] = useState<'cards' | 'kanban' | 'area_groups'>('cards')
  const [showArchived, setShowArchived] = useState(false)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

  // Filter tasks in-memory
  const filteredTasks = tasks.filter(task => {
    if (!showArchived && task.archived_at) return false
    if (showArchived && !task.archived_at) return false

    if (selectedAreaId !== 'all' && task.area_id !== selectedAreaId) return false
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false
    if (selectedStatus !== 'all' && task.status !== selectedStatus) return false
    if (selectedAssigneeId !== 'all') {
      if (selectedAssigneeId === 'unassigned' && task.main_assignee_id) return false
      if (selectedAssigneeId !== 'unassigned' && task.main_assignee_id !== selectedAssigneeId) return false
    }
    if (isBlockedOnly && task.status !== 'bloqueada' && task.status !== 'esperando_tercero') return false

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

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedAreaId !== 'all' ||
    selectedPriority !== 'all' ||
    selectedStatus !== 'all' ||
    selectedAssigneeId !== 'all' ||
    isBlockedOnly ||
    showArchived

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedAreaId('all')
    setSelectedPriority('all')
    setSelectedStatus('all')
    setSelectedAssigneeId('all')
    setIsBlockedOnly(false)
    setShowArchived(false)
  }

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-300">
      
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, área, responsable..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E2D9] rounded-2xl text-xs sm:text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C92A2A] shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Switchers & Create Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer sm:hidden ${
              hasActiveFilters ? 'bg-[#FAF0F0] border-[#C92A2A] text-[#C92A2A]' : 'bg-white border-[#E8E2D9] text-[#71717A]'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>

          {/* View format switcher */}
          <div className="bg-white p-1 rounded-2xl border border-[#E8E2D9] flex items-center shadow-xs">
            <button
              type="button"
              onClick={() => setViewFormat('cards')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewFormat === 'cards' ? 'bg-[#FAF7F2] text-[#18181B] font-bold shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
              }`}
              title="Vista de Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setViewFormat('kanban')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewFormat === 'kanban' ? 'bg-[#FAF7F2] text-[#18181B] font-bold shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
              }`}
              title="Vista Kanban por Estado"
            >
              <Columns3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setViewFormat('area_groups')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewFormat === 'area_groups' ? 'bg-[#FAF7F2] text-[#18181B] font-bold shadow-xs' : 'text-[#71717A] hover:text-[#18181B]'
              }`}
              title="Agrupado por Área"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          {/* New Task Button */}
          <button
            type="button"
            onClick={onNewTaskClick}
            className="px-4 py-2.5 bg-[#C92A2A] hover:bg-[#B02525] text-white text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 shadow-sm shadow-[#C92A2A]/20 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Tarea</span>
            <span className="sm:hidden">Crear</span>
          </button>
        </div>
      </div>

      {/* Filter Row (Desktop Always, Mobile Collapsible) */}
      <div className={`p-4 bg-white rounded-2xl border border-[#E8E2D9] space-y-3 shadow-xs ${isFilterPanelOpen ? 'block' : 'hidden sm:block'}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          
          {/* Area filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#71717A] mb-1">Área</label>
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="w-full p-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
            >
              <option value="all">Todas las áreas ({areas.length})</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#71717A] mb-1">Prioridad</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full p-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
            >
              <option value="all">Todas</option>
              <option value="critica">Crítica (P0)</option>
              <option value="alta">Alta (P1)</option>
              <option value="media">Media (P2)</option>
              <option value="baja">Baja (P3)</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#71717A] mb-1">Estado</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En progreso</option>
              <option value="bloqueada">Bloqueada</option>
              <option value="esperando_tercero">Esperando tercero</option>
              <option value="completada">Completada</option>
            </select>
          </div>

          {/* Assignee filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#71717A] mb-1">Responsable</label>
            <select
              value={selectedAssigneeId}
              onChange={(e) => setSelectedAssigneeId(e.target.value)}
              className="w-full p-2 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#18181B]"
            >
              <option value="all">Todos</option>
              <option value="unassigned">Sin asignar</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          {/* Quick Toggle: Only Blocked */}
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={() => setIsBlockedOnly(!isBlockedOnly)}
              className={`w-full p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isBlockedOnly ? 'bg-orange-100 border-orange-300 text-orange-900' : 'bg-[#FAF7F2] border-[#E8E2D9] text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Solo Bloqueadas</span>
            </button>
          </div>

          {/* Quick Toggle: Archived */}
          {isAdmin && (
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => setShowArchived(!showArchived)}
                className={`w-full p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  showArchived ? 'bg-zinc-200 border-zinc-400 text-zinc-900' : 'bg-[#FAF7F2] border-[#E8E2D9] text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <span>{showArchived ? 'Ver Activas' : 'Ver Archivadas'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Filters Summary & Reset */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-xs text-[#71717A]">
            <span>Mostrando {filteredTasks.length} de {tasks.length} tareas</span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[#C92A2A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E8E2D9] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-[#18181B]">No se encontraron tareas</h3>
          <p className="text-xs text-[#71717A] max-w-sm mx-auto">
            No hay tareas que coincidan con los filtros seleccionados.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 bg-[#18181B] hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Restablecer Filtros
            </button>
          )}
        </div>
      ) : viewFormat === 'cards' ? (
        /* VISTA 1: CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      ) : viewFormat === 'kanban' ? (
        /* VISTA 2: KANBAN POR ESTADO */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto">
          {/* Col 1: Pendiente */}
          <KanbanColumn
            title="Pendiente"
            icon={<Clock className="w-4 h-4 text-zinc-500" />}
            colorClass="bg-zinc-100 text-zinc-800"
            tasks={filteredTasks.filter(t => t.status === 'pendiente')}
            onTaskClick={onTaskClick}
          />

          {/* Col 2: En Progreso */}
          <KanbanColumn
            title="En Progreso"
            icon={<Clock className="w-4 h-4 text-amber-600" />}
            colorClass="bg-amber-100 text-amber-900"
            tasks={filteredTasks.filter(t => t.status === 'en_progreso')}
            onTaskClick={onTaskClick}
          />

          {/* Col 3: Bloqueada / Tercero */}
          <KanbanColumn
            title="Bloqueada / Espera"
            icon={<Lock className="w-4 h-4 text-red-600" />}
            colorClass="bg-red-100 text-red-900"
            tasks={filteredTasks.filter(t => t.status === 'bloqueada' || t.status === 'esperando_tercero')}
            onTaskClick={onTaskClick}
          />

          {/* Col 4: Completada */}
          <KanbanColumn
            title="Completada"
            icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
            colorClass="bg-green-100 text-green-900"
            tasks={filteredTasks.filter(t => t.status === 'completada')}
            onTaskClick={onTaskClick}
          />
        </div>
      ) : (
        /* VISTA 3: AGRUPADA POR ÁREA */
        <div className="space-y-6">
          {areas.map(area => {
            const areaTasks = filteredTasks.filter(t => t.area_id === area.id)
            if (areaTasks.length === 0) return null

            return (
              <div key={area.id} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[#F0EBE1] pb-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: area.color || '#C92A2A' }}
                  />
                  <h3 className="text-sm font-black text-[#18181B]">{area.name} ({areaTasks.length})</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {areaTasks.map(t => (
                    <TaskCard key={t.id} task={t} onClick={() => onTaskClick(t)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}

interface KanbanColumnProps {
  title: string
  icon: React.ReactNode
  colorClass: string
  tasks: TaskWithDetails[]
  onTaskClick: (task: TaskWithDetails) => void
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  icon,
  colorClass,
  tasks,
  onTaskClick
}) => {
  return (
    <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D9] flex flex-col min-h-[400px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-black text-[#18181B]">{title}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${colorClass}`}>
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#A1A1AA] border border-dashed border-zinc-300 rounded-xl">
            Sin tareas
          </div>
        ) : (
          tasks.map(t => (
            <div
              key={t.id}
              onClick={() => onTaskClick(t)}
              className="p-3 bg-white rounded-xl border border-[#E8E2D9] hover:border-[#C92A2A] shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between gap-1">
                {t.area && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: t.area.color || '#C92A2A' }}
                  >
                    {t.area.name}
                  </span>
                )}
                <span className="text-[9px] font-black uppercase text-zinc-500">{t.priority}</span>
              </div>

              <h4 className="text-xs font-bold text-[#18181B] group-hover:text-[#C92A2A] transition-colors leading-snug line-clamp-2">
                {t.title}
              </h4>

              <div className="flex items-center justify-between text-[10px] text-[#71717A] pt-1 border-t border-[#F0EBE1]">
                <span>{t.subtasks?.length || 0} pasos</span>
                <span>{t.progress_percentage}%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
