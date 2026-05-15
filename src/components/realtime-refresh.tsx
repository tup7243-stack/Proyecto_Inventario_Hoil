"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Wifi } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const WATCHED_TABLES = ["materiales", "prestamos", "movimientos"] as const;

interface RealtimeRefreshProps {
  label?: string;
  showStatus?: boolean;
}

/**
 * Suscribe la vista actual a cambios de inventario en Supabase Realtime.
 * Cuando cambian materiales, préstamos o movimientos, refresca Server Components
 * con debounce para evitar múltiples refresh seguidos durante una misma acción.
 */
export function RealtimeRefresh({
  label = "Actualizaciones en vivo",
  showStatus = false,
}: RealtimeRefreshProps) {
  const router = useRouter();
  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("inventory-realtime-refresh");

    for (const table of WATCHED_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          setRefreshing(true);
          if (refreshTimeout.current) clearTimeout(refreshTimeout.current);

          refreshTimeout.current = setTimeout(() => {
            router.refresh();
            setRefreshing(false);
          }, 500);
        }
      );
    }

    channel.subscribe((status) => {
      setConnected(status === "SUBSCRIBED");
    });

    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  if (!showStatus) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-muted-foreground shadow-sm">
      {refreshing ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-cecyte-primary" />
      ) : (
        <Wifi
          className={
            connected
              ? "h-3.5 w-3.5 text-green-600"
              : "h-3.5 w-3.5 text-muted-foreground"
          }
        />
      )}
      <span>{refreshing ? "Actualizando…" : label}</span>
    </div>
  );
}
