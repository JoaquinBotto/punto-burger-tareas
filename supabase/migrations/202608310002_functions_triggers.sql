-- ==============================================================================
-- 02_functions_triggers.sql
-- Funciones Seguras (SECURITY DEFINER), Triggers y Procedimientos Almacenados
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNCIONES AUXILIARES DE SEGURIDAD (Sin recursión RLS)
-- ------------------------------------------------------------------------------

-- Verifica si el usuario actual autenticado está activo
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = true
  );
$$;

-- Verifica si el usuario actual es Administrador activo
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

-- Verifica si el usuario es Responsable o Admin activo
CREATE OR REPLACE FUNCTION public.is_responsable_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'responsable') AND is_active = true
  );
$$;

-- Verifica si el usuario puede crear tareas según configuración
CREATE OR REPLACE FUNCTION public.can_create_task()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_role TEXT;
  v_allow_resp BOOLEAN;
BEGIN
  IF NOT public.is_active_user() THEN
    RETURN FALSE;
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  IF v_role = 'responsable' THEN
    SELECT allow_responsible_create_task INTO v_allow_resp FROM public.app_settings WHERE id = 1;
    RETURN COALESCE(v_allow_resp, true);
  END IF;

  RETURN FALSE;
END;
$$;

-- Verifica si el usuario puede editar operativamente una tarea (asignado o admin)
CREATE OR REPLACE FUNCTION public.can_edit_task(p_task_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true AND (
      p.role = 'admin'
      OR EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = p_task_id AND (
          t.main_assignee_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.task_assignees ta
            WHERE ta.task_id = p_task_id AND ta.profile_id = auth.uid()
          )
        )
      )
    )
  );
$$;

-- ------------------------------------------------------------------------------
-- 2. TRIGGER: CÁLCULO AUTOMÁTICO DE AVANCE DE TAREAS (SUBTASKS -> TASKS)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_recalculate_task_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task_id UUID;
  v_total INT;
  v_completed INT;
  v_percentage INT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_task_id := OLD.task_id;
  ELSE
    v_task_id := NEW.task_id;
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_completed = true)
  INTO v_total, v_completed
  FROM public.subtasks
  WHERE task_id = v_task_id;

  IF v_total > 0 THEN
    v_percentage := ROUND((v_completed::NUMERIC / v_total::NUMERIC) * 100);
    UPDATE public.tasks
    SET progress_percentage = v_percentage,
        is_progress_manual = false,
        updated_at = now()
    WHERE id = v_task_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_subtasks_progress ON public.subtasks;
CREATE TRIGGER trg_subtasks_progress
AFTER INSERT OR UPDATE OR DELETE ON public.subtasks
FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_task_progress();

