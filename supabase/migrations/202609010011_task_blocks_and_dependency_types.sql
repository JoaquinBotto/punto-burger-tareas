-- ==============================================================================
-- 202609010011_task_blocks_and_dependency_types.sql
-- 1. Tabla task_blocks para historial real de bloqueos y desbloqueos
-- 2. Columna dependency_type en task_dependencies (blocking vs coordination)
-- ==============================================================================

-- 1. Tabla task_blocks
CREATE TABLE IF NOT EXISTS public.task_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  blocked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  related_party TEXT,
  estimated_resolution_at DATE,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_task_blocks_task_id ON public.task_blocks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_blocks_blocked_by ON public.task_blocks(blocked_by);
CREATE INDEX IF NOT EXISTS idx_task_blocks_active ON public.task_blocks(task_id) WHERE resolved_at IS NULL;

-- RLS para task_blocks
ALTER TABLE public.task_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_blocks_select_policy" ON public.task_blocks;
CREATE POLICY "task_blocks_select_policy"
  ON public.task_blocks
  FOR SELECT
  TO authenticated
  USING (public.is_active_user());

DROP POLICY IF EXISTS "task_blocks_insert_policy" ON public.task_blocks;
CREATE POLICY "task_blocks_insert_policy"
  ON public.task_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_active_user() AND (
      public.is_admin() OR public.can_edit_task(task_id)
    )
  );

DROP POLICY IF EXISTS "task_blocks_update_policy" ON public.task_blocks;
CREATE POLICY "task_blocks_update_policy"
  ON public.task_blocks
  FOR UPDATE
  TO authenticated
  USING (
    public.is_active_user() AND (
      public.is_admin() OR public.can_edit_task(task_id)
    )
  )
  WITH CHECK (
    public.is_active_user() AND (
      public.is_admin() OR public.can_edit_task(task_id)
    )
  );

-- 2. Columna dependency_type en task_dependencies
ALTER TABLE public.task_dependencies 
ADD COLUMN IF NOT EXISTS dependency_type TEXT NOT NULL DEFAULT 'blocking';

ALTER TABLE public.task_dependencies
DROP CONSTRAINT IF EXISTS check_dependency_type;

ALTER TABLE public.task_dependencies
ADD CONSTRAINT check_dependency_type CHECK (dependency_type IN ('blocking', 'coordination'));
