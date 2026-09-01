import { describe, it, expect } from 'vitest'
import { attachmentService, sanitizeFileName } from '../services/attachmentService'

describe('Attachment Service & Validation', () => {
  it('should sanitize dangerous or dirty file names properly', () => {
    expect(sanitizeFileName('plano obra final (1).pdf')).toBe('plano_obra_final_1.pdf')
    expect(sanitizeFileName('../../etc/passwd.png')).toBe('etc_passwd.png')
    expect(sanitizeFileName('foto avance café #3 & 5.webp')).toBe('foto_avance_cafe_3_5.webp')
  })

  it('should allow valid MIME types (JPEG, PNG, WebP, PDF, DOCX, XLSX)', () => {
    const validJpg = new File(['dummy'], 'foto.jpg', { type: 'image/jpeg' })
    expect(attachmentService.validateFile(validJpg).isValid).toBe(true)

    const validPdf = new File(['dummy'], 'factura.pdf', { type: 'application/pdf' })
    expect(attachmentService.validateFile(validPdf).isValid).toBe(true)
  })

  it('should reject dangerous or disallowed MIME types (exe, html, sh)', () => {
    const invalidExe = new File(['dummy'], 'virus.exe', { type: 'application/x-msdownload' })
    expect(attachmentService.validateFile(invalidExe).isValid).toBe(false)

    const invalidHtml = new File(['dummy'], 'page.html', { type: 'text/html' })
    expect(attachmentService.validateFile(invalidHtml).isValid).toBe(false)
  })
})
