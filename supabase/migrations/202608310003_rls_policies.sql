-- ==============================================================================
-- 03_rls_policies.sql
-- Políticas de Seguridad a Nivel de Fila (Row Level Security - RLS)
-- ==============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_task_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. PROTECCIÓN CONTRA ESCALAMIENTO EN PROFILES (Trigger estricto)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Si no es admin y está intentando cambiar su rol o su estado activo
  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'No tienes permiso para modificar roles de usuario.';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'No tienes permiso para activar o desactivar usuarios.';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profiles ON public.profiles;
CREATE TRIGGER trg_protect_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_protect_profile_privileges();

-- ------------------------------------------------------------------------------
-- 2. POLÍTICAS: PROFILES
-- ------------------------------------------------------------------------------
-- Lectura: Cualquier usuario activo puede ver los perfiles del equipo
CREATE POLICY "profiles_select_active" ON public.profiles
FOR SELECT TO authenticated
USING (public.is_active_user());

-- Inserción: Solo Admin
CREATE POLICY "profiles_insert_admin" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- Actualización: Admin puede todo; Usuario común solo su propio perfil (sujeto al trigger de protección)
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
FOR UPDATE TO authenticated
USING (public.is_admin() OR (auth.uid() = id AND public.is_active_user()))
WITH CHECK (public.is_admin() OR (auth.uid() = id AND public.is_active_user()));

-- Eliminación: Solo Admin
CREATE POLICY "profiles_delete_admin" ON public.profiles
FOR DELETE TO authenticated
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. POLÍTICAS: APP_SETTINGS
-- ------------------------------------------------------------------------------
CREATE POLICY "app_settings_select" ON public.app_settings
FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "app_settings_admin_all" ON public.app_settings
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. POLÍTICAS: AREAS
-- ------------------------------------------------------------------------------
CREATE POLICY "areas_select_active" ON public.areas
FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "areas_admin_modify" ON public.areas
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS: TASKS
-- ------------------------------------------------------------------------------
-- Lectura: Usuarios activos ven tareas no archivadas; Admins ven todas
CREATE POLICY "tasks_select_active" ON public.tasks
FOR SELECT TO authenticated
USING (
  public.is_active_user() AND (
    archived_at IS NULL OR public.is_admin()
  )
);

-- Creación: Usuarios habilitados (Admin siempre, Responsable si app_settings lo permite)
CREATE POLICY "tasks_insert_authorized" ON public.tasks
FOR INSERT TO authenticated
WITH CHECK (
  public.can_create_task() AND created_by = auth.uid()
);

-- Actualización: Admins o Responsables/Colaboradores asignados
CREATE POLICY "tasks_update_authorized" ON public.tasks
FOR UPDATE TO authenticated
USING (
  public.is_admin() OR public.can_edit_task(id)
)
WITH CHECK (
  public.is_admin() OR public.can_edit_task(id)
);

-- Eliminación física: Solo Admin (UI utiliza archivado)
CREATE POLICY "tasks_delete_admin" ON public.tasks
FOR DELETE TO authenticated
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS: TASK_ASSIGNEES
-- ------------------------------------------------------------------------------
CREATE POLICY "task_assignees_select" ON public.task_assignees
FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "task_assignees_modify" ON public.task_assignees
FOR ALL TO authenticated
USING (public.is_admin() OR public.can_edit_task(task_id))
WITH CHECK (public.is_admin() OR public.can_edit_task(task_id));

-- ------------------------------------------------------------------------------
-- 7. POLÍTICAS: SUBTASKS
-- ------------------------------------------------------------------------------
CREATE POLICY "subtasks_select" ON public.subtasks
FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "subtasks_insert_update" ON public.subtasks
FOR ALL TO authenticated
USING (public.is_admin() OR public.can_edit_task(task_id))
WITH CHECK (public.is_admin() OR public.can_edit_task(task_id));

-- ------------------------------------------------------------------------------
-- 8. POLÍTICAS: COMMENTS
-- ------------------------------------------------------------------------------
CREATE POLICY "comments_select" ON public.comments
FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "comments_insert" ON public.comments
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user() AND profile_id = auth.uid());

