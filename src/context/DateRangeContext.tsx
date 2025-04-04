"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { DateRange } from "react-day-picker";
import { addDays, startOfToday, subDays, subYears, differenceInDays, startOfMonth } from "date-fns";
import type { PeriodOption } from "@/components/reports/DateRangeFilter";
import { ComparisonPeriod } from "@/components/reports/CompareWithFilter";

interface DateRangeContextType {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  selectedPeriod: PeriodOption;
  setSelectedPeriod: (period: PeriodOption) => void;
  comparisonPeriod: ComparisonPeriod;
  setComparisonPeriod: (period: ComparisonPeriod) => void;
  comparisonDate: DateRange | undefined;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

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

// Función para calcular el período de comparación
const getComparisonDateRange = (
  currentRange: DateRange,
  comparisonType: ComparisonPeriod
): DateRange | undefined => {
  if (!currentRange.from || !currentRange.to) return undefined;

  const daysDiff = differenceInDays(currentRange.to, currentRange.from);

  if (comparisonType === "previous_period") {
    return {
      from: subDays(currentRange.from, daysDiff + 1),
      to: subDays(currentRange.from, 1),
    };
  } else if (comparisonType === "previous_year") {
    return {
      from: subYears(currentRange.from, 1),
      to: subYears(currentRange.to, 1),
    };
  }

  return undefined;
};

// Función para recuperar los valores guardados del localStorage
const getSavedDateRange = (): DateRange | undefined => {
  if (typeof window === "undefined") return undefined;
  
  try {
    const saved = localStorage.getItem("analyticsDateRange");
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
    const savedPeriod = localStorage.getItem("analyticsSelectedPeriod") as PeriodOption;
    return savedPeriod || "30d";
  } catch (error) {
    return "30d";
  }
};

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [date, setDateInternal] = useState<DateRange | undefined>(() => getSavedDateRange());
  const [selectedPeriod, setSelectedPeriodInternal] = useState<PeriodOption>(() => getSavedPeriod());
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>("previous_period");
  const [comparisonDate, setComparisonDate] = useState<DateRange | undefined>();

  // Manejar cambios en el período seleccionado
  const handlePeriodChange = (newPeriod: PeriodOption) => {
    setSelectedPeriodInternal(newPeriod);
    if (newPeriod !== "custom") {
      const newDateRange = getDateRangeFromPeriod(newPeriod);
      setDateInternal(newDateRange);
    }
  };

  // Manejar cambios en el rango de fechas
  const handleDateChange = (newDate: DateRange | undefined) => {
    setDateInternal(newDate);
    if (newDate) {
      setSelectedPeriodInternal("custom");
    }
  };

  // Efecto para actualizar el rango de comparación cuando cambia el rango principal o el tipo de comparación
  useEffect(() => {
    if (date) {
      const newComparisonRange = getComparisonDateRange(date, comparisonPeriod);
      setComparisonDate(newComparisonRange);
    }
  }, [date, comparisonPeriod]);

  // Efecto inicial para asegurar que los valores estén sincronizados
  useEffect(() => {
    const period = getSavedPeriod();
    const dateRange = getSavedDateRange();

    setSelectedPeriodInternal(period);
    setDateInternal(dateRange);
  }, []);

  // Guardar cambios en localStorage
  useEffect(() => {
    if (date) {
      localStorage.setItem("analyticsDateRange", JSON.stringify({
        from: date.from?.toISOString(),
        to: date.to?.toISOString(),
      }));
    }
  }, [date]);

  useEffect(() => {
    localStorage.setItem("analyticsSelectedPeriod", selectedPeriod);
  }, [selectedPeriod]);

  return (
    <DateRangeContext.Provider
      value={{
        date,
        setDate: handleDateChange,
        selectedPeriod,
        setSelectedPeriod: handlePeriodChange,
        comparisonPeriod,
        setComparisonPeriod,
        comparisonDate,
      }}
    >
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error("useDateRange must be used within a DateRangeProvider");
  }
  return context;
} 