-- ==============================================================================
-- 06_seed_demo_tasks.sql
-- Tareas de Demostración Realistas para Punto Burger (is_demo = true)
-- ==============================================================================

DO $$
DECLARE
  v_admin_id UUID;
  v_area_obra UUID;
  v_area_mkt UUID;
  v_area_equip UUID;
  v_area_barra UUID;
  v_area_plom UUID;
  v_area_elec UUID;
  v_area_sist UUID;
  v_area_menu UUID;
  v_area_hab UUID;
  v_area_prov UUID;
  v_area_pers UUID;
  v_task_id UUID;
BEGIN
  -- Obtener primer usuario admin o perfil disponible
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  
  -- Si no existe aún un admin, salir silenciosamente (se ejecutará luego de crear el admin)
  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'No se encontró un perfil admin para asociar las tareas demo. Crea el admin primero.';
    RETURN;
  END IF;

  -- Obtener IDs de áreas
  SELECT id INTO v_area_obra FROM public.areas WHERE name = 'Obra y construcción';
  SELECT id INTO v_area_mkt FROM public.areas WHERE name = 'Marketing y comunicación';
  SELECT id INTO v_area_equip FROM public.areas WHERE name = 'Equipamiento';
  SELECT id INTO v_area_barra FROM public.areas WHERE name = 'Barra y cocina';
  SELECT id INTO v_area_plom FROM public.areas WHERE name = 'Plomería';
  SELECT id INTO v_area_elec FROM public.areas WHERE name = 'Electricidad';
  SELECT id INTO v_area_sist FROM public.areas WHERE name = 'Sistemas y tecnología';
  SELECT id INTO v_area_menu FROM public.areas WHERE name = 'Menú y productos';
  SELECT id INTO v_area_hab FROM public.areas WHERE name = 'Habilitaciones';
  SELECT id INTO v_area_prov FROM public.areas WHERE name = 'Proveedores';
  SELECT id INTO v_area_pers FROM public.areas WHERE name = 'Personal y capacitación';

  -- 1. Terminar trabajos de Durlock
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Terminar trabajos de Durlock', 'Completar cerramientos, masillado y lijado en el salón principal y zona de baños.', v_area_obra, v_admin_id, 'alta', 'en_progreso', CURRENT_DATE + 3, v_admin_id, true)
  RETURNING id INTO v_task_id;
  INSERT INTO public.subtasks (task_id, title, is_completed, display_order) VALUES
  (v_task_id, 'Verificar nivelación de placas', true, 1),
  (v_task_id, 'Aplicar segunda mano de masilla', true, 2),
  (v_task_id, 'Lijado final para pintura', false, 3);

  -- 2. Confirmar dónde y cuándo se instala el cartel
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Confirmar dónde y cuándo se instala el cartel', 'Coordinar con la empresa de cartelería el montaje del letrero frontal exterior.', v_area_mkt, v_admin_id, 'alta', 'esperando_tercero', CURRENT_DATE + 2, v_admin_id, true)
  RETURNING id INTO v_task_id;
  UPDATE public.tasks SET 
    third_party_name = 'Letreros Neon Pro',
    third_party_reason = 'Esperando entrega de estructura metálica y permisos de grúa',
    third_party_promised_date = CURRENT_DATE + 2,
    third_party_contact = '+54 9 351 555-0192'
  WHERE id = v_task_id;

  -- 3. Verificar si el cartel está pagado
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Verificar si el cartel está pagado', 'Revisar comprobante de transferencia y saldo pendiente con administración.', v_area_mkt, v_admin_id, 'media', 'completada', CURRENT_DATE - 1, v_admin_id, true);

  -- 4. Finalizar colocación de pisos
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Finalizar colocación de pisos', 'Colocar cerámicos antideslizantes de alta resistencia en cocina y salón.', v_area_obra, v_admin_id, 'critica', 'en_progreso', CURRENT_DATE + 1, v_admin_id, true)
  RETURNING id INTO v_task_id;
  INSERT INTO public.subtasks (task_id, title, is_completed, display_order) VALUES
  (v_task_id, 'Nivelación de carpeta', true, 1),
  (v_task_id, 'Pegado de cerámicos en cocina', true, 2),
  (v_task_id, 'Pastinado y sellado en salón', false, 3);

  -- 5. Terminar construcción de la barra
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Terminar construcción de la barra', 'Estructura de madera y cubierta de acero inoxidable para despacho y cobro.', v_area_barra, v_admin_id, 'critica', 'en_progreso', CURRENT_DATE + 4, v_admin_id, true)
  RETURNING id INTO v_task_id;
  INSERT INTO public.subtasks (task_id, title, is_completed, display_order) VALUES
  (v_task_id, 'Confirmar medidas definitivas', true, 1),
  (v_task_id, 'Comprar maderas y herrajes', true, 2),
  (v_task_id, 'Montaje de estructura', false, 3),
  (v_task_id, 'Revisar terminaciones y barnizado', false, 4);

  -- 6. Coordinar trabajos de plomería en la barra
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Coordinar trabajos de plomería en la barra', 'Conexión de bacha, canilla monocomando y desagüe con grasera.', v_area_plom, v_admin_id, 'alta', 'pendiente', CURRENT_DATE + 2, v_admin_id, true);

  -- 7. Llevar electricidad hasta la barra
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Llevar electricidad hasta la barra', 'Tirada de cable de 4mm y colocación de tomas dedicados.', v_area_elec, v_admin_id, 'critica', 'bloqueada', CURRENT_DATE + 2, v_admin_id, true)
  RETURNING id INTO v_task_id;
  UPDATE public.tasks SET 
    blocked_reason = 'Falta terminar la estructura de madera para pasar los caños corrugados.'
  WHERE id = v_task_id;

  -- 8. Instalar conexión para la comandera
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Instalar conexión para la comandera', 'Punto de red Ethernet RJ45 y toma 220V bajo la barra.', v_area_sist, v_admin_id, 'media', 'pendiente', CURRENT_DATE + 5, v_admin_id, true);

  -- 9. Instalar toma para la máquina de café
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Instalar toma para la máquina de café', 'Toma reforzado de 20A con disyuntor térmico independiente.', v_area_elec, v_admin_id, 'alta', 'pendiente', CURRENT_DATE + 4, v_admin_id, true);

  -- 10. Revisar iluminación de la barra
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Revisar iluminación de la barra', 'Instalación de luces colgantes cálidas y tira LED bajo mesada.', v_area_elec, v_admin_id, 'media', 'pendiente', CURRENT_DATE + 6, v_admin_id, true);

  -- 11. Definir pozo de frío para hamburguesas
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Definir pozo de frío para hamburguesas', 'Determinar ubicación de la mesa bajo mesada refrigerada para medallones y toppings.', v_area_equip, v_admin_id, 'alta', 'completada', CURRENT_DATE - 2, v_admin_id, true);

  -- 12. Revisar freezers comprados y faltantes
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Revisar freezers comprados y faltantes', 'Inventario de 2 freezers verticales y 1 pozo congelador.', v_area_equip, v_admin_id, 'alta', 'en_progreso', CURRENT_DATE + 1, v_admin_id, true);

  -- 13. Confirmar equipamiento para pizza en cono
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Confirmar equipamiento para pizza en cono', 'Coneras, moldes cónicos térmicos y soporte exhibidor.', v_area_menu, v_admin_id, 'alta', 'en_progreso', CURRENT_DATE + 3, v_admin_id, true);

  -- 14. Confirmar hornos necesarios
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Confirmar hornos necesarios', 'Horno convector industrial para panificación y pre-cocción.', v_area_equip, v_admin_id, 'alta', 'completada', CURRENT_DATE - 3, v_admin_id, true);

  -- 15. Revisar habilitaciones
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Revisar habilitaciones', 'Trámite en la municipalidad, plano de evacuación y matafuegos con oblea vigente.', v_area_hab, v_admin_id, 'critica', 'en_progreso', CURRENT_DATE + 5, v_admin_id, true)
  RETURNING id INTO v_task_id;
  INSERT INTO public.subtasks (task_id, title, is_completed, display_order) VALUES
  (v_task_id, 'Presentar planos ante bomberos', true, 1),
  (v_task_id, 'Inspección de bromatología', false, 2),
  (v_task_id, 'Pago de timbrado municipal', false, 3);

  -- 16. Confirmar proveedores principales
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Confirmar proveedores principales', 'Cierres de contratos con frigorífico vacuno, panificadora artesanal y distribuidora de quesos.', v_area_prov, v_admin_id, 'critica', 'en_progreso', CURRENT_DATE + 2, v_admin_id, true);

  -- 17. Capacitar al personal
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Capacitar al personal', 'Inducción de cocina: smashed burgers, rotación de freidoras y protocolo de servicio al cliente.', v_area_pers, v_admin_id, 'alta', 'pendiente', CURRENT_DATE + 7, v_admin_id, true);

  -- 18. Preparar campaña de apertura
  INSERT INTO public.tasks (title, description, area_id, main_assignee_id, priority, status, due_date, created_by, is_demo)
  VALUES ('Preparar campaña de apertura', 'Lanzamiento en Instagram/TikTok, degustación para influencers locales y flyers del barrio.', v_area_mkt, v_admin_id, 'alta', 'pendiente', CURRENT_DATE + 8, v_admin_id, true);

END $$;
