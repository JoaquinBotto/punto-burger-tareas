-- ==============================================================================
-- 202609010009_secure_activity_log_audit.sql
-- Asegurar activity_log: revocar inserción directa a clientes y asegurar trigger auditor
-- ==============================================================================

-- 1. Eliminar política de INSERT directo para usuarios
DROP POLICY IF EXISTS "activity_log_insert" ON public.activity_log;

-- 2. Revocar privilegios de modificación directa a roles de cliente
REVOKE INSERT, UPDATE, DELETE ON public.activity_log FROM authenticated, anon;
GRANT SELECT ON public.activity_log TO authenticated;

-- 3. Asegurar que la función del trigger de auditoría sea SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.trg_audit_task_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_action TEXT;
  v_actor_id UUID := auth.uid();
  v_changes JSONB := '{}'::jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_changes := jsonb_build_object(
      'title', NEW.title,
      'area_id', NEW.area_id,
      'priority', NEW.priority,
      'status', NEW.status
    );
    INSERT INTO public.activity_log (task_id, profile_id, action, changes)
    VALUES (NEW.id, COALESCE(v_actor_id, NEW.created_by), v_action, v_changes);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN
      v_action := 'archived';
    ELSIF OLD.archived_at IS NOT NULL AND NEW.archived_at IS NULL THEN
      v_action := 'restored';
    ELSIF OLD.status != NEW.status THEN
      v_action := 'status_changed';
      v_changes := jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status);
    ELSIF OLD.progress_percentage != NEW.progress_percentage THEN
      v_action := 'progress_updated';
      v_changes := jsonb_build_object('old_progress', OLD.progress_percentage, 'new_progress', NEW.progress_percentage);
    ELSIF OLD.main_assignee_id IS DISTINCT FROM NEW.main_assignee_id THEN
      v_action := 'reassigned';
      v_changes := jsonb_build_object('old_assignee', OLD.main_assignee_id, 'new_assignee', NEW.main_assignee_id);
    ELSE
      v_action := 'updated';
      v_changes := jsonb_build_object('version', NEW.version);
    END IF;

    INSERT INTO public.activity_log (task_id, profile_id, action, changes)
    VALUES (NEW.id, COALESCE(v_actor_id, NEW.created_by), v_action, v_changes);
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;
