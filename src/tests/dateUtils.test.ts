import { describe, it, expect } from 'vitest'
import {
  getTodayDateString,
  getTomorrowDateString,
  parseLocalDate,
  getDueStatus,
  getTimeDifferenceDescription,
  formatDueDate
} from '../lib/dateUtils'

describe('Date & Timezone Utilities (America/Argentina/Cordoba)', () => {
  it('should return valid YYYY-MM-DD strings for today and tomorrow', () => {
    const today = getTodayDateString()
    const tomorrow = getTomorrowDateString()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(tomorrow).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(today).not.toEqual(tomorrow)
  })

  it('should parse local date without timezone offset day shift', () => {
    const dateStr = '2026-09-01'
    const parsed = parseLocalDate(dateStr)
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(8) // September is 8 (0-indexed)
    expect(parsed.getDate()).toBe(1)
  })

  it('should correctly classify overdue, today, and future tasks', () => {
    const today = getTodayDateString()
    const tomorrow = getTomorrowDateString()
    const pastDate = '2020-01-01'
    const farFutureDate = '2030-01-01'

    expect(getDueStatus(pastDate)).toBe('overdue')
    expect(getDueStatus(today)).toBe('due_today')
    expect(getDueStatus(tomorrow)).toBe('due_tomorrow')
    expect(getDueStatus(farFutureDate)).toBe('future')
    expect(getDueStatus(null)).toBe('no_date')
    expect(getDueStatus(pastDate, null, 'completada')).toBe('future')
  })

  it('should describe time differences in human readable Spanish', () => {
    const pastDate = '2020-01-01'
    const diff = getTimeDifferenceDescription(pastDate)
    expect(diff).toContain('Atrasada por')

    const today = getTodayDateString()
    expect(getTimeDifferenceDescription(today)).toBe('Vence hoy')
  })

  it('should format due date with time properly', () => {
    const today = getTodayDateString()
    const formatted = formatDueDate(today, '14:30:00')
    expect(formatted).toBe('Hoy a las 14:30 hs')
  })
})
