import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { seedMateriales } from "./seed-data";

/**
 * Script de seed: población inicial de la base de datos.
 *
 * Ejecutar con: npx tsx src/lib/db/seed.ts
 *
 * Requiere las variables de entorno:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY (para crear usuarios y bypass RLS)
 *
 * Crea:
 * - 10 materiales iniciales (catálogo del taller de refrigeración)
 * - 2 equipos
 * - 1 admin + 2 representantes (con usuarios en auth.users)
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY son requeridas."
  );
  console.error("Asegurate de tener el archivo .env.local configurado.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: WebSocket as unknown as typeof globalThis.WebSocket,
  },
});

// ============================================================
// DATOS SEED
// ============================================================

const equiposSeed = [
  { nombre: "Equipo 1 - Refrigeración" },
  { nombre: "Equipo 2 - Climatización" },
];

const usuariosSeed = [
  {
    email: "admin@cecyte.edu.mx",
    password: "Admin123!",
    perfil: {
      matricula: "0001",
      nombre: "Administrador CECYTE",
      rol: "admin" as const,
      equipo_id: null as string | null,
    },
  },
  {
    email: "rep1@cecyte.edu.mx",
    password: "Rep12345!",
    perfil: {
      matricula: "7433",
      nombre: "María López",
      rol: "representante" as const,
      equipo_id: null as string | null, // se asigna después de crear equipos
    },
  },
  {
    email: "rep2@cecyte.edu.mx",
    password: "Rep12345!",
    perfil: {
      matricula: "8521",
      nombre: "Carlos Hernández",
      rol: "representante" as const,
      equipo_id: null as string | null,
    },
  },
];

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

async function crearUsuarioAuth(email: string, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    // Si el usuario ya existe, obtenerlo
    if (error.message?.includes("already been registered")) {
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users?.find((u) => u.email === email);
      if (found) return found;
    }
    throw new Error(`Error creando usuario auth ${email}: ${error.message}`);
  }

  return data.user;
}

// ============================================================
// SEED PRINCIPAL
// ============================================================

async function seed() {
  console.log("🌱 Iniciando seed de la base de datos...\n");

  // --- 1. Crear equipos ---
  console.log("📦 Creando equipos...");
  const equiposCreados: { id: string; nombre: string }[] = [];

  for (const eq of equiposSeed) {
    const { data, error } = await supabase
      .from("equipos")
      .insert({ nombre: eq.nombre })
      .select("id, nombre")
      .single();

    if (error) {
      console.error(`  ❌ Error creando equipo "${eq.nombre}":`, error.message);
    } else {
      console.log(`  ✅ Equipo creado: ${data.nombre} (${data.id})`);
      equiposCreados.push(data);
    }
  }

  if (equiposCreados.length < 2) {
    console.error("  ❌ No se pudieron crear los 2 equipos. Abortando.");
    process.exit(1);
  }

  // Asignar equipo_id a representantes
  usuariosSeed[1].perfil.equipo_id = equiposCreados[0].id;
  usuariosSeed[2].perfil.equipo_id = equiposCreados[1].id;

  // --- 2. Crear usuarios en auth.users + perfiles ---
  console.log("\n👤 Creando usuarios...");

  for (const u of usuariosSeed) {
    try {
      const authUser = await crearUsuarioAuth(u.email, u.password);

      // Insertar perfil vinculado al auth user
      const { error: perfilError } = await supabase.from("perfiles").upsert({
        id: authUser.id,
        matricula: u.perfil.matricula,
        nombre: u.perfil.nombre,
        rol: u.perfil.rol,
        equipo_id: u.perfil.equipo_id,
      });

      if (perfilError) {
        console.error(
          `  ❌ Error creando perfil de ${u.perfil.nombre}:`,
          perfilError.message
        );
      } else {
        console.log(
          `  ✅ Usuario creado: ${u.perfil.nombre} (${u.perfil.rol}) — matrícula: ${u.perfil.matricula}`
        );
      }
    } catch (err: unknown) {
      console.error(`  ❌ ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // --- 3. Crear materiales iniciales ---
  console.log("\n🔧 Creando materiales del catálogo...");

  for (const mat of seedMateriales) {
    const { data, error } = await supabase
      .from("materiales")
      .insert({
        nombre: mat.nombre,
        categoria: mat.categoria,
        cantidad_total: mat.cantidad_total,
        stock_minimo: mat.stock_minimo,
        estado: mat.estado,
      })
      .select("id, nombre")
      .single();

    if (error) {
      console.error(`  ❌ Error creando "${mat.nombre}":`, error.message);
    } else {
      console.log(
        `  ✅ Material creado: ${data.nombre} (stock: ${mat.cantidad_total}, mín: ${mat.stock_minimo})`
      );
    }
  }

  console.log("\n🎉 Seed completado exitosamente.");
  console.log("\nCredenciales de prueba:");
  console.log("  Admin:     admin@cecyte.edu.mx / Admin123!");
  console.log("  Rep 1:     rep1@cecyte.edu.mx / Rep12345!");
  console.log("  Rep 2:     rep2@cecyte.edu.mx / Rep12345!");
}

seed().catch((err) => {
  console.error("\n❌ Error durante el seed:", err);
  process.exit(1);
});
