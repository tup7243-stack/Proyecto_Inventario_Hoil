# Guía de Diseño UI/UX

## Identidad Visual Institucional (CECYTE)
El diseño debe basarse en los colores institucionales del CECYTE.

- **Color Principal:** Verde institucional CECYTE (`#006847` o similar, validar contra el manual de identidad de la región).
- **Colores Secundarios:** Blanco (`#FFFFFF`) para fondos limpios y contrastes. Gris claro (`#F3F4F6` Tailwind `gray-100`) para tarjetas y fondos secundarios.
- **Acentos:**
  - Naranja (`#F97316` Tailwind `orange-500`) para alertas de stock bajo.
  - Rojo (`#EF4444` Tailwind `red-500`) para errores y materiales agotados.
  - Verde claro (`#22C55E` Tailwind `green-500`) para confirmaciones y material disponible.

### Configuración Tailwind CSS

```js
// tailwind.config.ts
colors: {
  cecyte: {
    primary:   '#006847',  // Verde institucional
    dark:      '#004d35',  // Hover states
    light:     '#e6f0ec',  // Fondos suaves
    accent:    '#F97316',  // Alertas
  }
}
```

## Stack de diseño

| Elemento | Herramienta |
|---|---|
| Framework CSS | Tailwind CSS 4 |
| Iconos | Lucide React (set completo, tree-shakeable) |
| Gráficos | Recharts (nativo React, declarativo) |
| Componentes UI | shadcn/ui (opcional, basado en Radix + Tailwind) |
| Tipografía | Inter (Google Fonts, optimizada para pantalla) |

## Directrices de Interfaz (Jóvenes de Preparatoria)

### Botones y Acciones
- **Botones grandes y claros:** Mínimo 48px de alto (regla de accesibilidad táctil). Usar `px-6 py-3` como base.
- **Color por función:**
  - Acción principal (pedir, confirmar) → Verde institucional
  - Acción secundaria (cancelar, volver) → Gris
  - Acción destructiva (eliminar) → Rojo
- **Iconos siempre acompañados de texto** hasta que el usuario se familiarice.
- **Confirmación visible tras acciones:** mostrar estado de éxito después de guardar, actualizar, crear, devolver o eliminar.
- **Campos autoexplicativos:** inputs numéricos deben mostrar etiqueta visible, por ejemplo `Cantidad inicial` y `Stock mínimo`, no solo valores `0` o `1`.
- **Contraseña clara:** no usar placeholder de puntos cuando el campo está vacío y ofrecer control para mostrar/ocultar el valor.

### Iconografía (Lucide React)
Usar iconos representativos de cada herramienta/material:
- 🔧 Herramientas: `Wrench`, `Hammer`, `Scissors`
- 🔥 Consumibles: `Flame` (propano/gas)
- 🧤 Protección: `Shield`
- 📊 Reportes: `BarChart3`, `TrendingUp`, `FileText`
- 👥 Equipos: `Users`, `UserCheck`
- ⚠️ Alertas: `AlertTriangle`, `AlertCircle`

### Flujo de 3 clics (regla estricta)

**Pedir material:**
1. **Pantalla:** Lista de materiales disponibles con iconos grandes y cantidades visibles
2. **Modal/selector:** Elegir cantidad (slider o botones +/-)
3. **Confirmación:** Botón grande "Pedir" → toast de éxito + actualización en tiempo real

**Devolver material:**
1. **Pantalla:** Lista de préstamos activos del equipo
2. **Selección:** Tap en el préstamo a devolver
3. **Confirmación:** Botón "Devolver" → toast + inventario actualizado

### Dashboards Visuales
- Los reportes de horas/días/semanas deben mostrarse con gráficas de barras o líneas simples (Recharts).
- Colores consistentes con la paleta CECYTE.
- Las alertas de stock bajo deben ser visualmente obvias (tarjeta con borde naranja/rojo, icono de alerta).
- Los KPIs principales van en tarjetas grandes tipo "card" con número grande + etiqueta + icono.

### Responsive (Mobile-First)
- Diseñar primero para pantalla de celular (375px de ancho), luego escalar a tablet y desktop.
- Los alumnos usarán el sistema desde sus teléfonos o una tablet en el taller.
- Layout: single column en móvil, 2 columnas en tablet, 3+ en desktop.
- Navegación: bottom tab bar en móvil, sidebar en desktop.
- Las tablas de datos en móvil se convierten en cards apiladas.
