import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isVitest = process.env.VITEST === 'true'

  // Fail-fast validation in production build
  if (command === 'build' && !isVitest) {
    const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey =
      env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('tu-proyecto') || supabaseUrl.includes('placeholder')) {
      throw new Error(
        '\n\n[FATAL BUILD ERROR] Variables de entorno de Supabase ausentes o inválidas.\n' +
        'El build de producción requiere obligatoriamente:\n' +
        '  - VITE_SUPABASE_URL\n' +
        '  - VITE_SUPABASE_PUBLISHABLE_KEY\n' +
        'Configura estas variables en Cloudflare / entorno de compilación antes de continuar.\n\n'
      )
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false
        },
        includeAssets: ['favicon.svg', '_headers'],
        manifest: {
          name: 'Punto Burger | Tareas',
          short_name: 'Punto Tareas',
          description: 'Gestión operativa de tareas y apertura de Punto Burger',
          theme_color: '#C92A2A',
          background_color: '#FAF7F2',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: '/favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: '/favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'maskable'
            }
          ]
        }
      })
    ]
  }
})
