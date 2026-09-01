import type { Database } from './database.types'

export * from './database.types'

export type UserRole = 'admin' | 'responsable' | 'colaborador'
export type TaskPriority = 'critica' | 'alta' | 'media' | 'baja'
export type TaskStatus = 'pendiente' | 'en_progreso' | 'bloqueada' | 'esperando_tercero' | 'en_revision' | 'completada' | 'cancelada'

export type AppSettings = Database['public']['Tables']['app_settings']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  role: UserRole
}
export type Area = Database['public']['Tables']['areas']['Row']
export type Task = Database['public']['Tables']['tasks']['Row'] & {
  priority: TaskPriority
  status: TaskStatus
}
export type Subtask = Database['public']['Tables']['subtasks']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Attachment = Database['public']['Tables']['attachments']['Row']
export type TaskDependency = Database['public']['Tables']['task_dependencies']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type ActivityLog = Database['public']['Tables']['activity_log']['Row']
export type RecurringTaskRule = Database['public']['Tables']['recurring_task_rules']['Row']

// Extended Task with Relations
export interface TaskWithDetails extends Task {
  area?: Area
  main_assignee?: Profile | null
  assignees?: Profile[]
  subtasks?: Subtask[]
  comments?: (Comment & { profile?: Profile })[]
  attachments?: Attachment[]
  dependencies?: (TaskDependency & { blocking_task?: Task })[]
  tags?: Tag[]
  created_by_profile?: Profile
}

// User Filter & Search State
export interface TaskFilters {
  searchQuery: string
  assigneeId: string | 'all' | 'unassigned'
  areaId: string | 'all'
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  duePeriod: 'all' | 'overdue' | 'today' | 'tomorrow' | 'soon' | 'no_date'
  isBlockedOnly: boolean
  includeArchived: boolean
  tagId: string | 'all'
}

export type ViewMode = 'dashboard' | 'my_day' | 'all_tasks' | 'by_area' | 'calendar' | 'kanban' | 'alerts' | 'team' | 'history' | 'areas_admin' | 'recurring_admin'
