import { describe, it, expect } from 'vitest'
import type { UserRole } from '../types'

describe('Role & Authorization Logic', () => {
  function checkCanEditTask(
    userRole: UserRole,
    isActive: boolean,
    userId: string,
    taskAssigneeId: string | null,
    coAssignees: string[]
  ): boolean {
    if (!isActive) return false
    if (userRole === 'admin') return true
    if (taskAssigneeId === userId) return true
    if (coAssignees.includes(userId)) return true
    return false
  }

  function checkCanCreateTask(userRole: UserRole, isActive: boolean, allowRespCreate: boolean): boolean {
    if (!isActive) return false
    if (userRole === 'admin') return true
    if (userRole === 'responsable') return allowRespCreate
    return false
  }

  it('should allow admin to edit any task when active', () => {
    expect(checkCanEditTask('admin', true, 'admin-1', 'other-user', [])).toBe(true)
  })

  it('should prevent deactivated users from any editing even if admin', () => {
    expect(checkCanEditTask('admin', false, 'admin-1', 'admin-1', [])).toBe(false)
  })

  it('should allow assignees to edit their assigned task', () => {
    expect(checkCanEditTask('responsable', true, 'user-1', 'user-1', [])).toBe(true)
    expect(checkCanEditTask('colaborador', true, 'user-1', 'other-user', ['user-1'])).toBe(true)
  })

  it('should deny unassigned collaborator from editing a task', () => {
    expect(checkCanEditTask('colaborador', true, 'user-1', 'user-2', ['user-3'])).toBe(false)
  })

  it('should respect app_settings for responsible task creation', () => {
    expect(checkCanCreateTask('responsable', true, true)).toBe(true)
    expect(checkCanCreateTask('responsable', true, false)).toBe(false)
    expect(checkCanCreateTask('colaborador', true, true)).toBe(false)
    expect(checkCanCreateTask('admin', true, false)).toBe(true)
  })
})
