"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
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
import { formatNumber } from "@/lib/utils/formatters";

interface FlavorData {
  id?: string;
  nombre: string;
  cantidad: number;
  litros: number;
  porcentajeCajas: number;
  porcentajeLitros: number;
}

export default function FlavorsReport() {
  const router = useRouter();
  const { selectedPeriod, setSelectedPeriod, date, setDate } = useDateRangeFilter();
  const [data, setData] = useState<FlavorData[]>([]);
  const [filteredData, setFilteredData] = useState<FlavorData[]>([]);
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

        // Fetch boxes data
        const boxesResponse = await fetch(`/api/analytics/most-produced-flavors?${params}`);
        if (!boxesResponse.ok) throw new Error("Error al cargar los datos de cajas");
        const boxesResult = await boxesResponse.json();
        
        // Fetch liters data
        const litersResponse = await fetch(`/api/analytics/most-produced-flavors-liters?${params}`);
        if (!litersResponse.ok) throw new Error("Error al cargar los datos de litros");
        const litersResult = await litersResponse.json();

        // Combinar los datos
        const saboresMap = new Map<string, FlavorData>();
        
        // Primero agregar todos los datos de cajas
        boxesResult.forEach((item: any) => {
          saboresMap.set(item.nombre, {
            id: item.id,
            nombre: item.nombre,
            cantidad: item.cantidad,
            litros: 0,
            porcentajeCajas: item.porcentaje,
            porcentajeLitros: 0
          });
        });
        
        // Luego agregar o actualizar con los datos de litros
        litersResult.forEach((item: any) => {
          if (saboresMap.has(item.nombre)) {
            // Actualizar un sabor existente
            const existingData = saboresMap.get(item.nombre)!;
            existingData.litros = item.litros;
            existingData.porcentajeLitros = item.porcentaje;
          } else {
            // Agregar un nuevo sabor
            saboresMap.set(item.nombre, {
              id: item.id,
              nombre: item.nombre,
              cantidad: 0,
              litros: item.litros,
              porcentajeCajas: 0,
              porcentajeLitros: item.porcentaje
            });
          }
        });
        
        // Convertir el mapa a array
        const combinedData = Array.from(saboresMap.values());
        
        // Ordenar por la suma de los porcentajes (para priorizar los sabores relevantes en ambas métricas)
        combinedData.sort((a, b) => 
          (b.porcentajeCajas + b.porcentajeLitros) - (a.porcentajeCajas + a.porcentajeLitros)
        );
        
        setData(combinedData);
        setFilteredData(combinedData);
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
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      const filtered = data.filter((item) => 
        item.nombre.toLowerCase().includes(searchTermLower)
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [data, searchTerm]);

  const resetFilters = () => {
    setSearchTerm("");
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleDownload = () => {
    const dataToDownload = filteredData.map(item => ({
      "Sabor": item.nombre,
      "Cajas Producidas": item.cantidad,
      "Litros Producidos": item.litros,
      "% Cajas": `${item.porcentajeCajas.toFixed(1)}%`,
      "% Litros": `${item.porcentajeLitros.toFixed(1)}%`
    }));
    
    downloadCSV(dataToDownload, "reporte_sabores_completo");
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
            <h1 className="text-2xl font-semibold">Reporte de Producción por Sabor</h1>
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

  const hasNoData = data.length === 0;

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
          <h1 className="text-2xl font-semibold">Reporte de Producción por Sabor</h1>
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
          ) : hasNoData ? (
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
                    placeholder="Buscar por nombre..."
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
                      onClick={handleDownload}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Tabla combinada */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sabor</TableHead>
                      <TableHead className="text-right">Cajas Producidas</TableHead>
                      <TableHead className="text-right">% Cajas</TableHead>
                      <TableHead className="text-right">Litros Producidos</TableHead>
                      <TableHead className="text-right">% Litros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No hay datos disponibles con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item) => (
                        <TableRow key={item.id || item.nombre}>
                          <TableCell>{item.nombre}</TableCell>
                          <TableCell className="text-right">
                            {formatNumber(item.cantidad)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.porcentajeCajas.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(item.litros)} L
                          </TableCell>
                          <TableCell className="text-right">
                            {item.porcentajeLitros.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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