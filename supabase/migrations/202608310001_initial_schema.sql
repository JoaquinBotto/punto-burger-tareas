-- ==============================================================================
-- 01_initial_schema.sql
-- Base de Datos para Punto Burger | Tareas
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. APP SETTINGS (Configuración Centralizada del Sistema)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
    id INT PRIMARY KEY DEFAULT 1,
    business_name TEXT NOT NULL DEFAULT 'Punto Burger',
    timezone TEXT NOT NULL DEFAULT 'America/Argentina/Cordoba',
    due_soon_days INT NOT NULL DEFAULT 3,
    blocked_alert_hours INT NOT NULL DEFAULT 48,
    allow_responsible_create_task BOOLEAN NOT NULL DEFAULT true,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- ------------------------------------------------------------------------------
-- 2. PROFILES (Perfiles de Usuario asociados a auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'responsable', 'colaborador')) DEFAULT 'colaborador',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- ------------------------------------------------------------------------------
-- 3. AREAS (Áreas de Trabajo del Proyecto)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'Folder',
    color TEXT NOT NULL DEFAULT '#C92A2A',
    display_order INT NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_areas_display_order ON public.areas(display_order);
CREATE INDEX IF NOT EXISTS idx_areas_is_archived ON public.areas(is_archived);

-- ------------------------------------------------------------------------------
-- 4. RECURRING TASK RULES (Reglas de Tareas Recurrentes Operativas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recurring_task_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_title TEXT NOT NULL,
    template_description TEXT,
    area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
    main_assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    priority TEXT NOT NULL CHECK (priority IN ('critica', 'alta', 'media', 'baja')) DEFAULT 'media',
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekdays', 'weekly', 'monthly', 'custom')),
    interval_days INT DEFAULT 1,
    days_of_week INT[] DEFAULT '{}', -- 1=Lunes, 7=Domingo
    create_time TIME NOT NULL DEFAULT '08:00:00',
    timezone TEXT NOT NULL DEFAULT 'America/Argentina/Cordoba',
    next_run_date DATE NOT NULL,
    last_run_date DATE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_rules_active ON public.recurring_task_rules(is_active, next_run_date);

-- ------------------------------------------------------------------------------
-- 5. TASKS (Tareas de Apertura y Operación)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
    main_assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    priority TEXT NOT NULL CHECK (priority IN ('critica', 'alta', 'media', 'baja')) DEFAULT 'media',
    status TEXT NOT NULL CHECK (status IN ('pendiente', 'en_progreso', 'esperando_tercero', 'bloqueada', 'en_revision', 'completada', 'cancelada')) DEFAULT 'pendiente',
    progress_percentage INT NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100) DEFAULT 0,
    is_progress_manual BOOLEAN NOT NULL DEFAULT false,
    due_date DATE,
    due_time TIME,
    
    -- Datos de 'Esperando a un tercero'
    third_party_name TEXT,
    third_party_reason TEXT,
    third_party_promised_date DATE,
    third_party_contact TEXT,
    
    -- Datos de bloqueo
    blocked_reason TEXT,
    blocked_at TIMESTAMPTZ,
    
    -- Auditoría de ciclo de vida
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    archived_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Recurrencias e idempotencia
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurring_rule_id UUID REFERENCES public.recurring_task_rules(id) ON DELETE SET NULL,
    recurrence_occurrence_date DATE,
    
    -- Control de demo y concurrencia optimista
    is_demo BOOLEAN NOT NULL DEFAULT false,
    version INT NOT NULL DEFAULT 1,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT uq_recurring_occurrence UNIQUE (recurring_rule_id, recurrence_occurrence_date)
);

CREATE INDEX IF NOT EXISTS idx_tasks_area_id ON public.tasks(area_id);
CREATE INDEX IF NOT EXISTS idx_tasks_main_assignee ON public.tasks(main_assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_archived_at ON public.tasks(archived_at);
CREATE INDEX IF NOT EXISTS idx_tasks_is_demo ON public.tasks(is_demo);

-- ------------------------------------------------------------------------------
-- 6. TASK ASSIGNEES (Colaboradores Adicionales de la Tarea)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_task_assignee UNIQUE (task_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_task_assignees_task ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_profile ON public.task_assignees(profile_id);

-- ------------------------------------------------------------------------------
-- 7. SUBTASKS (Pasos del Checklist Operativo)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id, display_order);

-- ------------------------------------------------------------------------------
-- 8. COMMENTS (Comentarios en Tareas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.comments(task_id, created_at);

-- ------------------------------------------------------------------------------
-- 9. ATTACHMENTS (Archivos, Fotos y Comprobantes Adjuntos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON public.attachments(task_id);

-- ------------------------------------------------------------------------------
-- 10. TASK DEPENDENCIES (Dependencias y Tareas Bloqueantes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    blocking_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_no_self_dependency CHECK (task_id != blocking_task_id),
    CONSTRAINT uq_task_dependency UNIQUE (task_id, blocking_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dep_task ON public.task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dep_blocking ON public.task_dependencies(blocking_task_id);

-- ------------------------------------------------------------------------------
-- 11. TAGS & TASK TAGS (Etiquetas para Búsqueda y Filtros)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#71717A',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_tags (
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

-- ------------------------------------------------------------------------------
-- 12. NOTIFICATIONS (Centro de Alertas y Avisos Internos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'assignment',
        'due_today',
        'overdue',
        'due_soon',
        'due_date_changed',
        'comment',
        'critical_completed',
        'blocked_alert',
        'dependency_resolved',
        'third_party_due',
        'system'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
    event_key TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_notification_event UNIQUE (profile_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_notifications_profile_read ON public.notifications(profile_id, is_read, created_at DESC);

-- ------------------------------------------------------------------------------
-- 13. ACTIVITY LOG (Registro Inmutable de Auditoría Histórica)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_task_created ON public.activity_log(task_id, created_at DESC);
