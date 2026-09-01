import { describe, it, expect } from 'vitest'

describe('Task Operational Rules & Progress Calculations', () => {
  function calculateProgressFromSubtasks(subtasks: { is_completed: boolean }[]): number {
    if (!subtasks || subtasks.length === 0) return 0
    const completed = subtasks.filter(s => s.is_completed).length
    return Math.round((completed / subtasks.length) * 100)
  }

  function validateStateTransition(
    newStatus: string,
    extra?: { blocked_reason?: string; third_party_name?: string; third_party_reason?: string }
  ): { valid: boolean; error?: string } {
    if (newStatus === 'bloqueada') {
      if (!extra?.blocked_reason || !extra.blocked_reason.trim()) {
        return { valid: false, error: 'El motivo del bloqueo es obligatorio.' }
      }
    }

    if (newStatus === 'esperando_tercero') {
      if (!extra?.third_party_name?.trim() || !extra?.third_party_reason?.trim()) {
        return { valid: false, error: 'Nombre de tercero y motivo son obligatorios.' }
      }
    }

    return { valid: true }
  }

  function validateNoSelfDependency(taskId: string, blockingTaskId: string): boolean {
    return taskId !== blockingTaskId
  }

  it('should calculate accurate progress percentage from subtasks', () => {
    const subtasks = [
      { is_completed: true },
      { is_completed: true },
      { is_completed: false }
    ]
    expect(calculateProgressFromSubtasks(subtasks)).toBe(67)

    const allDone = [
      { is_completed: true },
      { is_completed: true }
    ]
    expect(calculateProgressFromSubtasks(allDone)).toBe(100)

    const noneDone = [
      { is_completed: false },
      { is_completed: false }
    ]
    expect(calculateProgressFromSubtasks(noneDone)).toBe(0)
  })

  it('should require a reason when marking task as blocked', () => {
    expect(validateStateTransition('bloqueada', {}).valid).toBe(false)
    expect(validateStateTransition('bloqueada', { blocked_reason: 'Falta cable de 4mm' }).valid).toBe(true)
  })

  it('should require third-party details when status is esperando_tercero', () => {
    expect(validateStateTransition('esperando_tercero', {}).valid).toBe(false)
    expect(validateStateTransition('esperando_tercero', { third_party_name: 'Carpintero', third_party_reason: 'Montaje barra' }).valid).toBe(true)
  })

  it('should reject self-dependency', () => {
    expect(validateNoSelfDependency('t1', 't1')).toBe(false)
    expect(validateNoSelfDependency('t1', 't2')).toBe(true)
  })
})
