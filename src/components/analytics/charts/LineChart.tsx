"use client";

import {
  Line,
  LineChart as RechartsLineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface LineChartProps {
  data: any[];
  index: string;
  categories: string[];
  title?: string;
  subtitle?: string;
  colors?: string[];
  className?: string;
  yAxisWidth?: number;
  showLegend?: boolean;
  showAnimation?: boolean;
  valueFormatter?: (number: number) => string;
  showGridLines?: boolean;
  curveType?: "linear" | "natural" | "monotone" | "step";
}

// Paleta de verdes para los gráficos de producción
const defaultColors = [
  "#4ade80", // green-400 - Verde producción
  "#86efac", // green-300 - Verde claro
  "#10b981", // emerald-500 - Verde alternativo
  "#34d399", // emerald-400 - Verde alternativo claro
];

export const LineChart = ({
  data,
  index,
  categories,
  title,
  subtitle,
  colors = defaultColors,
  className = "",
  yAxisWidth = 56,
  showLegend = true,
  showAnimation = true,
  valueFormatter = (value: number) => value.toString(),
  showGridLines = true,
  curveType = "natural",
}: LineChartProps) => {
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
              {valueFormatter(item.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={showGridLines}
            vertical={false}
            stroke="#E5E7EB"
          />
          <XAxis
            dataKey={index}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tick={{ fill: '#6B7280' }}
          />
          <YAxis
            width={yAxisWidth}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tick={{ fill: '#6B7280' }}
            // Evitar mostrar valores decimales en el eje Y
            tickFormatter={(value) => Math.round(value).toString()}
          />
          <Tooltip
            content={CustomTooltip}
            cursor={{ fill: "transparent" }}
          />
          {categories.map((category, idx) => (
            <Line
              key={category}
              type={curveType}
              dataKey={category}
              stroke={colors[idx % colors.length]}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={showAnimation ? 800 : 0}
              isAnimationActive={showAnimation}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}; 