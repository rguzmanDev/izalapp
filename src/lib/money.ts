const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatMoney(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** Accepts "1059.65", "1,059.65" or "$1,059.65". Returns null when the input is not a valid amount. */
export function parseMoney(input: string): number | null {
  const normalized = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}