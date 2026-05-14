-- Migración 0002: Row Level Security (RLS)
-- Admin: acceso total a todas las tablas
-- Representante: acceso limitado a su propio equipo

BEGIN;

-- ============================================================
-- FUNCIONES AUXILIARES PARA RLS
-- ============================================================

-- Verifica si el usuario autenticado es admin
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid() AND rol = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Devuelve el equipo_id del usuario autenticado (NULL si es admin)
CREATE OR REPLACE FUNCTION public.mi_equipo_id()
RETURNS uuid
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT equipo_id FROM public.perfiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS: perfiles
-- ============================================================

-- Admin: acceso total
CREATE POLICY "Admin: full access perfiles"
  ON public.perfiles
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.es_admin())
  WITH CHECK (public.es_admin());

-- Representante: solo ve su propio perfil
CREATE POLICY "Representante: SELECT own perfil"
  ON public.perfiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ============================================================
-- POLÍTICAS: equipos
-- ============================================================

-- Admin: acceso total
CREATE POLICY "Admin: full access equipos"
  ON public.equipos
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.es_admin())
  WITH CHECK (public.es_admin());

-- Representante: solo ve su propio equipo
CREATE POLICY "Representante: SELECT own equipo"
  ON public.equipos
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (id = public.mi_equipo_id());

-- ============================================================
-- POLÍTICAS: materiales
-- ============================================================

-- Admin: acceso total
CREATE POLICY "Admin: full access materiales"
  ON public.materiales
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.es_admin())
  WITH CHECK (public.es_admin());

-- Representante: solo SELECT (lectura del catálogo)
CREATE POLICY "Representante: SELECT materiales"
  ON public.materiales
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- POLÍTICAS: prestamos
-- ============================================================

-- Admin: acceso total
CREATE POLICY "Admin: full access prestamos"
  ON public.prestamos
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.es_admin())
  WITH CHECK (public.es_admin());

-- Representante: SELECT solo préstamos de su equipo
CREATE POLICY "Representante: SELECT own team prestamos"
  ON public.prestamos
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (equipo_id = public.mi_equipo_id());

-- ============================================================
-- POLÍTICAS: movimientos
-- ============================================================

-- Admin: SELECT todos (las mutaciones van por Server Actions con service_role)
CREATE POLICY "Admin: SELECT all movimientos"
  ON public.movimientos
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (public.es_admin());

-- Representante: SELECT solo movimientos de su equipo
CREATE POLICY "Representante: SELECT own team movimientos"
  ON public.movimientos
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (equipo_id = public.mi_equipo_id());

-- Nota: INSERT/UPDATE/DELETE en movimientos y prestamos se hace
-- vía Server Actions con service_role, que bypassea RLS.

COMMIT;
