import { useEffect, useState } from "react";
import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from "@tremor/react";
import { formatNumber } from "@/lib/utils/formatters";

interface BoxData {
  name: string;
  unidadesTotales: number;
  cajasTotales: number;
  numeroUnidades: number;
}

export function MostUsedBoxes() {
  const [data, setData] = useState<BoxData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/most-used-boxes');
        if (!response.ok) {
          throw new Error('Error al obtener los datos');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card className="h-full">
        <Title>Cajas Más Usadas en Producción</Title>
        <div className="h-[300px] flex items-center justify-center">
          Cargando datos...
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="h-full">
        <Title>Cajas Más Usadas en Producción</Title>
        <div className="h-[300px] flex items-center justify-center text-red-500">
          {error || "No hay datos disponibles"}
        </div>
      </Card>
    );
  }

  const totalUnidades = data.reduce((sum, item) => sum + item.unidadesTotales, 0);
  const totalCajas = data.reduce((sum, item) => sum + item.cajasTotales, 0);

  return (
    <Card className="h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <Title>Cajas Más Usadas en Producción</Title>
          <p className="text-sm text-gray-600 mt-2">
            Total de unidades: {formatNumber(totalUnidades)} | Total de cajas: {formatNumber(totalCajas)}
          </p>
        </div>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Tipo de Caja</TableHeaderCell>
            <TableHeaderCell className="text-right">Unidades por Caja</TableHeaderCell>
            <TableHeaderCell className="text-right">Total de Cajas</TableHeaderCell>
            <TableHeaderCell className="text-right">Total de Unidades</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.name}>
              <TableCell>{item.name}</TableCell>
              <TableCell className="text-right">{formatNumber(item.numeroUnidades)}</TableCell>
              <TableCell className="text-right">{formatNumber(item.cajasTotales)}</TableCell>
              <TableCell className="text-right">{formatNumber(item.unidadesTotales)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
} 