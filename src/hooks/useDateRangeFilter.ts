import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { addDays, startOfToday } from "date-fns";
import type { PeriodOption } from "@/components/reports/DateRangeFilter";

// Función para obtener el rango de fechas por defecto (últimos 30 días)
const getDefaultDateRange = (): DateRange => {
  const today = startOfToday();
  return {
    from: addDays(today, -30),
    to: today,
  };
};

// Función para recuperar los valores guardados del localStorage
const getSavedDateRange = (): DateRange | undefined => {
  if (typeof window === "undefined") return undefined;
  
  try {
    const saved = localStorage.getItem("dateRange");
    if (!saved) return getDefaultDateRange();
    
    const { from, to } = JSON.parse(saved);
    return {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };
  } catch (error) {
    return getDefaultDateRange();
  }
};

const getSavedPeriod = (): PeriodOption => {
  if (typeof window === "undefined") return "30d";
  
  try {
    const savedPeriod = localStorage.getItem("selectedPeriod") as PeriodOption;
    return savedPeriod || "30d";
  } catch (error) {
    return "30d";
  }
};

export function useDateRangeFilter() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(() => getSavedPeriod());
  const [date, setDate] = useState<DateRange | undefined>(() => getSavedDateRange());

  // Efecto inicial para asegurar que los valores estén sincronizados
  useEffect(() => {
    const period = getSavedPeriod();
    const dateRange = getSavedDateRange();

    setSelectedPeriod(period);
    setDate(dateRange);
  }, []);

  // Guardar cambios en localStorage
  useEffect(() => {
    if (date) {
      localStorage.setItem("dateRange", JSON.stringify({
        from: date.from?.toISOString(),
        to: date.to?.toISOString(),
      }));
    }
  }, [date]);

  useEffect(() => {
    localStorage.setItem("selectedPeriod", selectedPeriod);
  }, [selectedPeriod]);

  return {
    selectedPeriod,
    setSelectedPeriod,
    date,
    setDate,
  };
} 