import { Card, Title } from "@tremor/react";
import { BarChart } from "../charts/BarChart";
import { Skeleton } from "@/components/ui/skeleton";

interface TopProductsProps {
  data: any[];
  isLoading?: boolean;
}

export function TopProducts({ data, isLoading }: TopProductsProps) {
  if (isLoading) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[350px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <Title className="text-lg font-medium">Productos Más Producidos</Title>
      <BarChart
        data={data}
        index="name"
        categories={["total"]}
        colors={["#0284C7"]}
        className="mt-4"
      />
    </Card>
  );
} 