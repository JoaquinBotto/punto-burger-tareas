import { describe, it, expect } from 'vitest'

describe('Invite User and Auth Architecture Suite', () => {
  it('should validate invite payload structure and normalize email', () => {
    const sanitizeInvitePayload = (raw: { email: string; full_name: string; role: string }) => {
      const email = raw.email.trim().toLowerCase()
      const full_name = raw.full_name.trim()
      const validRoles = ['admin', 'responsable', 'colaborador']
      const role = validRoles.includes(raw.role) ? raw.role : 'colaborador'

      if (!email || !full_name) {
        return { ok: false, error: 'Email y Nombre completo son obligatorios.' }
      }
      return { ok: true, payload: { email, full_name, role } }
    }

    const result = sanitizeInvitePayload({
      email: '  JoaquinHBotto@Gmail.Com  ',
      full_name: '  Joaquin Botto  ',
      role: 'admin'
    })

    expect(result.ok).toBe(true)
    if (result.ok && result.payload) {
      expect(result.payload.email).toBe('joaquinhbotto@gmail.com')
      expect(result.payload.full_name).toBe('Joaquin Botto')
      expect(result.payload.role).toBe('admin')
    }
  })

  it('should parse Edge Function error contexts into user-friendly messages', () => {
    const mapFunctionError = (errJson: any, fallbackMessage: string) => {
      const msg = errJson?.message || errJson?.error || fallbackMessage
      const lower = msg.toLowerCase()
      if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
        return 'Se alcanzó el límite temporal de envío de correos. Por favor espera unos minutos antes de reenviar.'
      }
      if (lower.includes('already registered') || lower.includes('user_already_exists')) {
        return 'Este correo ya pertenece a un usuario registrado en Punto Burger.'
      }
      return msg
    }

    expect(mapFunctionError({ message: 'over_email_send_rate_limit' }, 'Error')).toContain('límite temporal')
    expect(mapFunctionError({ error: 'User already registered' }, 'Error')).toContain('ya pertenece a un usuario registrado')
    expect(mapFunctionError(null, 'Acceso denegado')).toBe('Acceso denegado')
  })

  it('should separate routes for password recovery and invitation acceptance', () => {
    const resolveAuthViewFromUrl = (pathname: string, hash: string) => {
      if (pathname === '/accept-invite' || hash.includes('type=invite')) {
        return { isRecovery: true, mode: 'invite' }
      }
      if (pathname === '/update-password' || hash.includes('type=recovery')) {
        return { isRecovery: true, mode: 'recovery' }
      }
      return { isRecovery: false, mode: null }
    }

    expect(resolveAuthViewFromUrl('/accept-invite', '')).toEqual({ isRecovery: true, mode: 'invite' })
    expect(resolveAuthViewFromUrl('/', '#access_token=xyz&type=invite')).toEqual({ isRecovery: true, mode: 'invite' })
    expect(resolveAuthViewFromUrl('/update-password', '')).toEqual({ isRecovery: true, mode: 'recovery' })
    expect(resolveAuthViewFromUrl('/', '#access_token=xyz&type=recovery')).toEqual({ isRecovery: true, mode: 'recovery' })
    expect(resolveAuthViewFromUrl('/', '')).toEqual({ isRecovery: false, mode: null })
  })
})
