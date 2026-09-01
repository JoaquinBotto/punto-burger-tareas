-- ==============================================================================
-- 202608310007_fix_audit_trigger_after.sql
-- Separar normalización de campos (BEFORE) y registro de auditoría (AFTER)
-- ==============================================================================

-- 1. Trigger BEFORE UPDATE: versionamiento y timestamps de estado
CREATE OR REPLACE FUNCTION public.trg_tasks_before_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  NEW.version := OLD.version + 1;
  NEW.updated_at := now();

  -- Si se completa
  IF NEW.status = 'completada' AND OLD.status != 'completada' THEN
    NEW.completed_at := now();
    NEW.completed_by := COALESCE(v_user_id, NEW.completed_by);
    NEW.progress_percentage := 100;
  ELSIF NEW.status != 'completada' AND OLD.status = 'completada' THEN
    NEW.completed_at := NULL;
    NEW.completed_by := NULL;
  END IF;

  -- Si se bloquea
  IF NEW.status = 'bloqueada' AND OLD.status != 'bloqueada' THEN
    NEW.blocked_at := now();
  ELSIF NEW.status != 'bloqueada' AND OLD.status = 'bloqueada' THEN
    NEW.blocked_at := NULL;
    NEW.blocked_reason := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_before_update ON public.tasks;
CREATE TRIGGER trg_tasks_before_update
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_tasks_before_update();

-- 2. Trigger AFTER INSERT OR UPDATE: Registro en activity_log
CREATE OR REPLACE FUNCTION public.trg_audit_task_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (task_id, profile_id, action_type, details)
    VALUES (NEW.id, v_user_id, 'create', jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'status', NEW.status));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Cambio de estado
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.activity_log (task_id, profile_id, action_type, details)
      VALUES (NEW.id, v_user_id, 'status_change', jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
    END IF;

    -- Cambio de prioridad
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO public.activity_log (task_id, profile_id, action_type, details)
      VALUES (NEW.id, v_user_id, 'priority_change', jsonb_build_object('old_priority', OLD.priority, 'new_priority', NEW.priority));
    END IF;

    -- Cambio de responsable principal
    IF OLD.main_assignee_id IS DISTINCT FROM NEW.main_assignee_id THEN
      INSERT INTO public.activity_log (task_id, profile_id, action_type, details)
      VALUES (NEW.id, v_user_id, 'assignee_change', jsonb_build_object('old_assignee', OLD.main_assignee_id, 'new_assignee', NEW.main_assignee_id));
    END IF;

    -- Cambio de fecha límite
    IF OLD.due_date IS DISTINCT FROM NEW.due_date OR OLD.due_time IS DISTINCT FROM NEW.due_time THEN
      INSERT INTO public.activity_log (task_id, profile_id, action_type, details)
      VALUES (NEW.id, v_user_id, 'due_date_change', jsonb_build_object('old_due_date', OLD.due_date, 'new_due_date', NEW.due_date));
    END IF;

    -- Archivado / Restaurado
    IF OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN
      INSERT INTO public.activity_log (task_id, profile_id, action_type, details)
      VALUES (NEW.id, v_user_id, 'archive', jsonb_build_object('archived_at', NEW.archived_at));
    ELSIF OLD.archived_at IS NOT NULL AND NEW.archived_at IS NULL THEN
      INSERT INTO public.activity_log (task_id, profile_id, action_type, details)
      VALUES (NEW.id, v_user_id, 'restore', jsonb_build_object('restored_at', now()));
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_audit ON public.tasks;
CREATE TRIGGER trg_tasks_audit
AFTER INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_audit_task_changes();
