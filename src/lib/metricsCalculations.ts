import type { TaskWithDetails, Area } from '../types'
import { getTodayDateString, getDueStatus } from './dateUtils'

export interface DashboardMetrics {
  totalActiveTasks: number
  pendingCount: number
  inProgressCount: number
  overdueCount: number
  blockedCount: number
  completedThisWeekCount: number
  overallProgressPercentage: number
}

export interface UrgentTaskItem {
  task: TaskWithDetails
  urgencyReason: string
  urgencyLevel: 'critical' | 'high' | 'warning'
}

export interface AreaProgressItem {
  areaId: string
  name: string
  color: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  blockedTasks: number
  progressPercentage: number
}

/**
 * Calculates overall dashboard metrics excluding demo and archived tasks
 */
export function calculateDashboardMetrics(tasks: TaskWithDetails[]): DashboardMetrics {
  const activeTasks = tasks.filter(t => !t.archived_at && !t.is_demo)

  if (activeTasks.length === 0) {
    return {
      totalActiveTasks: 0,
      pendingCount: 0,
      inProgressCount: 0,
      overdueCount: 0,
      blockedCount: 0,
      completedThisWeekCount: 0,
      overallProgressPercentage: 0
    }
  }

  let pendingCount = 0
  let inProgressCount = 0
  let overdueCount = 0
  let blockedCount = 0
  let completedThisWeekCount = 0
  let totalWeightedProgress = 0

  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  activeTasks.forEach(t => {
    if (t.status === 'pendiente') pendingCount++
    if (t.status === 'en_progreso') inProgressCount++
    if (t.status === 'bloqueada' || t.status === 'esperando_tercero') blockedCount++

    if (t.status === 'completada' && t.completed_at) {
      const completedDate = new Date(t.completed_at)
      if (completedDate >= oneWeekAgo) {
        completedThisWeekCount++
      }
    }

    const dueStatus = getDueStatus(t.due_date, t.due_time, t.status)
    if (dueStatus === 'overdue') {
      overdueCount++
    }

    // Progress calculation per task
    const totalSub = t.subtasks?.length || 0
    if (totalSub > 0) {
      const completedSub = t.subtasks?.filter(s => s.is_completed).length || 0
      totalWeightedProgress += (completedSub / totalSub) * 100
    } else {
      totalWeightedProgress += t.progress_percentage || (t.status === 'completada' ? 100 : 0)
    }
  })

  const overallProgressPercentage = Math.round(totalWeightedProgress / activeTasks.length)

  return {
    totalActiveTasks: activeTasks.length,
    pendingCount,
    inProgressCount,
    overdueCount,
    blockedCount,
    completedThisWeekCount,
    overallProgressPercentage
  }
}

/**
 * Returns prioritized "Lo Urgente" list based on P0/P1 criticality, deadlines and blockages
 */
export function getUrgentTasks(tasks: TaskWithDetails[]): UrgentTaskItem[] {
  const activeTasks = tasks.filter(t => !t.archived_at && !t.is_demo && t.status !== 'completada' && t.status !== 'cancelada')
  const urgentList: UrgentTaskItem[] = []

  // Rank 1: P0 overdue
  activeTasks
    .filter(t => t.priority === 'critica' && getDueStatus(t.due_date, t.due_time, t.status) === 'overdue')
    .forEach(task => urgentList.push({ task, urgencyReason: 'Crítica P0 Atrasada', urgencyLevel: 'critical' }))

  // Rank 2: P0 due today
  activeTasks
    .filter(t => t.priority === 'critica' && getDueStatus(t.due_date, t.due_time, t.status) === 'due_today' && !urgentList.some(u => u.task.id === t.id))
    .forEach(task => urgentList.push({ task, urgencyReason: 'Crítica P0 Vence Hoy', urgencyLevel: 'critical' }))

  // Rank 3: P0 blocked
  activeTasks
    .filter(t => t.priority === 'critica' && (t.status === 'bloqueada' || t.status === 'esperando_tercero') && !urgentList.some(u => u.task.id === t.id))
    .forEach(task => urgentList.push({ task, urgencyReason: 'Crítica P0 Bloqueada', urgencyLevel: 'critical' }))

  // Rank 4: P0 active / opening blocker
  activeTasks
    .filter(t => t.priority === 'critica' && !urgentList.some(u => u.task.id === t.id))
    .forEach(task => urgentList.push({ task, urgencyReason: 'Crítica P0 Bloqueante de Apertura', urgencyLevel: 'critical' }))

  // Rank 5: P1 overdue
  activeTasks
    .filter(t => t.priority === 'alta' && getDueStatus(t.due_date, t.due_time, t.status) === 'overdue' && !urgentList.some(u => u.task.id === t.id))
    .forEach(task => urgentList.push({ task, urgencyReason: 'Prioridad Alta Atrasada', urgencyLevel: 'high' }))

  // Rank 6: Any task due today
  activeTasks
    .filter(t => getDueStatus(t.due_date, t.due_time, t.status) === 'due_today' && !urgentList.some(u => u.task.id === t.id))
    .forEach(task => urgentList.push({ task, urgencyReason: 'Vence Hoy', urgencyLevel: 'high' }))

  // Rank 7: Other blocked tasks
  activeTasks
    .filter(t => (t.status === 'bloqueada' || t.status === 'esperando_tercero') && !urgentList.some(u => u.task.id === t.id))
    .forEach(task => urgentList.push({ task, urgencyReason: 'Tarea Bloqueada', urgencyLevel: 'warning' }))

  return urgentList
}

