import { REPORT_RANGES } from "@/features/reports/components/range-selector";
import { buildReportsCsv } from "@/features/reports/export-csv";
import { requireUser } from "@/lib/session";

function parseRange(value: string | null): number {
  const range = Number(value);
  return REPORT_RANGES.find((option) => option === range) ?? REPORT_RANGES[0];
}

export async function GET(request: Request) {
  const user = await requireUser();
  const range = parseRange(new URL(request.url).searchParams.get("quincenas"));
  const csv = await buildReportsCsv(user.id, range);
  const filename = `izalapp-reportes-${range}q.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
