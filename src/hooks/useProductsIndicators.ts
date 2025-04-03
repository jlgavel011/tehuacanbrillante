"use client";

import { useEffect, useState } from "react";
import { useDateRange } from "@/context/DateRangeContext";
import { useComparisonPercentage } from "./useComparisonPercentage";

interface ProductsData {
  totalProducts: number;
  totalFlavors: number;
  totalModels: number;
  totalBoxes: number;
}

interface ProductsIndicators {
  totalProducts: number;
  totalFlavors: number;
  totalModels: number;
  totalBoxes: number;
  productsComparison: {
    percentage: number;
    isIncrease: boolean;
    formattedPercentage: string;
  };
  flavorsComparison: {
    percentage: number;
    isIncrease: boolean;
    formattedPercentage: string;
  };
  modelsComparison: {
    percentage: number;
    isIncrease: boolean;
    formattedPercentage: string;
  };
  boxesComparison: {
    percentage: number;
    isIncrease: boolean;
    formattedPercentage: string;
  };
  isLoading: boolean;
}

const initialData: ProductsData = {
  totalProducts: 0,
  totalFlavors: 0,
  totalModels: 0,
  totalBoxes: 0,
};

export function useProductsIndicators(): ProductsIndicators {
  const { date, comparisonDate } = useDateRange();
  const [currentData, setCurrentData] = useState<ProductsData>(initialData);
  const [previousData, setPreviousData] = useState<ProductsData>(initialData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!date?.from || !date?.to) return;

      setIsLoading(true);
      try {
        // Fetch current period data
        const currentResponse = await fetch("/api/analytics/products/indicators", {
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
          const comparisonResponse = await fetch("/api/analytics/products/indicators", {
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
        console.error("Error fetching indicators:", error);
        // Reset data on error
        setCurrentData(initialData);
        setPreviousData(initialData);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [date, comparisonDate]);

  // Calculate comparisons
  const productsComparison = useComparisonPercentage(
    currentData.totalProducts,
    previousData.totalProducts
  );
  const flavorsComparison = useComparisonPercentage(
    currentData.totalFlavors,
    previousData.totalFlavors
  );
  const modelsComparison = useComparisonPercentage(
    currentData.totalModels,
    previousData.totalModels
  );
  const boxesComparison = useComparisonPercentage(
    currentData.totalBoxes,
    previousData.totalBoxes
  );

  return {
    ...currentData,
    productsComparison,
    flavorsComparison,
    modelsComparison,
    boxesComparison,
    isLoading,
  };
} 