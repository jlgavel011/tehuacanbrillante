"use client";

import { Card, Title, LineChart as TremorLineChart } from "@tremor/react";
import { PRIMARY_COLORS, getPrimaryColors } from "@/config/chart-colors";

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

export const LineChart = ({
  data,
  index,
  categories,
  title,
  subtitle,
  colors = getPrimaryColors(),
  className = "",
  yAxisWidth = 48,
  showLegend = true,
  showAnimation = true,
  valueFormatter = (value: number) => value.toString(),
  showGridLines = true,
  curveType = "linear",
}: LineChartProps) => {
  return (
    <Card className={`${className}`}>
      {title && <Title>{title}</Title>}
      {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
      <TremorLineChart
        data={data}
        index={index}
        categories={categories}
        colors={colors}
        yAxisWidth={yAxisWidth}
        showLegend={showLegend}
        showAnimation={showAnimation}
        valueFormatter={valueFormatter}
        showGridLines={showGridLines}
        curveType={curveType}
        className="mt-2 h-52"
      />
    </Card>
  );
}; 