/**
 * Datos seed para el catálogo de materiales iniciales.
 * Basado en docs/03_catalogo_materiales.md — Taller de Refrigeración.
 */
export const seedMateriales = [
  {
    nombre: "Pinza de corte",
    categoria: "herramienta_manual" as const,
    cantidad_total: 5,
    stock_minimo: 2,
    estado: "bueno" as const,
  },
  {
    nombre: "Martillo",
    categoria: "herramienta_manual" as const,
    cantidad_total: 3,
    stock_minimo: 1,
    estado: "bueno" as const,
  },
  {
    nombre: "Perica (Llave ajustable)",
    categoria: "herramienta_manual" as const,
    cantidad_total: 4,
    stock_minimo: 1,
    estado: "bueno" as const,
  },
  {
    nombre: "Boquilla para soldar",
    categoria: "consumible" as const,
    cantidad_total: 10,
    stock_minimo: 3,
    estado: "bueno" as const,
  },
  {
    nombre: "Cilindro de Propano",
    categoria: "consumible" as const,
    cantidad_total: 4,
    stock_minimo: 1,
    estado: "bueno" as const,
  },
  {
    nombre: "Gas MAP",
    categoria: "consumible" as const,
    cantidad_total: 3,
    stock_minimo: 1,
    estado: "bueno" as const,
  },
  {
    nombre: "Guantes de seguridad",
    categoria: "equipo_proteccion" as const,
    cantidad_total: 8,
    stock_minimo: 2,
    estado: "bueno" as const,
  },
  {
    nombre: "Manómetros",
    categoria: "equipo_medicion" as const,
    cantidad_total: 2,
    stock_minimo: 1,
    estado: "bueno" as const,
  },
  {
    nombre: "Cortatubos",
    categoria: "herramienta_manual" as const,
    cantidad_total: 3,
    stock_minimo: 1,
    estado: "bueno" as const,
  },
  {
    nombre: "Expansores de tubo",
    categoria: "herramienta_manual" as const,
    cantidad_total: 3,
    stock_minimo: 1,
    estado: "bueno" as const,
  },
];
