import React from 'react'
import type { TaskWithDetails } from '../../types'
import { organizeMyDayTasks } from '../../lib/metricsCalculations'
import { formatDueDate, formatHeaderDate } from '../../lib/dateUtils'
import { useAuth } from '../../contexts/AuthContext'
import {
  CalendarCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  CheckSquare,
  Sparkles,
  Lock
} from 'lucide-react'

interface MyDayViewProps {
  tasks: TaskWithDetails[]
  onSelectTask: (task: TaskWithDetails) => void
}

export const MyDayView: React.FC<MyDayViewProps> = ({
  tasks,
  onSelectTask
}) => {
  const { user, isAdmin } = useAuth()
  const todayFormatted = formatHeaderDate()
  const myDay = organizeMyDayTasks(tasks, user?.id || '', isAdmin)

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-900 to-[#C92A2A] text-white p-6 sm:p-7 rounded-3xl shadow-md space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase opacity-80">
          <CalendarCheck className="w-4 h-4" />
          <span>Mi Día Operativo</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          {todayFormatted}
        </h1>
        <p className="text-xs sm:text-sm text-red-100 font-medium pt-1">
          {myDay.totalCount > 0 ? (
            <span>Tenés <strong>{myDay.totalCount} tareas</strong> en tu radar para hoy.</span>
          ) : (
            <span>No tenés tareas pendientes para hoy. ¡Todo al día!</span>
          )}
        </p>
      </div>

      {myDay.totalCount === 0 && myDay.completedToday.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E8E2D9] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-[#18181B]">No tenés tareas pendientes asignadas para hoy</h3>
          <p className="text-xs text-[#71717A] max-w-sm mx-auto">
            Podés revisar el listado general de tareas o las áreas para colaborar con el equipo.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Section 1: Atrasadas */}
          {myDay.overdue.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#C92A2A]" />
                <span>Atrasadas ({myDay.overdue.length})</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myDay.overdue.map(t => (
                  <TaskCardCompact key={t.id} task={t} onSelect={() => onSelectTask(t)} badgeColor="red" />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Para Hoy */}
          {myDay.today.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#18181B] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#C92A2A]" />
                <span>Para Hoy ({myDay.today.length})</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myDay.today.map(t => (
                  <TaskCardCompact key={t.id} task={t} onSelect={() => onSelectTask(t)} badgeColor="amber" />
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Próximas */}
          {myDay.upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#71717A] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <span>Próximas ({myDay.upcoming.length})</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myDay.upcoming.map(t => (
                  <TaskCardCompact key={t.id} task={t} onSelect={() => onSelectTask(t)} badgeColor="zinc" />
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Sin Fecha */}
          {myDay.undated.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#71717A] flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-zinc-400" />
                <span>Sin Fecha Límite ({myDay.undated.length})</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myDay.undated.map(t => (
                  <TaskCardCompact key={t.id} task={t} onSelect={() => onSelectTask(t)} badgeColor="zinc" />
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Completadas Hoy */}
          {myDay.completedToday.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-green-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Completadas Hoy ({myDay.completedToday.length})</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myDay.completedToday.map(t => (
                  <TaskCardCompact key={t.id} task={t} onSelect={() => onSelectTask(t)} badgeColor="green" />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}

interface TaskCardCompactProps {
  task: TaskWithDetails
  onSelect: () => void
  badgeColor?: 'red' | 'amber' | 'green' | 'zinc'
}

const TaskCardCompact: React.FC<TaskCardCompactProps> = ({ task, onSelect }) => {
  const subDone = task.subtasks?.filter(s => s.is_completed).length || 0
  const subTotal = task.subtasks?.length || 0

  return (
    <div
      onClick={onSelect}
      className="p-4 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#C92A2A] transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between gap-3 group"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {task.area && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
              style={{ backgroundColor: task.area.color || '#C92A2A' }}
            >
              {task.area.name}
            </span>
          )}

          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
            {task.priority}
          </span>
        </div>

        <h3 className="text-sm font-black text-[#18181B] group-hover:text-[#C92A2A] transition-colors leading-tight">
          {task.title}
        </h3>

        {task.status === 'bloqueada' && (
          <div className="text-[11px] text-red-700 bg-red-50 p-2 rounded-xl flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{task.blocked_reason || 'Bloqueada'}</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-xs text-[#71717A]">
        <span>{subTotal > 0 ? `${subDone}/${subTotal} pasos` : `${task.progress_percentage}%`}</span>
        <span>{formatDueDate(task.due_date, task.due_time)}</span>
      </div>
    </div>
  )
}
