import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { RecurringTaskRule, TaskPriority, TaskWithDetails, Area, Profile } from '../types'

export interface CreateRecurringRulePayload {
  template_title: string
  template_description?: string
  area_id: string
  main_assignee_id?: string | null
  priority: TaskPriority
  frequency: 'daily' | 'specific_days' | 'weekly' | 'monthly'
  interval_days?: number
  days_of_week?: number[] // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  create_time?: string
  start_date: string
  end_date?: string | null
  is_active?: boolean
}

export const recurringTaskService = {
  async getRules(): Promise<(RecurringTaskRule & { area?: Area; main_assignee?: Profile | null })[]> {
    if (!isSupabaseConfigured) {
      return []
    }

    try {
      const { data, error } = await (supabase.from('recurring_task_rules') as any)
        .select(`
          *,
          area:areas(*),
          main_assignee:profiles!recurring_task_rules_main_assignee_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[recurringTaskService.getRules] Error:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('[recurringTaskService.getRules] Exception:', err)
      return []
    }
  },

  async createRule(payload: CreateRecurringRulePayload): Promise<{ success: boolean; data?: RecurringTaskRule; error?: string }> {
    if (!payload.template_title.trim()) {
      return { success: false, error: 'El título de la plantilla es obligatorio.' }
    }
    if (!payload.area_id) {
      return { success: false, error: 'El área es obligatoria.' }
    }

    if (!isSupabaseConfigured) {
      return { success: true }
    }

    try {
      const { data: authData } = await supabase.auth.getUser()
      const currentUserId = authData.user?.id

      const insertPayload = {
        template_title: payload.template_title.trim(),
        template_description: payload.template_description?.trim() || null,
        area_id: payload.area_id,
        main_assignee_id: payload.main_assignee_id || null,
        priority: payload.priority || 'media',
        frequency: payload.frequency,
        interval_days: payload.interval_days || 1,
        days_of_week: payload.days_of_week || [],
        create_time: payload.create_time || '08:00:00',
        timezone: 'America/Argentina/Cordoba',
        start_date: payload.start_date,
        next_run_date: payload.start_date,
        end_date: payload.end_date || null,
        is_active: payload.is_active ?? true,
        created_by: currentUserId
      }

      const { data, error } = await (supabase.from('recurring_task_rules') as any)
        .insert(insertPayload)
        .select()
        .single()

      if (error || !data) {
        console.error('[recurringTaskService.createRule] Error:', error)
        return { success: false, error: error?.message || 'No se pudo crear la regla de recurrencia.' }
      }

      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  async toggleRuleStatus(ruleId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true }
    }

    try {
      const { error } = await (supabase.from('recurring_task_rules') as any)
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId)

      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  async deleteRule(ruleId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true }
    }

    try {
      const { error } = await (supabase.from('recurring_task_rules') as any)
        .delete()
        .eq('id', ruleId)

      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  /**
   * Generates a single task occurrence idempotently
   */
  async generateOccurrence(rule: RecurringTaskRule, occurrenceDate: string): Promise<{ success: boolean; task?: TaskWithDetails; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true }
    }

    try {
      const { data: authData } = await supabase.auth.getUser()
      const currentUserId = authData.user?.id || rule.created_by

      const taskPayload = {
        title: rule.template_title,
        description: rule.template_description,
        area_id: rule.area_id,
        main_assignee_id: rule.main_assignee_id,
        priority: rule.priority,
        status: 'pendiente',
        due_date: occurrenceDate,
        due_time: rule.create_time,
        is_recurring: true,
        recurring_rule_id: rule.id,
        recurrence_occurrence_date: occurrenceDate,
        is_demo: false,
        created_by: currentUserId
      }

      const { data, error } = await (supabase.from('tasks') as any)
        .insert(taskPayload)
        .select(`
          *,
          area:areas(*),
          main_assignee:profiles!tasks_main_assignee_id_fkey(*)
        `)
        .single()

      if (error) {
        // Unique constraint violation means it was already generated
        if (error.code === '23505' || error.message.includes('uq_recurring_occurrence')) {
          return { success: true }
        }
        console.error('[recurringTaskService.generateOccurrence] Error:', error)
        return { success: false, error: error.message }
      }

      // Update last_run_date on rule
      await (supabase.from('recurring_task_rules') as any)
        .update({ last_run_date: occurrenceDate, updated_at: new Date().toISOString() })
        .eq('id', rule.id)

      return { success: true, task: data }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }
}
