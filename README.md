# Punto Burger | Tareas 🍔📋

Sistema web y PWA mobile-first diseñado específicamente para organizar, asignar, monitorear y ejecutar todas las tareas operativas de apertura y operación diaria de **Punto Burger**.

---

## 🛠️ Stack Tecnológico
- **Frontend:** React 19 + TypeScript + Vite.
- **Estilos:** Tailwind CSS v4 con paleta gastronómica oficial de Punto Burger.
- **PWA:** `vite-plugin-pwa` con Service Worker para instalación en celulares (iOS y Android) y protección offline.
- **Backend & Base de Datos:** Supabase (PostgreSQL 15+, Auth JWT, RLS estricto, Realtime WebSockets, Storage privado).
- **Zona Horaria:** `America/Argentina/Cordoba` (UTC-3) sin desfasajes de fecha.
- **Pruebas Automatizadas:** Vitest.

---

## 🚀 Guía de Inicio Rápido

### 1. Requisitos Previos
- Node.js 18+ y npm.
- Una cuenta y proyecto en [Supabase](https://supabase.com).

### 2. Instalación de Dependencias
```bash
npm install
```

### 3. Variables de Entorno
Copia el archivo de ejemplo `.env.example` a `.env`:
```bash
cp .env.example .env
```
Completa las variables con las credenciales de tu proyecto Supabase:
```env
VITE_SUPABASE_URL=https://vqozfrwanvtroeacegrd.supabase.co/
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ZFKjaTu-9pdu3iBzoQKlDg_s1Ug2GfP
```
> **NOTA DE SEGURIDAD ESTRICTA:**
> La `Publishable Key` es la única clave que puede utilizar el frontend.
> Nunca agregues `SUPABASE_SECRET_KEY` ni `SUPABASE_SERVICE_ROLE_KEY` en el archivo `.env` del frontend ni en variables `VITE_*`.

### 4. Ejecución en Desarrollo
```bash
npm run dev
```

### 5. Pruebas Automatizadas y Build de Producción
```bash
npm run test     # Ejecuta pruebas de permisos y zona horaria
npm run build    # Compila TypeScript y genera el bundle PWA para producción
```

---

## 🗄️ Base de Datos y Pasos en Supabase

Ejecuta las migraciones en orden desde el **SQL Editor** de tu panel de Supabase:

1. `supabase/migrations/01_initial_schema.sql` (Tablas base, índices y restricciones).
2. `supabase/migrations/02_functions_triggers.sql` (Funciones SECURITY DEFINER, triggers de avance, auditoría y alertas).
3. `supabase/migrations/03_rls_policies.sql` (Políticas de seguridad RLS para Admin, Responsable y Colaborador).
4. `supabase/migrations/04_storage_setup.sql` (Bucket privado `task-attachments` y políticas de almacenamiento).
5. `supabase/migrations/05_seed_initial.sql` (Configuración `app_settings` y las 15 áreas iniciales).
6. `supabase/migrations/06_seed_demo_tasks.sql` (Tareas realistas de demostración de Punto Burger).

### 👑 Cómo Crear el Primer Administrador
1. Ve a **Authentication -> Users** en el Dashboard de Supabase y haz clic en **Add User** (crea tu usuario con tu correo y contraseña).
2. Abre el **SQL Editor** y ejecuta el script `supabase/scripts/create_first_admin.sql` (reemplazando `admin@puntoburger.com` por tu correo):
```sql
DO $$
DECLARE
  v_target_email TEXT := 'tu-correo@puntoburger.com';
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_target_email;
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (v_user_id, v_target_email, 'Administrador Punto Burger', 'admin', true)
  ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true;
END $$;
```

---

## 🔒 Supabase Edge Functions
- `supabase/functions/invite-user`: Invitación segura de usuarios por parte del Administrador usando `service_role` únicamente en el backend.
- `supabase/functions/check-due-alerts`: Comprobación idempotente de alertas de vencimiento y generador de tareas recurrentes para Cron.
