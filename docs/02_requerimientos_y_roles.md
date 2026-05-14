# Roles de Usuario y Requerimientos Funcionales

## Roles del Sistema

### 1. Administrador (Docente / Encargado de Taller)
- Tiene acceso total al sistema.
- Puede registrar, editar y eliminar materiales del inventario.
- Puede añadir stock a materiales existentes (entrada de inventario).
- Puede crear "Equipos de Trabajo".
- Asigna a un alumno como "Representante" de cada equipo.
- Crea y gestiona las cuentas de usuario (matrícula + contraseña).
- Tiene acceso al panel de reportes, KPIs e informes.
- Puede exportar reportes a CSV.

### 2. Representante de Equipo (Alumno)
- Es el único del equipo autorizado para registrar las salidas (préstamos) y entradas (devoluciones) de material para su equipo.
- Puede reportar consumo de materiales (ej. gas propano agotado).
- Solo visualiza el material disponible y el estado de los préstamos activos de su propio equipo.
- Ve las actualizaciones de inventario en tiempo real.

## Autenticación

| Método | Prioridad | Detalle |
|---|---|---|
| Matrícula + contraseña | Primario | El Admin crea la cuenta. El Representante usa su matrícula escolar como identificador. |
| Google OAuth | Secundario / Futuro | Integración con cuentas institucionales `@cecyte.edu.mx`. Se configura con Supabase Auth + Google Cloud Console. |

**Regla de seguridad**: Row Level Security (RLS) en Supabase garantiza que un Representante solo vea y modifique datos de su propio equipo. El middleware de Next.js redirige según el rol.

## Requerimientos Funcionales Clave

### Gestión de Equipos
- El sistema debe permitir la creación de múltiples equipos de trabajo que operen simultáneamente.
- Cada equipo tiene UN solo Representante.
- Un Representante pertenece a UN solo equipo.

### Gestión de Materiales
- CRUD completo de materiales (solo Admin).
- Añadir stock: el Admin registra una entrada de material aumentando `cantidad_total`.
- Registrar consumo: el Representante reporta que un material se consumió (ej. "se acabó el gas del soplete, 2 cilindros"). Esto descuenta del stock sin generar préstamo.
- Estado visual del material: bueno, desgastado, dañado.
- Stock mínimo configurable por material para generar alertas.

### Trazabilidad
Toda acción de entrada o salida debe registrar:
- Quién la hizo (usuario)
- Qué material fue (material)
- Qué cantidad (cantidad)
- A qué equipo pertenece la acción (equipo, si aplica)
- Marca de tiempo exacta (created_at)
- Tipo de movimiento: `entrada_stock`, `salida_prestamo`, `entrada_devolucion`, `consumo`

### Flujo de Préstamo (≤3 clics)
1. Representante ve lista de materiales disponibles
2. Selecciona material y cantidad
3. Confirma → se crea el préstamo y se actualiza el inventario

### Flujo de Devolución (≤3 clics)
1. Representante ve sus préstamos activos
2. Selecciona el préstamo a devolver
3. Confirma → se marca como devuelto y el material vuelve al inventario

### Flujo de Consumo (≤3 clics)
1. Representante ve materiales prestados a su equipo
2. Selecciona material consumible y reporta cantidad consumida
3. Confirma → se descuenta del stock total

### Generación de Informes y KPIs
Ver [07_kpis_y_dashboard.md](./07_kpis_y_dashboard.md) para el detalle completo.

El sistema debe poder filtrar y exportar reportes de movimientos agrupados por:
- Hora
- Día
- Semana
- Mes

*(Nota estricta: Excluir filtros y lógicas de reportes anuales).*

### Actualización en Tiempo Real
- Cuando un Representante pide o devuelve material, el inventario se actualiza en vivo para todos los usuarios conectados (vía Supabase Realtime).
- El Dashboard del Admin refleja los cambios sin necesidad de refrescar la página.
