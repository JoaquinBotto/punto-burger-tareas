import React from 'react'
import type { TaskWithDetails, Area, Profile } from '../../types'
import {
  calculateDashboardMetrics,
  getUrgentTasks,
  calculateAreaProgress
} from '../../lib/metricsCalculations'
import { formatDueDate } from '../../lib/dateUtils'
import type { ActivityItem } from '../../services/activityService'
import {
  Clock,
  AlertTriangle,
  Lock,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckSquare
} from 'lucide-react'

interface DashboardViewProps {
  tasks: TaskWithDetails[]
  areas: Area[]
  profiles: Profile[]
  activity: ActivityItem[]
  userName?: string
  onSelectTask: (task: TaskWithDetails) => void
  onNavigateToTasksWithFilter: (filter: {
    status?: string
    isBlockedOnly?: boolean
    areaId?: string
    priority?: string
  }) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  areas,
  activity,
  userName = 'Equipo',
  onSelectTask,
  onNavigateToTasksWithFilter
}) => {
  const metrics = calculateDashboardMetrics(tasks)
  const urgentTasks = getUrgentTasks(tasks)
  const areaProgress = calculateAreaProgress(tasks, areas).filter(a => a.totalTasks > 0)

  // Greeting based on current hour in Córdoba (UTC-3)
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 13) return 'Buen día'
    if (hour >= 13 && hour < 20) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* 1. Header & Operational Status Banner */}
      <div className="bg-gradient-to-r from-[#FAF7F2] to-white p-5 sm:p-7 rounded-3xl border border-[#E8E2D9] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#18181B]">
              {getGreeting()}, {userName.split(' ')[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm text-[#71717A] font-medium">
              {urgentTasks.length > 0 ? (
                <span>
                  Hay <strong className="text-[#C92A2A] font-bold">{urgentTasks.length} tareas urgentes</strong> que requieren atención para la apertura.
                </span>
              ) : (
                <span>Todas las tareas prioritarias se encuentran bajo control.</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto bg-white px-4 py-2.5 rounded-2xl border border-[#E8E2D9] shadow-xs">
            <TrendingUp className="w-5 h-5 text-[#16A34A]" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-[#71717A]">Avance Apertura</span>
              <span className="text-base font-black text-[#18181B]">{metrics.overallProgressPercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Pendientes */}
        <button
          type="button"
          onClick={() => onNavigateToTasksWithFilter({ status: 'pendiente' })}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#C92A2A]/40 transition-all text-left shadow-xs hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">Pendientes</span>
            <Clock className="w-4 h-4 text-zinc-400 group-hover:text-[#C92A2A] transition-colors" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#18181B]">{metrics.pendingCount}</div>
          <span className="text-[11px] text-zinc-400 font-medium">Por iniciar</span>
        </button>

        {/* Card 2: En Progreso */}
        <button
          type="button"
          onClick={() => onNavigateToTasksWithFilter({ status: 'en_progreso' })}
          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-amber-400 transition-all text-left shadow-xs hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">En Progreso</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900">{metrics.inProgressCount}</div>
          <span className="text-[11px] text-amber-600 font-medium">Trabajo en curso</span>
        </button>

        {/* Card 3: Atrasadas */}
        <button
          type="button"
          onClick={() => onNavigateToTasksWithFilter({ priority: 'critica' })}
          className={`p-4 sm:p-5 rounded-2xl border transition-all text-left shadow-xs hover:shadow-md cursor-pointer group ${
            metrics.overdueCount > 0 ? 'bg-red-50/70 border-red-200' : 'bg-white border-[#E8E2D9]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">Atrasadas</span>
            <AlertTriangle className="w-4 h-4 text-[#C92A2A]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#C92A2A]">{metrics.overdueCount}</div>
          <span className="text-[11px] text-red-600 font-medium">Vencidas</span>
        </button>

        {/* Card 4: Bloqueadas */}
        <button
          type="button"
          onClick={() => onNavigateToTasksWithFilter({ isBlockedOnly: true })}
          className={`p-4 sm:p-5 rounded-2xl border transition-all text-left shadow-xs hover:shadow-md cursor-pointer group ${
            metrics.blockedCount > 0 ? 'bg-orange-50/70 border-orange-200' : 'bg-white border-[#E8E2D9]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700">Bloqueadas</span>
            <Lock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-orange-900">{metrics.blockedCount}</div>
          <span className="text-[11px] text-orange-600 font-medium">Requieren destrabe</span>
        </button>
      </div>

      {/* 3. Block "LO URGENTE" */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C92A2A] animate-ping" />
            <h2 className="text-base sm:text-lg font-black tracking-tight text-[#18181B]">
              Lo Urgente ({urgentTasks.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTasksWithFilter({ priority: 'critica' })}
            className="text-xs font-bold text-[#C92A2A] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver críticas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {urgentTasks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-[#E8E2D9] text-center text-xs text-[#71717A]">
            No hay tareas urgentes en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentTasks.map(({ task, urgencyReason, urgencyLevel }) => {
              const subDone = task.subtasks?.filter(s => s.is_completed).length || 0
              const subTotal = task.subtasks?.length || 0

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#C92A2A] transition-all shadow-xs hover:shadow-md flex flex-col justify-between gap-3 cursor-pointer group"
                >
                  <div className="space-y-2">
                    {/* Urgency Badge & Area */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          urgencyLevel === 'critical'
                            ? 'bg-red-100 text-[#C92A2A] border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {urgencyReason}
                      </span>

                      {task.area && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: task.area.color || '#C92A2A' }}
                        >
                          {task.area.name}
                        </span>
                      )}
                    </div>

                    {/* Task Title */}
                    <h3 className="text-sm sm:text-base font-black text-[#18181B] group-hover:text-[#C92A2A] transition-colors leading-tight">
                      {task.title}
                    </h3>

                    {/* Description preview */}
                    {task.description && (
                      <p className="text-xs text-[#71717A] line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Task Meta & Progress */}
                  <div className="pt-2 border-t border-[#F0EBE1] space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#71717A]">
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{subTotal > 0 ? `${subDone}/${subTotal} pasos` : `${task.progress_percentage}%`}</span>
                      </span>

                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{formatDueDate(task.due_date, task.due_time)}</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#16A34A] rounded-full transition-all"
                        style={{ width: `${task.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. Avance por Área */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black tracking-tight text-[#18181B] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C92A2A]" />
            <span>Avance por Área ({areaProgress.length})</span>
          </h2>
          <span className="text-xs text-[#71717A] font-medium hidden sm:inline">Pulsá un área para filtrar tareas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {areaProgress.map(ap => (
            <button
              key={ap.areaId}
              type="button"
              onClick={() => onNavigateToTasksWithFilter({ areaId: ap.areaId })}
              className="p-4 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#18181B]/40 transition-all text-left shadow-xs hover:shadow-md cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ap.color }}
                  />
                  <span className="text-xs font-black text-[#18181B] truncate">{ap.name}</span>
                </div>
                <span className="text-xs font-black text-[#18181B]">{ap.progressPercentage}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${ap.progressPercentage}%`, backgroundColor: ap.color }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#71717A]">
                <span>{ap.totalTasks} {ap.totalTasks === 1 ? 'tarea' : 'tareas'}</span>
                <span>{ap.completedTasks} completadas</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Actividad Reciente */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-black tracking-tight text-[#18181B] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#C92A2A]" />
          <span>Actividad Reciente</span>
        </h2>

        {activity.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-[#E8E2D9] text-center text-xs text-[#71717A]">
            No hay actividad registrada recientemente.
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] divide-y divide-[#F0EBE1] space-y-0">
            {activity.slice(0, 7).map(item => (
              <div key={item.id} className="py-3 flex items-start justify-between gap-3 text-xs first:pt-0 last:pb-0">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[#18181B] font-medium leading-tight">
                    <strong className="font-bold">{item.profile?.full_name || 'Usuario'}: </strong>
                    <span>{item.readableAction}</span>
                  </p>
                  <span className="text-[11px] text-[#A1A1AA]">
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
