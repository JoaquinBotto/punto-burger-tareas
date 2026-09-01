import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Notification } from '../types'

export const notificationService = {
  async getNotifications(limit = 40): Promise<Notification[]> {
    if (!isSupabaseConfigured) {
      return []
    }

    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) return []

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('[notificationService.getNotifications] Error:', error)
        return []
      }

      return (data || []) as Notification[]
    } catch (err) {
      console.error('[notificationService.getNotifications] Exception:', err)
      return []
    }
  },

  async getUnreadCount(): Promise<number> {
    if (!isSupabaseConfigured) return 0

    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) return 0

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId)
        .eq('is_read', false)

      if (error) return 0
      return count || 0
    } catch {
      return 0
    }
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true

    try {
      const { error } = await (supabase.from('notifications') as any)
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      return !error
    } catch {
      return false
    }
  },

  async markAllAsRead(): Promise<boolean> {
    if (!isSupabaseConfigured) return true

    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) return false

      const { error } = await (supabase.from('notifications') as any)
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('profile_id', userId)
        .eq('is_read', false)

      return !error
    } catch {
      return false
    }
  }
}
