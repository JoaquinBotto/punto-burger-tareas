import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://punto-burger-tareas.joaquinhbotto.workers.dev'
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  const isAllowed = ALLOWED_ORIGINS.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[1],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function jsonResponse(data: any, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const requestId = crypto.randomUUID()

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`)
      return jsonResponse({
        ok: false,
        code: 'CONFIG_ERROR',
        message: 'Error de configuración en el servidor de autenticación',
        requestId
      }, 500, corsHeaders)
    }

    // 1. Verificar token del llamador
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'No autorizado: falta token de sesión',
        requestId
      }, 401, corsHeaders)
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return jsonResponse({
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'No autorizado: token inválido',
        requestId
      }, 401, corsHeaders)
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Validate JWT caller
    const { data: { user: callerUser }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !callerUser) {
      console.warn(`[${requestId}] Caller JWT invalid:`, userError?.message)
      return jsonResponse({
        ok: false,
        code: 'SESSION_EXPIRED',
        message: 'Tu sesión ha expirado o no es válida. Por favor inicia sesión nuevamente.',
        requestId
      }, 401, corsHeaders)
    }

    // 2. Verificar que el llamador sea Administrador activo
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, is_active')
      .eq('id', callerUser.id)
      .single()

    if (profileError || !callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_active) {
      return jsonResponse({
        ok: false,
        code: 'FORBIDDEN',
        message: 'Acceso denegado: solo los administradores activos de Punto Burger pueden invitar usuarios.',
        requestId
      }, 403, corsHeaders)
    }

    // 3. Procesar payload de invitación
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      return jsonResponse({
        ok: false,
        code: 'INVALID_INPUT',
        message: 'Cuerpo de solicitud inválido.',
        requestId
      }, 400, corsHeaders)
    }

    const rawEmail = body.email || ''
    const rawFullName = body.full_name || ''
    const role = body.role || 'colaborador'
    const phone = body.phone || null

    const email = rawEmail.trim().toLowerCase()
    const full_name = rawFullName.trim()

    if (!email || !full_name) {
      return jsonResponse({
        ok: false,
        code: 'INVALID_INPUT',
        message: 'Correo electrónico y Nombre completo son obligatorios.',
        requestId
      }, 400, corsHeaders)
    }

    if (!['admin', 'responsable', 'colaborador'].includes(role)) {
      return jsonResponse({
        ok: false,
        code: 'INVALID_INPUT',
        message: 'Rol inválido. Debe ser admin, responsable o colaborador.',
        requestId
      }, 400, corsHeaders)
    }

    // 4. Invitar usuario mediante Supabase Auth Admin
    const origin = req.headers.get('Origin') || 'https://punto-burger-tareas.joaquinhbotto.workers.dev'
    const redirectTo = `${origin}/accept-invite`

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role },
      redirectTo
    })

    if (inviteError) {
      const errMsg = inviteError.message.toLowerCase()
      console.warn(`[${requestId}] inviteUserByEmail error:`, inviteError.message)

      if (errMsg.includes('rate limit') || errMsg.includes('too many requests') || errMsg.includes('over_email_send_rate_limit')) {
        return jsonResponse({
          ok: false,
          code: 'EMAIL_RATE_LIMIT',
          message: 'Se alcanzó temporalmente el límite de envío de correos. Por favor espera unos minutos antes de reintentar.',
          requestId
        }, 429, corsHeaders)
      }

      if (errMsg.includes('already registered') || errMsg.includes('user_already_exists') || errMsg.includes('already been registered')) {
        return jsonResponse({
          ok: false,
          code: 'USER_ALREADY_EXISTS',
          message: 'Este correo ya pertenece a un usuario registrado en el sistema.',
          requestId
        }, 409, corsHeaders)
      }

      return jsonResponse({
        ok: false,
        code: 'AUTH_INVITE_FAILED',
        message: `Error al generar la invitación: ${inviteError.message}`,
        requestId
      }, 400, corsHeaders)
    }

    const invitedUserId = inviteData.user.id

    // 5. Crear o actualizar perfil en public.profiles de manera idempotente
    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: invitedUserId,
        email: email,
        full_name,
        phone: phone ? phone.trim() : null,
        role,
        is_active: true,
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error(`[${requestId}] Error upserting profile:`, upsertError.message)
      return jsonResponse({
        ok: false,
        code: 'PROFILE_CREATION_FAILED',
        message: 'Usuario invitado en Auth pero ocurrió un error al configurar su perfil: ' + upsertError.message,
        requestId
      }, 500, corsHeaders)
    }

    return jsonResponse({
      ok: true,
      message: `Invitación enviada con éxito a ${email}`,
      user: { id: invitedUserId, email, full_name, role },
      requestId
    }, 200, corsHeaders)

  } catch (err: any) {
    console.error(`[${requestId}] Unhandled exception:`, err)
    return jsonResponse({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: err.message || 'Error interno del servidor al procesar la invitación',
      requestId
    }, 500, corsHeaders)
  }
})
