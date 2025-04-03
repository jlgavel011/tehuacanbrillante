import { useEffect, useState } from "react";
import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from "@tremor/react";
import { formatNumber } from "@/lib/utils/formatters";

interface BoxTypeData {
  name: string;
  cajas: number;
  cajasPlanificadas: number;
  cumplimiento: number;
  unidades: number;
  unidadesPlanificadas: number;
}

export function ProductionByBoxType() {
  const [data, setData] = useState<BoxTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/production-by-box-type');
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
        <Title>Producción por Tipo de Caja</Title>
        <div className="h-[300px] flex items-center justify-center">
          Cargando datos...
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="h-full">
        <Title>Producción por Tipo de Caja</Title>
        <div className="h-[300px] flex items-center justify-center text-red-500">
          {error || "No hay datos disponibles"}
        </div>
      </Card>
    );
  }

  const totalCajas = data.reduce((sum, item) => sum + item.cajas, 0);
  const totalCajasPlanificadas = data.reduce((sum, item) => sum + item.cajasPlanificadas, 0);
  const totalUnidades = data.reduce((sum, item) => sum + item.unidades, 0);
  const totalUnidadesPlanificadas = data.reduce((sum, item) => sum + item.unidadesPlanificadas, 0);
  const cumplimientoPromedio = (totalCajas / totalCajasPlanificadas) * 100;

  return (
    <Card className="h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <Title>Producción por Tipo de Caja</Title>
          <p className="text-sm text-gray-600 mt-2">
            Total de cajas: {formatNumber(totalCajas)} | Planificadas: {formatNumber(totalCajasPlanificadas)} | 
            Cumplimiento: {formatNumber(cumplimientoPromedio)}%
          </p>
          <p className="text-sm text-gray-600">
            Total de unidades: {formatNumber(totalUnidades)} | Planificadas: {formatNumber(totalUnidadesPlanificadas)}
          </p>
        </div>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Tipo de Caja</TableHeaderCell>
            <TableHeaderCell className="text-right">Cajas Producidas</TableHeaderCell>
            <TableHeaderCell className="text-right">Cajas Planificadas</TableHeaderCell>
            <TableHeaderCell className="text-right">Cumplimiento</TableHeaderCell>
            <TableHeaderCell className="text-right">Unidades Producidas</TableHeaderCell>
            <TableHeaderCell className="text-right">Unidades Planificadas</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.name}>
              <TableCell>{item.name}</TableCell>
              <TableCell className="text-right">{formatNumber(item.cajas)}</TableCell>
              <TableCell className="text-right">{formatNumber(item.cajasPlanificadas)}</TableCell>
              <TableCell className="text-right">{formatNumber(item.cumplimiento)}%</TableCell>
              <TableCell className="text-right">{formatNumber(item.unidades)}</TableCell>
              <TableCell className="text-right">{formatNumber(item.unidadesPlanificadas)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
} 