const fs = require('fs');
const WebSocket = require('ws');

for (const path of ['.env.local', '.env']) {
  if (!fs.existsSync(path)) continue;
  for (const raw of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const idx = raw.indexOf('=');
    const key = raw.slice(0, idx).trim();
    const value = raw.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket },
  global: { headers: { Authorization: `Bearer ${serviceKey}` } },
});

const batch = 'Carga inventario físico 2026-06-10';
const rawItems = [
  ['Niveleta', 4, 'herramienta_manual'],
  ['Prensas para avellanar', 4, 'herramienta_manual'],
  ['Chispero', 5, 'herramienta_manual'],
  ['Dobladora de tubería cobre', 2, 'herramienta_manual'],
  ['Llaves mixtas', 24, 'herramienta_manual'],
  ['Pelacables manual', 7, 'herramienta_manual'],
  ['Pinza de corte diagonal', 6, 'herramienta_manual'],
  ['Pinza electricista', 12, 'herramienta_manual'],
  ['Pinza de presión', 4, 'herramienta_manual'],
  ['Pinza de punta', 5, 'herramienta_manual'],
  ['Pinza mecánica', 7, 'herramienta_manual'],
  ['Avellanador', 4, 'herramienta_manual'],
  ['Desarmador de punta de cruz', 16, 'herramienta_manual'],
  ['Desarmador de punta plana', 19, 'herramienta_manual'],
  ['Expansor de golpe', 5, 'herramienta_manual'],
  ['Manómetro', 7, 'equipo_medicion'],
  ['Vacumetros marca supco', 1, 'equipo_medicion'],
  ['Navaja', 1, 'herramienta_manual'],
  ['Flexometro', 3, 'equipo_medicion'],
  ['Corta tubo chico', 6, 'herramienta_manual'],
  ['Corta tubo grande', 4, 'herramienta_manual'],
  ['Taladro alámbrico', 7, 'herramienta_manual'],
  ['Espátula', 13, 'herramienta_manual'],
  ['Tester', 4, 'equipo_medicion'],
  ['Pericas', 8, 'herramienta_manual'],
  ['Arco metálico para segueta', 2, 'herramienta_manual'],
  ['Serrucho', 1, 'herramienta_manual'],
  ['Remachadora tipo tijera', 5, 'herramienta_manual'],
  ['Pinza de presión hojalatero', 1, 'herramienta_manual'],
  ['Pinza de presión tipo C', 2, 'herramienta_manual'],
  ['Pinza de presión soldadora', 2, 'herramienta_manual'],
  ['Esmeril', 3, 'herramienta_manual'],
  ['Pica hielo', 9, 'herramienta_manual'],
  ['Martillo', 6, 'herramienta_manual'],
  ['Maso de goma', 6, 'herramienta_manual'],
  ['Marro', 3, 'herramienta_manual'],
  ['Escalera de 7 peldaños', 2, 'herramienta_manual'],
  ['Extensión eléctrica 220V', 4, 'herramienta_manual'],
  ['Extensión eléctrica 110V', 11, 'herramienta_manual'],
  ['Manguera de PVC para compresor de aire 10 mts', 4, 'herramienta_manual'],
  ['Compresor de aire lubricado de 50 litros', 1, 'herramienta_manual'],
  ['Bomba de vacío', 4, 'herramienta_manual'],
  ['Bomba de vacío', 4, 'herramienta_manual'],
  ['Cuerda de vida', 3, 'equipo_proteccion'],
  ['Amperímetro gancho digital', 7, 'equipo_medicion'],
  ['Sierra caladora', 3, 'herramienta_manual'],
  ['Esmeril de banco', 1, 'herramienta_manual'],
  ['Prensas de banco', 10, 'herramienta_manual'],
];

function norm(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

const combined = new Map();
for (const [nombre, cantidad, categoria] of rawItems) {
  const key = norm(nombre);
  const existing = combined.get(key);
  if (existing) existing.cantidad += cantidad;
  else combined.set(key, { nombre, cantidad, categoria });
}
const items = [...combined.values()];

async function findAdminId() {
  const wantedEmail = 'tup7243@tecplayacar.edu.mx';
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === wantedEmail);
    if (found) return found.id;
    if (data.users.length < 1000) break;
  }
  const { data: perfil, error } = await supabase.from('perfiles').select('id').eq('rol', 'admin').limit(1).maybeSingle();
  if (error) throw error;
  if (!perfil) throw new Error('No encontré perfil admin para registrar movimientos.');
  return perfil.id;
}

(async () => {
  const adminId = await findAdminId();
  const { data: existingMaterials, error: matError } = await supabase
    .from('materiales')
    .select('id,nombre,cantidad_total,activo');
  if (matError) throw matError;

  const materialByName = new Map((existingMaterials || []).filter((m) => m.activo !== false).map((m) => [norm(m.nombre), m]));
  const results = [];

  for (const item of items) {
    const comment = `${batch}: ${item.nombre}`;
    const { data: existingMovement, error: movementCheckError } = await supabase
      .from('movimientos')
      .select('id')
      .eq('tipo', 'entrada_stock')
      .eq('comentario', comment)
      .maybeSingle();
    if (movementCheckError) throw movementCheckError;
    if (existingMovement) {
      results.push({ nombre: item.nombre, cantidad: item.cantidad, accion: 'omitido_por_batch_existente' });
      continue;
    }

    let material = materialByName.get(norm(item.nombre));
    if (material) {
      const nuevoTotal = Number(material.cantidad_total || 0) + item.cantidad;
      const { error: updateError } = await supabase
        .from('materiales')
        .update({ cantidad_total: nuevoTotal, estado: 'bueno' })
        .eq('id', material.id);
      if (updateError) throw updateError;
      material.cantidad_total = nuevoTotal;
      results.push({ nombre: item.nombre, cantidad: item.cantidad, accion: 'sumado', total: nuevoTotal });
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('materiales')
        .insert({ nombre: item.nombre, categoria: item.categoria, cantidad_total: item.cantidad, stock_minimo: 1, estado: 'bueno', activo: true })
        .select('id,nombre,cantidad_total,activo')
        .single();
      if (insertError) throw insertError;
      material = inserted;
      materialByName.set(norm(item.nombre), material);
      results.push({ nombre: item.nombre, cantidad: item.cantidad, accion: 'creado', total: item.cantidad });
    }

    const { error: movError } = await supabase.from('movimientos').insert({
      tipo: 'entrada_stock', material_id: material.id, cantidad: item.cantidad, usuario_id: adminId, comentario: comment,
    });
    if (movError) throw movError;
  }

  console.log(JSON.stringify({ batch, total_items: items.length, results }, null, 2));
})().catch((error) => {
  console.error('ERROR:', error.message || error);
  process.exit(1);
});
