"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductionData {
  id: string;
  name: string;
  totalBoxes: number;
  totalLiters: number;
}

type SortField = "boxes" | "liters" | "name";
type SortDirection = "asc" | "desc";

export default function ProductionByProductReport() {
  const router = useRouter();
  const { date, setDate, selectedPeriod, setSelectedPeriod } = useDateRangeFilter();
  const [data, setData] = useState<ProductionData[]>([]);
  const [filteredData, setFilteredData] = useState<ProductionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("boxes");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    const fetchData = async () => {
      if (!date?.from || !date?.to) return;

      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/analytics/top-products-production", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: date.from.toISOString(),
            endDate: date.to.toISOString(),
          }),
        });

        if (!response.ok) throw new Error("Error al cargar los datos");
        
        const result = await response.json();
        // Combinar los datos de cajas y litros en un solo array
        const combinedData = result.byBoxes.map((item: ProductionData) => {
          const literData = result.byLiters.find((l: ProductionData) => l.id === item.id);
          return {
            ...item,
            totalLiters: literData?.totalLiters || 0
          };
        });
        
        setData(combinedData);
        setFilteredData(combinedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date?.from?.getTime(), date?.to?.getTime()]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === "boxes") {
        comparison = b.totalBoxes - a.totalBoxes;
      } else if (sortField === "liters") {
        comparison = b.totalLiters - a.totalLiters;
      } else {
        comparison = a.name.localeCompare(b.name);
      }
      return sortDirection === "desc" ? comparison : -comparison;
    });

    setFilteredData(filtered);
  }, [data, searchTerm, sortField, sortDirection]);

  const resetFilters = () => {
    setSearchTerm("");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

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
            <h1 className="text-2xl font-semibold">Producción Total por Producto</h1>
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
            <h1 className="text-2xl font-semibold">Producción Total por Producto</h1>
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
          <h1 className="text-2xl font-semibold">Producción Total por Producto</h1>
        </div>
        <DateRangeFilter
          date={date}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          onDateChange={setDate}
        />
      </div>

      <div className="space-y-6">
        {filteredData.length === 0 ? (
          <Alert>
            <AlertDescription>
              No hay datos disponibles para el período seleccionado
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Input
                  placeholder="Buscar por producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[450px]"
                />
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={resetFilters}>
                    Limpiar filtros
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => downloadCSV(filteredData.map(item => ({
                      "Producto": item.name,
                      "Total Cajas": formatNumber(item.totalBoxes),
                      "Total Litros": formatNumber(item.totalLiters)
                    })), "produccion_por_producto")}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descargar
                  </Button>
                </div>
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
                          Producto
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("boxes")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          Total Cajas
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => handleSort("liters")}
                          className="h-8 px-2 hover:bg-transparent"
                        >
                          Total Litros
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(item.totalBoxes)} cajas
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(item.totalLiters)} L
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