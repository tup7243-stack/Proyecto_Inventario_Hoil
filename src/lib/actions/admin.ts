"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type MaterialCategoria =
  | "herramienta_manual"
  | "consumible"
  | "equipo_proteccion"
  | "equipo_medicion";

export type MaterialEstado = "bueno" | "desgastado" | "dañado";
export type PerfilRol = "admin" | "representante";

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

function getNonNegativeInt(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} no puede ser negativo.`);
  }
  return value;
}

function getPassword(formData: FormData, key: string) {
  const value = getString(formData, key);
  if (value.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }
  return value;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesión requerida.");

  const { data: perfil, error } = await supabase
    .from("perfiles")
    .select("id, rol")
    .eq("id", user.id)
    .single();

  if (error || perfil?.rol !== "admin") {
    throw new Error("Solo un administrador puede realizar esta acción.");
  }

  return perfil.id as string;
}

export async function createMaterial(formData: FormData) {
  const adminId = await requireAdmin();
  const supabase = await createAdminClient();

  const nombre = getString(formData, "nombre");
  const categoria = getString(formData, "categoria") as MaterialCategoria;
  const estado = getString(formData, "estado") as MaterialEstado;
  const cantidad = getNonNegativeInt(formData, "cantidad_total");
  const stockMinimo = getNonNegativeInt(formData, "stock_minimo");

  if (!nombre) throw new Error("El nombre es requerido.");

  const { data: material, error } = await supabase
    .from("materiales")
    .insert({
      nombre,
      categoria,
      estado,
      cantidad_total: cantidad,
      stock_minimo: stockMinimo,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (cantidad > 0) {
    const { error: movimientoError } = await supabase
      .from("movimientos")
      .insert({
        tipo: "entrada_stock",
        material_id: material.id,
        cantidad,
        usuario_id: adminId,
        comentario: "Alta inicial de material",
      });

    if (movimientoError) throw new Error(movimientoError.message);
  }

  revalidatePath("/dashboard/materiales");
  revalidatePath("/dashboard");
}

export async function updateMaterial(formData: FormData) {
  await requireAdmin();
  const supabase = await createAdminClient();

  const id = getString(formData, "id");
  const nombre = getString(formData, "nombre");
  const categoria = getString(formData, "categoria") as MaterialCategoria;
  const estado = getString(formData, "estado") as MaterialEstado;
  const stockMinimo = getNonNegativeInt(formData, "stock_minimo");

  if (!id || !nombre) throw new Error("Material inválido.");

  const { error } = await supabase
    .from("materiales")
    .update({ nombre, categoria, estado, stock_minimo: stockMinimo })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/materiales");
  revalidatePath("/dashboard");
}

export async function deleteMaterial(formData: FormData) {
  const adminId = await requireAdmin();
  const supabase = await createAdminClient();
  const id = getString(formData, "id");

  if (!id) throw new Error("Material inválido.");

  const [{ data: material, error: materialError }, { count: prestamosActivos }] =
    await Promise.all([
      supabase
        .from("materiales")
        .select("nombre, cantidad_total, activo")
        .eq("id", id)
        .single(),
      supabase
        .from("prestamos")
        .select("id", { count: "exact", head: true })
        .eq("material_id", id)
        .eq("estado", "activo"),
    ]);

  if (materialError || !material) {
    throw new Error(materialError?.message ?? "Material no encontrado.");
  }

  if (!material.activo) throw new Error("El material ya fue eliminado.");

  if ((prestamosActivos ?? 0) > 0) {
    throw new Error(
      "No se puede eliminar mientras el material tenga préstamos activos por devolver."
    );
  }

  const { error: updateError } = await supabase
    .from("materiales")
    .update({ activo: false, eliminado_at: new Date().toISOString() })
    .eq("id", id);
  if (updateError) throw new Error(updateError.message);

  const { error: movimientoError } = await supabase.from("movimientos").insert({
    tipo: "eliminacion_material",
    material_id: id,
    cantidad: material.cantidad_total,
    usuario_id: adminId,
    comentario: `Material eliminado: ${material.nombre}`,
  });
  if (movimientoError) throw new Error(movimientoError.message);

  revalidatePath("/dashboard/materiales");
  revalidatePath("/dashboard");
}

export async function addMaterialStock(formData: FormData) {
  const adminId = await requireAdmin();
  const supabase = await createAdminClient();

  const id = getString(formData, "id");
  const cantidad = getPositiveInt(formData, "cantidad");
  const comentario = getString(formData, "comentario") || "Entrada de stock";

  const { data: material, error: materialError } = await supabase
    .from("materiales")
    .select("cantidad_total")
    .eq("id", id)
    .eq("activo", true)
    .single();

  if (materialError || !material) {
    throw new Error(materialError?.message ?? "Material no encontrado.");
  }

  const { error: updateError } = await supabase
    .from("materiales")
    .update({ cantidad_total: material.cantidad_total + cantidad })
    .eq("id", id);

  if (updateError) throw new Error(updateError.message);

  const { error: movimientoError } = await supabase
    .from("movimientos")
    .insert({
      tipo: "entrada_stock",
      material_id: id,
      cantidad,
      usuario_id: adminId,
      comentario,
    });

  if (movimientoError) throw new Error(movimientoError.message);

  revalidatePath("/dashboard/materiales");
  revalidatePath("/dashboard");
}

export async function createEquipo(formData: FormData) {
  await requireAdmin();
  const supabase = await createAdminClient();
  const nombre = getString(formData, "nombre");

  if (!nombre) throw new Error("El nombre del equipo es requerido.");

  const { error } = await supabase.from("equipos").insert({ nombre });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/equipos");
  revalidatePath("/dashboard/usuarios");
}

export async function updateEquipo(formData: FormData) {
  await requireAdmin();
  const supabase = await createAdminClient();
  const id = getString(formData, "id");
  const nombre = getString(formData, "nombre");

  if (!id || !nombre) throw new Error("Equipo inválido.");

  const { error } = await supabase
    .from("equipos")
    .update({ nombre })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/equipos");
  revalidatePath("/dashboard/usuarios");
}

export async function deleteEquipo(formData: FormData) {
  await requireAdmin();
  const supabase = await createAdminClient();
  const id = getString(formData, "id");

  if (!id) throw new Error("Equipo inválido.");

  const [{ count: perfilesCount }, { count: prestamosCount }] =
    await Promise.all([
      supabase
        .from("perfiles")
        .select("id", { count: "exact", head: true })
        .eq("equipo_id", id),
      supabase
        .from("prestamos")
        .select("id", { count: "exact", head: true })
        .eq("equipo_id", id),
    ]);

  if ((perfilesCount ?? 0) > 0 || (prestamosCount ?? 0) > 0) {
    throw new Error(
      "No se puede eliminar porque el equipo tiene representantes o historial de préstamos."
    );
  }

  const { error } = await supabase.from("equipos").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/equipos");
  revalidatePath("/dashboard/usuarios");
  revalidatePath("/dashboard");
}

export async function updatePerfil(formData: FormData) {
  await requireAdmin();
  const supabase = await createAdminClient();

  const id = getString(formData, "id");
  const nombre = getString(formData, "nombre");
  const matricula = getString(formData, "matricula");
  const rol = getString(formData, "rol") as PerfilRol;
  const equipoId = getString(formData, "equipo_id");

  if (!id || !nombre || !matricula) throw new Error("Perfil inválido.");

  const { error } = await supabase
    .from("perfiles")
    .update({
      nombre,
      matricula,
      rol,
      equipo_id: rol === "representante" && equipoId ? equipoId : null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/usuarios");
  revalidatePath("/dashboard/equipos");
}

export async function createUsuario(formData: FormData) {
  await requireAdmin();
  const supabase = await createAdminClient();

  const nombre = getString(formData, "nombre");
  const matricula = getString(formData, "matricula");
  const email = getString(formData, "email").toLowerCase();
  const password = getPassword(formData, "password");
  const rol = getString(formData, "rol") as PerfilRol;
  const equipoId = getString(formData, "equipo_id");

  if (!nombre || !matricula || !email) {
    throw new Error("Nombre, matrícula y correo son requeridos.");
  }

  const { data, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !data.user) {
    throw new Error(
      authError?.message.includes("already")
        ? "Ya existe una cuenta con ese correo."
        : authError?.message ?? "No se pudo crear la cuenta."
    );
  }

  const { error: perfilError } = await supabase.from("perfiles").insert({
    id: data.user.id,
    nombre,
    matricula,
    rol,
    equipo_id: rol === "representante" && equipoId ? equipoId : null,
  });

  if (perfilError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    throw new Error(
      perfilError.code === "23505"
        ? "La matrícula ya está registrada."
        : perfilError.message
    );
  }

  revalidatePath("/dashboard/usuarios");
  revalidatePath("/dashboard/equipos");
}

export async function resetUsuarioPassword(formData: FormData) {
  await requireAdmin();
  const supabase = await createAdminClient();
  const id = getString(formData, "id");
  const password = getPassword(formData, "password");

  if (!id) throw new Error("Usuario inválido.");

  const { error } = await supabase.auth.admin.updateUserById(id, {
    password,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/usuarios");
}

export async function deletePerfil(formData: FormData) {
  const adminId = await requireAdmin();
  const supabase = await createAdminClient();
  const id = getString(formData, "id");

  if (!id) throw new Error("Usuario inválido.");
  if (id === adminId) {
    throw new Error("No puedes eliminar tu propio usuario mientras tienes sesión activa.");
  }

  const [{ count: prestamosCount }, { count: movimientosCount }] =
    await Promise.all([
      supabase
        .from("prestamos")
        .select("id", { count: "exact", head: true })
        .eq("representante_id", id),
      supabase
        .from("movimientos")
        .select("id", { count: "exact", head: true })
        .eq("usuario_id", id),
    ]);

  if ((prestamosCount ?? 0) > 0 || (movimientosCount ?? 0) > 0) {
    throw new Error(
      "No se puede eliminar porque el usuario ya tiene historial de préstamos o movimientos."
    );
  }

  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/usuarios");
  revalidatePath("/dashboard/equipos");
}