-- ------------------------------------------------------------------------------
-- 3. TRIGGER: AUDITORÍA AUTOMÁTICA EN ACTIVITY LOG
-- ------------------------------------------------------------------------------
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
    -- Control de versión para concurrencia optimista
    NEW.version := OLD.version + 1;
    NEW.updated_at := now();

    -- Cambio de estado
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.activity_log (task_id, profile_id, action_type, details)
      VALUES (NEW.id, v_user_id, 'status_change', jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
      
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
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_audit_task_changes();

-- ------------------------------------------------------------------------------
-- 4. TRIGGER: NOTIFICACIONES AUTOMÁTICAS POR EVENTOS INMEDIATOS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_task_event_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_author_id UUID := auth.uid();
  v_admin_id UUID;
  v_dep_record RECORD;
BEGIN
  -- 1. Nueva asignación o cambio de responsable
  IF (TG_OP = 'INSERT' AND NEW.main_assignee_id IS NOT NULL) 
     OR (TG_OP = 'UPDATE' AND NEW.main_assignee_id IS DISTINCT FROM OLD.main_assignee_id AND NEW.main_assignee_id IS NOT NULL) THEN
    
    IF NEW.main_assignee_id != COALESCE(v_author_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
      INSERT INTO public.notifications (profile_id, task_id, title, message, type, severity, event_key, metadata)
      VALUES (
        NEW.main_assignee_id,
        NEW.id,
        'Nueva tarea asignada',
        'Has sido asignado como responsable principal de: ' || NEW.title,
        'assignment',
        'info',
        'assign_' || NEW.id || '_' || NEW.main_assignee_id || '_' || extract(epoch from now())::bigint,
        jsonb_build_object('task_title', NEW.title, 'priority', NEW.priority)
      ) ON CONFLICT (profile_id, event_key) DO NOTHING;
    END IF;
  END IF;

  -- 2. Tarea marcada como bloqueada
  IF TG_OP = 'UPDATE' AND NEW.status = 'bloqueada' AND OLD.status != 'bloqueada' THEN
    -- Notificar a todos los administradores
    FOR v_admin_id IN SELECT id FROM public.profiles WHERE role = 'admin' AND is_active = true LOOP
      INSERT INTO public.notifications (profile_id, task_id, title, message, type, severity, event_key, metadata)
      VALUES (
        v_admin_id,
        NEW.id,
        'Tarea Bloqueada',
        'La tarea "' || NEW.title || '" ha sido bloqueada. Motivo: ' || COALESCE(NEW.blocked_reason, 'Sin motivo especificado'),
        'blocked_alert',
        'critical',
        'blocked_' || NEW.id || '_' || extract(epoch from now())::bigint,
        jsonb_build_object('task_title', NEW.title, 'blocked_reason', NEW.blocked_reason)
      ) ON CONFLICT (profile_id, event_key) DO NOTHING;
    END LOOP;
  END IF;

  -- 3. Tarea Crítica Completada
  IF TG_OP = 'UPDATE' AND NEW.status = 'completada' AND OLD.status != 'completada' AND NEW.priority = 'critica' THEN
    FOR v_admin_id IN SELECT id FROM public.profiles WHERE role = 'admin' AND is_active = true LOOP
      IF v_admin_id != COALESCE(v_author_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
        INSERT INTO public.notifications (profile_id, task_id, title, message, type, severity, event_key, metadata)
        VALUES (
          v_admin_id,
          NEW.id,
          'Tarea Crítica Completada',
          'La tarea crítica "' || NEW.title || '" ha sido completada con éxito.',
          'critical_completed',
          'info',
          'crit_done_' || NEW.id || '_' || extract(epoch from now())::bigint,
          jsonb_build_object('task_title', NEW.title)
        ) ON CONFLICT (profile_id, event_key) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  -- 4. Resolución de Dependencias (Desbloqueo de tareas hijas)
  IF TG_OP = 'UPDATE' AND NEW.status = 'completada' AND OLD.status != 'completada' THEN
    FOR v_dep_record IN 
      SELECT td.task_id AS child_task_id, t.title AS child_title, t.main_assignee_id
      FROM public.task_dependencies td
      JOIN public.tasks t ON t.id = td.task_id
      WHERE td.blocking_task_id = NEW.id AND t.status != 'completada'
    LOOP
      IF v_dep_record.main_assignee_id IS NOT NULL THEN
        INSERT INTO public.notifications (profile_id, task_id, title, message, type, severity, event_key, metadata)
        VALUES (
          v_dep_record.main_assignee_id,
          v_dep_record.child_task_id,
          'Dependencia Resuelta',
          'La tarea bloqueante "' || NEW.title || '" fue completada. Ya puedes avanzar con "' || v_dep_record.child_title || '".',
          'dependency_resolved',
          'info',
          'dep_res_' || NEW.id || '_' || v_dep_record.child_task_id,
          jsonb_build_object('blocking_title', NEW.title, 'child_title', v_dep_record.child_title)
        ) ON CONFLICT (profile_id, event_key) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_notifications ON public.tasks;
CREATE TRIGGER trg_tasks_notifications
AFTER INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_task_event_notifications();

-- ------------------------------------------------------------------------------
-- 5. TRIGGER: NOTIFICACIONES POR NUEVOS COMENTARIOS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_comment_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task RECORD;
  v_assignee RECORD;
  v_author_name TEXT;
BEGIN
  SELECT title, main_assignee_id INTO v_task FROM public.tasks WHERE id = NEW.task_id;
  SELECT full_name INTO v_author_name FROM public.profiles WHERE id = NEW.profile_id;

  -- Notificar al responsable principal si no es quien comentó
  IF v_task.main_assignee_id IS NOT NULL AND v_task.main_assignee_id != NEW.profile_id THEN
    INSERT INTO public.notifications (profile_id, task_id, title, message, type, severity, event_key, metadata)
    VALUES (
      v_task.main_assignee_id,
      NEW.task_id,
      'Nuevo comentario en tarea',
      COALESCE(v_author_name, 'Un usuario') || ' comentó en: ' || v_task.title,
      'comment',
      'info',
      'comm_' || NEW.id || '_' || v_task.main_assignee_id,
      jsonb_build_object('task_title', v_task.title, 'comment_id', NEW.id)
    ) ON CONFLICT (profile_id, event_key) DO NOTHING;
  END IF;

  -- Notificar a otros colaboradores asignados
  FOR v_assignee IN 
    SELECT profile_id FROM public.task_assignees 
    WHERE task_id = NEW.task_id AND profile_id != NEW.profile_id AND profile_id != COALESCE(v_task.main_assignee_id, '00000000-0000-0000-0000-000000000000'::uuid)
  LOOP
    INSERT INTO public.notifications (profile_id, task_id, title, message, type, severity, event_key, metadata)
    VALUES (
      v_assignee.profile_id,
      NEW.task_id,
      'Nuevo comentario en tarea',
      COALESCE(v_author_name, 'Un usuario') || ' comentó en: ' || v_task.title,
      'comment',
      'info',
      'comm_' || NEW.id || '_' || v_assignee.profile_id,
      jsonb_build_object('task_title', v_task.title, 'comment_id', NEW.id)
    ) ON CONFLICT (profile_id, event_key) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_notify ON public.comments;
CREATE TRIGGER trg_comments_notify
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.trg_comment_notifications();

-- ------------------------------------------------------------------------------
-- 6. FUNCIÓN IDEMPOTENTE DE ALERTAS TEMPORALES (Para Cron / Edge Function)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_task_due_alerts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_settings RECORD;
  v_today DATE;
  v_tomorrow DATE;
  v_soon_limit DATE;
  v_task RECORD;
  v_alerts_count INT := 0;
BEGIN
  SELECT * INTO v_settings FROM public.app_settings WHERE id = 1;
  
  -- Cálculo de fecha local en America/Argentina/Cordoba
  v_today := (timezone('America/Argentina/Cordoba', now()))::date;
  v_tomorrow := v_today + INTERVAL '1 day';
  v_soon_limit := v_today + (v_settings.due_soon_days || ' days')::interval;

  -- 1. Tareas Vencidas
  FOR v_task IN 
    SELECT t.id, t.title, t.priority, t.due_date, t.main_assignee_id 
    FROM public.tasks t
    WHERE t.status NOT IN ('completada', 'cancelada')
      AND t.archived_at IS NULL
      AND t.due_date < v_today
      AND t.main_assignee_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (profile_id, task_id, title, message, type, severity, event_key, metadata)
    VALUES (
      v_task.main_assignee_id,
      v_task.id,
      'Tarea Vencida',
      'La tarea "' || v_task.title || '" venció el ' || to_char(v_task.due_date, 'DD/MM/YYYY'),
      'overdue',
      'critical',
      'overdue_' || v_task.id || '_' || v_today,
      jsonb_build_object('due_date', v_task.due_date, 'priority', v_task.priority)
    ) ON CONFLICT (profile_id, event_key) DO NOTHING;
    v_alerts_count := v_alerts_count + 1;
  END LOOP;

  -- 2. Tareas que Vencen Hoy
  FOR v_task IN 
    SELECT t.id, t.title, t.priority, t.due_date, t.main_assignee_id 
    FROM public.tasks t
    WHERE t.status NOT IN ('completada', 'cancelada')
      AND t.archived_at IS NULL
      AND t.due_date = v_today
      AND t.main_assignee_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (profile_id, task_id, title, message, type, severity, event_key, metadata)
    VALUES (
      v_task.main_assignee_id,
      v_task.id,
      'Tarea Vence Hoy',
      'La tarea "' || v_task.title || '" vence hoy.',
      'due_today',
      'warning',
      'due_today_' || v_task.id || '_' || v_today,
      jsonb_build_object('due_date', v_task.due_date, 'priority', v_task.priority)
    ) ON CONFLICT (profile_id, event_key) DO NOTHING;
    v_alerts_count := v_alerts_count + 1;
  END LOOP;

  -- 3. Tareas que Vencen Próximamente (Mañana o en <= due_soon_days)
  FOR v_task IN 
    SELECT t.id, t.title, t.priority, t.due_date, t.main_assignee_id 
    FROM public.tasks t
    WHERE t.status NOT IN ('completada', 'cancelada')
      AND t.archived_at IS NULL
      AND t.due_date > v_today
      AND t.due_date <= v_soon_limit
      AND t.main_assignee_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (profile_id, task_id, title, message, type, severity, event_key, metadata)
    VALUES (
      v_task.main_assignee_id,
      v_task.id,
      'Tarea Próxima a Vencer',
      'La tarea "' || v_task.title || '" vence el ' || to_char(v_task.due_date, 'DD/MM/YYYY'),
      'due_soon',
      'info',
      'due_soon_' || v_task.id || '_' || v_task.due_date,
      jsonb_build_object('due_date', v_task.due_date, 'priority', v_task.priority)
    ) ON CONFLICT (profile_id, event_key) DO NOTHING;
    v_alerts_count := v_alerts_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'alerts_checked', v_alerts_count, 'executed_at', now());
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. GENERADOR IDEMPOTENTE DE TAREAS RECURRENTES
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_recurring_tasks()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_today DATE := (timezone('America/Argentina/Cordoba', now()))::date;
  v_rule RECORD;
  v_created_count INT := 0;
  v_new_task_id UUID;
  v_next_date DATE;
  v_dow INT;
BEGIN
  -- Día de la semana en ISO: 1=Lunes, 7=Domingo
  v_dow := EXTRACT(ISODOW FROM v_today)::INT;

  FOR v_rule IN 
    SELECT * FROM public.recurring_task_rules
    WHERE is_active = true 
      AND start_date <= v_today
      AND (end_date IS NULL OR end_date >= v_today)
      AND next_run_date <= v_today
  LOOP
    -- Insertar nueva tarea (ON CONFLICT uq_recurring_occurrence DO NOTHING asegura idempotencia)
    INSERT INTO public.tasks (
      title,
      description,
      area_id,
      main_assignee_id,
      priority,
      status,
      due_date,
      due_time,
      created_by,
      is_recurring,
      recurring_rule_id,
      recurrence_occurrence_date
    ) VALUES (
      v_rule.template_title,
      v_rule.template_description,
      v_rule.area_id,
      v_rule.main_assignee_id,
      v_rule.priority,
      'pendiente',
      v_today,
      v_rule.create_time,
      COALESCE(v_rule.created_by, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
      true,
      v_rule.id,
      v_today
    )
    ON CONFLICT (recurring_rule_id, recurrence_occurrence_date) DO NOTHING
    RETURNING id INTO v_new_task_id;

    IF v_new_task_id IS NOT NULL THEN
      v_created_count := v_created_count + 1;
    END IF;

    -- Calcular siguiente fecha según frecuencia
    IF v_rule.frequency = 'daily' THEN
      v_next_date := v_today + (COALESCE(v_rule.interval_days, 1) || ' days')::interval;
    ELSIF v_rule.frequency = 'weekdays' THEN
      IF v_dow >= 5 THEN -- Viernes o fin de semana -> Lunes
        v_next_date := v_today + ((8 - v_dow) || ' days')::interval;
      ELSE
        v_next_date := v_today + INTERVAL '1 day';
      END IF;
    ELSIF v_rule.frequency = 'weekly' THEN
      v_next_date := v_today + INTERVAL '7 days';
    ELSIF v_rule.frequency = 'monthly' THEN
      v_next_date := v_today + INTERVAL '1 month';
    ELSE
      v_next_date := v_today + (COALESCE(v_rule.interval_days, 1) || ' days')::interval;
    END IF;

    -- Actualizar regla
    UPDATE public.recurring_task_rules
    SET last_run_date = v_today,
        next_run_date = v_next_date,
        updated_at = now()
    WHERE id = v_rule.id;

  END LOOP;

  RETURN jsonb_build_object('success', true, 'tasks_created', v_created_count, 'executed_at', now());
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. PURGA SEGURA DE DATOS DE DEMOSTRACIÓN (Solo registros con is_demo = true)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_demo_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden purgar datos de demo.';
  END IF;

  DELETE FROM public.tasks WHERE is_demo = true;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'deleted_tasks', v_deleted);
END;
$$;
