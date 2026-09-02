import { format, isBefore, addDays, differenceInMinutes, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

export const TIMEZONE_CORDOBA = 'America/Argentina/Cordoba'

/**
 * Returns today's date formatted as YYYY-MM-DD in the local Argentina timezone
 */
export function getTodayDateString(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_CORDOBA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(now) // Produces 'YYYY-MM-DD'
}

/**
 * Parses a YYYY-MM-DD string into a Date object normalized to local noon or local midnight
 * to avoid any UTC timezone boundary shifts.
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0)
}

/**
 * Formats a Date or YYYY-MM-DD string into friendly Spanish (e.g. "Lunes, 31 de Agosto")
 */
export function formatHeaderDate(date: Date = new Date()): string {
  const formatted = format(date, "EEEE, d 'de' MMMM", { locale: es })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/**
 * Formats a deadline date (and optional time) into a readable string
 */
export function formatDueDate(dateString: string | null, timeString?: string | null): string {
  if (!dateString) return 'Sin fecha límite'
  
  const parsed = parseLocalDate(dateString)
  const todayStr = getTodayDateString()
  
  let baseText = ''
  if (dateString === todayStr) {
    baseText = 'Hoy'
  } else {
    const tomorrowStr = getTomorrowDateString()
    if (dateString === tomorrowStr) {
      baseText = 'Mañana'
    } else {
      baseText = format(parsed, "d 'de' MMM", { locale: es })
    }
  }

  if (timeString) {
    const cleanTime = timeString.slice(0, 5) // 'HH:mm'
    return `${baseText} a las ${cleanTime} hs`
  }

  return baseText
}

export function getTomorrowDateString(): string {
  const now = new Date()
  const tomorrow = addDays(now, 1)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_CORDOBA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(tomorrow)
}

/**
 * Evaluates urgency classification of a task deadline
 */
export type DueStatus = 'overdue' | 'due_today' | 'due_tomorrow' | 'due_soon' | 'future' | 'no_date'

export function getDueStatus(dateString: string | null, timeString?: string | null, status?: string): DueStatus {
  if (status === 'completada' || status === 'cancelada') return 'future'
  if (!dateString) return 'no_date'

  const todayStr = getTodayDateString()
  const tomorrowStr = getTomorrowDateString()

  if (dateString < todayStr) return 'overdue'
  
  if (dateString === todayStr) {
    // If there's a specific time, check if the hour has already passed today
    if (timeString) {
      const now = new Date()
      const [hours, minutes] = timeString.split(':').map(Number)
      const dueMoment = new Date()
      dueMoment.setHours(hours, minutes, 0, 0)
      if (isBefore(dueMoment, now)) {
        return 'overdue'
      }
    }
    return 'due_today'
  }

  if (dateString === tomorrowStr) return 'due_tomorrow'

  // Within 3 days
  const soonLimit = addDays(new Date(), 3)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_CORDOBA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const soonLimitStr = formatter.format(soonLimit)
  if (dateString <= soonLimitStr) return 'due_soon'

  return 'future'
}

/**
 * Returns human-readable delay or remaining time
 */
export function getTimeDifferenceDescription(dateString: string | null, timeString?: string | null): string {
  if (!dateString) return 'Sin fecha'
  const todayStr = getTodayDateString()

  if (dateString < todayStr) {
    const daysLate = differenceInDays(parseLocalDate(todayStr), parseLocalDate(dateString))
    return `Atrasada por ${daysLate} ${daysLate === 1 ? 'día' : 'días'}`
  }

  if (dateString === todayStr) {
    if (timeString) {
      const now = new Date()
      const [hours, minutes] = timeString.split(':').map(Number)
      const dueMoment = new Date()
      dueMoment.setHours(hours, minutes, 0, 0)
      
      const diffMins = differenceInMinutes(dueMoment, now)
      if (diffMins < 0) {
        const minsLate = Math.abs(diffMins)
        if (minsLate < 60) return `Vencida hace ${minsLate} min`
        const hrs = Math.floor(minsLate / 60)
        return `Vencida hace ${hrs} hs`
      }
      if (diffMins < 60) return `Vence en ${diffMins} min`
      const hrs = Math.floor(diffMins / 60)
      return `Vence en ${hrs} hs`
    }
    return 'Vence hoy'
  }

  const daysLeft = differenceInDays(parseLocalDate(dateString), parseLocalDate(todayStr))
  if (daysLeft === 1) return 'Vence mañana'
  return `Quedan ${daysLeft} días`
}

/**
 * Safely formats any date string/object without throwing runtime exceptions
 */
export function safeFormatDate(
  value: string | Date | null | undefined,
  fallback = 'Sin fecha',
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
): string {
  if (!value) return fallback
  try {
    const d = typeof value === 'string' ? new Date(value) : value
    if (isNaN(d.getTime())) return fallback
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: TIMEZONE_CORDOBA,
      ...options
    }).format(d)
  } catch {
    return fallback
  }
}

/**
 * Safely formats any time string/object without throwing runtime exceptions
 */
export function safeFormatTime(
  value: string | Date | null | undefined,
  fallback = ''
): string {
  if (!value) return fallback
  try {
    const d = typeof value === 'string' ? new Date(value) : value
    if (isNaN(d.getTime())) return fallback
    return new Intl.DateTimeFormat('es-AR', {
      timeZone: TIMEZONE_CORDOBA,
      hour: '2-digit',
      minute: '2-digit'
    }).format(d)
  } catch {
    return fallback
  }
}

