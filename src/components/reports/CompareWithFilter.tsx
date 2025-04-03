import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ComparisonPeriod = "previous_period" | "previous_year";

interface CompareWithFilterProps {
  selectedComparison: ComparisonPeriod;
  onComparisonChange: (value: ComparisonPeriod) => void;
}

export function CompareWithFilter({
  selectedComparison,
  onComparisonChange,
}: CompareWithFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Comparar con:</span>
      <Select value={selectedComparison} onValueChange={onComparisonChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleccionar período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="previous_period">Período anterior</SelectItem>
          <SelectItem value="previous_year">Año anterior</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 