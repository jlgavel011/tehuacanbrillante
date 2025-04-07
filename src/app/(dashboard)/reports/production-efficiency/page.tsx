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
import { parseISO } from "date-fns";

interface EfficiencyData {
  date: string;
  originalDate: string;
  efficiency: number;
  totalProduced: number;
  totalPlanned: number;
}

type SortField = "date" | "efficiency" | "produced" | "planned";
type SortDirection = "asc" | "desc";

export default function ProductionEfficiencyReport() {
  const router = useRouter();
  const { date, setDate, selectedPeriod, setSelectedPeriod } = useDateRangeFilter();
  const [data, setData] = useState<EfficiencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [averageEfficiency, setAverageEfficiency] = useState<number>(0);

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

        const response = await fetch(`/api/analytics/production-efficiency?${params}`);
        if (!response.ok) throw new Error("Error al cargar los datos");
        
        const result = await response.json();
        
        // Convertir los datos a nuestro formato interno con una copia de la fecha original para ordenar
        const formattedData = result.data.map((item: any) => ({
          date: item.date,
          originalDate: item.date, // Guardamos esto para poder ordenar correctamente
          efficiency: item.efficiency,
          totalProduced: item.totalProduced,
          totalPlanned: item.totalPlanned
        }));
        
        setData(formattedData);
        setAverageEfficiency(result.averageEfficiency);
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
      case "date":
        comparison = a.originalDate.localeCompare(b.originalDate);
        break;
      case "efficiency":
        comparison = a.efficiency - b.efficiency;
        break;
      case "produced":
        comparison = a.totalProduced - b.totalProduced;
        break;
      case "planned":
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
            <h1 className="text-2xl font-semibold">Eficiencia de Producción</h1>
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
            <h1 className="text-2xl font-semibold">Eficiencia de Producción</h1>
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
          <h1 className="text-2xl font-semibold">Eficiencia de Producción</h1>
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
                <div className="bg-[#e8f6e9]/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Eficiencia Promedio</p>
                  <p className="text-xl font-semibold">{(averageEfficiency * 100).toFixed(1)}%</p>
                </div>
                <Button
                  variant="default"
                  onClick={() => downloadCSV(sortedData.map(item => ({
                    "Fecha": item.date,
                    "Cajas Producidas": formatNumber(item.totalProduced),
                    "Cajas Planificadas": formatNumber(item.totalPlanned),
                    "Eficiencia": `${(item.efficiency * 100).toFixed(1)}%`
                  })), "eficiencia_produccion")}
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
                          onClick={() => handleSort("date")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          Fecha
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("produced")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          Cajas Producidas
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("planned")}
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
                          Eficiencia
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(item.totalProduced)} cajas
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(item.totalPlanned)} cajas
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          <span 
                            className={
                              item.efficiency >= 1 
                                ? "text-green-500" 
                                : item.efficiency >= 0.8 
                                  ? "text-yellow-500" 
                                  : "text-red-500"
                            }
                          >
                            {(item.efficiency * 100).toFixed(1)}%
                          </span>
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