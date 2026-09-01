-- ==============================================================================
-- 202608310006_setup_cron_alerts.sql
-- Programación Idempotente de Alertas de Vencimiento vía pg_cron
-- ==============================================================================

-- Habilitar extensión pg_cron en schema extensions si está disponible
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Eliminar job previo si existe para garantizar idempotencia
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Desprogramar si ya existía el job con ese nombre
    PERFORM cron.unschedule('punto-burger-due-alerts') 
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'punto-burger-due-alerts');

    -- Programar ejecución cada 30 minutos
    PERFORM cron.schedule(
      'punto-burger-due-alerts',
      '*/30 * * * *',
      'SELECT public.check_task_due_alerts();'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo configurar pg_cron automáticamente. Se puede configurar manualmente desde Integrations -> Cron.';
END $$;
