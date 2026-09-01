import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Task, TaskWithDetails, Subtask, Comment, TaskFilters, TaskStatus, TaskPriority } from '../types'
import { DEMO_TASKS, INITIAL_AREAS, DEMO_PROFILES } from '../data/demoData'

let localTasksMemory: TaskWithDetails[] = JSON.parse(JSON.stringify(DEMO_TASKS))

// Valid columns in the Postgres 'tasks' table
const VALID_TASK_COLUMNS = new Set([
  'title',
  'description',
  'area_id',
  'main_assignee_id',
  'priority',
  'status',
  'progress_percentage',
  'is_progress_manual',
  'due_date',
  'due_time',
  'third_party_name',
  'third_party_reason',
  'third_party_promised_date',
  'third_party_contact',
  'blocked_reason',
  'blocked_at',
  'completed_by',
  'completed_at',
  'archived_at',
  'archived_by',
  'is_recurring',
  'recurring_rule_id',
  'recurrence_occurrence_date',
  'is_demo',
  'version'
])

function sanitizeColumnValue(val: any): any {
  if (val === '' || val === undefined) return null
  return val
}

export const taskService = {
  async getTasks(filters?: Partial<TaskFilters>): Promise<TaskWithDetails[]> {
    if (!isSupabaseConfigured) {
      let filtered = [...localTasksMemory]

      if (filters) {
        if (!filters.includeArchived) {
          filtered = filtered.filter(t => !t.archived_at)
        }
        if (filters.areaId && filters.areaId !== 'all') {
          filtered = filtered.filter(t => t.area_id === filters.areaId)
        }
        if (filters.status && filters.status !== 'all') {
          filtered = filtered.filter(t => t.status === filters.status)
        }
        if (filters.priority && filters.priority !== 'all') {
          filtered = filtered.filter(t => t.priority === filters.priority)
        }
        if (filters.assigneeId && filters.assigneeId !== 'all') {
          if (filters.assigneeId === 'unassigned') {
            filtered = filtered.filter(t => !t.main_assignee_id)
          } else {
            filtered = filtered.filter(t => t.main_assignee_id === filters.assigneeId || t.assignees?.some(a => a.id === filters.assigneeId))
          }
        }
        if (filters.isBlockedOnly) {
          filtered = filtered.filter(t => t.status === 'bloqueada')
        }
        if (filters.searchQuery?.trim()) {
          const query = filters.searchQuery.toLowerCase()
          filtered = filtered.filter(t => 
            t.title.toLowerCase().includes(query) || 
            (t.description && t.description.toLowerCase().includes(query)) ||
            (t.area?.name && t.area.name.toLowerCase().includes(query))
          )
        }
      }

      return filtered
    }

    try {
      let query = (supabase.from('tasks') as any)
        .select(`
          *,
          area:areas(*),
          main_assignee:profiles!tasks_main_assignee_id_fkey(*),
          subtasks(*),
          comments(*, profile:profiles(*)),
          attachments(*),
          task_dependencies!task_dependencies_task_id_fkey(*, blocking_task:tasks(*)),
          task_assignees(profile:profiles(*))
        `)
        .order('created_at', { ascending: false })

      if (!filters?.includeArchived) {
        query = query.is('archived_at', null)
      }

      if (filters?.areaId && filters.areaId !== 'all') {
        query = query.eq('area_id', filters.areaId)
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority)
      }

      if (filters?.assigneeId && filters.assigneeId !== 'all') {
        if (filters.assigneeId === 'unassigned') {
          query = query.is('main_assignee_id', null)
        } else {
          query = query.eq('main_assignee_id', filters.assigneeId)
        }
      }

      if (filters?.isBlockedOnly) {
        query = query.eq('status', 'bloqueada')
      }

      if (filters?.searchQuery?.trim()) {
        query = query.ilike('title', `%${filters.searchQuery.trim()}%`)
      }

      const { data, error } = await query
      if (error) {
        console.error('[taskService.getTasks] Error fetching tasks:', error)
        return []
      }

      // Map relational structures
      const formatted = (data || []).map((t: any) => ({
        ...t,
        assignees: (t.task_assignees || []).map((ta: any) => ta.profile).filter(Boolean),
        dependencies: t.task_dependencies || []
      }))

      return formatted as TaskWithDetails[]
    } catch (err) {
      console.error('[taskService.getTasks] Exception querying tasks:', err)
      return []
    }
  },

  async createTask(payload: {
    title: string
    description?: string
    area_id: string
    main_assignee_id?: string | null
    priority: TaskPriority
    due_date?: string | null
    due_time?: string | null
    created_by?: string
    subtasks?: string[]
    third_party_name?: string | null
    third_party_reason?: string | null
    third_party_promised_date?: string | null
    third_party_contact?: string | null
    additional_assignees?: string[]
  }): Promise<{ success: boolean; data?: TaskWithDetails; error?: string }> {
    if (!isSupabaseConfigured) {
      const area = INITIAL_AREAS.find(a => a.id === payload.area_id)
      const assignee = DEMO_PROFILES.find(p => p.id === payload.main_assignee_id) || null
      const taskId = 't_' + Date.now()

      const createdSubtasks: Subtask[] = (payload.subtasks || []).map((title, idx) => ({
        id: 's_' + taskId + '_' + idx,
        task_id: taskId,
        title,
        is_completed: false,
        completed_by: null,
        completed_at: null,
        display_order: idx + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const newTask: TaskWithDetails = {
        id: taskId,
        title: payload.title,
        description: payload.description || null,
        area_id: payload.area_id,
        area,
        main_assignee_id: payload.main_assignee_id || null,
        main_assignee: assignee,
        priority: payload.priority,
        status: 'pendiente',
        progress_percentage: 0,
        is_progress_manual: createdSubtasks.length === 0,
        due_date: payload.due_date || null,
        due_time: payload.due_time || null,
        third_party_name: payload.third_party_name || null,
        third_party_reason: payload.third_party_reason || null,
        third_party_promised_date: payload.third_party_promised_date || null,
        third_party_contact: payload.third_party_contact || null,
        blocked_reason: null,
        blocked_at: null,
        created_by: payload.created_by || 'u1',
        completed_by: null,
        completed_at: null,
        archived_at: null,
        archived_by: null,
        is_recurring: false,
        recurring_rule_id: null,
        recurrence_occurrence_date: null,
        is_demo: false,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subtasks: createdSubtasks,
        comments: [],
        attachments: [],
        dependencies: [],
        assignees: (payload.additional_assignees || []).map(id => DEMO_PROFILES.find(p => p.id === id)).filter(Boolean) as any
      }

      localTasksMemory.unshift(newTask)
      return { success: true, data: newTask }
    }

    try {
      const { data: authData } = await supabase.auth.getUser()
      const currentUserId = authData.user?.id

      if (!currentUserId) {
        return { success: false, error: 'Sesión no válida o expirada. Por favor, vuelve a iniciar sesión.' }
      }

      // 1. Prepare sanitized insert object
      const insertPayload: Record<string, any> = {
        title: payload.title.trim(),
        description: sanitizeColumnValue(payload.description),
        area_id: payload.area_id,
        main_assignee_id: sanitizeColumnValue(payload.main_assignee_id),
        priority: payload.priority || 'alta',
        status: 'pendiente',
        progress_percentage: 0,
        is_progress_manual: (payload.subtasks?.length || 0) === 0,
        due_date: sanitizeColumnValue(payload.due_date),
        due_time: sanitizeColumnValue(payload.due_time),
        third_party_name: sanitizeColumnValue(payload.third_party_name),
        third_party_reason: sanitizeColumnValue(payload.third_party_reason),
        third_party_promised_date: sanitizeColumnValue(payload.third_party_promised_date),
        third_party_contact: sanitizeColumnValue(payload.third_party_contact),
        created_by: currentUserId
      }

      // 2. Insert task row
      const { data: taskData, error: taskError } = await (supabase.from('tasks') as any)
        .insert(insertPayload)
        .select(`
          *,
          area:areas(*),
          main_assignee:profiles!tasks_main_assignee_id_fkey(*)
        `)
        .single()

      if (taskError || !taskData) {
        console.error('[taskService.createTask] Supabase Insert Error:', taskError)
        return { success: false, error: taskError?.message || 'Error al crear la tarea en la base de datos.' }
      }

      const newTaskId = taskData.id
      let createdSubtasks: Subtask[] = []

      // 3. Insert subtasks if provided
      if (payload.subtasks && payload.subtasks.length > 0) {
        const subtasksToInsert = payload.subtasks.map((stTitle, idx) => ({
          task_id: newTaskId,
          title: stTitle.trim(),
          display_order: idx + 1
        }))
        const { data: stData, error: stError } = await (supabase.from('subtasks') as any)
          .insert(subtasksToInsert)
          .select()

        if (!stError && stData) {
          createdSubtasks = stData as Subtask[]
        }
      }

      // 4. Insert additional assignees if provided
      if (payload.additional_assignees && payload.additional_assignees.length > 0) {
        const assigneesToInsert = payload.additional_assignees.map(profId => ({
          task_id: newTaskId,
          profile_id: profId
        }))
        await (supabase.from('task_assignees') as any).insert(assigneesToInsert)
      }

      const completeTask: TaskWithDetails = {
        ...taskData,
        subtasks: createdSubtasks,
        comments: [],
        attachments: [],
        dependencies: []
      }

      return { success: true, data: completeTask }
    } catch (err: any) {
      console.error('[taskService.createTask] Exception:', err)
      return { success: false, error: err.message || 'Error inesperado al crear la tarea.' }
    }
  },

  async updateTask(id: string, updates: Partial<TaskWithDetails>, currentVersion?: number): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      localTasksMemory = localTasksMemory.map(t => {
        if (t.id === id) {
          return {
            ...t,
            ...updates,
            version: (t.version || 1) + 1,
            updated_at: new Date().toISOString()
          }
        }
        return t
      })
      return { success: true }
    }

    try {
      // Filter updates to only valid table columns
      const sanitizedUpdates: Record<string, any> = {
        updated_at: new Date().toISOString()
      }

      for (const [key, value] of Object.entries(updates)) {
        if (VALID_TASK_COLUMNS.has(key)) {
          sanitizedUpdates[key] = sanitizeColumnValue(value)
        }
      }

      let query = (supabase.from('tasks') as any)
        .update(sanitizedUpdates)
        .eq('id', id)

      // Optimistic Concurrency Control if version is provided
      if (currentVersion !== undefined) {
        query = query.eq('version', currentVersion)
      }

      const { error } = await query
      if (error) {
        console.error('[taskService.updateTask] Update error:', error)
        return { success: false, error: error.message || 'No se pudo actualizar la tarea.' }
      }

      return { success: true }
    } catch (err: any) {
      console.error('[taskService.updateTask] Exception:', err)
      return { success: false, error: err.message || 'Error inesperado al actualizar la tarea.' }
    }
  },

  async toggleSubtask(taskId: string, subtaskId: string, isCompleted: boolean, _userId?: string): Promise<{ success: boolean; progress?: number; error?: string }> {
    if (!isSupabaseConfigured) {
      let updatedProgress = 0
      localTasksMemory = localTasksMemory.map(t => {
        if (t.id === taskId) {
          const updatedSubtasks = (t.subtasks || []).map(s => {
            if (s.id === subtaskId) {
              return {
                ...s,
                is_completed: isCompleted,
                completed_by: isCompleted ? 'u1' : null,
                completed_at: isCompleted ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
              }
            }
            return s
          })

          const total = updatedSubtasks.length
          const completedCount = updatedSubtasks.filter(s => s.is_completed).length
          updatedProgress = total > 0 ? Math.round((completedCount / total) * 100) : 0

          return {
            ...t,
            subtasks: updatedSubtasks,
            progress_percentage: updatedProgress,
            is_progress_manual: false,
            updated_at: new Date().toISOString()
          }
        }
        return t
      })
      return { success: true, progress: updatedProgress }
    }

    try {
      const { data: authData } = await supabase.auth.getUser()
      const currentUserId = authData.user?.id

      const { error } = await (supabase.from('subtasks') as any)
        .update({
          is_completed: isCompleted,
          completed_by: isCompleted ? currentUserId : null,
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subtaskId)

      if (error) {
        console.error('[taskService.toggleSubtask] Error:', error)
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  async addSubtask(taskId: string, title: string, displayOrder: number): Promise<{ success: boolean; data?: Subtask; error?: string }> {
    if (!isSupabaseConfigured) {
      const newSubtask: Subtask = {
        id: 's_' + Date.now(),
        task_id: taskId,
        title,
        is_completed: false,
        completed_by: null,
        completed_at: null,
        display_order: displayOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      localTasksMemory = localTasksMemory.map(t => {
        if (t.id === taskId) {
          const subtasks = [...(t.subtasks || []), newSubtask]
          const total = subtasks.length
          const completedCount = subtasks.filter(s => s.is_completed).length
          const progress = Math.round((completedCount / total) * 100)
          return {
            ...t,
            subtasks,
            progress_percentage: progress,
            is_progress_manual: false
          }
        }
        return t
      })

      return { success: true, data: newSubtask }
    }

    try {
      const { data, error } = await (supabase.from('subtasks') as any)
        .insert({
          task_id: taskId,
          title: title.trim(),
          display_order: displayOrder
        })
        .select()
        .single()

      if (error) {
        console.error('[taskService.addSubtask] Error:', error)
        return { success: false, error: error.message }
      }
      return { success: true, data: data as unknown as Subtask }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  async deleteSubtask(taskId: string, subtaskId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      localTasksMemory = localTasksMemory.map(t => {
        if (t.id === taskId) {
          const subtasks = (t.subtasks || []).filter(s => s.id !== subtaskId)
          const total = subtasks.length
          const completedCount = subtasks.filter(s => s.is_completed).length
          const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0
          return {
            ...t,
            subtasks,
            progress_percentage: progress,
            is_progress_manual: total === 0
          }
        }
        return t
      })
      return { success: true }
    }

    try {
      const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId)
      if (error) {
        console.error('[taskService.deleteSubtask] Error:', error)
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  async updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    _userId?: string,
    extra?: {
      blocked_reason?: string
      third_party_name?: string
      third_party_reason?: string
      third_party_promised_date?: string
      third_party_contact?: string
    }
  ): Promise<{ success: boolean; error?: string }> {
    const { data: authData } = await supabase.auth.getUser()
    const currentUserId = authData.user?.id

    const updates: Partial<Task> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (newStatus === 'completada') {
      updates.progress_percentage = 100
      updates.completed_at = new Date().toISOString()
      updates.completed_by = currentUserId || null
    } else {
      updates.completed_at = null
      updates.completed_by = null
    }

    if (newStatus === 'bloqueada') {
      updates.blocked_reason = extra?.blocked_reason || 'Sin motivo'
      updates.blocked_at = new Date().toISOString()
    } else {
      updates.blocked_reason = null
      updates.blocked_at = null
    }

    if (newStatus === 'esperando_tercero' && extra) {
      updates.third_party_name = extra.third_party_name || null
      updates.third_party_reason = extra.third_party_reason || null
      updates.third_party_promised_date = extra.third_party_promised_date || null
      updates.third_party_contact = extra.third_party_contact || null
    }

    return this.updateTask(taskId, updates)
  },

  async archiveTask(taskId: string, _userId?: string): Promise<{ success: boolean; error?: string }> {
    const { data: authData } = await supabase.auth.getUser()
    const currentUserId = authData.user?.id

    return this.updateTask(taskId, {
      archived_at: new Date().toISOString(),
      archived_by: currentUserId || null
    })
  },

  async restoreTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateTask(taskId, {
      archived_at: null,
      archived_by: null
    })
  },

  async addComment(taskId: string, _profileId: string, content: string): Promise<{ success: boolean; data?: Comment; error?: string }> {
    if (!isSupabaseConfigured) {
      const author = DEMO_PROFILES[0]
      const newComment: Comment & { profile?: any } = {
        id: 'c_' + Date.now(),
        task_id: taskId,
        profile_id: 'u1',
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile: author
      }

      localTasksMemory = localTasksMemory.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            comments: [...(t.comments || []), newComment]
          }
        }
        return t
      })
      return { success: true, data: newComment }
    }

    try {
      const { data: authData } = await supabase.auth.getUser()
      const currentUserId = authData.user?.id

      if (!currentUserId) {
        return { success: false, error: 'Sesión no válida. Vuelve a iniciar sesión.' }
      }

      const { data, error } = await (supabase.from('comments') as any)
        .insert({
          task_id: taskId,
          profile_id: currentUserId,
          content: content.trim()
        })
        .select('*, profile:profiles(*)')
        .single()

      if (error) {
        console.error('[taskService.addComment] Error:', error)
        return { success: false, error: error.message }
      }
      return { success: true, data: data as any }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  async addDependency(taskId: string, blockingTaskId: string): Promise<{ success: boolean; error?: string }> {
    if (taskId === blockingTaskId) {
      return { success: false, error: 'Una tarea no puede depender de sí misma.' }
    }

    if (!isSupabaseConfigured) {
      const blockingTask = localTasksMemory.find(t => t.id === blockingTaskId)
      localTasksMemory = localTasksMemory.map(t => {
        if (t.id === taskId) {
          const exists = (t.dependencies || []).some(d => d.blocking_task_id === blockingTaskId)
          if (exists) return t
          const newDep = {
            id: 'dep_' + Date.now(),
            task_id: taskId,
            blocking_task_id: blockingTaskId,
            created_at: new Date().toISOString(),
            blocking_task: blockingTask
          }
          return {
            ...t,
            dependencies: [...(t.dependencies || []), newDep as any]
          }
        }
        return t
      })
      return { success: true }
    }

    try {
      const { error } = await (supabase.from('task_dependencies') as any)
        .insert({
          task_id: taskId,
          blocking_task_id: blockingTaskId
        })

      if (error) {
        console.error('[taskService.addDependency] Error:', error)
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  async removeDependency(dependencyId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      localTasksMemory = localTasksMemory.map(t => ({
        ...t,
        dependencies: (t.dependencies || []).filter(d => d.id !== dependencyId)
      }))
      return { success: true }
    }

    try {
      const { error } = await supabase.from('task_dependencies').delete().eq('id', dependencyId)
      if (error) {
        console.error('[taskService.removeDependency] Error:', error)
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }
}
