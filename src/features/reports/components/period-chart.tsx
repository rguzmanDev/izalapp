"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/** Amounts in dollars (not cents) so the chart axis and tooltip read naturally. */
export type PeriodChartPoint = {
  label: string;
  fixed: number;
  budgets: number;
  other: number;
  surplus: number;
};

const config = {
  fixed: { label: "Gastos fijos", color: "var(--chart-4)" },
  budgets: { label: "Presupuestos", color: "var(--chart-2)" },
  other: { label: "Otros gastos", color: "var(--chart-1)" },
  surplus: { label: "Sobrante", color: "oklch(0.65 0.15 150)" },
} satisfies ChartConfig;

export function PeriodChart({ data }: { data: PeriodChartPoint[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ left: -12 }} maxBarSize={56}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="fixed" stackId="total" fill="var(--color-fixed)" />
        <Bar dataKey="budgets" stackId="total" fill="var(--color-budgets)" />
        <Bar dataKey="other" stackId="total" fill="var(--color-other)" />
        <Bar dataKey="surplus" stackId="total" fill="var(--color-surplus)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
