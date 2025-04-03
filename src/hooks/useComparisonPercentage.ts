import { useMemo } from 'react';

interface ComparisonResult {
  percentage: number;
  isIncrease: boolean;
  formattedPercentage: string;
}

export function useComparisonPercentage(currentValue: number, previousValue: number): ComparisonResult {
  return useMemo(() => {
    if (previousValue === 0) {
      return {
        percentage: 100,
        isIncrease: true,
        formattedPercentage: '+100%'
      };
    }

    const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
    const isIncrease = percentageChange >= 0;
    
    return {
      percentage: Math.abs(percentageChange),
      isIncrease,
      formattedPercentage: `${isIncrease ? '+' : '-'}${Math.abs(percentageChange).toFixed(2)}%`
    };
  }, [currentValue, previousValue]);
} 