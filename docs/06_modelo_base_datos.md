# Modelo de Base de Datos (Supabase / PostgreSQL)

## Nota sobre Supabase Auth

Supabase gestiona `auth.users` automáticamente. Nosotros creamos una tabla `public.perfiles` vinculada por `id` a `auth.users.id`. Así separamos la autenticación (manejada por Supabase) de los datos de dominio (nuestra app).

---

## Esquema completo

### `public.perfiles`
Vinculada 1:1 con `auth.users`. Extiende los datos del usuario.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK, FK → auth.users.id | Mismo ID que Supabase Auth |
| `matricula` | TEXT | UNIQUE, NOT NULL | Matrícula escolar (ej. "7433") |
| `nombre` | TEXT | NOT NULL | Nombre completo |
| `rol` | TEXT | NOT NULL, CHECK IN ('admin', 'representante') | Rol del usuario |
| `equipo_id` | UUID | FK → equipos.id, NULLABLE | Solo para representantes |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

**RLS:** Admin ve todos los perfiles. Representante solo ve el suyo.

---

### `public.equipos`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `nombre` | TEXT | NOT NULL | Ej. "Equipo 1 - Refrigeración" |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

**RLS:** Admin ve/edita todos. Representante solo ve su propio equipo.

---

### `public.materiales`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK | |
| `nombre` | TEXT | NOT NULL | |
| `categoria` | TEXT | NOT NULL, CHECK IN ('herramienta_manual', 'consumible', 'equipo_proteccion', 'equipo_medicion') | |
| `cantidad_total` | INTEGER | NOT NULL, DEFAULT 0, CHECK >= 0 | Stock físico total |
| `stock_minimo` | INTEGER | NOT NULL, DEFAULT 0, CHECK >= 0 | Umbral para alerta |
| `estado` | TEXT | NOT NULL, DEFAULT 'bueno', CHECK IN ('bueno', 'desgastado', 'dañado') | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

**RLS:** Admin gestiona todo. Representante solo SELECT.

**cantidad_disponible NO se almacena.** Se calcula:
```sql
cantidad_total - COALESCE((
  SELECT SUM(p.cantidad_prestada)
  FROM prestamos p
  WHERE p.material_id = materiales.id AND p.estado = 'activo'
), 0)
```

---

### `public.movimientos`
Bitácora universal. **Nunca se borra ni se edita.** Solo INSERT.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK | |
| `tipo` | TEXT | NOT NULL, CHECK IN ('entrada_stock', 'salida_prestamo', 'entrada_devolucion', 'consumo') | |
| `material_id` | UUID | FK → materiales.id, NOT NULL | |
| `cantidad` | INTEGER | NOT NULL, CHECK > 0 | Cantidad movida |
| `equipo_id` | UUID | FK → equipos.id, NULLABLE | Nulo si es entrada de stock |
| `usuario_id` | UUID | FK → perfiles.id, NOT NULL | Quién hizo el movimiento |
| `prestamo_id` | UUID | FK → prestamos.id, NULLABLE | Vincula devolución con préstamo |
| `comentario` | TEXT | NULLABLE | Ej. "Se consumió durante práctica de soldadura" |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Marca de tiempo exacta |

**RLS:** Admin ve todos. Representante solo ve movimientos de su equipo (`equipo_id`).

---

### `public.prestamos`
Préstamos activos e históricos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | PK | |
| `equipo_id` | UUID | FK → equipos.id, NOT NULL | Equipo que pidió |
| `representante_id` | UUID | FK → perfiles.id, NOT NULL | Quién ejecutó el préstamo |
| `material_id` | UUID | FK → materiales.id, NOT NULL | |
| `cantidad_prestada` | INTEGER | NOT NULL, CHECK > 0 | |
| `cantidad_devuelta` | INTEGER | NOT NULL, DEFAULT 0, CHECK >= 0 | Se incrementa en devolución parcial |
| `estado` | TEXT | NOT NULL, DEFAULT 'activo', CHECK IN ('activo', 'devuelto') | |
| `movimiento_salida_id` | UUID | FK → movimientos.id, NULLABLE | Trazabilidad |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

**RLS:** Admin ve todos. Representante solo ve préstamos de su equipo.

---

## Diagrama Entidad-Relación

```
auth.users ──1:1── perfiles ──N:1── equipos
                    │                    │
                    │                    │
                    ▼                    ▼
              movimientos ◄─────── prestamos
                    │                    │
                    │                    │
                    ▼                    ▼
                materiales ◄─────────────┘
```

---

## Relaciones clave

| Relación | Tipo | Explicación |
|---|---|---|
| `auth.users` → `perfiles` | 1:1 | Cada usuario auth tiene un perfil de dominio |
| `perfiles` → `equipos` | N:1 | Varios representantes pertenecen a un equipo. Admin tiene `equipo_id = NULL` |
| `equipos` → `prestamos` | 1:N | Un equipo tiene muchos préstamos |
| `materiales` → `prestamos` | 1:N | Un material puede estar en muchos préstamos |
| `materiales` → `movimientos` | 1:N | Trazabilidad completa de cada material |
| `prestamos` → `movimientos` | 1:N | Un préstamo tiene movimientos asociados (salida, devolución) |

---

## Reglas de negocio en BD

1. **No prestar más de lo disponible:** Validar en la app y con un trigger o CHECK en `prestamos`.
2. **No devolver más de lo prestado:** `cantidad_devuelta <= cantidad_prestada`.
3. **Solo Representante puede pedir/devolver:** RLS + middleware en Next.js.
4. **Un Representante solo ve su equipo:** RLS policy filtra por `equipo_id`.
5. **Movimientos son inmutables:** Sin UPDATE ni DELETE sobre la tabla `movimientos`. Solo INSERT.
6. **Consumo no genera préstamo:** El tipo `consumo` en `movimientos` descuenta `cantidad_total` sin crear registro en `prestamos`.

---

## SQL de creación (migrations)

```sql
-- Enum types (opcional, usar TEXT con CHECK es más portable)
CREATE TYPE rol_usuario AS ENUM ('admin', 'representante');
CREATE TYPE categoria_material AS ENUM ('herramienta_manual', 'consumible', 'equipo_proteccion', 'equipo_medicion');
CREATE TYPE estado_material AS ENUM ('bueno', 'desgastado', 'dañado');
CREATE TYPE tipo_movimiento AS ENUM ('entrada_stock', 'salida_prestamo', 'entrada_devolucion', 'consumo');
CREATE TYPE estado_prestamo AS ENUM ('activo', 'devuelto');

-- Tablas principales
CREATE TABLE public.equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  matricula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'representante')),
  equipo_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- Índices para queries frecuentes
CREATE INDEX idx_movimientos_material ON movimientos(material_id);
CREATE INDEX idx_movimientos_equipo ON movimientos(equipo_id);
CREATE INDEX idx_movimientos_created ON movimientos(created_at);
CREATE INDEX idx_prestamos_equipo ON prestamos(equipo_id);
CREATE INDEX idx_prestamos_estado ON prestamos(estado);
CREATE INDEX idx_perfiles_rol ON perfiles(rol);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_equipos_updated BEFORE UPDATE ON equipos
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_perfiles_updated BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_materiales_updated BEFORE UPDATE ON materiales
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_prestamos_updated BEFORE UPDATE ON prestamos
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```
