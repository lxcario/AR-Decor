const formatterCache = new Map<string, Intl.NumberFormat>();

export function formatCurrency(value: number, currency = "TRY") {
  const locale = currency === "TRY" ? "tr-TR" : "en-US";
  const cacheKey = `${locale}:${currency}`;

  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    formatterCache.set(cacheKey, formatter);
  }

  return formatter.format(value);
}

export const formatUsd = (value: number) => formatCurrency(value, "TRY");