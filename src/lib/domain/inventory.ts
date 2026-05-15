export interface PrestamoPendiente {
  cantidad_prestada: number;
  cantidad_devuelta?: number | null;
}

export function calcularPrestadoPendiente(prestamos: PrestamoPendiente[]) {
  return prestamos.reduce(
    (total, prestamo) =>
      total +
      Math.max(
        0,
        prestamo.cantidad_prestada - (prestamo.cantidad_devuelta ?? 0)
      ),
    0
  );
}

export function calcularDisponible(
  cantidadTotal: number,
  prestamos: PrestamoPendiente[]
) {
  return Math.max(0, cantidadTotal - calcularPrestadoPendiente(prestamos));
}

export function validarCantidadDisponible(cantidad: number, disponible: number) {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return "La cantidad debe ser mayor a 0.";
  }

  if (cantidad > disponible) {
    return `No hay stock disponible suficiente. Disponible: ${disponible}.`;
  }

  return null;
}

export function validarDevolucionPendiente(
  cantidad: number,
  cantidadPrestada: number,
  cantidadDevuelta: number | null | undefined
) {
  const pendiente = cantidadPrestada - (cantidadDevuelta ?? 0);

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return "La cantidad debe ser mayor a 0.";
  }

  if (cantidad > pendiente) {
    return `No puedes devolver más de lo pendiente. Pendiente: ${pendiente}.`;
  }

  return null;
}

export function esConsumible(categoria: string) {
  return categoria === "consumible";
}
