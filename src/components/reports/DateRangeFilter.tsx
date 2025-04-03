import { DateRange } from "react-day-picker";
import { addDays, addYears, startOfToday } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

export type PeriodOption = "7d" | "30d" | "1y" | "custom";

interface DateRangeFilterProps {
  date: DateRange | undefined;
  selectedPeriod: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
  onDateChange: (date: DateRange | undefined) => void;
}

export function DateRangeFilter({
  date,
  selectedPeriod,
  onPeriodChange,
  onDateChange,
}: DateRangeFilterProps) {
  // Manejar cambios en el período seleccionado
  const handlePeriodChange = (period: PeriodOption) => {
    onPeriodChange(period);
    const today = startOfToday();
    
    switch (period) {
      case "7d":
        onDateChange({
          from: addDays(today, -7),
          to: today
        });
        break;
      case "30d":
        onDateChange({
          from: addDays(today, -30),
          to: today
        });
        break;
      case "1y":
        onDateChange({
          from: addYears(today, -1),
          to: today
        });
        break;
      case "custom":
        // Mantener el rango de fechas actual
        break;
    }
  };

  // Manejar cambios en el calendario
  const handleDateChange = (newDate: DateRange | undefined) => {
    onPeriodChange("custom");
    onDateChange(newDate);
  };

  return (
    <div className="flex items-center gap-4">
      <Select value={selectedPeriod} onValueChange={(value: PeriodOption) => handlePeriodChange(value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleccionar período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Últimos 7 días</SelectItem>
          <SelectItem value="30d">Últimos 30 días</SelectItem>
          <SelectItem value="1y">Último año</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>
      <div className="w-[320px]">
        <DatePickerWithRange date={date} onDateChange={handleDateChange} />
      </div>
    </div>
  );
} 