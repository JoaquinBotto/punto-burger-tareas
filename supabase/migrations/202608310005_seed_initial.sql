-- ==============================================================================
-- 05_seed_initial.sql
-- Datos Iniciales de Configuración y Áreas de Trabajo
-- ==============================================================================

-- 1. Configuración General de Punto Burger
INSERT INTO public.app_settings (
    id,
    business_name,
    timezone,
    due_soon_days,
    blocked_alert_hours,
    allow_responsible_create_task
)
VALUES (
    1,
    'Punto Burger',
    'America/Argentina/Cordoba',
    3,
    48,
    true
)
ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    timezone = EXCLUDED.timezone;

-- 2. Las 15 Áreas Iniciales del Proyecto
INSERT INTO public.areas (name, description, icon, color, display_order)
VALUES
    ('Obra y construcción', 'Trabajos de albañilería, durlock, pintura y reformas estructurales', 'Hammer', '#E03131', 1),
    ('Equipamiento', 'Hornos, planchas, freidoras, campanas y mesadas gastronómicas', 'Refrigerator', '#E8590C', 2),
    ('Electricidad', 'Tableros, tomas trifásicos/monofásicos, cableados e iluminación', 'Zap', '#F59F00', 3),
    ('Plomería', 'Desagües, graseras, agua fría/caliente y griferías de barra y cocina', 'Droplets', '#1098AD', 4),
    ('Barra y cocina', 'Montaje, conexión de comanderas, cafetera y áreas de despacho', 'UtensilsCrossed', '#7048E8', 5),
    ('Proveedores', 'Cárnicos, panificación, bebidas, packaging y descartables', 'Truck', '#3B5BDB', 6),
    ('Compras e insumos', 'Adquisición de insumos iniciales, vajilla, uniformes y herramientas', 'ShoppingBag', '#0CA678', 7),
    ('Menú y productos', 'Recetas, escandallos, pruebas de producto (burgers, conos de pizza)', 'Flame', '#D6336C', 8),
    ('Habilitaciones', 'Trámites municipales, bromatología, bomberos, planos y seguros', 'FileCheck', '#495057', 9),
    ('Personal y capacitación', 'Entrevistas, contratos, inducción, manuales de procedimiento y servicio', 'Users', '#1C7ED6', 10),
    ('Marketing y comunicación', 'Cartelería, redes sociales, fotografía de carta y promoción inaugural', 'Megaphone', '#F76707', 11),
    ('Sistemas y tecnología', 'Punto de venta (POS), comandera, red Wi-Fi, audio y cámaras de seguridad', 'Monitor', '#845EF7', 12),
    ('Limpieza y seguridad', 'Kit de sanitización, extintores, señalética y plan de higiene', 'ShieldCheck', '#2B8A3E', 13),
    ('Apertura', 'Checklist final para el día de apertura, marcha blanca y evento de prensa', 'Sparkles', '#C92A2A', 14),
    ('Operación diaria', 'Rutinas diarias de apertura, control de caja, stock y cierre de turno', 'Clock', '#868E96', 15)
ON CONFLICT (name) DO UPDATE SET
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    display_order = EXCLUDED.display_order;
