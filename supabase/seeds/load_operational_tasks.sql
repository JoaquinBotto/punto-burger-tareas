-- ==============================================================================
-- Carga Idempotente de Tareas Operativas Reales para Apertura de Punto Burger
-- Proyecto: vqozfrwanvtroeacegrd
-- ==============================================================================

DO $$
DECLARE
  v_admin_id UUID;
  v_area_obra UUID := 'ae624e97-f1df-40a8-a86d-4ff47c719944';        -- Obra y construcción
  v_area_equip UUID := 'cdfcdbe3-8872-4540-a532-54d07428cba1';       -- Equipamiento
  v_area_elec UUID := '78c627f0-8538-46f3-bbae-ac76ed5be9c3';        -- Electricidad
  v_area_plom UUID := 'bf28d6f4-d84a-4981-9eb1-200df8dad132';        -- Plomería
  v_area_barra_cocina UUID := 'e9d20af1-b083-48f0-8e72-18a22f1546ca'; -- Barra y cocina
  v_area_prov UUID := '4c895ea8-b383-489e-84e2-3ebe6ec87f8e';        -- Proveedores
  v_area_compras UUID := '8236e76e-8b6e-44dd-953f-88b3b4868aef';     -- Compras e insumos
  v_area_mkt UUID := '1d3038ba-d2f3-4dbe-9bff-69e584e8458b';         -- Marketing y comunicación

  -- Task IDs
  v_t1 UUID;
  v_t2 UUID;
  v_t3 UUID;
  v_t4 UUID;
  v_t5 UUID;
  v_t6 UUID;
  v_t7 UUID;
  v_t8 UUID;
  v_t9 UUID;
  v_t10 UUID;
  v_t11 UUID;
  v_t12 UUID;
  v_t13 UUID;

  -- Tag IDs
  v_tag_apertura UUID;
  v_tag_obra UUID;
  v_tag_bloqueante UUID;
  v_tag_terceros UUID;
  v_tag_carteleria UUID;
  v_tag_barra UUID;
  v_tag_plomeria UUID;
  v_tag_electricidad UUID;
  v_tag_cocina UUID;
  v_tag_equipamiento UUID;
  v_tag_frio UUID;
  v_tag_hornos UUID;
  v_tag_compras UUID;
  v_tag_pisos UUID;
  v_tag_equipo_interno UUID;
  v_tag_coordinacion UUID;
  v_tag_inventario UUID;
  v_tag_prueba_operativa UUID;

