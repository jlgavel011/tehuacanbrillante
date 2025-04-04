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

interface SizeData {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

export default function SizesReport() {
  const router = useRouter();
  const { selectedPeriod, setSelectedPeriod, date, setDate } = useDateRangeFilter();
  const [data, setData] = useState<SizeData[]>([]);
  const [filteredData, setFilteredData] = useState<SizeData[]>([]);
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

        const response = await fetch(`/api/analytics/most-produced-sizes?${params}`);
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
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (loading) {
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
            <h1 className="text-2xl font-semibold">Reporte de Producción por Tamaño</h1>
          </div>
          <div className="w-[320px]">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </Card>
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
          <h1 className="text-2xl font-semibold">Reporte de Producción por Tamaño</h1>
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
            <div className="text-red-500">{error}</div>
          ) : data.length === 0 ? (
            <div className="text-muted-foreground">
              No hay datos disponibles para el período seleccionado
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Input
                    placeholder="Buscar por tamaño..."
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
                      onClick={() => downloadCSV(filteredData, "reporte_tamanos")}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tamaño</TableHead>
                      <TableHead className="text-right">Cajas Producidas</TableHead>
                      <TableHead className="text-right">% del Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.nombre}>
                        <TableCell>{item.nombre}</TableCell>
                        <TableCell className="text-right">
                          {item.cantidad.toLocaleString("es-MX")}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.porcentaje.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
} 