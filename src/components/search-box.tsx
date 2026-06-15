import Link from "next/link";
import { Search, X } from "lucide-react";

interface SearchBoxProps {
  value: string;
  placeholder: string;
  total: number;
  filtered: number;
  clearHref?: string;
  hiddenFields?: Record<string, string | undefined>;
}

export function SearchBox({
  value,
  placeholder,
  total,
  filtered,
  clearHref = "?",
  hiddenFields = {},
}: SearchBoxProps) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {Object.entries(hiddenFields).map(([name, fieldValue]) =>
          fieldValue ? (
            <input key={name} type="hidden" name={name} value={fieldValue} />
          ) : null
        )}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={value}
            placeholder={placeholder}
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-cecyte-primary focus:ring-1 focus:ring-cecyte-primary"
          />
        </div>
        <div className="flex gap-2">
          <button className="rounded-md bg-cecyte-primary px-4 py-2 text-sm font-medium text-white hover:bg-cecyte-dark">
            Buscar
          </button>
          {value && (
            <Link
              href={clearHref}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <X className="h-4 w-4" />
              Limpiar
            </Link>
          )}
        </div>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        {value ? `${filtered} de ${total} resultados` : `${total} registros`}
      </p>
    </section>
  );
}
