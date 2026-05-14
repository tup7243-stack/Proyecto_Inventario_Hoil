-- Migración 0001: Esquema completo de base de datos
-- Tablas: equipos, perfiles, materiales, prestamos, movimientos
-- Índices, triggers updated_at

BEGIN;

-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: equipos
-- ============================================================
CREATE TABLE public.equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLA: perfiles
-- Vinculada 1:1 con auth.users
-- ============================================================
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  matricula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'representante')),
  equipo_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLA: materiales
-- cantidad_disponible se calcula, NO se almacena
-- ============================================================
CREATE TABLE public.materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('herramienta_manual', 'consumible', 'equipo_proteccion', 'equipo_medicion')),
  cantidad_total INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_total >= 0),
  stock_minimo INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  estado TEXT NOT NULL DEFAULT 'bueno' CHECK (estado IN ('bueno', 'desgastado', 'dañado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLA: prestamos
-- Préstamos activos e históricos
-- ============================================================
CREATE TABLE public.prestamos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  representante_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materiales(id) ON DELETE RESTRICT,
  cantidad_prestada INTEGER NOT NULL CHECK (cantidad_prestada > 0),
  cantidad_devuelta INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_devuelta >= 0),
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'devuelto')),
  movimiento_salida_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLA: movimientos
-- Bitácora inmutable — solo INSERT, nunca UPDATE ni DELETE
-- ============================================================
CREATE TABLE public.movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada_stock', 'salida_prestamo', 'entrada_devolucion', 'consumo')),
  material_id UUID NOT NULL REFERENCES materiales(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  equipo_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  prestamo_id UUID REFERENCES prestamos(id) ON DELETE SET NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FK de prestamos.movimiento_salida_id → movimientos.id
-- ============================================================
ALTER TABLE public.prestamos
  ADD CONSTRAINT fk_prestamos_movimiento_salida
  FOREIGN KEY (movimiento_salida_id)
  REFERENCES public.movimientos(id)
  ON DELETE SET NULL;

-- ============================================================
-- ÍNDICES para queries frecuentes
-- ============================================================
CREATE INDEX idx_movimientos_material ON movimientos(material_id);
CREATE INDEX idx_movimientos_equipo ON movimientos(equipo_id);
CREATE INDEX idx_movimientos_created ON movimientos(created_at);
CREATE INDEX idx_movimientos_tipo ON movimientos(tipo);
CREATE INDEX idx_prestamos_equipo ON prestamos(equipo_id);
CREATE INDEX idx_prestamos_estado ON prestamos(estado);
CREATE INDEX idx_prestamos_material ON prestamos(material_id);
CREATE INDEX idx_perfiles_rol ON perfiles(rol);
CREATE INDEX idx_perfiles_equipo ON perfiles(equipo_id);
CREATE INDEX idx_materiales_categoria ON materiales(categoria);

-- ============================================================
-- FUNCIÓN: update_timestamp()
-- ============================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE TRIGGER trg_equipos_updated BEFORE UPDATE ON equipos
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_perfiles_updated BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_materiales_updated BEFORE UPDATE ON materiales
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_prestamos_updated BEFORE UPDATE ON prestamos
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

COMMIT;
