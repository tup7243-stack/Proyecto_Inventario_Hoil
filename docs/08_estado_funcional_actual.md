# Estado funcional actual

El sistema ya cubre el flujo operativo principal del taller: autenticación, administración base, préstamos, devoluciones, consumo, reportes y refresco en tiempo real.

## Funciones disponibles

| Módulo | Funciones ya disponibles |
|---|---|
| Autenticación | Login por correo/contraseña, Google OAuth, sesión Supabase, redirección por rol, logout |
| Admin | Dashboard, materiales, equipos, creación/edición de usuarios, restablecimiento de contraseña, reportes |
| Representante | Pedir material, devolver préstamos activos, reportar consumo |
| Inventario | Entradas de stock, stock mínimo, disponibilidad calculada, trazabilidad por movimientos |
| Tiempo real | Refresco automático de Server Components cuando cambian materiales, préstamos o movimientos |
| QA | Unit tests, build, lint, typecheck y smoke tests E2E |

## Decisiones ya aplicadas

| Tema | Decisión |
|---|---|
| Lectura de datos | Server Components consultan Supabase JS directamente |
| Mutaciones complejas | Server Actions validan rol con sesión de usuario y mutan con service role puro |
| Disponibilidad | Se calcula como `cantidad_total - préstamos activos`, no se persiste |
| Realtime | Un componente cliente escucha cambios y usa `router.refresh()` |
| Entorno local | Supabase local corre con Podman y `DOCKER_HOST` explícito |

## Mejoras de UX implementadas

- Confirmación visual después de acciones exitosas.
- Etiquetas claras para `Cantidad inicial` y `Stock mínimo`.
- Campo de contraseña sin puntos engañosos cuando está vacío y con botón para mostrar/ocultar el texto.
- Eliminación administrada de materiales, equipos y usuarios con validaciones de seguridad.
- Gestión de usuarios desde la app con creación de cuentas y restablecimiento de contraseña.

## Criterios de seguridad para eliminación

| Entidad | Regla prevista |
|---|---|
| Material | Eliminación lógica si no tiene préstamos activos; conserva historial y añade movimiento de eliminación |
| Equipo | Solo eliminar si no tiene representantes ni préstamos asociados |
| Usuario/perfil | No permitir que un admin se elimine a sí mismo y evitar borrar perfiles con historial relevante |

## Siguiente paso

Validar en navegador los nuevos flujos y decidir si más adelante se necesita archivado lógico para entidades con historial, en vez de impedir su eliminación.
