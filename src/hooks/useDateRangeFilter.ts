"use client";

import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { addDays, startOfMonth, subDays, subYears } from "date-fns";
import type { PeriodOption } from "@/components/reports/DateRangeFilter";

// Función para obtener el rango de fechas basado en el período
const getDateRangeFromPeriod = (period: PeriodOption): DateRange => {
  const today = new Date();
  
  switch (period) {
    case "7d":
      return {
        from: subDays(today, 7),
        to: today,
      };
    case "30d":
      return {
        from: subDays(today, 30),
        to: today,
      };
    case "90d":
      return {
        from: subDays(today, 90),
        to: today,
      };
    case "1y":
      return {
        from: subYears(today, 1),
        to: today,
      };
    default:
      return {
        from: startOfMonth(today),
        to: today,
      };
  }
};

// Función para recuperar los valores guardados del localStorage
const getSavedDateRange = (): DateRange | undefined => {
  if (typeof window === "undefined") return undefined;
  
  try {
    const saved = localStorage.getItem("dateRange");
    if (!saved) return getDateRangeFromPeriod("30d");
    
    const { from, to } = JSON.parse(saved);
    return {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };
  } catch (error) {
    return getDateRangeFromPeriod("30d");
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
  const [date, setDate] = useState<DateRange | undefined>(() => getSavedDateRange());
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(() => getSavedPeriod());

  // Manejar cambios en el período seleccionado
  const handlePeriodChange = (newPeriod: PeriodOption) => {
    setSelectedPeriod(newPeriod);
    if (newPeriod !== "custom") {
      const newDateRange = getDateRangeFromPeriod(newPeriod);
      setDate(newDateRange);
    }
  };

  // Manejar cambios en el rango de fechas
  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (newDate) {
      setSelectedPeriod("custom");
    }
  };

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
    date,
    setDate: handleDateChange,
    selectedPeriod,
    setSelectedPeriod: handlePeriodChange,
  };
} 