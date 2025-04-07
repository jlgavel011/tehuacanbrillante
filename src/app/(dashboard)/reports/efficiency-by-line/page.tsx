"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadCSV } from "@/lib/utils/csv";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { formatNumber } from "@/lib/utils/formatters";
import { Progress } from "@/components/ui/progress";

interface LineEfficiencyData {
  id: string;
  name: string;
  efficiency: number;
  totalProduced: number;
  totalPlanned: number;
}

type SortField = "name" | "efficiency" | "totalProduced" | "totalPlanned";
type SortDirection = "asc" | "desc";

export default function EfficiencyByLineReport() {
  const router = useRouter();
  const { date, setDate, selectedPeriod, setSelectedPeriod } = useDateRangeFilter();
  const [data, setData] = useState<LineEfficiencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("efficiency");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    const fetchData = async () => {
      if (!date?.from || !date?.to) return;

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          from: date.from.toISOString(),
          to: date.to.toISOString(),
        });

        const response = await fetch(`/api/analytics/efficiency-by-line?${params}`);
        if (!response.ok) throw new Error("Error al cargar los datos");
        
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date?.from?.getTime(), date?.to?.getTime()]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "efficiency":
        comparison = a.efficiency - b.efficiency;
        break;
      case "totalProduced":
        comparison = a.totalProduced - b.totalProduced;
        break;
      case "totalPlanned":
        comparison = a.totalPlanned - b.totalPlanned;
        break;
    }
    
    return sortDirection === "desc" ? -comparison : comparison;
  });

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              disabled
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold">% Eficiencia por Línea de Producción</h1>
          </div>
          <Skeleton className="h-10 w-[300px]" />
        </div>

        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold">% Eficiencia por Línea de Producción</h1>
          </div>
          <DateRangeFilter
            date={date}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            onDateChange={setDate}
          />
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const averageEfficiency = data.length > 0
    ? data.reduce((sum, item) => sum + item.efficiency, 0) / data.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">% Eficiencia por Línea de Producción</h1>
        </div>
        <DateRangeFilter
          date={date}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          onDateChange={setDate}
        />
      </div>

      <div className="space-y-6">
        {sortedData.length === 0 ? (
          <Alert>
            <AlertDescription>
              No hay datos disponibles para el período seleccionado
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrando {sortedData.length} líneas de producción
                </div>
                <Button
                  variant="default"
                  onClick={() => downloadCSV(sortedData.map(item => ({
                    "Línea de Producción": item.name,
                    "Cajas Producidas": item.totalProduced,
                    "Cajas Planificadas": item.totalPlanned,
                    "% Eficiencia": `${Math.round(item.efficiency * 100)}%`
                  })), "eficiencia_por_linea")}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              </div>

              <div className="rounded-md border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("name")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          Línea de Producción
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("totalProduced")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          Cajas Producidas
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("totalPlanned")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          Cajas Planificadas
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("efficiency")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          % Eficiencia
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(item.totalProduced)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(item.totalPlanned)}
                        </TableCell>
                        <TableCell className="w-[180px]">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={item.efficiency * 100} 
                              className={`h-2 ${
                                item.efficiency >= 0.9 
                                  ? "bg-green-100" 
                                  : item.efficiency >= 0.75 
                                    ? "bg-yellow-100" 
                                    : "bg-red-100"
                              }`}
                            />
                            <span className={`text-right font-semibold w-[50px] ${
                              item.efficiency >= 0.9 
                                ? "text-green-600" 
                                : item.efficiency >= 0.75 
                                  ? "text-yellow-600" 
                                  : "text-red-600"
                            }`}>
                              {Math.round(item.efficiency * 100)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 