BEGIN
  -- 1. Obtener ID del Administrador
  SELECT id INTO v_admin_id FROM auth.users WHERE lower(email) = 'puntoburger@puntoburger.com.ar' LIMIT 1;
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' AND is_active = true LIMIT 1;
  END IF;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ningún administrador activo para asignar created_by.';
  END IF;

  -- 2. Asegurar Tags en public.tags
  INSERT INTO public.tags (name, color) VALUES ('apertura', '#C92A2A') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_apertura;
  INSERT INTO public.tags (name, color) VALUES ('obra', '#E03131') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_obra;
  INSERT INTO public.tags (name, color) VALUES ('bloqueante', '#C92A2A') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_bloqueante;
  INSERT INTO public.tags (name, color) VALUES ('terceros', '#7048E8') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_terceros;
  INSERT INTO public.tags (name, color) VALUES ('cartelería', '#F76707') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_carteleria;
  INSERT INTO public.tags (name, color) VALUES ('barra', '#E9D20A') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_barra;
  INSERT INTO public.tags (name, color) VALUES ('plomería', '#1098AD') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_plomeria;
  INSERT INTO public.tags (name, color) VALUES ('electricidad', '#F59F00') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_electricidad;
  INSERT INTO public.tags (name, color) VALUES ('cocina', '#D6336C') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_cocina;
  INSERT INTO public.tags (name, color) VALUES ('equipamiento', '#E8590C') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_equipamiento;
  INSERT INTO public.tags (name, color) VALUES ('frío', '#1C7ED6') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_frio;
  INSERT INTO public.tags (name, color) VALUES ('hornos', '#E03131') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_hornos;
  INSERT INTO public.tags (name, color) VALUES ('compras', '#0CA678') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_compras;
  INSERT INTO public.tags (name, color) VALUES ('pisos', '#495057') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_pisos;
  INSERT INTO public.tags (name, color) VALUES ('equipo interno', '#2B8A3E') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_equipo_interno;
  INSERT INTO public.tags (name, color) VALUES ('coordinación', '#3B5BDB') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_coordinacion;
  INSERT INTO public.tags (name, color) VALUES ('inventario', '#845EF7') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_inventario;
  INSERT INTO public.tags (name, color) VALUES ('prueba operativa', '#16A34A') ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color RETURNING id INTO v_tag_prueba_operativa;

  -- ============================================================================
  -- TAREA 1: DEFINIR Y EJECUTAR TRABAJOS DE DURLOCK
  -- ============================================================================
  SELECT id INTO v_t1 FROM public.tasks WHERE title = 'Definir y ejecutar trabajos de Durlock' AND area_id = v_area_obra LIMIT 1;
  IF v_t1 IS NULL THEN
    INSERT INTO public.tasks (
      title, description, area_id, priority, status, progress_percentage, is_progress_manual, is_demo, created_by
    ) VALUES (
      'Definir y ejecutar trabajos de Durlock',
      'Definir de manera completa los trabajos de Durlock necesarios para Punto Burger: qué se debe construir, reparar o cerrar, dónde se realizará, quién lo ejecutará, cuándo comenzará y cuál es su situación económica.',
      v_area_obra, 'critica', 'pendiente', 0, false, false, v_admin_id
    ) RETURNING id INTO v_t1;

    INSERT INTO public.subtasks (task_id, title, display_order) VALUES
      (v_t1, 'Recorrer el local e identificar todos los sectores que necesitan Durlock.', 1),
      (v_t1, 'Definir exactamente qué trabajo se realizará en cada sector.', 2),
      (v_t1, 'Registrar medidas y ubicación de cada intervención.', 3),
      (v_t1, 'Definir materiales necesarios.', 4),
      (v_t1, 'Confirmar quién realizará el trabajo.', 5),
      (v_t1, 'Solicitar o verificar presupuesto.', 6),
      (v_t1, 'Confirmar si el trabajo está contratado.', 7),
      (v_t1, 'Confirmar cuánto está pagado.', 8),
      (v_t1, 'Confirmar si existe saldo pendiente.', 9),
      (v_t1, 'Definir fecha de inicio.', 10),
      (v_t1, 'Definir duración estimada.', 11),
      (v_t1, 'Definir fecha comprometida de finalización.', 12),
      (v_t1, 'Ejecutar los trabajos.', 13),
      (v_t1, 'Revisar terminaciones.', 14),
      (v_t1, 'Registrar fotografías del resultado.', 15),
      (v_t1, 'Aprobar el trabajo final.', 16);

    INSERT INTO public.task_tags (task_id, tag_id) VALUES 
      (v_t1, v_tag_apertura), (v_t1, v_tag_obra), (v_t1, v_tag_bloqueante), (v_t1, v_tag_terceros)
      ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- TAREA 2: DEFINIR E INSTALAR EL CARTEL DEL LOCAL
  -- ============================================================================
  SELECT id INTO v_t2 FROM public.tasks WHERE title = 'Definir e instalar el cartel del local' AND area_id = v_area_mkt LIMIT 1;
  IF v_t2 IS NULL THEN
    INSERT INTO public.tasks (
      title, description, area_id, priority, status, progress_percentage, is_progress_manual, is_demo, created_by
    ) VALUES (
      'Definir e instalar el cartel del local',
      'Resolver integralmente el cartel exterior de Punto Burger: diseño definitivo, medidas, ubicación, proveedor, presupuesto, estado de pago, fabricación, instalación e iluminación.',
      v_area_mkt, 'critica', 'pendiente', 0, false, false, v_admin_id
    ) RETURNING id INTO v_t2;

    INSERT INTO public.subtasks (task_id, title, display_order) VALUES
      (v_t2, 'Confirmar el diseño definitivo del cartel.', 1),
      (v_t2, 'Verificar que utilice correctamente la identidad visual de Punto Burger.', 2),
      (v_t2, 'Definir medidas.', 3),
      (v_t2, 'Definir ubicación exacta.', 4),
      (v_t2, 'Revisar visibilidad desde la calle.', 5),
      (v_t2, 'Definir materiales.', 6),
      (v_t2, 'Confirmar si tendrá iluminación.', 7),
      (v_t2, 'Verificar alimentación eléctrica necesaria.', 8),
      (v_t2, 'Confirmar proveedor.', 9),
      (v_t2, 'Solicitar o revisar presupuesto.', 10),
      (v_t2, 'Confirmar si está encargado.', 11),
      (v_t2, 'Confirmar cuánto está pagado.', 12),
      (v_t2, 'Registrar saldo pendiente.', 13),
      (v_t2, 'Confirmar fecha de fabricación.', 14),
      (v_t2, 'Confirmar fecha de instalación.', 15),
      (v_t2, 'Coordinar instalación con electricidad si corresponde.', 16),
      (v_t2, 'Instalar el cartel.', 17),
      (v_t2, 'Probar iluminación.', 18),
      (v_t2, 'Registrar fotografías.', 19),
      (v_t2, 'Aprobar instalación final.', 20);

    INSERT INTO public.task_tags (task_id, tag_id) VALUES 
      (v_t2, v_tag_apertura), (v_t2, v_tag_obra), (v_t2, v_tag_carteleria), (v_t2, v_tag_terceros)
      ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- TAREA 3: FINALIZAR LA BARRA
  -- ============================================================================
  SELECT id INTO v_t3 FROM public.tasks WHERE title = 'Finalizar la barra' AND area_id = v_area_barra_cocina LIMIT 1;
  IF v_t3 IS NULL THEN
    INSERT INTO public.tasks (
      title, description, area_id, priority, status, progress_percentage, is_progress_manual, is_demo, created_by
    ) VALUES (
      'Finalizar la barra',
      'Completar la construcción y terminación de la barra, coordinando obra, plomería, electricidad y colocación de equipamiento.',
      v_area_barra_cocina, 'critica', 'pendiente', 0, false, false, v_admin_id
    ) RETURNING id INTO v_t3;

    INSERT INTO public.subtasks (task_id, title, display_order) VALUES
      (v_t3, 'Confirmar diseño y medidas finales.', 1),
      (v_t3, 'Confirmar distribución de trabajo.', 2),
      (v_t3, 'Definir ubicación de bacha y grifería.', 3),
      (v_t3, 'Definir ubicación de comandera.', 4),
      (v_t3, 'Definir ubicación de máquina de café.', 5),
      (v_t3, 'Definir ubicación de tomas eléctricos.', 6),
      (v_t3, 'Definir pasadas de agua y desagüe.', 7),
      (v_t3, 'Confirmar materiales disponibles.', 8),
      (v_t3, 'Identificar materiales faltantes.', 9),
      (v_t3, 'Ejecutar estructura de la barra.', 10),
      (v_t3, 'Completar revestimientos.', 11),
      (v_t3, 'Completar mesada.', 12),
      (v_t3, 'Coordinar trabajos de plomería.', 13),
      (v_t3, 'Coordinar trabajos eléctricos.', 14),
      (v_t3, 'Verificar espacio y ventilación de equipos.', 15),
      (v_t3, 'Revisar terminaciones.', 16),
      (v_t3, 'Limpiar el sector.', 17),
      (v_t3, 'Probar todos los servicios.', 18),
      (v_t3, 'Aprobar la barra para uso operativo.', 19);

    INSERT INTO public.task_tags (task_id, tag_id) VALUES 
      (v_t3, v_tag_apertura), (v_t3, v_tag_obra), (v_t3, v_tag_barra), (v_t3, v_tag_bloqueante)
      ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- TAREA 4: REALIZAR PLOMERÍA DE LA BARRA
  -- ============================================================================
  SELECT id INTO v_t4 FROM public.tasks WHERE title = 'Realizar plomería de la barra' AND area_id = v_area_plom LIMIT 1;
  IF v_t4 IS NULL THEN
    INSERT INTO public.tasks (
      title, description, area_id, priority, status, progress_percentage, is_progress_manual, is_demo, created_by
    ) VALUES (
      'Realizar plomería de la barra',
      'Coordinar y ejecutar todas las conexiones de agua y desagüe necesarias en la barra.',
      v_area_plom, 'critica', 'pendiente', 0, false, false, v_admin_id
    ) RETURNING id INTO v_t4;

    INSERT INTO public.subtasks (task_id, title, display_order) VALUES
      (v_t4, 'Confirmar ubicación de la bacha.', 1),
      (v_t4, 'Confirmar ubicación de la grifería.', 2),
      (v_t4, 'Definir recorrido de agua.', 3),
      (v_t4, 'Definir recorrido del desagüe.', 4),
      (v_t4, 'Verificar presión de agua.', 5),
      (v_t4, 'Verificar diámetro y pendiente del desagüe.', 6),
      (v_t4, 'Confirmar necesidades de la máquina de café.', 7),
      (v_t4, 'Confirmar si otros equipos necesitan conexión de agua.', 8),
      (v_t4, 'Solicitar o revisar presupuesto del plomero.', 9),
      (v_t4, 'Confirmar contratación.', 10),
      (v_t4, 'Confirmar estado del pago.', 11),
      (v_t4, 'Definir fecha de ejecución.', 12),
      (v_t4, 'Realizar instalación.', 13),
      (v_t4, 'Probar entrada de agua.', 14),
      (v_t4, 'Probar desagüe.', 15),
      (v_t4, 'Revisar pérdidas.', 16),
      (v_t4, 'Corregir filtraciones si existieran.', 17),
      (v_t4, 'Registrar evidencia.', 18),
      (v_t4, 'Aprobar instalación.', 19);

    INSERT INTO public.task_tags (task_id, tag_id) VALUES 
      (v_t4, v_tag_apertura), (v_t4, v_tag_plomeria), (v_t4, v_tag_barra), (v_t4, v_tag_terceros), (v_t4, v_tag_bloqueante)
      ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- TAREA 5: REALIZAR INSTALACIÓN ELÉCTRICA DE LA BARRA
  -- ============================================================================
  SELECT id INTO v_t5 FROM public.tasks WHERE title = 'Realizar instalación eléctrica de la barra' AND area_id = v_area_elec LIMIT 1;
  IF v_t5 IS NULL THEN
    INSERT INTO public.tasks (
      title, description, area_id, priority, status, progress_percentage, is_progress_manual, is_demo, created_by
    ) VALUES (
      'Realizar instalación eléctrica de la barra',
      'Llevar y adecuar la instalación eléctrica de la barra para la comandera, la máquina de café y el resto del equipamiento previsto.',
      v_area_elec, 'critica', 'pendiente', 0, false, false, v_admin_id
    ) RETURNING id INTO v_t5;

    INSERT INTO public.subtasks (task_id, title, display_order) VALUES
      (v_t5, 'Elaborar listado de equipos que funcionarán en la barra.', 1),
      (v_t5, 'Registrar potencia y tensión requerida por cada equipo.', 2),
      (v_t5, 'Confirmar ubicación de la comandera.', 3),
      (v_t5, 'Confirmar ubicación de la máquina de café.', 4),
      (v_t5, 'Definir cantidad y posición de tomacorrientes.', 5),
      (v_t5, 'Determinar si se necesitan circuitos exclusivos.', 6),
      (v_t5, 'Verificar capacidad del tablero.', 7),
      (v_t5, 'Verificar térmicas y disyuntor.', 8),
      (v_t5, 'Verificar puesta a tierra.', 9),
      (v_t5, 'Definir canalización y recorrido del cableado.', 10),
      (v_t5, 'Solicitar o revisar presupuesto del electricista.', 11),
      (v_t5, 'Confirmar contratación.', 12),
      (v_t5, 'Confirmar estado de pago.', 13),
      (v_t5, 'Definir fecha de ejecución.', 14),
      (v_t5, 'Llevar alimentación eléctrica a la comandera.', 15),
      (v_t5, 'Llevar alimentación eléctrica a la máquina de café.', 16),
      (v_t5, 'Instalar tomas adicionales requeridos.', 17),
      (v_t5, 'Identificar cada circuito.', 18),
      (v_t5, 'Probar todos los tomacorrientes.', 19),
      (v_t5, 'Probar los equipos conectados.', 20),
      (v_t5, 'Registrar evidencia.', 21),
      (v_t5, 'Aprobar la instalación.', 22);

    INSERT INTO public.task_tags (task_id, tag_id) VALUES 
      (v_t5, v_tag_apertura), (v_t5, v_tag_electricidad), (v_t5, v_tag_barra), (v_t5, v_tag_bloqueante), (v_t5, v_tag_terceros)
      ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- TAREA 6: RELEVAR Y RESOLVER EL FRÍO PARA HAMBURGUESAS
  -- ============================================================================
  SELECT id INTO v_t6 FROM public.tasks WHERE title = 'Relevar y resolver el frío para hamburguesas' AND area_id = v_area_equip LIMIT 1;
  IF v_t6 IS NULL THEN
    INSERT INTO public.tasks (
      title, description, area_id, priority, status, progress_percentage, is_progress_manual, is_demo, created_by
    ) VALUES (
      'Relevar y resolver el frío para hamburguesas',
      'Determinar la capacidad de frío necesaria para almacenar hamburguesas y verificar qué freezers o equipos están disponibles, cuáles funcionan y qué falta comprar o reparar.',
      v_area_equip, 'critica', 'pendiente', 0, false, false, v_admin_id
    ) RETURNING id INTO v_t6;

    INSERT INTO public.subtasks (task_id, title, display_order) VALUES
      (v_t6, 'Definir stock inicial esperado de hamburguesas.', 1),
      (v_t6, 'Definir stock mínimo operativo.', 2),
      (v_t6, 'Calcular capacidad de almacenamiento necesaria.', 3),
      (v_t6, 'Relevar freezers disponibles.', 4),
      (v_t6, 'Registrar marca, modelo y capacidad de cada equipo.', 5),
      (v_t6, 'Verificar qué equipos son propios.', 6),
      (v_t6, 'Verificar qué equipos están instalados.', 7),
      (v_t6, 'Verificar cuáles funcionan.', 8),
      (v_t6, 'Medir temperatura real de funcionamiento.', 9),
      (v_t6, 'Identificar equipos que necesitan reparación.', 10),
      (v_t6, 'Determinar capacidad disponible total.', 11),
      (v_t6, 'Comparar capacidad disponible contra capacidad necesaria.', 12),
      (v_t6, 'Definir cuántos equipos faltan.', 13),
      (v_t6, 'Solicitar presupuestos si se necesitan compras.', 14),
      (v_t6, 'Definir ubicación de cada freezer.', 15),
      (v_t6, 'Verificar alimentación eléctrica.', 16),
      (v_t6, 'Verificar ventilación y espacio.', 17),
      (v_t6, 'Instalar o ubicar los equipos.', 18),
      (v_t6, 'Realizar prueba de funcionamiento.', 19),
      (v_t6, 'Registrar temperaturas.', 20),
      (v_t6, 'Definir procedimiento de control diario.', 21),
      (v_t6, 'Aprobar capacidad de frío para apertura.', 22);

    INSERT INTO public.task_tags (task_id, tag_id) VALUES 
      (v_t6, v_tag_apertura), (v_t6, v_tag_cocina), (v_t6, v_tag_equipamiento), (v_t6, v_tag_frio), (v_t6, v_tag_compras), (v_t6, v_tag_bloqueante)
      ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- TAREA 7: RELEVAR Y RESOLVER EQUIPAMIENTO PARA PIZZA EN CONO
  -- ============================================================================
  SELECT id INTO v_t7 FROM public.tasks WHERE title = 'Relevar y resolver equipamiento para pizza en cono' AND area_id = v_area_equip LIMIT 1;
  IF v_t7 IS NULL THEN
    INSERT INTO public.tasks (
      title, description, area_id, priority, status, progress_percentage, is_progress_manual, is_demo, created_by
    ) VALUES (
      'Relevar y resolver equipamiento para pizza en cono',
      'Determinar qué equipamiento y hornos se necesitan para producir pizza en cono, qué equipos ya existen y cuáles faltan comprar, instalar o probar.',
      v_area_equip, 'critica', 'pendiente', 0, false, false, v_admin_id
    ) RETURNING id INTO v_t7;

    INSERT INTO public.subtasks (task_id, title, display_order) VALUES
      (v_t7, 'Definir el proceso completo de elaboración.', 1),
      (v_t7, 'Confirmar volumen estimado de producción.', 2),
      (v_t7, 'Identificar el horno o los hornos requeridos.', 3),
      (v_t7, 'Confirmar cantidad necesaria.', 4),
      (v_t7, 'Registrar especificaciones técnicas.', 5),
      (v_t7, 'Confirmar temperatura de trabajo.', 6),
      (v_t7, 'Confirmar tiempo de cocción.', 7),
      (v_t7, 'Relevar los equipos ya disponibles.', 8),
      (v_t7, 'Verificar estado de los equipos.', 9),
      (v_t7, 'Identificar accesorios y moldes disponibles.', 10),
      (v_t7, 'Identificar accesorios y moldes faltantes.', 11),
      (v_t7, 'Determinar qué equipos deben comprarse.', 12),
      (v_t7, 'Solicitar presupuestos.', 13),
      (v_t7, 'Verificar medidas y ubicación.', 14),
      (v_t7, 'Verificar consumo eléctrico o de gas.', 15),
      (v_t7, 'Confirmar compatibilidad con las instalaciones del local.', 16),
      (v_t7, 'Comprar o reparar lo necesario.', 17),
      (v_t7, 'Instalar los equipos.', 18),
      (v_t7, 'Realizar una prueba de producción.', 19),
      (v_t7, 'Medir tiempos reales.', 20),
      (v_t7, 'Revisar calidad del producto.', 21),
      (v_t7, 'Aprobar la estación de pizza en cono.', 22);

    INSERT INTO public.task_tags (task_id, tag_id) VALUES 
      (v_t7, v_tag_apertura), (v_t7, v_tag_cocina), (v_t7, v_tag_equipamiento), (v_t7, v_tag_hornos), (v_t7, v_tag_compras), (v_t7, v_tag_bloqueante)
      ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- TAREA 8: FINALIZAR LOS PISOS DEL LOCAL
  -- ============================================================================
  SELECT id INTO v_t8 FROM public.tasks WHERE title = 'Finalizar los pisos del local' AND area_id = v_area_obra LIMIT 1;
  IF v_t8 IS NULL THEN
    INSERT INTO public.tasks (
      title, description, area_id, priority, status, progress_percentage, is_progress_manual, is_demo, created_by
    ) VALUES (
      'Finalizar los pisos del local',
      'Relevar y completar todos los trabajos pendientes de pisos en salón, cocina, barra y sectores operativos.',
      v_area_obra, 'alta', 'pendiente', 0, false, false, v_admin_id
    ) RETURNING id INTO v_t8;

    INSERT INTO public.subtasks (task_id, title, display_order) VALUES
      (v_t8, 'Identificar sectores pendientes.', 1),
      (v_t8, 'Medir superficies.', 2),
      (v_t8, 'Definir trabajos necesarios en cada sector.', 3),
      (v_t8, 'Verificar materiales disponibles.', 4),
      (v_t8, 'Identificar materiales faltantes.', 5),
      (v_t8, 'Definir qué trabajos realizará el equipo propio.', 6),
      (v_t8, 'Definir qué trabajos requieren terceros.', 7),
      (v_t8, 'Establecer orden de ejecución.', 8),
      (v_t8, 'Reparar o nivelar superficies.', 9),
      (v_t8, 'Colocar o terminar pisos.', 10),
      (v_t8, 'Completar juntas y terminaciones.', 11),
      (v_t8, 'Verificar que no existan desniveles peligrosos.', 12),
      (v_t8, 'Limpiar los sectores.', 13),
      (v_t8, 'Registrar evidencia.', 14),
      (v_t8, 'Aprobar el resultado.', 15);

    INSERT INTO public.task_tags (task_id, tag_id) VALUES 
      (v_t8, v_tag_apertura), (v_t8, v_tag_obra), (v_t8, v_tag_pisos)
      ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- TAREA 9: RELEVAR TODAS LAS OBRAS A CARGO DEL EQUIPO PROPIO
  -- ============================================================================
  SELECT id INTO v_t9 FROM public.tasks WHERE title = 'Relevar todas las obras a cargo del equipo propio' AND area_id = v_area_obra LIMIT 1;
  IF v_t9 IS NULL THEN
    INSERT INTO public.tasks (
      title, description, area_id, priority, status, progress_percentage, is_progress_manual, is_demo, created_by
    ) VALUES (
      'Relevar todas las obras a cargo del equipo propio',
      'Crear un inventario completo de trabajos que serán realizados directamente por el equipo de Punto Burger y organizar su ejecución.',
      v_area_obra, 'alta', 'pendiente', 0, false, false, v_admin_id
    ) RETURNING id INTO v_t9;

    INSERT INTO public.subtasks (task_id, title, display_order) VALUES
      (v_t9, 'Listar trabajos de pisos.', 1),
      (v_t9, 'Listar trabajos de barra.', 2),
      (v_t9, 'Identificar otras terminaciones internas pendientes.', 3),
      (v_t9, 'Definir responsable por cada trabajo.', 4),
      (v_t9, 'Registrar materiales disponibles.', 5),
      (v_t9, 'Registrar materiales faltantes.', 6),
      (v_t9, 'Estimar duración de cada trabajo.', 7),
      (v_t9, 'Definir orden de ejecución.', 8),
      (v_t9, 'Identificar dependencias con terceros.', 9),
      (v_t9, 'Registrar avance diario.', 10),
      (v_t9, 'Adjuntar evidencia de cada trabajo.', 11),
      (v_t9, 'Aprobar cada intervención.', 12);

    INSERT INTO public.task_tags (task_id, tag_id) VALUES 
      (v_t9, v_tag_apertura), (v_t9, v_tag_obra), (v_t9, v_tag_equipo_interno)
      ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- TAREA 10: COORDINAR TODAS LAS OBRAS DE TERCEROS
  -- ============================================================================
  SELECT id INTO v_t10 FROM public.tasks WHERE title = 'Coordinar todas las obras de terceros' AND area_id = v_area_prov LIMIT 1;
  IF v_t10 IS NULL THEN
    INSERT INTO public.tasks (
      title, description, area_id, priority, status, progress_percentage, is_progress_manual, is_demo, created_by
    ) VALUES (
      'Coordinar todas las obras de terceros',
      'Centralizar proveedores, presupuestos, pagos, fechas comprometidas y resultados de todos los trabajos realizados por terceros.',
      v_area_prov, 'alta', 'pendiente', 0, false, false, v_admin_id
    ) RETURNING id INTO v_t10;

    INSERT INTO public.subtasks (task_id, title, display_order) VALUES
      (v_t10, 'Listar todos los terceros contratados o por contratar.', 1),
      (v_t10, 'Incluir Durlock.', 2),
      (v_t10, 'Incluir cartel.', 3),
      (v_t10, 'Incluir plomería.', 4),
      (v_t10, 'Incluir electricidad.', 5),
      (v_t10, 'Registrar nombre y contacto de cada proveedor.', 6),
      (v_t10, 'Registrar trabajo contratado.', 7),
      (v_t10, 'Registrar presupuesto.', 8),
      (v_t10, 'Registrar monto pagado.', 9),
      (v_t10, 'Registrar saldo pendiente.', 10),
      (v_t10, 'Registrar fecha de inicio.', 11),
      (v_t10, 'Registrar fecha prometida de finalización.', 12),
      (v_t10, 'Identificar trabajos bloqueados.', 13),
      (v_t10, 'Confirmar asistencia antes de cada visita.', 14),
      (v_t10, 'Registrar avances.', 15),
      (v_t10, 'Registrar incumplimientos o reprogramaciones.', 16),
      (v_t10, 'Verificar resultado final.', 17),
      (v_t10, 'Aprobar cada trabajo antes del pago final.', 18);

    INSERT INTO public.task_tags (task_id, tag_id) VALUES 
      (v_t10, v_tag_apertura), (v_t10, v_tag_obra), (v_t10, v_tag_terceros), (v_t10, v_tag_coordinacion)
      ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- TAREA 11: CREAR MATRIZ DE EQUIPAMIENTO DISPONIBLE Y FALTANTE
  -- ============================================================================
  SELECT id INTO v_t11 FROM public.tasks WHERE title = 'Crear matriz de equipamiento disponible y faltante' AND area_id = v_area_compras LIMIT 1;
  IF v_t11 IS NULL THEN
    INSERT INTO public.tasks (
      title, description, area_id, priority, status, progress_percentage, is_progress_manual, is_demo, created_by
    ) VALUES (
      'Crear matriz de equipamiento disponible y faltante',
      'Registrar qué equipamiento necesita Punto Burger, qué hay disponible, qué funciona, qué debe repararse y qué debe comprarse.',
      v_area_compras, 'alta', 'pendiente', 0, false, false, v_admin_id
    ) RETURNING id INTO v_t11;

    INSERT INTO public.subtasks (task_id, title, display_order) VALUES
      (v_t11, 'Relevar equipamiento de hamburguesas.', 1),
      (v_t11, 'Relevar freezers.', 2),
      (v_t11, 'Relevar heladeras.', 3),
      (v_t11, 'Relevar equipamiento de pizza en cono.', 4),
      (v_t11, 'Relevar hornos.', 5),
      (v_t11, 'Relevar equipamiento de barra.', 6),
      (v_t11, 'Relevar comandera.', 7),
      (v_t11, 'Relevar máquina de café.', 8),
      (v_t11, 'Registrar cantidad necesaria.', 9),
      (v_t11, 'Registrar cantidad disponible.', 10),
      (v_t11, 'Registrar estado de cada equipo.', 11),
      (v_t11, 'Identificar faltantes.', 12),
      (v_t11, 'Identificar reparaciones.', 13),
      (v_t11, 'Priorizar compras bloqueantes.', 14),
      (v_t11, 'Solicitar presupuestos.', 15),
      (v_t11, 'Registrar proveedor elegido.', 16),
      (v_t11, 'Registrar fecha de entrega.', 17),
      (v_t11, 'Registrar instalación.', 18),
      (v_t11, 'Registrar prueba de funcionamiento.', 19);

    INSERT INTO public.task_tags (task_id, tag_id) VALUES 
      (v_t11, v_tag_apertura), (v_t11, v_tag_equipamiento), (v_t11, v_tag_compras), (v_t11, v_tag_inventario)
      ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- TAREA 12: REALIZAR PRUEBA OPERATIVA INTEGRAL DE LA BARRA
  -- ============================================================================
  SELECT id INTO v_t12 FROM public.tasks WHERE title = 'Realizar prueba operativa integral de la barra' AND area_id = v_area_barra_cocina LIMIT 1;
  IF v_t12 IS NULL THEN
    INSERT INTO public.tasks (
      title, description, area_id, priority, status, progress_percentage, is_progress_manual, is_demo, created_by
    ) VALUES (
      'Realizar prueba operativa integral de la barra',
      'Realizar una prueba real de trabajo en la barra una vez terminadas la obra, plomería y electricidad.',
      v_area_barra_cocina, 'media', 'pendiente', 0, false, false, v_admin_id
    ) RETURNING id INTO v_t12;

    INSERT INTO public.subtasks (task_id, title, display_order) VALUES
      (v_t12, 'Encender comandera.', 1),
      (v_t12, 'Encender máquina de café.', 2),
      (v_t12, 'Probar funcionamiento simultáneo.', 3),
      (v_t12, 'Probar abastecimiento de agua.', 4),
      (v_t12, 'Probar desagües.', 5),
      (v_t12, 'Comprobar disposición de herramientas.', 6),
      (v_t12, 'Simular preparación de pedidos.', 7),
      (v_t12, 'Detectar interferencias o falta de espacio.', 8),
      (v_t12, 'Registrar problemas.', 9),
      (v_t12, 'Corregir problemas encontrados.', 10),
      (v_t12, 'Repetir prueba.', 11),
      (v_t12, 'Aprobar operación de barra.', 12);

    INSERT INTO public.task_tags (task_id, tag_id) VALUES 
      (v_t12, v_tag_apertura), (v_t12, v_tag_barra), (v_t12, v_tag_prueba_operativa)
      ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- TAREA 13: REALIZAR PRUEBA OPERATIVA DE COCINA
  -- ============================================================================
  SELECT id INTO v_t13 FROM public.tasks WHERE title = 'Realizar prueba operativa de cocina' AND area_id = v_area_barra_cocina LIMIT 1;
  IF v_t13 IS NULL THEN
    INSERT INTO public.tasks (
      title, description, area_id, priority, status, progress_percentage, is_progress_manual, is_demo, created_by
    ) VALUES (
      'Realizar prueba operativa de cocina',
      'Simular una jornada de producción utilizando frío, hamburguesas y pizza en cono para comprobar capacidad y organización.',
      v_area_barra_cocina, 'media', 'pendiente', 0, false, false, v_admin_id
    ) RETURNING id INTO v_t13;

    INSERT INTO public.subtasks (task_id, title, display_order) VALUES
      (v_t13, 'Verificar temperaturas iniciales.', 1),
      (v_t13, 'Preparar una tanda de hamburguesas.', 2),
      (v_t13, 'Preparar una tanda de pizza en cono.', 3),
      (v_t13, 'Medir tiempos de producción.', 4),
      (v_t13, 'Detectar cruces entre puestos.', 5),
      (v_t13, 'Verificar capacidad eléctrica.', 6),
      (v_t13, 'Verificar recuperación de temperatura de los equipos.', 7),
      (v_t13, 'Registrar faltantes.', 8),
      (v_t13, 'Corregir distribución o procedimiento.', 9),
      (v_t13, 'Repetir la prueba si corresponde.', 10),
      (v_t13, 'Aprobar cocina para apertura.', 11);

    INSERT INTO public.task_tags (task_id, tag_id) VALUES 
      (v_t13, v_tag_apertura), (v_t13, v_tag_cocina), (v_t13, v_tag_prueba_operativa)
      ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- DEPENDENCIAS DE TAREAS (task_dependencies)
  -- ============================================================================

  -- 1. "Finalizar la barra" (v_t3) depende de:
  --    - "Realizar plomería de la barra" (v_t4)
  --    - "Realizar instalación eléctrica de la barra" (v_t5)
  IF v_t3 IS NOT NULL AND v_t4 IS NOT NULL THEN
    INSERT INTO public.task_dependencies (task_id, blocking_task_id) VALUES (v_t3, v_t4) ON CONFLICT DO NOTHING;
  END IF;
  IF v_t3 IS NOT NULL AND v_t5 IS NOT NULL THEN
    INSERT INTO public.task_dependencies (task_id, blocking_task_id) VALUES (v_t3, v_t5) ON CONFLICT DO NOTHING;
  END IF;

  -- 2. "Realizar prueba operativa integral de la barra" (v_t12) depende de:
  --    - "Finalizar la barra" (v_t3)
  --    - "Realizar plomería de la barra" (v_t4)
  --    - "Realizar instalación eléctrica de la barra" (v_t5)
  IF v_t12 IS NOT NULL AND v_t3 IS NOT NULL THEN
    INSERT INTO public.task_dependencies (task_id, blocking_task_id) VALUES (v_t12, v_t3) ON CONFLICT DO NOTHING;
  END IF;
  IF v_t12 IS NOT NULL AND v_t4 IS NOT NULL THEN
    INSERT INTO public.task_dependencies (task_id, blocking_task_id) VALUES (v_t12, v_t4) ON CONFLICT DO NOTHING;
  END IF;
  IF v_t12 IS NOT NULL AND v_t5 IS NOT NULL THEN
    INSERT INTO public.task_dependencies (task_id, blocking_task_id) VALUES (v_t12, v_t5) ON CONFLICT DO NOTHING;
  END IF;

  -- 3. "Realizar prueba operativa de cocina" (v_t13) depende de:
  --    - "Relevar y resolver el frío para hamburguesas" (v_t6)
  --    - "Relevar y resolver equipamiento para pizza en cono" (v_t7)
  IF v_t13 IS NOT NULL AND v_t6 IS NOT NULL THEN
    INSERT INTO public.task_dependencies (task_id, blocking_task_id) VALUES (v_t13, v_t6) ON CONFLICT DO NOTHING;
  END IF;
  IF v_t13 IS NOT NULL AND v_t7 IS NOT NULL THEN
    INSERT INTO public.task_dependencies (task_id, blocking_task_id) VALUES (v_t13, v_t7) ON CONFLICT DO NOTHING;
  END IF;

  -- 4. "Finalizar los pisos del local" (v_t8) coordinado / dependiente de:
  --    - "Definir y ejecutar trabajos de Durlock" (v_t1)
  --    - "Finalizar la barra" (v_t3)
  --    - "Realizar plomería de la barra" (v_t4)
  --    - "Realizar instalación eléctrica de la barra" (v_t5)
  IF v_t8 IS NOT NULL AND v_t1 IS NOT NULL THEN
    INSERT INTO public.task_dependencies (task_id, blocking_task_id) VALUES (v_t8, v_t1) ON CONFLICT DO NOTHING;
  END IF;
  IF v_t8 IS NOT NULL AND v_t3 IS NOT NULL THEN
    INSERT INTO public.task_dependencies (task_id, blocking_task_id) VALUES (v_t8, v_t3) ON CONFLICT DO NOTHING;
  END IF;
  IF v_t8 IS NOT NULL AND v_t4 IS NOT NULL THEN
    INSERT INTO public.task_dependencies (task_id, blocking_task_id) VALUES (v_t8, v_t4) ON CONFLICT DO NOTHING;
  END IF;
  IF v_t8 IS NOT NULL AND v_t5 IS NOT NULL THEN
    INSERT INTO public.task_dependencies (task_id, blocking_task_id) VALUES (v_t8, v_t5) ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'SUCCESS_OPERATIONAL_TASKS_LOADED';
END $$;
