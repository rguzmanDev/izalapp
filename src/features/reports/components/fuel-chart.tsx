"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type FuelChartPoint = { label: string; mpg: number };

const config = {
  mpg: { label: "mi/gal", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function FuelChart({ data }: { data: FuelChartPoint[] }) {
  const values = data.map((point) => point.mpg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(1, (max - min) * 0.15);
  const domain: [number, number] = [
    Math.max(0, Math.floor(min - pad)),
    Math.ceil(max + pad),
  ];

  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-56 w-full sm:h-64"
      initialDimension={{ width: 640, height: 256 }}
    >
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fuelFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-mpg)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-mpg)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 6" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} minTickGap={16} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          domain={domain}
          tickMargin={4}
          tickFormatter={(value) => `${value}`}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Area
          type="monotone"
          dataKey="mpg"
          stroke="var(--color-mpg)"
          strokeWidth={2.5}
          fill="url(#fuelFill)"
          dot={{ r: 3, fill: "var(--color-mpg)", strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
