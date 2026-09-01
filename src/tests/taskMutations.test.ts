import { describe, it, expect } from 'vitest'

describe('Task Mutation Sanitization and Rules', () => {
  const TASK_DETAIL_COLUMNS = new Set([
    'title',
    'description',
    'area_id',
    'main_assignee_id',
    'priority',
    'due_date',
    'due_time'
  ])

  function sanitizeUpdateDetails(details: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    for (const [key, value] of Object.entries(details)) {
      if (TASK_DETAIL_COLUMNS.has(key) && value !== undefined) {
        sanitized[key] = value === '' ? null : value
      }
    }
    return sanitized
  }

  function validateTaskDetails(details: { title?: string; area_id?: string }) {
    if (!details.title || !details.title.trim()) {
      return { valid: false, error: 'El título no puede estar vacío.' }
    }
    if (!details.area_id) {
      return { valid: false, error: 'Debes seleccionar un área válida.' }
    }
    return { valid: true }
  }

  it('should sanitize update payloads by excluding undefined and relations', () => {
    const input = {
      title: 'Nuevo título',
      description: '',
      area_id: 'a1',
      due_date: undefined,
      subtasks: [{ id: '1' }],
      area: { name: 'Cocina' },
      comments: []
    }

    const output = sanitizeUpdateDetails(input)

    expect(output.title).toBe('Nuevo título')
    expect(output.description).toBeNull() // empty string converted to null
    expect(output.area_id).toBe('a1')
    expect(output).not.toHaveProperty('due_date') // undefined omitted
    expect(output).not.toHaveProperty('subtasks') // relations excluded
    expect(output).not.toHaveProperty('area') // relations excluded
    expect(output).not.toHaveProperty('comments') // relations excluded
    expect(output.updated_at).toBeDefined()
  })

  it('should validate title and area before sending mutation', () => {
    expect(validateTaskDetails({ title: '', area_id: 'a1' }).valid).toBe(false)
    expect(validateTaskDetails({ title: 'Instalar freidora', area_id: '' }).valid).toBe(false)
    expect(validateTaskDetails({ title: 'Instalar freidora', area_id: 'a1' }).valid).toBe(true)
  })

  it('should preserve false and 0 without converting to null', () => {
    const sanitizeGeneral = (val: any) => (val === '' || val === undefined ? null : val)
    expect(sanitizeGeneral(false)).toBe(false)
    expect(sanitizeGeneral(0)).toBe(0)
    expect(sanitizeGeneral('')).toBeNull()
    expect(sanitizeGeneral(undefined)).toBeNull()
    expect(sanitizeGeneral('texto')).toBe('texto')
  })
})
