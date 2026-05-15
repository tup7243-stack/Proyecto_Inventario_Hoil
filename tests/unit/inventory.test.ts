import { describe, expect, it } from "vitest";
import {
  calcularDisponible,
  calcularPrestadoPendiente,
  esConsumible,
  validarCantidadDisponible,
  validarDevolucionPendiente,
} from "@/lib/domain/inventory";

describe("reglas de inventario", () => {
  it("calcula préstamos pendientes descontando devoluciones parciales", () => {
    expect(
      calcularPrestadoPendiente([
        { cantidad_prestada: 5, cantidad_devuelta: 2 },
        { cantidad_prestada: 3, cantidad_devuelta: null },
      ])
    ).toBe(6);
  });

  it("calcula disponible sin almacenar cantidad_disponible", () => {
    expect(
      calcularDisponible(10, [
        { cantidad_prestada: 4, cantidad_devuelta: 1 },
        { cantidad_prestada: 2, cantidad_devuelta: 0 },
      ])
    ).toBe(5);
  });

  it("bloquea préstamo o consumo mayor al disponible", () => {
    expect(validarCantidadDisponible(4, 3)).toBe(
      "No hay stock disponible suficiente. Disponible: 3."
    );
    expect(validarCantidadDisponible(3, 3)).toBeNull();
  });

  it("bloquea devolución mayor a lo pendiente", () => {
    expect(validarDevolucionPendiente(4, 5, 2)).toBe(
      "No puedes devolver más de lo pendiente. Pendiente: 3."
    );
    expect(validarDevolucionPendiente(3, 5, 2)).toBeNull();
  });

  it("solo marca consumibles como consumibles", () => {
    expect(esConsumible("consumible")).toBe(true);
    expect(esConsumible("herramienta_manual")).toBe(false);
  });
});
