"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  calcularPrestadoPendiente,
  esConsumible,
  validarCantidadDisponible,
  validarDevolucionPendiente,
} from "@/lib/domain/inventory";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getPositiveInt(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} debe ser mayor a 0.`);
  }
  return value;
}

async function requireRepresentante() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesión requerida.");

  const { data: perfil, error } = await supabase
    .from("perfiles")
    .select("id, rol, equipo_id")
    .eq("id", user.id)
    .single();

  if (error || perfil?.rol !== "representante" || !perfil.equipo_id) {
    throw new Error("Solo un representante asignado a equipo puede realizar esta acción.");
  }

  return {
    representanteId: perfil.id as string,
    equipoId: perfil.equipo_id as string,
  };
}

async function getDisponible(materialId: string) {
  const supabase = await createAdminClient();
  const [{ data: material, error: materialError }, { data: prestamos }] =
    await Promise.all([
      supabase
        .from("materiales")
        .select("id, cantidad_total, categoria, activo")
        .eq("id", materialId)
        .single(),
      supabase
        .from("prestamos")
        .select("cantidad_prestada, cantidad_devuelta")
        .eq("material_id", materialId)
        .eq("estado", "activo"),
    ]);

  if (materialError || !material) {
    throw new Error(materialError?.message ?? "Material no encontrado.");
  }
  if (!material.activo) throw new Error("Este material ya no está disponible.");

  const prestado = calcularPrestadoPendiente(prestamos ?? []);

  return {
    material,
    disponible: Math.max(0, material.cantidad_total - prestado),
  };
}

export async function pedirMaterial(formData: FormData) {
  const { representanteId, equipoId } = await requireRepresentante();
  const supabase = await createAdminClient();

  const materialId = getString(formData, "material_id");
  const cantidad = getPositiveInt(formData, "cantidad");
  const comentario = getString(formData, "comentario") || "Préstamo solicitado por representante";

  const { disponible } = await getDisponible(materialId);
  const validationError = validarCantidadDisponible(cantidad, disponible);
  if (validationError) throw new Error(validationError);

  const { data: prestamo, error: prestamoError } = await supabase
    .from("prestamos")
    .insert({
      equipo_id: equipoId,
      representante_id: representanteId,
      material_id: materialId,
      cantidad_prestada: cantidad,
      cantidad_devuelta: 0,
      estado: "activo",
    })
    .select("id")
    .single();

  if (prestamoError || !prestamo) {
    throw new Error(prestamoError?.message ?? "No se pudo crear el préstamo.");
  }

  const { data: movimiento, error: movimientoError } = await supabase
    .from("movimientos")
    .insert({
      tipo: "salida_prestamo",
      material_id: materialId,
      cantidad,
      equipo_id: equipoId,
      usuario_id: representanteId,
      prestamo_id: prestamo.id,
      comentario,
    })
    .select("id")
    .single();

  if (movimientoError || !movimiento) {
    throw new Error(movimientoError?.message ?? "No se pudo registrar el movimiento.");
  }

  const { error: updateError } = await supabase
    .from("prestamos")
    .update({ movimiento_salida_id: movimiento.id })
    .eq("id", prestamo.id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/equipo");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/materiales");
}

export async function devolverMaterial(formData: FormData) {
  const { representanteId, equipoId } = await requireRepresentante();
  const supabase = await createAdminClient();

  const prestamoId = getString(formData, "prestamo_id");
  const cantidad = getPositiveInt(formData, "cantidad");
  const comentario = getString(formData, "comentario") || "Devolución registrada por representante";

  const { data: prestamo, error: prestamoError } = await supabase
    .from("prestamos")
    .select("id, equipo_id, material_id, cantidad_prestada, cantidad_devuelta, estado")
    .eq("id", prestamoId)
    .single();

  if (prestamoError || !prestamo) {
    throw new Error(prestamoError?.message ?? "Préstamo no encontrado.");
  }

  if (prestamo.equipo_id !== equipoId || prestamo.estado !== "activo") {
    throw new Error("No puedes devolver este préstamo.");
  }

  const validationError = validarDevolucionPendiente(
    cantidad,
    prestamo.cantidad_prestada,
    prestamo.cantidad_devuelta
  );
  if (validationError) throw new Error(validationError);

  const nuevaDevuelta = (prestamo.cantidad_devuelta ?? 0) + cantidad;
  const nuevoEstado = nuevaDevuelta >= prestamo.cantidad_prestada ? "devuelto" : "activo";

  const { error: updateError } = await supabase
    .from("prestamos")
    .update({ cantidad_devuelta: nuevaDevuelta, estado: nuevoEstado })
    .eq("id", prestamo.id);

  if (updateError) throw new Error(updateError.message);

  const { error: movimientoError } = await supabase
    .from("movimientos")
    .insert({
      tipo: "entrada_devolucion",
      material_id: prestamo.material_id,
      cantidad,
      equipo_id: equipoId,
      usuario_id: representanteId,
      prestamo_id: prestamo.id,
      comentario,
    });

  if (movimientoError) throw new Error(movimientoError.message);

  revalidatePath("/equipo");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/materiales");
}

export async function consumirMaterial(formData: FormData) {
  const { representanteId, equipoId } = await requireRepresentante();
  const supabase = await createAdminClient();

  const materialId = getString(formData, "material_id");
  const cantidad = getPositiveInt(formData, "cantidad");
  const comentario = getString(formData, "comentario") || "Consumo reportado por representante";

  const { material, disponible } = await getDisponible(materialId);
  if (!esConsumible(material.categoria)) {
    throw new Error("Solo los materiales consumibles pueden reportarse como consumo.");
  }

  const validationError = validarCantidadDisponible(cantidad, disponible);
  if (validationError) throw new Error(validationError);

  const { error: updateError } = await supabase
    .from("materiales")
    .update({ cantidad_total: material.cantidad_total - cantidad })
    .eq("id", materialId);

  if (updateError) throw new Error(updateError.message);

  const { error: movimientoError } = await supabase
    .from("movimientos")
    .insert({
      tipo: "consumo",
      material_id: materialId,
      cantidad,
      equipo_id: equipoId,
      usuario_id: representanteId,
      comentario,
    });

  if (movimientoError) throw new Error(movimientoError.message);

  revalidatePath("/equipo");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/materiales");
}
