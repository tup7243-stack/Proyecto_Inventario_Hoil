# Contexto del Proyecto: Sistema de Inventario para Taller

## Descripción General
El proyecto consiste en un sistema de gestión de inventario diseñado específicamente para el taller de "Aires Acondicionados y Refrigeración" de una escuela preparatoria (CECYTE). El enfoque principal es gestionar materiales y herramientas que tienen un flujo constante de entradas y salidas.

## Público Objetivo
El sistema será utilizado por estudiantes de preparatoria y administradores del taller. Por lo tanto, la curva de aprendizaje debe ser mínima.

## Objetivos Principales
1. Registrar de forma ágil y precisa cada entrada y salida de material del taller.
2. Organizar a los alumnos mediante un sistema de "Equipos", donde un alumno funge como "Representante" y responsable del material prestado.
3. Generar métricas de uso a corto y mediano plazo (horas, días, semanas y meses). No se requiere histórico por años debido a la naturaleza escolar del proyecto.
4. Mantener una interfaz altamente amigable, visual e intuitiva para los jóvenes.

## Stack Tecnológico
Ver [00_stack_y_arquitectura.md](./00_stack_y_arquitectura.md) para el detalle completo de tecnologías.

- **Frontend:** Next.js (App Router) alojado en Vercel
- **Backend / BD:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/contraseña + Google OAuth institucional)
- **Estilos:** Tailwind CSS
- **Gráficos:** Recharts
- **Despliegue:** Automático vía GitHub → Vercel

## Alcance del MVP (Producto Mínimo Viable)
- Login con matrícula y contraseña
- CRUD de materiales, equipos y usuarios (Admin)
- Flujo de préstamo y devolución (Representante)
- Registro de consumo de materiales
- Dashboard con KPIs (Admin)
- Reportes filtrables por período (Admin)
- Manual de usuario generado por IA
