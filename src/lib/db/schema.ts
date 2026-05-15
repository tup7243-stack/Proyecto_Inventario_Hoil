import "server-only";

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ============================================================
// TABLA: equipos
// ============================================================
export const equipos = pgTable("equipos", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================================
// TABLA: perfiles
// Vinculada 1:1 con auth.users
// ============================================================
export const perfiles = pgTable(
  "perfiles",
  {
    id: uuid("id").primaryKey(), // PK = auth.users.id (set by trigger)
    matricula: text("matricula").notNull().unique(),
    nombre: text("nombre").notNull(),
    rol: text("rol", { enum: ["admin", "representante"] }).notNull(),
    equipoId: uuid("equipo_id").references(() => equipos.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check("perfiles_rol_check", sql`${table.rol} IN ('admin', 'representante')`),
  ]
);

// ============================================================
// TABLA: materiales
// cantidad_disponible se calcula, NO se almacena
// ============================================================
export const materiales = pgTable(
  "materiales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nombre: text("nombre").notNull(),
    categoria: text("categoria", {
      enum: [
        "herramienta_manual",
        "consumible",
        "equipo_proteccion",
        "equipo_medicion",
      ],
    }).notNull(),
    cantidadTotal: integer("cantidad_total").notNull().default(0),
    stockMinimo: integer("stock_minimo").notNull().default(0),
    estado: text("estado", { enum: ["bueno", "desgastado", "dañado"] })
      .notNull()
      .default("bueno"),
    activo: boolean("activo").notNull().default(true),
    eliminadoAt: timestamp("eliminado_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check("materiales_cantidad_total_check", sql`${table.cantidadTotal} >= 0`),
    check("materiales_stock_minimo_check", sql`${table.stockMinimo} >= 0`),
    check(
      "materiales_categoria_check",
      sql`${table.categoria} IN ('herramienta_manual', 'consumible', 'equipo_proteccion', 'equipo_medicion')`
    ),
    check(
      "materiales_estado_check",
      sql`${table.estado} IN ('bueno', 'desgastado', 'dañado')`
    ),
  ]
);

// ============================================================
// TABLA: movimientos
// Bitácora inmutable — solo INSERT, nunca UPDATE ni DELETE
// ============================================================
export const movimientos = pgTable(
  "movimientos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tipo: text("tipo", {
      enum: [
        "entrada_stock",
        "salida_prestamo",
        "entrada_devolucion",
        "consumo",
        "eliminacion_material",
      ],
    }).notNull(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materiales.id, { onDelete: "restrict" }),
    cantidad: integer("cantidad").notNull(),
    equipoId: uuid("equipo_id").references(() => equipos.id, {
      onDelete: "set null",
    }),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    prestamoId: uuid("prestamo_id"), // FK añadida después de la tabla prestamos
    comentario: text("comentario"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      "movimientos_cantidad_check",
      sql`(${table.tipo} = 'eliminacion_material' AND ${table.cantidad} >= 0) OR (${table.tipo} <> 'eliminacion_material' AND ${table.cantidad} > 0)`
    ),
    check(
      "movimientos_tipo_check",
      sql`${table.tipo} IN ('entrada_stock', 'salida_prestamo', 'entrada_devolucion', 'consumo', 'eliminacion_material')`
    ),
  ]
);

// ============================================================
// TABLA: prestamos
// Préstamos activos e históricos
// ============================================================
export const prestamos = pgTable(
  "prestamos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    equipoId: uuid("equipo_id")
      .notNull()
      .references(() => equipos.id, { onDelete: "cascade" }),
    representanteId: uuid("representante_id")
      .notNull()
      .references(() => perfiles.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materiales.id, { onDelete: "restrict" }),
    cantidadPrestada: integer("cantidad_prestada").notNull(),
    cantidadDevuelta: integer("cantidad_devuelta").notNull().default(0),
    estado: text("estado", { enum: ["activo", "devuelto"] })
      .notNull()
      .default("activo"),
    movimientoSalidaId: uuid("movimiento_salida_id").references(
      () => movimientos.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check("prestamos_cantidad_prestada_check", sql`${table.cantidadPrestada} > 0`),
    check(
      "prestamos_cantidad_devuelta_check",
      sql`${table.cantidadDevuelta} >= 0`
    ),
    check(
      "prestamos_estado_check",
      sql`${table.estado} IN ('activo', 'devuelto')`
    ),
  ]
);

// ============================================================
// RELACIONES (Drizzle relations API)
// ============================================================

export const equiposRelations = relations(equipos, ({ many }) => ({
  perfiles: many(perfiles),
  prestamos: many(prestamos),
  movimientos: many(movimientos),
}));

export const perfilesRelations = relations(perfiles, ({ one, many }) => ({
  equipo: one(equipos, {
    fields: [perfiles.equipoId],
    references: [equipos.id],
  }),
  prestamos: many(prestamos, { relationName: "representantePrestamos" }),
  movimientos: many(movimientos),
}));

export const materialesRelations = relations(materiales, ({ many }) => ({
  prestamos: many(prestamos),
  movimientos: many(movimientos),
}));

export const movimientosRelations = relations(movimientos, ({ one }) => ({
  material: one(materiales, {
    fields: [movimientos.materialId],
    references: [materiales.id],
  }),
  equipo: one(equipos, {
    fields: [movimientos.equipoId],
    references: [equipos.id],
  }),
  usuario: one(perfiles, {
    fields: [movimientos.usuarioId],
    references: [perfiles.id],
  }),
  prestamo: one(prestamos, {
    fields: [movimientos.prestamoId],
    references: [prestamos.id],
  }),
}));

export const prestamosRelations = relations(prestamos, ({ one, many }) => ({
  equipo: one(equipos, {
    fields: [prestamos.equipoId],
    references: [equipos.id],
  }),
  representante: one(perfiles, {
    fields: [prestamos.representanteId],
    references: [perfiles.id],
    relationName: "representantePrestamos",
  }),
  material: one(materiales, {
    fields: [prestamos.materialId],
    references: [materiales.id],
  }),
  movimientoSalida: one(movimientos, {
    fields: [prestamos.movimientoSalidaId],
    references: [movimientos.id],
  }),
  movimientos: many(movimientos),
}));

// ============================================================
// TIPOS INFERIDOS
// ============================================================
export type Equipo = typeof equipos.$inferSelect;
export type NewEquipo = typeof equipos.$inferInsert;

export type Perfil = typeof perfiles.$inferSelect;
export type NewPerfil = typeof perfiles.$inferInsert;

export type Material = typeof materiales.$inferSelect;
export type NewMaterial = typeof materiales.$inferInsert;

export type Movimiento = typeof movimientos.$inferSelect;
export type NewMovimiento = typeof movimientos.$inferInsert;

export type Prestamo = typeof prestamos.$inferSelect;
export type NewPrestamo = typeof prestamos.$inferInsert;
