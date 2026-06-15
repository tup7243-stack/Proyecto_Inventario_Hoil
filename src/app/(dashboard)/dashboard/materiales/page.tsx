import {
  ImageIcon,
  PackagePlus,
  Pencil,
  PlusCircle,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  addMaterialStock,
  createMaterial,
  deleteMaterial,
  deleteMaterialImage,
  updateMaterial,
  updateMaterialImage,
} from "@/lib/actions/admin";
import { ManagedForm } from "@/components/forms/managed-form";
import { SearchBox } from "@/components/search-box";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { getSearchParam, matchesSearch } from "@/lib/search";

const categorias = [
  ["herramienta_manual", "Herramienta manual"],
  ["consumible", "Consumible"],
  ["equipo_proteccion", "Equipo de protección"],
  ["equipo_medicion", "Equipo de medición"],
] as const;

const estados = [
  ["bueno", "Bueno"],
  ["desgastado", "Desgastado"],
  ["dañado", "Dañado"],
] as const;

const categoriaLabel = new Map<string, string>(categorias);
const estadoLabel = new Map<string, string>(estados);

interface MaterialRow {
  id: string;
  nombre: string;
  categoria: string;
  cantidad_total: number;
  stock_minimo: number;
  estado: string;
  imagen_url: string | null;
}

interface PrestamoRow {
  material_id: string;
  cantidad_prestada: number;
  cantidad_devuelta: number | null;
}

function labelFor(map: Map<string, string>, value: string) {
  return map.get(value) ?? value;
}

