"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Card } from "@tremor/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { useDateRange } from "@/context/DateRangeContext";
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
import { downloadCSV } from "@/lib/utils/csv";
import { Download } from "lucide-react";

interface Size {
  id: string;
  nombre: string;
}

interface SizeData {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

export default function SizesReport() {
  const router = useRouter();
  const { date, setDate, selectedPeriod, setSelectedPeriod } = useDateRange();
  const [data, setData] = useState<SizeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!date?.from || !date?.to) return;

      setLoading(true);
      setError(null);
      try {
        // Primero obtenemos todos los tamaños
        const sizesResponse = await fetch('/api/tamanos');
        if (!sizesResponse.ok) throw new Error("Error al cargar los tamaños");
        const sizes: Size[] = await sizesResponse.json();

        // Luego obtenemos la producción para el rango de fechas
        const params = new URLSearchParams({
          from: date.from.toISOString(),
          to: date.to.toISOString(),
        });

        const productionResponse = await fetch(`/api/produccion?${params}`);
        if (!productionResponse.ok) throw new Error("Error al cargar la producción");
        const production = await productionResponse.json();

        // Calculamos la producción por tamaño
        const sizeProduction = sizes.map(size => {
          // Filtramos las producciones que corresponden a productos con este tamaño
          const produced = production
            .filter((p: any) => p.producto.tamanoId === size.id)
            .reduce((acc: number, curr: any) => acc + curr.cajasProducidas, 0);
          
          return {
            nombre: size.nombre,
            cantidad: produced,
          };
        }).filter(item => item.cantidad > 0); // Solo incluimos tamaños que tienen producción

        // Calculamos el total y los porcentajes
        const total = sizeProduction.reduce((acc, curr) => acc + curr.cantidad, 0);
        const sizeData = sizeProduction
          .map(item => ({
            ...item,
            porcentaje: (item.cantidad / total) * 100,
          }))
          .sort((a, b) => b.cantidad - a.cantidad);

        setData(sizeData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date]);

  const handleDownloadCSV = () => {
    const csvData = data.map((item) => ({
      Tamaño: item.nombre,
      "Cajas Producidas": item.cantidad,
      "Porcentaje": `${item.porcentaje.toFixed(1)}%`,
    }));

    downloadCSV(csvData, "reporte-tamanos.csv");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Reporte de Producción por Tamaño</h1>
        </div>
      </div>

      <Card className="bg-white border shadow-sm">
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <DateRangeFilter
              date={date}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              onDateChange={setDate}
            />
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleDownloadCSV}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar CSV
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[400px]" />
              <Skeleton className="h-4 w-[300px]" />
              <Skeleton className="h-4 w-[350px]" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : data.length === 0 ? (
            <Alert>
              <AlertDescription>No hay datos disponibles para el período seleccionado</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="rounded-md border-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tamaño</TableHead>
                      <TableHead className="text-right">Cajas Producidas</TableHead>
                      <TableHead className="text-right">Porcentaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => (
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