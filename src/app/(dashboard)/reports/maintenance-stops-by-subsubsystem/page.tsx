"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
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

interface MaintenanceStopData {
  name: string;
  subsistema: string;
  sistema: string;
  linea: string;
  paros: number;
  tiempo_total: number;
  porcentaje: number;
}

export default function MaintenanceStopsBySubsubsystemReport() {
  const router = useRouter();
  const { date, selectedPeriod, setSelectedPeriod, setDate } = useDateRangeFilter();
  const [data, setData] = useState<MaintenanceStopData[]>([]);
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

        const response = await fetch(`/api/analytics/maintenance-stops-by-subsubsystem?${params}`);
        if (!response.ok) throw new Error("Error al cargar los datos");
        const result = await response.json();

        // Calcular el tiempo total y los porcentajes
        const tiempoTotal = result.reduce((acc: number, item: MaintenanceStopData) => acc + item.tiempo_total, 0);
        const dataWithPercentages = result.map((item: MaintenanceStopData) => ({
          ...item,
          porcentaje: (item.tiempo_total / tiempoTotal) * 100,
        }));

        setData(dataWithPercentages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date]);

  const handleResetFilters = () => {
    setSearchTerm("");
  };

  const handleDownloadCSV = () => {
    const headers = ["Subsubsistema", "Subsistema", "Sistema", "Línea", "Cantidad de Paros", "Tiempo Total (min)", "Porcentaje"];
    const csvData = data.map((item) => [
      item.name,
      item.subsistema,
      item.sistema,
      item.linea,
      item.paros.toString(),
      item.tiempo_total.toString(),
      item.porcentaje.toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "paros_por_subsubsistema.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subsistema.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sistema.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.linea.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">
            Subsubsistemas con Más Paros por Mantenimiento
          </h1>
        </div>
        <DateRangeFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          date={date}
          onDateChange={setDate}
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Buscar por subsubsistema, subsistema, sistema o línea..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[400px]"
              />
              <Button variant="outline" onClick={handleResetFilters}>
                Limpiar filtros
              </Button>
            </div>
            <Button onClick={handleDownloadCSV}>Descargar CSV</Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subsubsistema</TableHead>
                    <TableHead>Subsistema</TableHead>
                    <TableHead>Sistema</TableHead>
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
                      <TableCell>{item.subsistema}</TableCell>
                      <TableCell>{item.sistema}</TableCell>
                      <TableCell>{item.linea}</TableCell>
                      <TableCell className="text-right">
                        {item.paros.toLocaleString("es-MX")}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.tiempo_total.toLocaleString("es-MX")}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.porcentaje.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
} 