# Stack Tecnológico y Arquitectura

## Stack elegido

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router) | Server Components + Client Components. Reactivo sin overkill. |
| **Hosting Frontend** | Vercel | Free tier (100 GB/mes). Deploy automático con `git push`. |
| **Backend / BD** | Supabase | PostgreSQL gestionado. Free tier: 500 MB BD, 50K MAU. |
| **Auth** | Supabase Auth | Email/password nativo + Google OAuth institucional. |
| **ORM** | Drizzle ORM | Tipado, liviano, migraciones en TypeScript. |
| **Estilos** | Tailwind CSS 4 | Utility-first. Rápido, responsive, personalizable. |
| **Iconos** | Lucide React | Set completo, libre, árbol sacudible (tree-shakeable). |
| **Gráficos** | Recharts | Nativo React, declarativo, liviano. |
| **Repositorio** | GitHub | Conectado a Vercel para CI/CD automático. |

## ¿Por qué no Laravel?

Laravel es excelente, pero para este proyecto Next.js + Supabase gana en:

- **Costo $0 total**: Vercel + Supabase free tier cubren de sobra el uso de un taller escolar (~50 alumnos).
- **Sin servidor que administrar**: No hay que configurar Apache, PHP, ni SSL. Vercel y Supabase lo gestionan todo.
- **Tiempo real nativo**: Supabase Realtime permite ver préstamos y devoluciones sin refrescar la página. En Laravel requeriría WebSockets + Echo + Redis.
- **Google OAuth integrado**: Supabase Auth lo trae nativo, sin paquetes adicionales.

## Arquitectura

```
┌──────────────────────────────────────────┐
│                 Vercel                    │
│  ┌────────────────────────────────────┐  │
│  │        Next.js App Router          │  │
│  │  ┌──────────┐  ┌────────────────┐  │  │
│  │  │  Server   │  │    Client      │  │  │
│  │  │Components │  │  Components    │  │  │
│  │  │ (SSR/ISR) │  │(useEffect/etc) │  │  │
│  │  └─────┬─────┘  └───────┬────────┘  │  │
│  │        │                │            │  │
│  │        │    Supabase    │            │  │
│  │        │   JS Client ───┘            │  │
│  │        │   (server + browser)        │  │
│  └────────┼─────────────────────────────┘  │
└───────────┼────────────────────────────────┘
            │
┌───────────┼────────────────────────────────┐
│           ▼          Supabase              │
│  ┌──────────────────────────────────────┐ │
│  │         PostgreSQL (SQL)             │ │
│  │  ┌────────┐ ┌────────┐ ┌─────────┐  │ │
│  │  │ auth.  │ │ public.│ │ public. │  │ │
│  │  │ users  │ │perfiles│ │  resto  │  │ │
│  │  └────────┘ └────────┘ └─────────┘  │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────┐ ┌────────────────────┐  │
│  │  Realtime    │ │   Row Level        │  │
│  │Subscriptions │ │   Security (RLS)   │  │
│  └──────────────┘ └────────────────────┘  │
└───────────────────────────────────────────┘
```

## Flujo de datos

1. Usuario hace login → Supabase Auth devuelve JWT + `auth.users.id`
2. Next.js middleware verifica sesión y rol en cada request
3. Server Components leen datos directo de Supabase (sin exponer la BD al cliente)
4. Client Components usan Supabase Realtime para recibir actualizaciones en vivo (ej. stock que cambia mientras otro Representante pide material)
5. Mutaciones (crear préstamo, devolver) son Server Actions en Next.js → escriben a Supabase → Realtime notifica a los demás clientes

## Endpoints (App Router)

```
/                         → Landing / Redirect al dashboard
/login                    → Login custom con contraseña visible/oculta
/dashboard                → Admin: KPIs y resumen general
/dashboard/materiales     → Admin: catálogo, stock y eliminación segura de materiales
/dashboard/equipos        → Admin: gestión y eliminación segura de equipos
/dashboard/usuarios       → Admin: gestión y eliminación segura de usuarios/perfiles
/dashboard/reportes       → Admin: reportes filtrados
/equipo                   → Representante: su dashboard
/equipo/pedir             → Representante: pedir material (≤3 clics)
/equipo/devolver          → Representante: devolver material
/equipo/consumo           → Representante: reportar consumo
/equipo/historial         → Representante: historial de su equipo
```

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=          # Solo server-side
# Compatibilidad local/legacy aceptada por el código:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                # Para Drizzle migrations
GOOGLE_CLIENT_ID=            # OAuth institucional
GOOGLE_CLIENT_SECRET=
```
