import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Area } from '../types'
import { INITIAL_AREAS } from '../data/demoData'

let localAreasMemory: Area[] = [...INITIAL_AREAS]

export const areaService = {
  async getAreas(includeArchived = false): Promise<Area[]> {
    if (!isSupabaseConfigured) {
      return includeArchived 
        ? localAreasMemory 
        : localAreasMemory.filter(a => !a.is_archived)
    }

    let query = (supabase.from('areas') as any)
      .select('*')
      .order('display_order', { ascending: true })

    if (!includeArchived) {
      query = query.eq('is_archived', false)
    }

    const { data, error } = await query
    if (error) {
      console.error('[areaService] Error fetching areas:', error)
      return includeArchived ? localAreasMemory : localAreasMemory.filter(a => !a.is_archived)
    }
    return (data as unknown as Area[]) || []
  },

  async createArea(area: Omit<Area, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: Area; error?: string }> {
    if (!isSupabaseConfigured) {
      const newArea: Area = {
        ...area,
        id: 'a_' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      localAreasMemory.push(newArea)
      return { success: true, data: newArea }
    }

    const { data, error } = await (supabase.from('areas') as any)
      .insert(area)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data: data as unknown as Area }
  },

  async updateArea(id: string, updates: Partial<Area>): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      localAreasMemory = localAreasMemory.map(a => a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a)
      return { success: true }
    }

    const { error } = await (supabase.from('areas') as any)
      .update(updates)
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  },

  async toggleArchiveArea(id: string, isArchived: boolean): Promise<{ success: boolean; error?: string }> {
    return this.updateArea(id, { is_archived: isArchived })
  }
}
