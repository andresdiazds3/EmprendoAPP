export function formatCurrency(value: number | string, locale = "es-CO", currency = "COP") {
  const numeric = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(numeric);
}

export function formatDate(date: Date, locale = "es-CO") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
