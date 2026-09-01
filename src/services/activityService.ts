import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { ActivityLog, Profile, Task } from '../types'

export interface ActivityItem extends ActivityLog {
  profile?: Profile
  task?: Task
  readableAction: string
}

export const activityService = {
  async getRecentActivity(limit = 25): Promise<ActivityItem[]> {
    if (!isSupabaseConfigured) {
      return []
    }

    try {
      const { data, error } = await (supabase.from('activity_log') as any)
        .select(`
          *,
          profile:profiles(*),
          task:tasks(id, title, status, priority, area_id)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('[activityService.getRecentActivity] Error:', error)
        return []
      }

      return (data || []).map((item: any) => ({
        ...item,
        readableAction: formatReadableAction(item.action_type, item.details, item.task?.title)
      }))
    } catch (err) {
      console.error('[activityService.getRecentActivity] Exception:', err)
      return []
    }
  }
}

function formatReadableAction(actionType: string, details: any, taskTitle?: string): string {
  const title = taskTitle ? `"${taskTitle}"` : 'la tarea'

  switch (actionType) {
    case 'created':
      return `Creó ${title}`
    case 'status_changed':
      return `Cambió el estado a ${details?.new_status || 'nuevo estado'} en ${title}`
    case 'progress_updated':
      return `Actualizó el avance a ${details?.new_progress || 0}% en ${title}`
    case 'reassigned':
      return `Reasignó ${title}`
    case 'archived':
      return `Archivó ${title}`
    case 'restored':
      return `Restauró ${title}`
    case 'updated':
      return `Editó la información de ${title}`
    default:
      return `Modificó ${title}`
  }
}
