"use client";

import { DateRangeProvider } from "@/context/DateRangeContext";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DateRangeProvider>{children}</DateRangeProvider>;
} 