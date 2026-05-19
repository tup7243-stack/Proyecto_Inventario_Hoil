import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase browser client — para Client Components.
 * Configurado con Realtime para suscripciones postgres_changes.
 * Usa la anon key pública (NEXT_PUBLIC).
 */
export function createClient() {
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publishableKey!
  );
}
