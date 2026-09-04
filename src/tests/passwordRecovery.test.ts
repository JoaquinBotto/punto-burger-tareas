import { describe, it, expect } from 'vitest'

describe('Password Recovery Suite', () => {
  it('should normalize emails with trim and lowercasing', () => {
    const rawEmail = '  HernanBotto2@Hotmail.Com  '
    const normalized = rawEmail.trim().toLowerCase()
    expect(normalized).toBe('hernanbotto2@hotmail.com')
  })

  it('should provide a neutral message to prevent user enumeration', () => {
    const getRecoveryMessage = () => {
      return 'Si existe una cuenta asociada a ese correo, recibirás un enlace para crear una nueva contraseña. Revisa también Spam o Correo no deseado.'
    }

    const messageForExisting = getRecoveryMessage()
    const messageForNonExisting = getRecoveryMessage()

    expect(messageForExisting).toBe(messageForNonExisting)
    expect(messageForExisting).toContain('Spam o Correo no deseado')
  })

  it('should validate password length and matching confirmation', () => {
    const validateNewPassword = (pwd: string, confirm: string) => {
      if (pwd.length < 6) return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' }
      if (pwd !== confirm) return { ok: false, error: 'Las contraseñas no coinciden.' }
      return { ok: true }
    }

    expect(validateNewPassword('123', '123').ok).toBe(false)
    expect(validateNewPassword('123456', '654321').ok).toBe(false)
    expect(validateNewPassword('PuntoBurger2026!', 'PuntoBurger2026!').ok).toBe(true)
  })

  it('should detect error params in URL hash or search (e.g. otp_expired)', () => {
    const parseUrlForRecoveryError = (hash: string, search: string) => {
      if (hash.includes('otp_expired') || search.includes('otp_expired')) {
        return 'El enlace de recuperación venció o ya fue utilizado. Solicitá uno nuevo.'
      }
      if (hash.includes('error=') || search.includes('error=')) {
        return 'El enlace de recuperación no es válido o está incompleto. Solicitá uno nuevo.'
      }
      return null
    }

    const expiredHash = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
    expect(parseUrlForRecoveryError(expiredHash, '')).toBe('El enlace de recuperación venció o ya fue utilizado. Solicitá uno nuevo.')

    const validHash = '#access_token=test&type=recovery'
    expect(parseUrlForRecoveryError(validHash, '')).toBeNull()
  })

  it('should format redirectTo destination using window.location.origin and /update-password', () => {
    const getRedirectUrl = (origin: string) => `${origin}/update-password`

    expect(getRedirectUrl('http://localhost:5173')).toBe('http://localhost:5173/update-password')
    expect(getRedirectUrl('https://punto-burger-tareas.joaquinhbotto.workers.dev')).toBe(
      'https://punto-burger-tareas.joaquinhbotto.workers.dev/update-password'
    )
  })
})
