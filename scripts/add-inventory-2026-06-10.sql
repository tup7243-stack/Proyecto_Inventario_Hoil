DO $$
DECLARE
  admin_id uuid;
  item record;
  material_id uuid;
  comment_text text;
BEGIN
  SELECT id INTO admin_id
  FROM auth.users
  WHERE lower(email) = 'tup7243@tecplayacar.edu.mx'
  LIMIT 1;

  IF admin_id IS NULL THEN
    SELECT id INTO admin_id
    FROM public.perfiles
    WHERE rol = 'admin'
    LIMIT 1;
  END IF;

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró usuario/perfil admin para registrar movimientos.';
  END IF;

  FOR item IN
    SELECT nombre, sum(cantidad)::int AS cantidad, categoria
    FROM (VALUES
      ('Niveleta', 4, 'herramienta_manual'),
      ('Prensas para avellanar', 4, 'herramienta_manual'),
      ('Chispero', 5, 'herramienta_manual'),
      ('Dobladora de tubería cobre', 2, 'herramienta_manual'),
      ('Llaves mixtas', 24, 'herramienta_manual'),
      ('Pelacables manual', 7, 'herramienta_manual'),
      ('Pinza de corte diagonal', 6, 'herramienta_manual'),
      ('Pinza electricista', 12, 'herramienta_manual'),
      ('Pinza de presión', 4, 'herramienta_manual'),
      ('Pinza de punta', 5, 'herramienta_manual'),
      ('Pinza mecánica', 7, 'herramienta_manual'),
      ('Avellanador', 4, 'herramienta_manual'),
      ('Desarmador de punta de cruz', 16, 'herramienta_manual'),
      ('Desarmador de punta plana', 19, 'herramienta_manual'),
      ('Expansor de golpe', 5, 'herramienta_manual'),
      ('Manómetro', 7, 'equipo_medicion'),
      ('Vacumetros marca supco', 1, 'equipo_medicion'),
      ('Navaja', 1, 'herramienta_manual'),
      ('Flexometro', 3, 'equipo_medicion'),
      ('Corta tubo chico', 6, 'herramienta_manual'),
      ('Corta tubo grande', 4, 'herramienta_manual'),
      ('Taladro alámbrico', 7, 'herramienta_manual'),
      ('Espátula', 13, 'herramienta_manual'),
      ('Tester', 4, 'equipo_medicion'),
      ('Pericas', 8, 'herramienta_manual'),
      ('Arco metálico para segueta', 2, 'herramienta_manual'),
      ('Serrucho', 1, 'herramienta_manual'),
      ('Remachadora tipo tijera', 5, 'herramienta_manual'),
      ('Pinza de presión hojalatero', 1, 'herramienta_manual'),
      ('Pinza de presión tipo C', 2, 'herramienta_manual'),
      ('Pinza de presión soldadora', 2, 'herramienta_manual'),
      ('Esmeril', 3, 'herramienta_manual'),
      ('Pica hielo', 9, 'herramienta_manual'),
      ('Martillo', 6, 'herramienta_manual'),
      ('Maso de goma', 6, 'herramienta_manual'),
      ('Marro', 3, 'herramienta_manual'),
      ('Escalera de 7 peldaños', 2, 'herramienta_manual'),
      ('Extensión eléctrica 220V', 4, 'herramienta_manual'),
      ('Extensión eléctrica 110V', 11, 'herramienta_manual'),
      ('Manguera de PVC para compresor de aire 10 mts', 4, 'herramienta_manual'),
      ('Compresor de aire lubricado de 50 litros', 1, 'herramienta_manual'),
      ('Bomba de vacío', 4, 'herramienta_manual'),
      ('Bomba de vacío', 4, 'herramienta_manual'),
      ('Cuerda de vida', 3, 'equipo_proteccion'),
      ('Amperímetro gancho digital', 7, 'equipo_medicion'),
      ('Sierra caladora', 3, 'herramienta_manual'),
      ('Esmeril de banco', 1, 'herramienta_manual'),
      ('Prensas de banco', 10, 'herramienta_manual')
    ) AS input(nombre, cantidad, categoria)
    GROUP BY nombre, categoria
  LOOP
    comment_text := 'Carga inventario físico 2026-06-10: ' || item.nombre;

    IF EXISTS (
      SELECT 1 FROM public.movimientos
      WHERE tipo = 'entrada_stock' AND comentario = comment_text
    ) THEN
      CONTINUE;
    END IF;

    SELECT id INTO material_id
    FROM public.materiales
    WHERE activo = true AND lower(trim(nombre)) = lower(trim(item.nombre))
    LIMIT 1;

    IF material_id IS NULL THEN
      INSERT INTO public.materiales(nombre, categoria, cantidad_total, stock_minimo, estado, activo)
      VALUES (item.nombre, item.categoria, item.cantidad, 1, 'bueno', true)
      RETURNING id INTO material_id;
    ELSE
      UPDATE public.materiales
      SET cantidad_total = cantidad_total + item.cantidad,
          estado = 'bueno'
      WHERE id = material_id;
    END IF;

    INSERT INTO public.movimientos(tipo, material_id, cantidad, usuario_id, comentario)
    VALUES ('entrada_stock', material_id, item.cantidad, admin_id, comment_text);
  END LOOP;
END $$;
