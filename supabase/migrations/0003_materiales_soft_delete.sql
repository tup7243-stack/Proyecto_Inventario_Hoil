-- Migración 0003: eliminación lógica de materiales con trazabilidad

BEGIN;

ALTER TABLE public.materiales
  ADD COLUMN activo BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN eliminado_at TIMESTAMPTZ;

ALTER TABLE public.movimientos
  DROP CONSTRAINT movimientos_tipo_check,
  DROP CONSTRAINT movimientos_cantidad_check;

ALTER TABLE public.movimientos
  ADD CONSTRAINT movimientos_tipo_check
    CHECK (
      tipo IN (
        'entrada_stock',
        'salida_prestamo',
        'entrada_devolucion',
        'consumo',
        'eliminacion_material'
      )
    ),
  ADD CONSTRAINT movimientos_cantidad_check
    CHECK (
      (tipo = 'eliminacion_material' AND cantidad >= 0)
      OR
      (tipo <> 'eliminacion_material' AND cantidad > 0)
    );

CREATE INDEX idx_materiales_activo ON materiales(activo);

COMMIT;
