"use client";

import { ReactNode } from "react";
import { Grid as TremorGrid } from "@tremor/react";

interface GridProps {
  children: ReactNode;
  numItems?: number;
  className?: string;
}

export const Grid = ({
  children,
  numItems = 3,
  className = "",
}: GridProps) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div
      className={`grid gap-4 ${gridCols[numItems as keyof typeof gridCols]} ${className}`}
    >
      {children}
    </div>
  );
}; 