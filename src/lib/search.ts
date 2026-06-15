export function getSearchParam(searchParams?: { q?: string | string[] }) {
  const value = searchParams?.q;
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw ?? "").trim();
}

export function normalizeSearch(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesSearch(query: string, values: unknown[]) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;

  return values.some((value) => normalizeSearch(value).includes(normalizedQuery));
}