/**
 * Calculates true progress per area
 */
export function calculateAreaProgress(tasks: TaskWithDetails[], areas: Area[]): AreaProgressItem[] {
  const activeTasks = tasks.filter(t => !t.archived_at && !t.is_demo)

  return areas.map(area => {
    const areaTasks = activeTasks.filter(t => t.area_id === area.id)
    const total = areaTasks.length

    if (total === 0) {
      return {
        areaId: area.id,
        name: area.name,
        color: area.color || '#C92A2A',
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        blockedTasks: 0,
        progressPercentage: 0
      }
    }

    const completed = areaTasks.filter(t => t.status === 'completada').length
    const inProgress = areaTasks.filter(t => t.status === 'en_progreso').length
    const blocked = areaTasks.filter(t => t.status === 'bloqueada' || t.status === 'esperando_tercero').length

    let weightedSum = 0
    areaTasks.forEach(t => {
      const subCount = t.subtasks?.length || 0
      if (subCount > 0) {
        const subDone = t.subtasks?.filter(s => s.is_completed).length || 0
        weightedSum += (subDone / subCount) * 100
      } else {
        weightedSum += t.progress_percentage || (t.status === 'completada' ? 100 : 0)
      }
    })

    const progressPercentage = Math.round(weightedSum / total)

    return {
      areaId: area.id,
      name: area.name,
      color: area.color || '#C92A2A',
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      blockedTasks: blocked,
      progressPercentage
    }
  })
}

/**
 * Organizes tasks for "Mi Día" view
 */
export function organizeMyDayTasks(tasks: TaskWithDetails[], userId: string, isAdmin: boolean) {
  const activeTasks = tasks.filter(t => !t.archived_at && !t.is_demo)
  const todayStr = getTodayDateString()

  // Relevant tasks for this user: assigned directly or all if admin
  const userTasks = isAdmin
    ? activeTasks
    : activeTasks.filter(t => t.main_assignee_id === userId || t.assignees?.some(a => a.id === userId))

  const overdue: TaskWithDetails[] = []
  const today: TaskWithDetails[] = []
  const upcoming: TaskWithDetails[] = []
  const undated: TaskWithDetails[] = []
  const completedToday: TaskWithDetails[] = []

  userTasks.forEach(t => {
    if (t.status === 'completada') {
      if (t.completed_at && t.completed_at.startsWith(todayStr)) {
        completedToday.push(t)
      }
      return
    }

    const dueStatus = getDueStatus(t.due_date, t.due_time, t.status)
    if (dueStatus === 'overdue') {
      overdue.push(t)
    } else if (dueStatus === 'due_today') {
      today.push(t)
    } else if (dueStatus === 'due_tomorrow' || dueStatus === 'due_soon') {
      upcoming.push(t)
    } else if (!t.due_date) {
      undated.push(t)
    } else {
      upcoming.push(t)
    }
  })

  return {
    overdue,
    today,
    upcoming,
    undated,
    completedToday,
    totalCount: overdue.length + today.length + upcoming.length + undated.length
  }
}
