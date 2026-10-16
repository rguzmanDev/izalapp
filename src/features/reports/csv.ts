/** Escape a CSV cell (RFC-style quotes). */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function csvRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(csvCell).join(",");
}

/** Amount in dollars with two decimals (no currency symbol). */
export function csvMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Build a CSV document from labeled tables separated by blank lines. */
export function buildCsvDocument(
  tables: { title: string; headers: string[]; rows: Array<Array<string | number | null | undefined>> }[],
): string {
  const parts: string[] = [];
  for (const table of tables) {
    parts.push(csvRow([`# ${table.title}`]));
    parts.push(csvRow(table.headers));
    for (const row of table.rows) parts.push(csvRow(row));
    parts.push("");
  }
  // BOM helps Excel open UTF-8 correctly
  return `\uFEFF${parts.join("\n")}`;
}
