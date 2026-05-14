import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase browser client — para Client Components.
 * Configurado con Realtime para suscripciones postgres_changes.
 * Usa la anon key pública (NEXT_PUBLIC).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
