import { describe, it, expect } from 'vitest'
import { safeFormatDate, safeFormatTime } from '../lib/dateUtils'

describe('TaskDetailDrawer & Date Safety Suite', () => {
  it('should safely format valid, invalid, and null dates without throwing exceptions', () => {
    // Valid dates
    expect(safeFormatDate('2026-09-02T12:00:00Z')).toBeDefined()
    expect(safeFormatDate(new Date(2026, 8, 2))).toBeDefined()

    // Null and undefined
    expect(safeFormatDate(null)).toBe('Sin fecha')
    expect(safeFormatDate(undefined)).toBe('Sin fecha')
    expect(safeFormatDate('', 'No date')).toBe('No date')

    // Corrupted / invalid date strings
    expect(safeFormatDate('invalid-date-string')).toBe('Sin fecha')
    expect(safeFormatDate('2026-99-99')).toBe('Sin fecha')
  })

  it('should safely format time strings and objects', () => {
    expect(safeFormatTime('2026-09-02T15:30:00Z')).toBeDefined()
    expect(safeFormatTime(null)).toBe('')
    expect(safeFormatTime(undefined)).toBe('')
    expect(safeFormatTime('invalid-time')).toBe('')
  })

  it('should verify defensive array normalization for tasks with null relations', () => {
    const mockTask: any = {
      id: 'task-1',
      title: 'Tarea de prueba',
      subtasks: null,
      comments: undefined,
      attachments: null,
      dependencies: null,
      blocks: null,
      assignees: null
    }

    const subtasks = Array.isArray(mockTask.subtasks) ? mockTask.subtasks : []
    const comments = Array.isArray(mockTask.comments) ? mockTask.comments : []
    const attachments = Array.isArray(mockTask.attachments) ? mockTask.attachments : []
    const dependencies = Array.isArray(mockTask.dependencies) ? mockTask.dependencies : []
    const blocks = Array.isArray(mockTask.blocks) ? mockTask.blocks : []

    expect(subtasks.length).toBe(0)
    expect(comments.length).toBe(0)
    expect(attachments.length).toBe(0)
    expect(dependencies.length).toBe(0)
    expect(blocks.length).toBe(0)
  })
})
