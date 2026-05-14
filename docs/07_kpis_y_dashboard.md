# KPIs y Dashboard (Panel de Administrador)

El Dashboard es la pantalla principal del Admin. Debe mostrar los KPIs clave en tarjetas grandes (cards) y gráficos visuales usando Recharts.

## KPIs Principales (9 indicadores)

### 1. Materiales totales en inventario
- **Tipo:** Card con número grande
- **Cálculo:** `SUM(materiales.cantidad_total)`
- **Icono:** `Package` (Lucide)
- **Color:** Verde institucional

### 2. Porcentaje de materiales prestados vs disponibles
- **Tipo:** Gráfico de anillo (PieChart donut)
- **Cálculo:**
  - Prestados: `SUM(prestamos WHERE estado='activo'.cantidad_prestada)`
  - Disponibles: `SUM(materiales.cantidad_total) - prestados`
- **Colores:** Naranja (prestado), Verde (disponible)

### 3. Materiales con stock bajo
- **Tipo:** Card con contador + tabla debajo
- **Cálculo:** `COUNT(materiales WHERE cantidad_disponible <= stock_minimo AND cantidad_total > 0)`
- **Alerta:** Número en rojo/naranja si > 0
- **Icono:** `AlertTriangle`

### 4. Top 5 materiales más prestados
- **Tipo:** Gráfico de barras horizontal
- **Cálculo:** Materiales con más préstamos en el período seleccionado
- **Query:** `GROUP BY material_id, ORDER BY COUNT DESC, LIMIT 5`
- **Filtro:** Por período (última hora, día, semana, mes)

### 5. Equipos con más actividad
- **Tipo:** Gráfico de barras vertical
- **Cálculo:** `COUNT(movimientos) GROUP BY equipo_id` en el período
- **Filtro:** Por período

### 6. Total de movimientos por período
- **Tipo:** Gráfico de líneas (LineChart) con selector de período
- **Opciones:** Hora, Día, Semana, Mes
- **Cálculo:** `COUNT(movimientos) GROUP BY period`
- **Eje X:** Período, **Eje Y:** Cantidad de movimientos
- **Color:** Verde institucional

### 7. Tasa de devolución
- **Tipo:** Card con porcentaje grande
- **Cálculo:** `COUNT(prestamos WHERE estado='devuelto') / COUNT(prestamos) * 100`
- **Icono:** `RefreshCw`
- **Colores condicionales:** >80% verde, 50-80% naranja, <50% rojo

### 8. Distribución de estado de materiales
- **Tipo:** Gráfico de anillo (donut)
- **Cálculo:** `COUNT(materiales) GROUP BY estado`
- **Segmentos:** Bueno (verde), Desgastado (naranja), Dañado (rojo)

### 9. Consumibles agotados o cercanos a agotarse
- **Tipo:** Tabla con indicador visual
- **Cálculo:** `materiales WHERE categoria='consumible' AND cantidad_disponible <= stock_minimo`
- **Columnas:** Nombre, Stock actual, Stock mínimo, Estado
- **Alerta:** Fila en rojo si `cantidad_total = 0`, naranja si `<= stock_minimo`

---

## Layout del Dashboard

```
┌──────────────────────────────────────────────────────┐
│  Dashboard                                [Período ▼]│
├──────────┬──────────┬──────────┬─────────────────────┤
│   KPI 1  │   KPI 3  │   KPI 7  │                     │
│ Material │  Stock   │  Tasa    │      KPI 2          │
│  total   │   Bajo   │devolución│   Prestado vs       │
│          │          │          │   Disponible        │
├──────────┴──────────┴──────────┴─────────────────────┤
│                                                     │
│             KPI 6 - Movimientos por período          │
│             (Gráfico de líneas)                      │
│                                                     │
├───────────────────────────┬─────────────────────────┤
│   KPI 4                   │   KPI 5                 │
│   Top 5 materiales        │   Equipos más activos   │
│   más prestados           │                         │
│   (Barras horizontal)     │   (Barras vertical)     │
├───────────────────────────┴─────────────────────────┤
│                                                     │
│   KPI 9 - Consumibles agotados (Tabla)              │
│                                                     │
├─────────────────────────────────────────────────────┤
│              KPI 8 - Estado de materiales            │
│              (Gráfico de anillo)                     │
└─────────────────────────────────────────────────────┘
```

---

## Filtro de período

Un selector global afecta a los KPIs 4, 5 y 6:

| Período | Agrupación | Query |
|---|---|---|
| Hora | `date_trunc('hour', created_at)` | Últimas 24 horas |
| Día | `date_trunc('day', created_at)` | Últimos 7 días |
| Semana | `date_trunc('week', created_at)` | Últimas 4 semanas |
| Mes | `date_trunc('month', created_at)` | Últimos 6 meses |

NUNCA incluir opción "Año" en el selector.

---

## Exportación

Desde el Dashboard, el Admin puede exportar a CSV:
- Reporte de movimientos filtrado por período
- Reporte de préstamos por equipo
- Reporte de materiales con stock bajo

Usar Server Actions de Next.js para generar el CSV y descargarlo.
