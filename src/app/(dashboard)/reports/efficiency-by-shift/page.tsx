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
import { Progress } from "@/components/ui/progress";

interface ShiftEfficiencyData {
  name: string;
  efficiency: number;
  producedCases: number;
  plannedCases: number;
}

type SortField = "name" | "efficiency" | "produced" | "planned";
type SortDirection = "asc" | "desc";

export default function EfficiencyByShiftReport() {
  const router = useRouter();
  const { date, setDate, selectedPeriod, setSelectedPeriod } = useDateRangeFilter();
  const [data, setData] = useState<ShiftEfficiencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("efficiency");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [averageEfficiency, setAverageEfficiency] = useState(0);
  const [totalProduced, setTotalProduced] = useState(0);
  const [totalPlanned, setTotalPlanned] = useState(0);

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

        const response = await fetch(`/api/analytics/efficiency-by-shift?${params}`);
        if (!response.ok) throw new Error("Error al cargar los datos");
        
        const result = await response.json();
        setData(result.data);
        setAverageEfficiency(result.averageEfficiency);
        setTotalProduced(result.totalProduced);
        setTotalPlanned(result.totalPlanned);
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
      case "produced":
        comparison = a.producedCases - b.producedCases;
        break;
      case "planned":
        comparison = a.plannedCases - b.plannedCases;
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
            <h1 className="text-2xl font-semibold">% Eficiencia por Turno</h1>
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
            <h1 className="text-2xl font-semibold">% Eficiencia por Turno</h1>
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
          <h1 className="text-2xl font-semibold">% Eficiencia por Turno</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4 bg-white">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Eficiencia Promedio</h3>
                <p className="text-2xl font-bold">{(averageEfficiency * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border p-4 bg-white">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Total Cajas Producidas</h3>
                <p className="text-2xl font-bold">{totalProduced.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4 bg-white">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Total Cajas Planificadas</h3>
                <p className="text-2xl font-bold">{totalPlanned.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrando {sortedData.length} turnos
                </div>
                <Button
                  variant="default"
                  onClick={() => downloadCSV(sortedData.map(item => ({
                    "Turno": item.name,
                    "Cajas Producidas": item.producedCases,
                    "Cajas Planificadas": item.plannedCases,
                    "% Eficiencia": `${(item.efficiency * 100).toFixed(1)}%`
                  })), "eficiencia_por_turno")}
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
                          Turno
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
                          % Eficiencia
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.producedCases.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{item.plannedCases.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress
                              value={item.efficiency * 100}
                              className="h-2 w-24"
                            />
                            <span className="whitespace-nowrap">
                              {(item.efficiency * 100).toFixed(1)}%
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