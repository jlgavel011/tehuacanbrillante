import { useState, useEffect } from "react";
import {
  Card,
  Title,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
} from "@tremor/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProductionOrder {
  id: string;
  fechaProduccion: Date;
  turno: number;
  producto: {
    nombre: string;
    sabor: {
      nombre: string;
    };
    modelo: {
      nombre: string;
    };
    tamaño: {
      nombre: string;
    };
  };
  linea: {
    nombre: string;
  };
  cajasProducidas: number;
  cajasPlanificadas: number;
  cumplimiento: number;
  estado: string;
}

export function ProductionOrdersHistory() {
  const [data, setData] = useState<ProductionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/analytics/detailed/production-orders?page=${page}&limit=${itemsPerPage}`);
        if (!response.ok) {
          throw new Error("Error al cargar los datos");
        }
        const result = await response.json();
        setData(result.data);
        setTotalPages(Math.ceil(result.total / itemsPerPage));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page]);

  if (isLoading) {
    return (
      <Card>
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse">Cargando...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="h-96 flex items-center justify-center text-red-500">
          {error}
        </div>
      </Card>
    );
  }

  const getCumplimientoBadge = (cumplimiento: number) => {
    if (cumplimiento >= 95) return <Badge color="green">{cumplimiento.toFixed(1)}%</Badge>;
    if (cumplimiento >= 85) return <Badge color="yellow">{cumplimiento.toFixed(1)}%</Badge>;
    return <Badge color="red">{cumplimiento.toFixed(1)}%</Badge>;
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "completada":
        return <Badge color="green">Completada</Badge>;
      case "en_progreso":
        return <Badge color="blue">En Progreso</Badge>;
      default:
        return <Badge color="gray">Pendiente</Badge>;
    }
  };

  return (
    <Card>
      <div className="p-4">
        <Title>Historial de Órdenes de Producción</Title>
        
        <div className="mt-6">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Fecha</TableHeaderCell>
                <TableHeaderCell>Turno</TableHeaderCell>
                <TableHeaderCell>Línea</TableHeaderCell>
                <TableHeaderCell>Producto</TableHeaderCell>
                <TableHeaderCell>Cajas Producidas</TableHeaderCell>
                <TableHeaderCell>Cajas Planificadas</TableHeaderCell>
                <TableHeaderCell>Cumplimiento</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    {format(new Date(order.fechaProduccion), "PPpp", { locale: es })}
                  </TableCell>
                  <TableCell>Turno {order.turno}</TableCell>
                  <TableCell>{order.linea.nombre}</TableCell>
                  <TableCell>
                    {`${order.producto.sabor.nombre} ${order.producto.modelo.nombre} ${order.producto.tamaño.nombre}`}
                  </TableCell>
                  <TableCell>{order.cajasProducidas.toLocaleString()}</TableCell>
                  <TableCell>{order.cajasPlanificadas.toLocaleString()}</TableCell>
                  <TableCell>{getCumplimientoBadge(order.cumplimiento)}</TableCell>
                  <TableCell>{getEstadoBadge(order.estado)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    </Card>
  );
} 