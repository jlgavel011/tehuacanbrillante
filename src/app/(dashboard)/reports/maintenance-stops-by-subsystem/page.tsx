"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Card } from "@tremor/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCSV } from "@/lib/utils";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";

interface MaintenanceStopData {
  name: string;
  sistema: string;
  linea: string;
  paros: number;
  tiempo_total: number;
}

export default function MaintenanceStopsBySubsystemReport() {
  const router = useRouter();
  const { date, selectedPeriod, setSelectedPeriod, setDate } = useDateRangeFilter();
  const [data, setData] = useState<MaintenanceStopData[]>([]);
  const [filteredData, setFilteredData] = useState<MaintenanceStopData[]>([]);
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

        const response = await fetch(`/api/analytics/maintenance-stops-by-subsystem?${params}`);
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
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sistema.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.linea.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  }, [data, searchTerm]);

  const handleBack = () => {
    router.back();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
  };

  const handleDownloadCSV = () => {
    const totalTime = data.reduce((acc, item) => acc + item.tiempo_total, 0);
    const csvData = filteredData.map((item) => ({
      "Subsistema": item.name,
      "Sistema": item.sistema,
      "Línea": item.linea,
      "Cantidad de Paros": item.paros,
      "Tiempo Total (min)": item.tiempo_total,
      "Porcentaje": ((item.tiempo_total / totalTime) * 100).toFixed(1) + "%"
    }));

    downloadCSV(csvData, "paros-por-subsistema");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Reporte de Paros por Subsistema</h1>
        </div>
        <DateRangeFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          date={date}
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
                    placeholder="Buscar por subsistema, sistema o línea..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={handleResetFilters}>
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
                        <TableHead>Subsistema</TableHead>
                        <TableHead>Sistema</TableHead>
                        <TableHead>Línea</TableHead>
                        <TableHead className="text-right">Cantidad de Paros</TableHead>
                        <TableHead className="text-right">Tiempo Total (min)</TableHead>
                        <TableHead className="text-right">Porcentaje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item) => {
                        const totalTime = data.reduce((acc, item) => acc + item.tiempo_total, 0);
                        const percentage = (item.tiempo_total / totalTime) * 100;
                        return (
                          <TableRow key={item.name}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.sistema}</TableCell>
                            <TableCell>{item.linea}</TableCell>
                            <TableCell className="text-right">
                              {item.paros.toLocaleString("es-MX")}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.tiempo_total.toLocaleString("es-MX")}
                            </TableCell>
                            <TableCell className="text-right">
                              {percentage.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
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