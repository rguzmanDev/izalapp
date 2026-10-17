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
  fixed: { label: "Gastos fijos", color: "var(--chart-3)" },
  budgets: { label: "Presupuestos", color: "var(--chart-2)" },
  other: { label: "Otros gastos", color: "var(--chart-4)" },
  surplus: { label: "Sobrante", color: "var(--chart-1)" },
} satisfies ChartConfig;

function moneyTick(value: number) {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return `$${value}`;
}

export function PeriodChart({ data }: { data: PeriodChartPoint[] }) {
  const wide = data.length > 8;

  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-72 w-full sm:h-80"
      initialDimension={{ width: 640, height: 320 }}
    >
      <BarChart
        data={data}
        margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
        barCategoryGap={wide ? "12%" : "22%"}
        maxBarSize={48}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 6" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          interval={wide ? "preserveStartEnd" : 0}
          minTickGap={wide ? 8 : 0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={moneyTick}
          tickMargin={4}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.45 }}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value, name, item) => (
                <>
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex flex-1 items-center justify-between gap-6 leading-none">
                    <span className="text-muted-foreground">
                      {config[name as keyof typeof config]?.label ?? name}
                    </span>
                    <span className="font-mono font-medium text-foreground tabular-nums">
                      {typeof value === "number"
                        ? value.toLocaleString("es-SV", {
                            style: "currency",
                            currency: "USD",
                            maximumFractionDigits: 0,
                          })
                        : String(value)}
                    </span>
                  </div>
                </>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent className="flex-wrap gap-x-3 gap-y-1" />} />
        <Bar dataKey="fixed" stackId="total" fill="var(--color-fixed)" />
        <Bar dataKey="budgets" stackId="total" fill="var(--color-budgets)" />
        <Bar dataKey="other" stackId="total" fill="var(--color-other)" />
        <Bar
          dataKey="surplus"
          stackId="total"
          fill="var(--color-surplus)"
          radius={[5, 5, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
