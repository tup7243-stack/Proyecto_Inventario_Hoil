import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Package,
  Users,
  Shield,
  FileText,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/materiales", label: "Materiales", icon: Package },
  { href: "/dashboard/equipos", label: "Equipos", icon: Users },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: Shield },
  { href: "/dashboard/reportes", label: "Reportes", icon: FileText },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar que sea admin
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, nombre")
    .eq("id", user.id)
    .single();

  if (perfil?.rol !== "admin") {
    redirect("/equipo");
  }

  return (
    <div className="flex min-h-screen flex-col md:h-screen md:overflow-hidden">
      {/* Sidebar — Desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:h-screen md:w-64 md:flex-col md:overflow-hidden md:border-r md:bg-cecyte-primary md:text-white">
        {/* Logo / Brand */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-5 py-4">
          <Package className="h-6 w-6" />
          <span className="text-lg font-bold">Inventario CECYTE</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <NavLink key={href} href={href}>
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/10 px-3 py-3">
          <p className="px-3 text-xs text-white/60">
            {perfil?.nombre ?? "Administrador"}
          </p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50 pb-20 md:ml-64 md:h-screen md:overflow-y-auto md:pb-0">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          <div className="mb-4 flex justify-end">
            <RealtimeRefresh showStatus />
          </div>
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar — Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-cecyte-primary md:hidden">
        <div className="flex items-center justify-around">
          {navItems.map(({ href, label, icon: Icon }) => (
            <MobileNavLink key={href} href={href}>
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{label}</span>
            </MobileNavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** Desktop nav link with active state */
function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  // For the desktop sidebar, we use a simple client-like check.
  // In server components we can't access pathname easily, so we use
  // a data attribute and match with CSS or a client component.
  // For simplicity, all links are rendered; active state is applied
  // by a client wrapper.

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}

/** Mobile bottom tab link */
function MobileNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 px-2 py-2 text-white/70 transition-colors hover:text-white"
    >
      {children}
    </Link>
  );
}
