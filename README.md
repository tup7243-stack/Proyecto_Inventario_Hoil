# Inventario HOIL

Sistema web para administrar materiales, equipos, usuarios y movimientos del taller de refrigeración de CECYTE.

## Ruta rápida

1. Inicia Supabase local con Podman:
   ```bash
   DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock corepack pnpm supabase start
   ```
2. Si reiniciaste la base local, carga variables y seed:
   ```bash
   set -a && source .env.local && set +a
   corepack pnpm tsx src/lib/db/seed.ts
   ```
3. Levanta la app:
   ```bash
   corepack pnpm dev
   ```
4. Abre `http://localhost:3000`.

## Estado actual

| Área | Estado |
|---|---|
| Login por correo/contraseña y Google | Implementado |
| Redirección por rol | Implementada |
| Dashboard admin con KPIs | Implementado |
| CRUD base de materiales/equipos/perfiles | Implementado |
| Préstamo, devolución y consumo | Implementados |
| Realtime para refrescar inventario | Implementado |
| Reportes | Implementados |
| Smoke tests E2E | Implementados |

## Credenciales seed

| Rol | Usuario | Contraseña |
|---|---|---|
| Admin | `admin@cecyte.edu.mx` | `Admin123!` |
| Representante 1 | `rep1@cecyte.edu.mx` | `Rep12345!` |
| Representante 2 | `rep2@cecyte.edu.mx` | `Rep12345!` |

## Comandos útiles

```bash
corepack pnpm dev
corepack pnpm verify
corepack pnpm exec playwright test --workers=1
```

> Si los E2E necesitan conectarse a Supabase local, deben ejecutarse en un entorno que pueda alcanzar `127.0.0.1:54321`; si el navegador está aislado por sandbox, el login fallará aunque las credenciales sean correctas.

## Documentación

- [Arquitectura](./docs/00_stack_y_arquitectura.md)
- [Contexto y objetivos](./docs/01_contexto_y_objetivos.md)
- [Roles y requerimientos](./docs/02_requerimientos_y_roles.md)
- [Catálogo de materiales](./docs/03_catalogo_materiales.md)
- [UI/UX](./docs/04_ui_ux_y_diseno.md)
- [Modelo de datos](./docs/06_modelo_base_datos.md)
- [KPIs y dashboard](./docs/07_kpis_y_dashboard.md)
- [Estado funcional actual](./docs/08_estado_funcional_actual.md)
- [Configuración Google OAuth](./docs/09_google_oauth.md)

## Notas locales importantes

- En este entorno usa `pnpm` vía Corepack, no `npm`.
- Para Supabase remoto usa preferentemente `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY`; el código mantiene compatibilidad con las variables legacy locales `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
- Si Next muestra `ECONNREFUSED 127.0.0.1:54321`, Supabase local no está disponible.
- Si `supabase start` queda atorado como “already running”, suele resolverse con:
  ```bash
  DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock corepack pnpm supabase stop --no-backup
  DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock corepack pnpm supabase start
  ```
