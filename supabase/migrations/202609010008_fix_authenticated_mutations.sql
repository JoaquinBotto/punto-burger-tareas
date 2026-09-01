-- ==============================================================================
-- 202609010008_fix_authenticated_mutations.sql
-- Defaults automáticos de auth.uid() y flexibilización de políticas RLS para mutaciones autenticadas
-- ==============================================================================

-- 1. Defaults automáticos de auth.uid() en columnas de auditoría / autor
ALTER TABLE public.tasks 
  ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.comments 
  ALTER COLUMN profile_id SET DEFAULT auth.uid();

ALTER TABLE public.activity_log 
  ALTER COLUMN profile_id SET DEFAULT auth.uid();

-- 2. Trigger BEFORE INSERT en tasks para garantizar created_by y updated_at válidos
CREATE OR REPLACE FUNCTION public.trg_tasks_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  NEW.version := COALESCE(NEW.version, 1);
  NEW.created_at := COALESCE(NEW.created_at, now());
  NEW.updated_at := COALESCE(NEW.updated_at, now());
  NEW.progress_percentage := COALESCE(NEW.progress_percentage, 0);
  NEW.is_progress_manual := COALESCE(NEW.is_progress_manual, false);
  NEW.is_demo := COALESCE(NEW.is_demo, false);
  NEW.is_recurring := COALESCE(NEW.is_recurring, false);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_before_insert ON public.tasks;
CREATE TRIGGER trg_tasks_before_insert
BEFORE INSERT ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_tasks_before_insert();

-- 3. Actualizar política de INSERT en tasks para aceptar tanto default como asignación explícita de auth.uid()
DROP POLICY IF EXISTS "tasks_insert_authorized" ON public.tasks;
CREATE POLICY "tasks_insert_authorized"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  can_create_task() AND (created_by IS NULL OR created_by = auth.uid())
);

-- 4. Actualizar política de INSERT en comments
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
CREATE POLICY "comments_insert"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
  is_active_user() AND (profile_id IS NULL OR profile_id = auth.uid())
);

-- 5. Actualizar política de INSERT en activity_log
DROP POLICY IF EXISTS "activity_log_insert" ON public.activity_log;
CREATE POLICY "activity_log_insert"
ON public.activity_log
FOR INSERT
TO authenticated
WITH CHECK (
  is_active_user() AND (profile_id IS NULL OR profile_id = auth.uid())
);

-- 6. Garantizar que can_edit_task permita tanto a administradores como a responsables y asignados
CREATE OR REPLACE FUNCTION public.can_edit_task(p_task_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_active_user() THEN
    RETURN FALSE;
  END IF;

  IF public.is_admin() THEN
    RETURN TRUE;
  END IF;

  -- Comprobar si es responsable principal o asignado
  RETURN EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = p_task_id AND (
      t.main_assignee_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.task_assignees ta
        WHERE ta.task_id = p_task_id AND ta.profile_id = auth.uid()
      )
    )
  );
END;
$$;
