import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Ejecutar verificación de vencimientos y generación de alertas
    const { data: alertsResult, error: alertsError } = await supabaseAdmin.rpc('check_task_due_alerts')
    if (alertsError) throw alertsError

    // 2. Ejecutar generador de tareas recurrentes para hoy
    const { data: recurringResult, error: recurringError } = await supabaseAdmin.rpc('generate_recurring_tasks')
    if (recurringError) throw recurringError

    return new Response(JSON.stringify({
      success: true,
      alerts: alertsResult,
      recurring: recurringResult,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
