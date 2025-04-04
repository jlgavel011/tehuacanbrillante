"use client";

import { useEffect, useState } from "react";
import { useDateRange } from "@/context/DateRangeContext";
import { useComparisonPercentage } from "./useComparisonPercentage";

interface StopsData {
  totalStops: number;
  totalStopTime: number;
}

interface StopsIndicators {
  totalStops: number;
  totalStopTime: number;
  stopsComparison: {
    percentage: number;
    isIncrease: boolean;
    formattedPercentage: string;
  };
  stopTimeComparison: {
    percentage: number;
    isIncrease: boolean;
    formattedPercentage: string;
  };
  isLoading: boolean;
}

const initialData: StopsData = {
  totalStops: 0,
  totalStopTime: 0,
};

export function useStopsIndicators(): StopsIndicators {
  const { date, comparisonDate } = useDateRange();
  const [currentData, setCurrentData] = useState<StopsData>(initialData);
  const [previousData, setPreviousData] = useState<StopsData>(initialData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!date?.from || !date?.to) return;

      setIsLoading(true);
      try {
        // Fetch current period data
        const currentResponse = await fetch("/api/analytics/stops/indicators", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: date.from.toISOString(),
            endDate: date.to.toISOString(),
          }),
        });

        if (!currentResponse.ok) {
          throw new Error('Error fetching current period data');
        }

        const currentResult = await currentResponse.json();
        setCurrentData(currentResult);

        // Fetch comparison period data if available
        if (comparisonDate?.from && comparisonDate?.to) {
          const comparisonResponse = await fetch("/api/analytics/stops/indicators", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startDate: comparisonDate.from.toISOString(),
              endDate: comparisonDate.to.toISOString(),
            }),
          });

          if (!comparisonResponse.ok) {
            throw new Error('Error fetching comparison period data');
          }

          const comparisonResult = await comparisonResponse.json();
          setPreviousData(comparisonResult);
        } else {
          // Reset previous data if no comparison date is selected
          setPreviousData(initialData);
        }
      } catch (error) {
        console.error('Error fetching stops indicators:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [date, comparisonDate]);

  const stopsComparison = useComparisonPercentage(
    currentData.totalStops,
    previousData.totalStops
  );

  const stopTimeComparison = useComparisonPercentage(
    currentData.totalStopTime,
    previousData.totalStopTime
  );

  return {
    totalStops: currentData.totalStops,
    totalStopTime: currentData.totalStopTime,
    stopsComparison,
    stopTimeComparison,
    isLoading,
  };
} 