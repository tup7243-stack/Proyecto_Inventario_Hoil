"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, LogIn, Package, UserPlus } from "lucide-react";

/**
 * Login page — email/password authentication via Supabase Auth.
 *
 * Spec: auth-session / Login success → redirect by role
 * Spec: auth-session / Login failure → show error, no session
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const callbackError = new URLSearchParams(window.location.search).get("error");
    if (callbackError) setError(callbackError);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!data.user) {
        setError("No se pudo iniciar sesión. Verifica tus credenciales.");
        return;
      }

      // Obtener rol desde la tabla perfiles (extensión del dominio)
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", data.user.id)
        .single();

      // Redirect basado en rol (design: admin → /dashboard, representante → /equipo)
      const dashboard =
        perfil?.rol === "admin" ? "/dashboard" : "/equipo";
      router.push(dashboard);
      router.refresh();
    } catch {
      setError("Error inesperado al iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch {
      setError("No se pudo iniciar sesión con Google.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cecyte-light p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        {/* Logo / header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cecyte-primary">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Inventario CECYTE
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Taller de Refrigeración — Inicia sesión con tu matrícula
            institucional
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Correo institucional
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.matricula@cecyte.edu.mx"
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-cecyte-primary focus:outline-none focus:ring-1 focus:ring-cecyte-primary disabled:opacity-50"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Escribe tu contraseña"
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 pr-11 text-sm shadow-sm placeholder:text-muted-foreground focus:border-cecyte-primary focus:outline-none focus:ring-1 focus:ring-cecyte-primary disabled:opacity-50"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-cecyte-primary hover:bg-cecyte-dark"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión…
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar sesión
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">o</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={handleGoogleSignIn}
          >
            Continuar con Google
          </Button>
        </form>

        <div className="rounded-lg border border-cecyte-primary/20 bg-cecyte-light/60 p-4 text-sm text-muted-foreground">
          <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
            <UserPlus className="h-4 w-4 text-cecyte-primary" />
            ¿Necesitas una cuenta?
          </div>
          <p>
            Un administrador debe agregarte manualmente desde el módulo de{" "}
            <strong>Usuarios</strong>. Iniciar con Google solo valida tu correo;
            no crea permisos automáticamente si tu perfil no existe.
          </p>
        </div>
      </div>
    </div>
  );
}
