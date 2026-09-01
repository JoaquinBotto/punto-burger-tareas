import { describe, it, expect } from 'vitest'
import { sanitizeCsvCell } from '../lib/exportUtils'
import { sanitizeFileName } from '../services/attachmentService'

describe('Stage 4 Features: Security, CSV Sanitization & File Handling', () => {
  it('should prevent CSV formula injection by prefixing dangerous characters with a single quote', () => {
    expect(sanitizeCsvCell('=1+1')).toBe("'=1+1")
    expect(sanitizeCsvCell('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)")
    expect(sanitizeCsvCell('-5+2')).toBe("'-5+2")
    expect(sanitizeCsvCell('+cmd|')).toBe("'+cmd|")
    expect(sanitizeCsvCell('Normal Task Title')).toBe('Normal Task Title')
  })

  it('should escape double quotes and handle multiline CSV cells', () => {
    const textWithComma = 'Cocina, Bachas y Parrilla'
    expect(sanitizeCsvCell(textWithComma)).toBe('"Cocina, Bachas y Parrilla"')

    const textWithQuotes = 'Revisar freezer "Gafa" modelo 2026'
    expect(sanitizeCsvCell(textWithQuotes)).toBe('"Revisar freezer ""Gafa"" modelo 2026"')
  })

  it('should correctly sanitize file names across all extensions', () => {
    expect(sanitizeFileName('plano final local comercial.pdf')).toBe('plano_final_local_comercial.pdf')
    expect(sanitizeFileName('C:\\fakepath\\evidencia.png')).toBe('C_fakepath_evidencia.png')
    expect(sanitizeFileName('archivo con acentos: conexión eléctrica.webp')).toBe('archivo_con_acentos_conexion_electrica.webp')
  })
})
