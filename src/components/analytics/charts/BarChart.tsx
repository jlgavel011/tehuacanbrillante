"use client";

import { Card } from "@tremor/react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BarChartProps {
  data: any[];
  categories: string[];
  index: string;
  colors?: string[];
  className?: string;
  yAxisWidth?: number;
  stack?: boolean;
  showLegend?: boolean;
  layout?: "horizontal" | "vertical";
  valueFormatter?: (value: number) => string;
}

// Paleta de azules para los gráficos de productos (Sky Blue)
const defaultColors = [
  "#0284C7", // sky-600 - Azul principal más intenso
  "#0EA5E9", // sky-500 - Azul principal
  "#38BDF8", // sky-400 - Azul más claro
  "#7DD3FC", // sky-300 - Azul aún más claro
];

export function BarChart({
  data,
  categories,
  index,
  colors = defaultColors,
  className,
  yAxisWidth = 56,
  stack = false,
  showLegend = false,
  layout = "horizontal",
  valueFormatter = (value: number) => value.toString(),
}: BarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="rounded-lg border bg-white p-2 shadow-md">
        <div className="font-medium">{label}</div>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground">
              {item.name}:
            </span>
            <span className="text-sm font-medium">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={350}>
        <RechartsBarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
            stroke="#E5E7EB"
          />
          <XAxis
            dataKey={index}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(value) => value.toString()}
            tick={{ fill: '#6B7280' }}
          />
          <YAxis
            width={yAxisWidth}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tick={{ fill: '#6B7280' }}
          />
          <Tooltip
            content={CustomTooltip}
            cursor={{ fill: "transparent" }}
          />
          {categories.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              fill={colors[index % colors.length]}
              radius={[4, 4, 4, 4]}
              stackId={stack ? "stack" : undefined}
              maxBarSize={40}
              opacity={0.9}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
} 