import React, { useState } from 'react'
import { testSupabaseConnection, isSupabaseConfigured } from '../../lib/supabase'
import { Database, CheckCircle2, AlertTriangle, Copy, Check, Terminal, ShieldAlert } from 'lucide-react'

export const SetupAdminNotice: React.FC = () => {
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  const handleTest = async () => {
    setIsTesting(true)
    const res = await testSupabaseConnection()
    setTestResult(res)
    setIsTesting(false)
  }

  const firstAdminScript = `-- Crear o promover tu usuario a Administrador:
DO $$
DECLARE
  v_target_email TEXT := 'admin@puntoburger.com'; -- REEMPLAZAR POR TU EMAIL DE SUPABASE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_target_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Crea primero el usuario en Authentication -> Users en el Dashboard de Supabase';
    RETURN;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (v_user_id, v_target_email, 'Administrador Punto Burger', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true;
END $$;`

  const handleCopySql = () => {
    navigator.clipboard.writeText(firstAdminScript)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  return (
    <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 my-6 text-sm text-[#18181B]">
      <div className="flex items-start gap-3.5 mb-4">
        <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 flex-shrink-0 mt-0.5">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-amber-900">Estado de Conexión y Primer Administrador</h3>
          <p className="text-xs text-amber-800 mt-1">
            {isSupabaseConfigured
              ? 'Variables .env detectadas. Puedes verificar la conexión contra tu proyecto Supabase.'
              : 'Supabase no está configurado aún en el archivo .env. Sigue las instrucciones para conectar tu base de datos.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <button
          onClick={handleTest}
          disabled={isTesting}
          className="px-4 py-2 bg-amber-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Terminal className="w-4 h-4" />
          <span>{isTesting ? 'Probando...' : 'Probar Conexión con Supabase'}</span>
        </button>
      </div>

      {testResult && (
        <div
          className={`p-3.5 rounded-2xl mb-5 flex items-start gap-2.5 text-xs font-medium ${
            testResult.ok
              ? 'bg-green-100/90 text-green-900 border border-green-200'
              : 'bg-red-100/90 text-red-900 border border-red-200'
          }`}
        >
          {testResult.ok ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#16A34A] mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#C92A2A] mt-0.5" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* SQL Snippet for First Admin */}
      <div className="bg-[#18181B] text-zinc-200 rounded-2xl p-4 font-mono text-xs overflow-x-auto relative">
        <div className="flex justify-between items-center mb-2 text-zinc-400 font-sans font-bold">
          <span className="flex items-center gap-1.5 text-white">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Script para crear el Primer Administrador:
          </span>
          <button
            onClick={handleCopySql}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-all cursor-pointer"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
          </button>
        </div>
        <pre className="text-zinc-300 text-[11px] leading-relaxed whitespace-pre-wrap">{firstAdminScript}</pre>
      </div>
    </div>
  )
}
