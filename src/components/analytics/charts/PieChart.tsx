"use client";

import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip } from "recharts";
import { ContentType } from "recharts/types/component/Tooltip";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

interface PieChartProps {
  data: {
    name: string;
    value: number;
    [key: string]: any;
  }[];
  colors?: string[];
  customTooltip?: ContentType<ValueType, NameType>;
  className?: string;
  valueFormatter?: (value: number) => string;
}

const defaultColors = [
  "#2563eb", // blue-600
  "#3b82f6", // blue-500
  "#60a5fa", // blue-400
  "#93c5fd", // blue-300
  "#bfdbfe", // blue-200
];

export function PieChart({
  data,
  colors = defaultColors,
  customTooltip,
  className = "",
  valueFormatter = (value: number) => value.toString(),
}: PieChartProps) {
  const CustomTooltip: ContentType<ValueType, NameType> = customTooltip || ((props) => {
    const { active, payload } = props;
    if (!active || !payload) return null;
    const data = payload[0];
    if (!data) return null;

    return (
      <div className="rounded-lg border bg-white p-2 shadow-md">
        <div className="font-medium">{data.name}</div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="text-sm text-muted-foreground">
            Cantidad:
          </span>
          <span className="text-sm font-medium">
            {valueFormatter(data.value as number)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div
            className="h-3 w-3 rounded-full opacity-0"
          />
          <span className="text-sm text-muted-foreground">
            Porcentaje:
          </span>
          <span className="text-sm font-medium">
            {data.payload.porcentaje?.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  });

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="90%"
            fill="#2563eb"
            stroke="white"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip content={CustomTooltip} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
} 