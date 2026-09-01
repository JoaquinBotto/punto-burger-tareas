import React, { useState } from 'react'
import type { Notification, TaskWithDetails } from '../../types'
import { notificationService } from '../../services/notificationService'
import {
  X,
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  Lock,
  MessageSquare,
  ArrowRight
} from 'lucide-react'

interface NotificationsDrawerProps {
  isOpen: boolean
  notifications: Notification[]
  tasks: TaskWithDetails[]
  onClose: () => void
  onRefreshNotifications: () => void
  onSelectTask: (task: TaskWithDetails) => void
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  notifications,
  tasks,
  onClose,
  onRefreshNotifications,
  onSelectTask
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  if (!isOpen) return null

  const displayedNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead()
    onRefreshNotifications()
  }

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await notificationService.markAsRead(n.id)
      onRefreshNotifications()
    }

    if (n.task_id) {
      const task = tasks.find(t => t.id === n.task_id)
      if (task) {
        onClose()
        onSelectTask(task)
      }
    }
  }

  const getNotificationIcon = (type: string, severity: string) => {
    if (severity === 'critical' || type === 'blocked_alert') {
      return <Lock className="w-4 h-4 text-red-600" />
    }
    if (type === 'critical_completed') {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />
    }
    if (type === 'comment') {
      return <MessageSquare className="w-4 h-4 text-indigo-600" />
    }
    if (severity === 'warning') {
      return <AlertTriangle className="w-4 h-4 text-amber-600" />
    }
    return <Info className="w-4 h-4 text-blue-600" />
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-[#E8E2D9] animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-[#F0EBE1] flex items-center justify-between gap-4 bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#C92A2A] text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#18181B]">Centro de Alertas</h2>
              <p className="text-xs text-[#71717A]">
                {unreadCount > 0 ? `${unreadCount} no leídas` : 'Al día'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#18181B] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar & Mark all read */}
        <div className="px-5 py-2.5 bg-white border-b border-[#F0EBE1] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'all' ? 'bg-[#18181B] text-white' : 'text-[#71717A] hover:bg-zinc-100'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'unread' ? 'bg-[#C92A2A] text-white' : 'text-[#71717A] hover:bg-zinc-100'
              }`}
            >
              No leídas ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-[#C92A2A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar leídas</span>
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {displayedNotifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#71717A]">
              No hay notificaciones para mostrar.
            </div>
          ) : (
            displayedNotifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                  n.is_read
                    ? 'bg-white border-[#E8E2D9] text-[#71717A]'
                    : 'bg-red-50/40 border-red-200 text-[#18181B] shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(n.type, n.severity)}
                    <span className="text-xs font-black text-[#18181B]">{n.title}</span>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[#C92A2A] flex-shrink-0" />
                  )}
                </div>

                <p className="text-xs text-[#52525B] leading-relaxed">
                  {n.message}
                </p>

                <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] pt-1 border-t border-[#F0EBE1]">
                  <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString()}</span>
                  {n.task_id && (
                    <span className="text-[#C92A2A] font-bold flex items-center gap-1">
                      <span>Ver tarea</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
