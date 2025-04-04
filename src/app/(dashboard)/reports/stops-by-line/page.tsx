"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Card } from "@tremor/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { downloadCSV } from "@/lib/utils/csv";
import { Download } from "lucide-react";

interface StopData {
  name: string;
  cantidad: number;
  tiempo_total: number;
  porcentaje: number;
}

export default function StopsByLinePage() {
  const router = useRouter();
  const { selectedPeriod, setSelectedPeriod, date, setDate } = useDateRangeFilter();
  const [data, setData] = useState<StopData[]>([]);
  const [filteredData, setFilteredData] = useState<StopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

        const response = await fetch(`/api/analytics/stops-by-line?${params}`);
        if (!response.ok) throw new Error("Error al cargar los datos");
        const result = await response.json();
        setData(result);
        setFilteredData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date]);

  // Aplicar filtro de búsqueda
  useEffect(() => {
    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  }, [data, searchTerm]);

  const resetFilters = () => {
    setSearchTerm("");
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleDownloadCSV = () => {
    const csvData = filteredData.map((item) => ({
      "Línea": item.name,
      "Cantidad de Paros": item.cantidad,
      "Tiempo Total (min)": item.tiempo_total,
      "Porcentaje": `${item.porcentaje.toFixed(1)}%`,
    }));

    downloadCSV(csvData, "paros-por-linea");
  };

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
          <h1 className="text-2xl font-semibold">Reporte de Paros por Línea</h1>
        </div>
        <DateRangeFilter
          date={date}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          onDateChange={setDate}
        />
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por línea..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={resetFilters}>
                  Limpiar filtros
                </Button>
                <Button variant="outline" onClick={handleDownloadCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar CSV
                </Button>
              </div>

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : filteredData.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No se encontraron datos para los filtros seleccionados
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Línea</TableHead>
                        <TableHead className="text-right">Cantidad de Paros</TableHead>
                        <TableHead className="text-right">Tiempo Total (min)</TableHead>
                        <TableHead className="text-right">Porcentaje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">
                            {item.cantidad.toLocaleString("es-MX")}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.tiempo_total.toLocaleString("es-MX")}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.porcentaje.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
} 