CREATE POLICY "comments_update_delete" ON public.comments
FOR UPDATE TO authenticated
USING (public.is_admin() OR (profile_id = auth.uid() AND public.is_active_user()))
WITH CHECK (public.is_admin() OR (profile_id = auth.uid() AND public.is_active_user()));

CREATE POLICY "comments_delete" ON public.comments
FOR DELETE TO authenticated
USING (public.is_admin() OR (profile_id = auth.uid() AND public.is_active_user()));

-- ------------------------------------------------------------------------------
-- 9. POLÍTICAS: ATTACHMENTS
-- ------------------------------------------------------------------------------
CREATE POLICY "attachments_select" ON public.attachments
FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "attachments_insert" ON public.attachments
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR public.can_edit_task(task_id));

CREATE POLICY "attachments_delete" ON public.attachments
FOR DELETE TO authenticated
USING (public.is_admin() OR (profile_id = auth.uid() AND public.is_active_user()));

-- ------------------------------------------------------------------------------
-- 10. POLÍTICAS: TASK_DEPENDENCIES
-- ------------------------------------------------------------------------------
CREATE POLICY "dependencies_select" ON public.task_dependencies
FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "dependencies_modify" ON public.task_dependencies
FOR ALL TO authenticated
USING (public.is_admin() OR public.can_edit_task(task_id))
WITH CHECK (public.is_admin() OR public.can_edit_task(task_id));

-- ------------------------------------------------------------------------------
-- 11. POLÍTICAS: TAGS & TASK_TAGS
-- ------------------------------------------------------------------------------
CREATE POLICY "tags_select" ON public.tags
FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "tags_modify" ON public.tags
FOR ALL TO authenticated
USING (public.is_responsable_or_admin())
WITH CHECK (public.is_responsable_or_admin());

CREATE POLICY "task_tags_select" ON public.task_tags
FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "task_tags_modify" ON public.task_tags
FOR ALL TO authenticated
USING (public.is_admin() OR public.can_edit_task(task_id))
WITH CHECK (public.is_admin() OR public.can_edit_task(task_id));

-- ------------------------------------------------------------------------------
-- 12. POLÍTICAS: NOTIFICATIONS (Privacidad estricta por usuario)
-- ------------------------------------------------------------------------------
-- Solo puede ver sus propias notificaciones
CREATE POLICY "notifications_select_own" ON public.notifications
FOR SELECT TO authenticated
USING (profile_id = auth.uid() AND public.is_active_user());

-- Solo puede actualizar sus propias notificaciones (marcar como leída)
CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE TO authenticated
USING (profile_id = auth.uid() AND public.is_active_user())
WITH CHECK (profile_id = auth.uid() AND public.is_active_user());

-- Inserción permitida a usuarios activos (para alertas colaborativas) o funciones SECURITY DEFINER
CREATE POLICY "notifications_insert_active" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user());

-- ------------------------------------------------------------------------------
-- 13. POLÍTICAS: ACTIVITY_LOG (Auditoría Inmutable)
-- ------------------------------------------------------------------------------
-- Lectura para usuarios activos
CREATE POLICY "activity_log_select" ON public.activity_log
FOR SELECT TO authenticated
USING (public.is_active_user());

-- Inserción permitida para registrar eventos
CREATE POLICY "activity_log_insert" ON public.activity_log
FOR INSERT TO authenticated
WITH CHECK (public.is_active_user());

-- Inmutable: NO SE PERMITE UPDATE NI DELETE A NINGÚN ROL COMÚN
-- (Sin políticas de UPDATE/DELETE)

-- ------------------------------------------------------------------------------
-- 14. POLÍTICAS: RECURRING_TASK_RULES
-- ------------------------------------------------------------------------------
CREATE POLICY "recurring_rules_select" ON public.recurring_task_rules
FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "recurring_rules_modify_admin" ON public.recurring_task_rules
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
