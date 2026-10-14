"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type FuelChartPoint = { label: string; mpg: number };

const config = {
  mpg: { label: "mi/gal", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function FuelChart({ data }: { data: FuelChartPoint[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-48 w-full">
      <LineChart data={data} margin={{ left: -12, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} domain={["auto", "auto"]} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line dataKey="mpg" stroke="var(--color-mpg)" strokeWidth={2} dot />
      </LineChart>
    </ChartContainer>
  );
}
