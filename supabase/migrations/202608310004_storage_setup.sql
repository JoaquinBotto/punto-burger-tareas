-- ==============================================================================
-- 04_storage_setup.sql
-- Configuración de Storage Privado y Políticas RLS Estrictas para Adjuntos
-- ==============================================================================

-- 1. Crear Bucket Privado para Adjuntos de Tareas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'task-attachments',
    'task-attachments',
    false, -- Privado: requiere URLs firmadas temporales
    20971520, -- 20 MB límite por archivo
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 20971520;

-- 2. Políticas de Seguridad en storage.objects
-- Estructura de ruta esperada: tasks/{task_id}/{uuid}-{nombre-archivo-sanitizado}

-- Lectura: Solo usuarios activos que tengan permiso para ver la tarea asociada
CREATE POLICY "attachments_read_authorized_task" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'task-attachments' 
    AND public.is_active_user()
    AND (
        public.is_admin()
        OR EXISTS (
            -- Extrae el task_id de la ruta 'tasks/{task_id}/...'
            SELECT 1 FROM public.tasks t
            WHERE t.id::text = (storage.foldername(name))[2]
              AND t.archived_at IS NULL
        )
    )
);

-- Subida: Usuarios activos que tengan permiso para editar la tarea asociada
CREATE POLICY "attachments_upload_authorized_task" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'task-attachments' 
    AND public.is_active_user()
    AND (
        public.is_admin()
        OR public.can_edit_task(((storage.foldername(name))[2])::uuid)
    )
);

-- Eliminación: Solo Admin o el usuario propietario que subió el archivo
CREATE POLICY "attachments_delete_owner_or_admin" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'task-attachments' 
    AND (public.is_admin() OR auth.uid() = owner)
);
