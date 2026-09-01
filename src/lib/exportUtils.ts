import type { TaskWithDetails } from '../types'

/**
 * Sanitizes cell values to prevent CSV / Excel formula injection
 */
export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return ''
  let str = String(value).trim()

  // Prevent CSV Injection: prefix with single quote if starts with formula trigger
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }

  // Escape double quotes and enclose in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Exports tasks to a properly formatted CSV file with UTF-8 BOM for Excel
 */
export function exportTasksToCsv(tasks: TaskWithDetails[], filenamePrefix = 'reporte-punto-burger'): void {
  const headers = [
    'Título',
    'Área',
    'Prioridad',
    'Estado',
    'Progreso (%)',
    'Responsable Principal',
    'Fecha Límite',
    'Hora Límite',
    'Bloqueada',
    'Motivo de Bloqueo',
    'Total Subtareas',
    'Subtareas Completadas',
    'Fecha de Creación'
  ]

  const rows = tasks
    .filter(t => !t.is_demo)
    .map(t => {
      const completedSubtasks = t.subtasks?.filter(s => s.is_completed).length || 0
      const totalSubtasks = t.subtasks?.length || 0
      const isBlocked = t.status === 'bloqueada' ? 'Sí' : 'No'

      return [
        sanitizeCsvCell(t.title),
        sanitizeCsvCell(t.area?.name || 'Sin área'),
        sanitizeCsvCell(t.priority.toUpperCase()),
        sanitizeCsvCell(t.status.replace('_', ' ').toUpperCase()),
        sanitizeCsvCell(t.progress_percentage),
        sanitizeCsvCell(t.main_assignee?.full_name || 'Sin asignar'),
        sanitizeCsvCell(t.due_date || 'Sin fecha'),
        sanitizeCsvCell(t.due_time || ''),
        sanitizeCsvCell(isBlocked),
        sanitizeCsvCell(t.blocked_reason || ''),
        sanitizeCsvCell(totalSubtasks),
        sanitizeCsvCell(completedSubtasks),
        sanitizeCsvCell(new Date(t.created_at).toLocaleDateString('es-AR'))
      ].join(',')
    })

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
