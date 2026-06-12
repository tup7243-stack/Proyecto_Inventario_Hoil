# Catálogo de Materiales (Taller de Refrigeración)

## Categorías

| Categoría | Descripción | Ejemplos |
|---|---|---|
| `herramienta_manual` | Herramientas de uso manual reutilizables | Pinza de corte, martillo, perica, cortatubos |
| `consumible` | Materiales que se gastan con el uso | Cilindro de propano, gas MAP, boquillas |
| `equipo_proteccion` | Equipo de seguridad personal | Guantes de seguridad, lentes, careta |
| `equipo_medicion` | Instrumentos de medición | Manómetros, termómetros, multímetros |

## Materiales iniciales (seed)

| # | Nombre | Categoría | Cantidad inicial | Stock mínimo | Estado |
|---|---|---|---|---|---|
| 1 | Pinza de corte | herramienta_manual | 5 | 2 | bueno |
| 2 | Martillo | herramienta_manual | 3 | 1 | bueno |
| 3 | Perica (Llave ajustable) | herramienta_manual | 4 | 1 | bueno |
| 4 | Boquilla para soldar | consumible | 10 | 3 | bueno |
| 5 | Cilindro de Propano | consumible | 4 | 1 | bueno |
| 6 | Gas MAP | consumible | 3 | 1 | bueno |
| 7 | Guantes de seguridad | equipo_proteccion | 8 | 2 | bueno |
| 8 | Manómetros | equipo_medicion | 2 | 1 | bueno |
| 9 | Cortatubos | herramienta_manual | 3 | 1 | bueno |
| 10 | Expansores de tubo | herramienta_manual | 3 | 1 | bueno |

## Atributos de cada material (tabla `materiales`)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `nombre` | TEXT | Nombre del material |
| `categoria` | TEXT | Categoría (ver tabla arriba) |
| `cantidad_total` | INTEGER | Stock físico total en el taller |
| `stock_minimo` | INTEGER | Umbral que dispara alerta de stock bajo |
| `estado` | TEXT | `bueno`, `desgastado`, `dañado` |
| `imagen_url` | TEXT | URL pública opcional de la imagen guía del material |
| `imagen_path` | TEXT | Ruta del archivo en Supabase Storage para reemplazo/eliminación |
| `created_at` | TIMESTAMPTZ | Fecha de creación del registro |
| `updated_at` | TIMESTAMPTZ | Fecha de última modificación |

> **`cantidad_disponible`** se calcula en tiempo real: `cantidad_total - SUM(prestamos activos.cantidad_prestada)`.
> No se almacena como columna para evitar inconsistencias.

## Funciones clave sobre materiales

### Añadir material al stock (Admin)
- El Admin ingresa la cantidad a añadir para un material existente.
- Se crea un registro en `movimientos` con tipo `entrada_stock`.
- Se incrementa `materiales.cantidad_total`.
- Aplica también al crear un material nuevo (la cantidad inicial es la primera "entrada").

### Registrar consumo (Representante)
- El Representante reporta que un material de tipo `consumible` se agotó o se consumió parcialmente.
- Ingresa la cantidad consumida.
- Se crea un registro en `movimientos` con tipo `consumo`.
- Se decrementa `materiales.cantidad_total`.
- **No se crea un préstamo** porque el consumo no es un préstamo retornable. Es material que se gastó.

### Editar material (Admin)
- El Admin puede modificar `nombre`, `categoria`, `stock_minimo` y `estado`.
- `cantidad_total` solo se modifica a través de movimientos (entrada_stock, consumo), nunca editando directamente el campo.
- La imagen guía se administra por separado para reducir ruido en la tarjeta del material.

### Imagen guía (Admin)
- Cada material puede tener una imagen opcional para ayudar a identificarlo visualmente.
- Las imágenes se guardan en el bucket público `materiales` de Supabase Storage.
- Solo admins pueden subir, reemplazar o quitar imágenes mediante Server Actions con clave server-side.
- El catálogo muestra una miniatura; si no hay imagen, muestra un marcador visual "Sin imagen".

### Eliminar material (Admin)
- Si no tiene préstamos activos, se aplica eliminación lógica: deja de mostrarse en el catálogo operativo pero conserva su registro histórico.
- Se crea un movimiento `eliminacion_material` para que el reporte muestre cuándo se eliminó y quién lo hizo.
- Si tiene préstamos activos, la UI debe explicar por qué aún no se puede eliminar.
