import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface StopData {
  id: string;
  fechaInicio: string;
  fechaFin: string | null;
  tiempoMinutos: number;
  tipoParo: string;
  sistema: string;
  subsistema: string;
  materiaPrima: string | null;
  desviacionCalidad: string | null;
  descripcion: string | null;
}

export function StopsTable() {
  const [data, setData] = useState<StopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/stops-table");
        if (!response.ok) throw new Error("Error al cargar los datos");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Tabla de Paros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Tabla de Paros</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Tabla de Paros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Tiempo (min)</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead>Subsistema</TableHead>
                <TableHead>Materia Prima</TableHead>
                <TableHead>Desviación</TableHead>
                <TableHead>Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((stop) => (
                <TableRow key={stop.id}>
                  <TableCell>{formatDate(stop.fechaInicio)}</TableCell>
                  <TableCell>
                    {stop.fechaFin ? formatDate(stop.fechaFin) : "-"}
                  </TableCell>
                  <TableCell>{stop.tiempoMinutos}</TableCell>
                  <TableCell>{stop.tipoParo}</TableCell>
                  <TableCell>{stop.sistema}</TableCell>
                  <TableCell>{stop.subsistema}</TableCell>
                  <TableCell>{stop.materiaPrima || "-"}</TableCell>
                  <TableCell>{stop.desviacionCalidad || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {stop.descripcion || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 