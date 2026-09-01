import React from 'react'
import type { TaskWithDetails, TaskPriority, TaskStatus } from '../../types'
import { formatDueDate, getDueStatus, getTimeDifferenceDescription } from '../../lib/dateUtils'
import { CheckCircle2, Clock, AlertTriangle, Lock, Users, CheckSquare, MessageSquare, Paperclip } from 'lucide-react'

interface TaskCardProps {
  task: TaskWithDetails
  onClick: () => void
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const dueStatus = getDueStatus(task.due_date, task.due_time, task.status)
  const isCompleted = task.status === 'completada'
  const isBlocked = task.status === 'bloqueada'
  const isThirdParty = task.status === 'esperando_tercero'

  const totalSubtasks = task.subtasks?.length || 0
  const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'critica':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-[#C92A2A] border border-red-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C92A2A] animate-ping" />
            Crítica
          </span>
        )
      case 'alta':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
            Alta
          </span>
        )
      case 'media':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
            Media
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            Baja
          </span>
        )
    }
  }

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completada':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-green-100 text-[#16A34A] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Lista</span>
          </span>
        )
      case 'bloqueada':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 text-[#DC2626] flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Bloqueada</span>
          </span>
        )
      case 'esperando_tercero':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-[#4F46E5] flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Tercero</span>
          </span>
        )
      case 'en_progreso':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-[#D97706] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>En curso</span>
          </span>
        )
      case 'en_revision':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-[#7C3AED]">
            En revisión
          </span>
        )
      case 'cancelada':
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-500 line-through">
            Cancelada
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700">
            Pendiente
          </span>
        )
    }
  }

  const getDueBadge = () => {
    if (isCompleted) return null
    if (!task.due_date) {
      return (
        <span className="text-[11px] font-medium text-[#A1A1AA]">
          Sin fecha
        </span>
      )
    }

    switch (dueStatus) {
      case 'overdue':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-[#C92A2A] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>{getTimeDifferenceDescription(task.due_date, task.due_time)}</span>
          </span>
        )
      case 'due_today':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-100 text-[#EA580C] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{getTimeDifferenceDescription(task.due_date, task.due_time)}</span>
          </span>
        )
      case 'due_tomorrow':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800">
            Vence mañana
          </span>
        )
      case 'due_soon':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-yellow-50 text-yellow-800">
            {formatDueDate(task.due_date)}
          </span>
        )
      default:
        return (
          <span className="text-[11px] font-medium text-[#71717A]">
            {formatDueDate(task.due_date)}
          </span>
        )
    }
  }

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-3xl p-5 border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99] ${
        isBlocked 
          ? 'border-red-300 ring-1 ring-red-200 bg-red-50/20' 
          : task.priority === 'critica' && !isCompleted
            ? 'border-red-200 hover:border-[#C92A2A]/40' 
            : 'border-[#E8E2D9] hover:border-[#C92A2A]/30'
      }`}
    >
      {/* Top row: Area and Badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {task.area && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: task.area.color || '#C92A2A' }}
            >
              <span>{task.area.name}</span>
            </span>
          )}
          {getPriorityBadge(task.priority)}
        </div>

        <div className="flex items-center gap-1.5">
          {getStatusBadge(task.status)}
        </div>
      </div>

      {/* Title */}
      <h3 className={`text-base font-extrabold text-[#18181B] leading-snug group-hover:text-[#C92A2A] transition-colors ${
        isCompleted ? 'line-through text-[#71717A]' : ''
      }`}>
        {task.title}
      </h3>

      {/* Description Snippet if available */}
      {task.description && (
        <p className="text-xs text-[#71717A] mt-1 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Blocked or Third-party Special Badges */}
      {isBlocked && task.blocked_reason && (
        <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#DC2626]" />
          <span className="font-medium line-clamp-2">{task.blocked_reason}</span>
        </div>
      )}

      {isThirdParty && task.third_party_name && (
        <div className="mt-3 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 flex items-start gap-2">
          <Users className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#4F46E5]" />
          <div className="font-medium">
            <strong>{task.third_party_name}</strong>: {task.third_party_reason}
          </div>
        </div>
      )}

      {/* Progress Bar & Subtasks Count */}
      <div className="mt-4 pt-3 border-t border-[#F0EBE1]">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1 text-[#71717A] font-semibold">
            {totalSubtasks > 0 ? (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-[#C92A2A]" />
                <span>{completedSubtasks} de {totalSubtasks} pasos</span>
              </>
            ) : (
              <span>Avance</span>
            )}
          </div>
          <span className="font-bold text-[#18181B]">{task.progress_percentage}%</span>
        </div>

        <div className="w-full h-2 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8E2D9]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted
                ? 'bg-[#16A34A]'
                : task.progress_percentage > 70
                  ? 'bg-[#16A34A]'
                  : task.progress_percentage > 30
                    ? 'bg-[#EA580C]'
                    : 'bg-[#C92A2A]'
            }`}
            style={{ width: `${task.progress_percentage}%` }}
          />
        </div>
      </div>

      {/* Bottom Row: Due date & Assignee */}
      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <div>{getDueBadge()}</div>

        <div className="flex items-center gap-2">
          {/* Comments count */}
          {(task.comments?.length || 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#71717A] font-semibold">
              <MessageSquare className="w-3 h-3" />
              <span>{task.comments?.length}</span>
            </span>
          )}

          {/* Attachments count */}
          {(task.attachments?.length || 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#71717A] font-semibold">
              <Paperclip className="w-3 h-3" />
              <span>{task.attachments?.length}</span>
            </span>
          )}

          {/* Assignee Avatar */}
          {task.main_assignee ? (
            <div
              className="inline-flex items-center gap-1.5 pl-1.5 py-0.5 pr-2 rounded-full bg-[#FAF7F2] border border-[#E8E2D9] text-[#18181B] font-bold text-[11px]"
              title={task.main_assignee.full_name}
            >
              <div className="w-4 h-4 rounded-full bg-[#C92A2A] text-white text-[9px] flex items-center justify-center font-black">
                {task.main_assignee.full_name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[80px] sm:max-w-[100px]">
                {task.main_assignee.full_name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-medium text-[#A1A1AA] italic">
              Sin asignar
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