function MaterialImage({ material }: { material: MaterialRow }) {
  if (material.imagen_url) {
    return (
      <div
        role="img"
        aria-label={`Imagen de ${material.nombre}`}
        className="h-full w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${material.imagen_url})` }}
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-cecyte-light text-cecyte-primary">
      <ImageIcon className="h-7 w-7" />
      <span className="text-[10px] font-medium">Sin imagen</span>
    </div>
  );
}

export default async function MaterialesPage({
  searchParams,
}: {
  searchParams?: { q?: string | string[] };
}) {
  const search = getSearchParam(searchParams);
  const supabase = await createClient();
  const [{ data: materiales }, { data: prestamos }] = await Promise.all([
    supabase
      .from("materiales")
      .select("id, nombre, categoria, cantidad_total, stock_minimo, estado, imagen_url")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("prestamos")
      .select("material_id, cantidad_prestada, cantidad_devuelta")
      .eq("estado", "activo"),
  ]);

  const prestadoPorMaterial = new Map<string, number>();
  for (const prestamo of (prestamos ?? []) as PrestamoRow[]) {
    const pendiente =
      prestamo.cantidad_prestada - (prestamo.cantidad_devuelta ?? 0);
    prestadoPorMaterial.set(
      prestamo.material_id,
      (prestadoPorMaterial.get(prestamo.material_id) ?? 0) + pendiente
    );
  }

  const allMaterials = (materiales ?? []) as MaterialRow[];
  const filteredMaterials = allMaterials.filter((material) =>
    matchesSearch(search, [
      material.nombre,
      material.categoria,
      labelFor(categoriaLabel, material.categoria),
      material.estado,
      labelFor(estadoLabel, material.estado),
    ])
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Materiales</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo visual, stock y entradas de inventario.
          </p>
        </div>
        <p className="rounded-full bg-cecyte-light px-3 py-1 text-xs font-medium text-cecyte-primary">
          {filteredMaterials.length} materiales activos
        </p>
      </div>

      <details className="group rounded-xl border bg-card shadow-sm" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-cecyte-primary" />
            <div>
              <h2 className="font-semibold">Nuevo material</h2>
              <p className="text-xs text-muted-foreground">
                Agrega solo lo necesario; la imagen es opcional.
              </p>
            </div>
          </div>
          <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground group-open:hidden">
            Abrir
          </span>
        </summary>
        <div className="border-t p-4 pt-5">
          <ManagedForm
            action={createMaterial}
            successMessage="Material guardado correctamente."
            resetOnSuccess
            className="grid gap-3 md:grid-cols-6"
          >
            <input
              name="nombre"
              placeholder="Nombre del material"
              required
              className="rounded-md border px-3 py-2 text-sm md:col-span-2"
            />
            <select name="categoria" className="rounded-md border px-3 py-2 text-sm">
              {categorias.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Cantidad inicial
              <input
                name="cantidad_total"
                type="number"
                min="0"
                defaultValue="0"
                className="rounded-md border px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Stock mínimo
              <input
                name="stock_minimo"
                type="number"
                min="0"
                defaultValue="1"
                className="rounded-md border px-3 py-2 text-sm text-foreground"
              />
            </label>
            <select name="estado" className="rounded-md border px-3 py-2 text-sm">
              {estados.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground md:col-span-3">
              Imagen guía opcional
              <input
                name="imagen"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="rounded-md border px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-cecyte-light file:px-3 file:py-1 file:text-xs file:font-medium file:text-cecyte-primary"
              />
            </label>
            <button className="rounded-md bg-cecyte-primary px-4 py-2 text-sm font-medium text-white hover:bg-cecyte-dark md:col-span-3 md:self-end">
              Guardar material
            </button>
          </ManagedForm>
        </div>
      </details>

      <SearchBox
        value={search}
        placeholder="Buscar por nombre, categoría o estado..."
        total={allMaterials.length}
        filtered={filteredMaterials.length}
        clearHref="/dashboard/materiales"
      />

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredMaterials.map((material) => {
          const prestado = prestadoPorMaterial.get(material.id) ?? 0;
          const disponible = Math.max(0, material.cantidad_total - prestado);
          const bajo = disponible <= material.stock_minimo;

          return (
            <article key={material.id} className="overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md">
              <div className="grid gap-4 p-4 sm:grid-cols-[112px_1fr]">
                <div className="h-28 overflow-hidden rounded-lg border bg-muted">
                  <MaterialImage material={material} />
                </div>

                <div className="min-w-0 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-foreground">
                        {material.nombre}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {labelFor(categoriaLabel, material.categoria)} · {labelFor(estadoLabel, material.estado)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "w-fit rounded-full px-3 py-1 text-xs font-medium",
                        bajo
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                      )}
                    >
                      {bajo ? "Stock bajo" : "Stock OK"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-cecyte-light p-2">
                      <p className="font-semibold text-cecyte-primary">{disponible}</p>
                      <p className="text-muted-foreground">Disponible</p>
                    </div>
                    <div className="rounded-lg bg-muted p-2">
                      <p className="font-semibold text-foreground">{material.cantidad_total}</p>
                      <p className="text-muted-foreground">Total</p>
                    </div>
                    <div className="rounded-lg bg-muted p-2">
                      <p className="font-semibold text-foreground">{material.stock_minimo}</p>
                      <p className="text-muted-foreground">Mínimo</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 border-t bg-muted/20 p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                <details className="min-w-0 rounded-lg border bg-background p-3 lg:col-start-1 lg:row-start-1">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
                    <Pencil className="h-4 w-4 text-cecyte-primary" />
                    Editar datos
                  </summary>
                  <ManagedForm
                    action={updateMaterial}
                    successMessage="Datos del material actualizados."
                    className="mt-3 grid gap-3 md:grid-cols-2"
                  >
                    <input type="hidden" name="id" value={material.id} />
                    <input
                      name="nombre"
                      defaultValue={material.nombre}
                      className="rounded-md border px-3 py-2 text-sm md:col-span-2"
                    />
                    <select name="categoria" defaultValue={material.categoria} className="rounded-md border px-3 py-2 text-sm">
                      {categorias.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <input
                      name="stock_minimo"
                      type="number"
                      min="0"
                      defaultValue={material.stock_minimo}
                      className="rounded-md border px-3 py-2 text-sm"
                    />
                    <select name="estado" defaultValue={material.estado} className="rounded-md border px-3 py-2 text-sm md:col-span-2">
                      {estados.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted md:col-span-2">
                      Actualizar datos
                    </button>
                  </ManagedForm>
                </details>

                <details className="min-w-0 rounded-lg border bg-background p-3 lg:col-start-2 lg:row-start-1">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
                    <PackagePlus className="h-4 w-4 text-cecyte-primary" />
                    Entrada
                  </summary>
                  <ManagedForm
                    action={addMaterialStock}
                    successMessage="Entrada de stock registrada."
                    className="mt-3"
                  >
                    <input type="hidden" name="id" value={material.id} />
                    <input
                      name="cantidad"
                      type="number"
                      min="1"
                      defaultValue="1"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <input
                      name="comentario"
                      placeholder="Comentario opcional"
                      className="mt-2 w-full rounded-md border px-3 py-2 text-xs"
                    />
                    <button className="mt-2 w-full rounded-md bg-cecyte-primary px-3 py-2 text-sm font-medium text-white hover:bg-cecyte-dark">
                      Añadir stock
                    </button>
                  </ManagedForm>
                </details>

                <details className="min-w-0 rounded-lg border bg-background p-3 lg:col-start-1 lg:row-start-2">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
                    <UploadCloud className="h-4 w-4 text-cecyte-primary" />
                    Imagen guía
                  </summary>
                  <ManagedForm
                    action={updateMaterialImage}
                    successMessage="Imagen actualizada."
                    className="mt-3 grid gap-2"
                  >
                    <input type="hidden" name="id" value={material.id} />
                    <input
                      name="imagen"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      required
                      className="min-w-0 rounded-md border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-cecyte-light file:px-3 file:py-1 file:text-xs file:font-medium file:text-cecyte-primary"
                    />
                    <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
                      Subir
                    </button>
                  </ManagedForm>
                  {material.imagen_url && (
                    <ManagedForm
                      action={deleteMaterialImage}
                      successMessage="Imagen eliminada."
                      confirmMessage={`¿Quitar la imagen de "${material.nombre}"?`}
                      className="mt-2"
                    >
                      <input type="hidden" name="id" value={material.id} />
                      <button className="text-xs font-medium text-red-700 hover:underline">
                        Quitar imagen actual
                      </button>
                    </ManagedForm>
                  )}
                </details>

                <ManagedForm
                  action={deleteMaterial}
                  successMessage="Material eliminado."
                  confirmMessage={`¿Eliminar "${material.nombre}"? Se ocultará del catálogo y quedará registro en reportes.`}
                  className="self-start rounded-lg border border-red-100 bg-red-50 p-3 lg:col-start-2 lg:row-start-2"
                >
                  <input type="hidden" name="id" value={material.id} />
                  <button className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </ManagedForm>
              </div>
            </article>
          );
        })}
        {filteredMaterials.length === 0 && (
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm xl:col-span-2">
            No encontramos materiales con ese texto.
          </div>
        )}
      </section>
    </div>
  );
}
