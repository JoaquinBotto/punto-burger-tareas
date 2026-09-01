-- ==============================================================================
-- create_first_admin.sql
-- Script para promover el Primer Administrador de Punto Burger
-- ==============================================================================

DO $$
DECLARE
  v_target_email TEXT := 'puntoburger@puntoburger.com.ar';
  v_user_id UUID;
BEGIN
  -- Buscar ID en auth.users sin distinguir mayúsculas/minúsculas
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE LOWER(email) = LOWER(v_target_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: % no existe aún en auth.users. Créalo en Authentication -> Users en el Dashboard de Supabase.', v_target_email;
  END IF;

  -- Insertar o actualizar el perfil como Administrador activo
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (v_user_id, LOWER(v_target_email), 'Administrador Punto Burger', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    updated_at = now();

  RAISE NOTICE '¡Éxito! El usuario % (UUID: %) ha sido configurado como Administrador Activo.', v_target_email, v_user_id;
END $$;
