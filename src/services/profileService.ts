import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Profile, UserRole } from '../types'
import { DEMO_PROFILES } from '../data/demoData'

let localProfilesMemory: Profile[] = [...DEMO_PROFILES]

export const profileService = {
  async getProfiles(activeOnly = true): Promise<Profile[]> {
    if (!isSupabaseConfigured) {
      return activeOnly ? localProfilesMemory.filter(p => p.is_active) : localProfilesMemory
    }

    let query = (supabase.from('profiles') as any)
      .select('*')
      .order('full_name', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query
    if (error) {
      console.error('[profileService] Error fetching profiles:', error)
      return activeOnly ? localProfilesMemory.filter(p => p.is_active) : localProfilesMemory
    }
    return (data as unknown as Profile[]) || []
  },

  async inviteUser(payload: { email: string; full_name: string; role: UserRole; phone?: string }): Promise<{ success: boolean; error?: string; user?: any }> {
    if (!isSupabaseConfigured) {
      const newMockProfile: Profile = {
        id: 'u_' + Date.now(),
        email: payload.email,
        full_name: payload.full_name,
        role: payload.role,
        phone: payload.phone || null,
        avatar_url: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      localProfilesMemory.push(newMockProfile)
      return { success: true, user: newMockProfile }
    }

    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: payload
      })

      if (error) return { success: false, error: error.message }
      if (data?.error) return { success: false, error: data.error }

      return { success: true, user: data?.user }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al conectar con la función de invitación' }
    }
  },

  async toggleUserActive(userId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      localProfilesMemory = localProfilesMemory.map(p => p.id === userId ? { ...p, is_active: isActive } : p)
      return { success: true }
    }

    const { error } = await (supabase.from('profiles') as any)
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  },

  async changeUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      localProfilesMemory = localProfilesMemory.map(p => p.id === userId ? { ...p, role: newRole } : p)
      return { success: true }
    }

    const { error } = await (supabase.from('profiles') as any)
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  }
}
