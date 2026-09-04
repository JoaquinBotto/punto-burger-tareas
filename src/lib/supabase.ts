import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabasePublishableKey && 
  supabaseUrl !== 'https://tu-proyecto.supabase.co' &&
  !supabaseUrl.includes('placeholder')
)

// Demo mode is strictly disabled if Supabase is configured or in production
export const isDemoModeActive = !isSupabaseConfigured && !import.meta.env.PROD

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '[Punto Burger] Supabase no está configurado aún. Configura VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en tu archivo .env'
  )
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      }
    }
  }
)

/**
 * Checks connectivity with Supabase backend and tables
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message: 'Faltan configurar las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.'
    }
  }

  try {
    const { error } = await supabase.from('app_settings').select('id').limit(1)
    if (error) {
      return {
        ok: false,
        message: `Error de conexión con Supabase: ${error.message}`
      }
    }
    return {
      ok: true,
      message: 'Conexión exitosa y verificada con Supabase.'
    }
  } catch (err: any) {
    return {
      ok: false,
      message: `Fallo de red: ${err.message || 'No se pudo conectar al servidor'}`
    }
  }
}
