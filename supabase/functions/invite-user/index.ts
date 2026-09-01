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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    // 1. Verificar token del llamador
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado: falta token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const clientUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await clientUser.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida o expirada' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Verificar que el usuario sea Administrador
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin' || !profile.is_active) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: solo administradores activos pueden invitar usuarios' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Procesar payload de invitación
    const { email, full_name, role = 'colaborador', phone } = await req.json()

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: 'Email y Nombre completo son obligatorios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!['admin', 'responsable', 'colaborador'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Rol inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Invitar usuario mediante Supabase Auth Admin
    const origin = req.headers.get('Origin') || 'https://punto-burger-tareas.joaquinhbotto.workers.dev'
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role },
      redirectTo: `${origin}/#type=invite`
    })

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const invitedUserId = inviteData.user.id

    // 5. Crear o actualizar perfil en public.profiles
    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: invitedUserId,
        email: email.toLowerCase(),
        full_name,
        phone: phone || null,
        role,
        is_active: true,
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      return new Response(JSON.stringify({ error: 'Usuario invitado en Auth pero error al crear perfil: ' + upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Invitación enviada con éxito a ${email}`,
      user: { id: invitedUserId, email, full_name, role }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error interno del servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
