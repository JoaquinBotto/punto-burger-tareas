import { describe, it, expect } from 'vitest'
import {
  calculateDashboardMetrics,
  getUrgentTasks,
  calculateAreaProgress,
  organizeMyDayTasks
} from '../lib/metricsCalculations'
import type { TaskWithDetails, Area } from '../types'

describe('Dashboard Metrics & Operational Sorting', () => {
  const mockAreas: Area[] = [
    { id: 'a1', name: 'Obra y construcción', color: '#E03131', display_order: 1, is_archived: false, icon: 'tool', description: null, created_at: '', updated_at: '' },
    { id: 'a2', name: 'Barra y cocina', color: '#7048E8', display_order: 2, is_archived: false, icon: 'coffee', description: null, created_at: '', updated_at: '' }
  ]

  const mockTasks: TaskWithDetails[] = [
    {
      id: 't1',
      title: 'Durlock salón',
      area_id: 'a1',
      priority: 'critica',
      status: 'en_progreso',
      progress_percentage: 50,
      is_progress_manual: false,
      is_demo: false,
      due_date: '2026-08-30', // Overdue
      due_time: null,
      archived_at: null,
      created_by: 'u1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      archived_by: null,
      blocked_at: null,
      blocked_reason: null,
      completed_at: null,
      completed_by: null,
      description: null,
      is_recurring: false,
      main_assignee_id: null,
      recurrence_occurrence_date: null,
      recurring_rule_id: null,
      third_party_contact: null,
      third_party_name: null,
      third_party_promised_date: null,
      third_party_reason: null,
      subtasks: [
        { id: 's1', task_id: 't1', title: 'Comprar placas', is_completed: true, completed_by: 'u1', completed_at: '', display_order: 1, created_at: '', updated_at: '' },
        { id: 's2', task_id: 't1', title: 'Montar perfiles', is_completed: false, completed_by: null, completed_at: null, display_order: 2, created_at: '', updated_at: '' }
      ]
    },
    {
      id: 't2',
      title: 'Plomería barra',
      area_id: 'a2',
      priority: 'critica',
      status: 'bloqueada',
      blocked_reason: 'Falta llave de paso',
      progress_percentage: 0,
      is_progress_manual: false,
      is_demo: false,
      due_date: null,
      due_time: null,
      archived_at: null,
      created_by: 'u1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      archived_by: null,
      blocked_at: null,
      completed_at: null,
      completed_by: null,
      description: null,
      is_recurring: false,
      main_assignee_id: null,
      recurrence_occurrence_date: null,
      recurring_rule_id: null,
      third_party_contact: null,
      third_party_name: null,
      third_party_promised_date: null,
      third_party_reason: null,
      subtasks: []
    },
    {
      id: 't3',
      title: 'Pintura',
      area_id: 'a1',
      priority: 'alta',
      status: 'completada',
      completed_at: new Date().toISOString(),
      completed_by: 'u1',
      progress_percentage: 100,
      is_progress_manual: false,
      is_demo: false,
      due_date: null,
      due_time: null,
      archived_at: null,
      created_by: 'u1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      archived_by: null,
      blocked_at: null,
      blocked_reason: null,
      description: null,
      is_recurring: false,
      main_assignee_id: null,
      recurrence_occurrence_date: null,
      recurring_rule_id: null,
      third_party_contact: null,
      third_party_name: null,
      third_party_promised_date: null,
      third_party_reason: null,
      subtasks: []
    },
    {
      id: 't_demo',
      title: 'Tarea Demo Ficticia',
      area_id: 'a1',
      priority: 'critica',
      status: 'pendiente',
      progress_percentage: 0,
      is_progress_manual: false,
      is_demo: true, // Should be ignored
      due_date: null,
      due_time: null,
      archived_at: null,
      created_by: 'u1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      archived_by: null,
      blocked_at: null,
      blocked_reason: null,
      completed_at: null,
      completed_by: null,
      description: null,
      is_recurring: false,
      main_assignee_id: null,
      recurrence_occurrence_date: null,
      recurring_rule_id: null,
      third_party_contact: null,
      third_party_name: null,
      third_party_promised_date: null,
      third_party_reason: null,
      subtasks: []
    },
    {
      id: 't_archived',
      title: 'Tarea Antigua Archivada',
      area_id: 'a1',
      priority: 'critica',
      status: 'pendiente',
      progress_percentage: 0,
      is_progress_manual: false,
      is_demo: false,
      due_date: null,
      due_time: null,
      archived_at: new Date().toISOString(), // Should be ignored
      created_by: 'u1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      archived_by: null,
      blocked_at: null,
      blocked_reason: null,
      completed_at: null,
      completed_by: null,
      description: null,
      is_recurring: false,
      main_assignee_id: null,
      recurrence_occurrence_date: null,
      recurring_rule_id: null,
      third_party_contact: null,
      third_party_name: null,
      third_party_promised_date: null,
      third_party_reason: null,
      subtasks: []
    }
  ]

  it('should accurately calculate dashboard metrics excluding demo and archived tasks', () => {
    const metrics = calculateDashboardMetrics(mockTasks)

    expect(metrics.totalActiveTasks).toBe(3)
    expect(metrics.pendingCount).toBe(0)
    expect(metrics.inProgressCount).toBe(1)
    expect(metrics.blockedCount).toBe(1)
    expect(metrics.overdueCount).toBe(1)
    expect(metrics.completedThisWeekCount).toBe(1)
    // t1 has 1 of 2 subtasks done (50%), t2 has 0%, t3 has 100%. Average = (50 + 0 + 100) / 3 = 50%
    expect(metrics.overallProgressPercentage).toBe(50)
  })

  it('should sort "Lo Urgente" with P0 critical tasks at top priority', () => {
    const urgent = getUrgentTasks(mockTasks)

    expect(urgent.length).toBe(2) // t1 and t2 (t3 is completed)
    // t1 is P0 overdue -> Rank 1
    expect(urgent[0].task.id).toBe('t1')
    expect(urgent[0].urgencyReason).toBe('Crítica P0 Atrasada')
    // t2 is P0 blocked -> Rank 3
    expect(urgent[1].task.id).toBe('t2')
    expect(urgent[1].urgencyReason).toBe('Crítica P0 Bloqueada')
  })

  it('should calculate progress per area without duplicate counting', () => {
    const progress = calculateAreaProgress(mockTasks, mockAreas)

    const area1 = progress.find(p => p.areaId === 'a1')
    expect(area1).toBeDefined()
    expect(area1?.totalTasks).toBe(2) // t1 and t3
    expect(area1?.completedTasks).toBe(1)
    expect(area1?.progressPercentage).toBe(75) // t1 (50%) + t3 (100%) / 2 = 75%

    const area2 = progress.find(p => p.areaId === 'a2')
    expect(area2).toBeDefined()
    expect(area2?.totalTasks).toBe(1) // t2
    expect(area2?.blockedTasks).toBe(1)
    expect(area2?.progressPercentage).toBe(0)
  })

  it('should organize "Mi Día" into overdue, today, upcoming, undated and completed', () => {
    const myDay = organizeMyDayTasks(mockTasks, 'u1', true)

    expect(myDay.overdue.length).toBe(1) // t1
    expect(myDay.undated.length).toBe(1) // t2
    expect(myDay.completedToday.length).toBe(1) // t3
  })
})
