"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Eye, 
  Search, 
  Loader2,
  CalendarIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface Producto {
  id: string;
  nombre: string;
  modelo: { nombre: string };
  sabor: { nombre: string };
  tamaño: { litros: number };
  caja: { numeroUnidades: number };
}

interface LineaProduccion {
  id: string;
  nombre: string;
}

// Interface for the API response
interface LineaProduccionResponse {
  id: string;
  name: string; // API returns 'name' instead of 'nombre'
}

interface Produccion {
  id: string;
  numeroOrden: number;
  cajasProducidas: number;
  cajasPlanificadas: number;
  turno: number;
  fechaProduccion: string;
  lineaProduccion: LineaProduccion;
  producto: Producto;
  paros: any[];
  createdAt: string;
}

export default function ProductionOrdersList() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [ordenes, setOrdenes] = useState<Produccion[]>([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState<Produccion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedLineaId, setSelectedLineaId] = useState<string>("all");
  const [lineasProduccion, setLineasProduccion] = useState<LineaProduccion[]>([]);

  // Fetch production orders and production lines
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch production orders
        const ordenesRes = await fetch("/api/ordenes");
        if (ordenesRes.ok) {
          const ordenesData = await ordenesRes.json();
          setOrdenes(ordenesData);
          setFilteredOrdenes(ordenesData);
        }

        // Fetch production lines for filtering
        const lineasRes = await fetch("/api/production-lines");
        if (lineasRes.ok) {
          const lineasData: LineaProduccionResponse[] = await lineasRes.json();
          // Map the API response to match our interface
          const mappedLineas: LineaProduccion[] = lineasData.map(linea => ({
            id: linea.id,
            nombre: linea.name
          }));
          setLineasProduccion(mappedLineas);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters when search term, date, or line changes
  useEffect(() => {
    let filtered = [...ordenes];

    // Filter by search term (order number or product name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (orden) =>
          orden.numeroOrden.toString().includes(term) ||
          orden.producto.nombre.toLowerCase().includes(term)
      );
    }

    // Filter by date
    if (selectedDate) {
      const dateString = format(selectedDate, "yyyy-MM-dd");
      filtered = filtered.filter((orden) =>
        orden.fechaProduccion.startsWith(dateString)
      );
    }

    // Filter by production line
    if (selectedLineaId && selectedLineaId !== "all") {
      filtered = filtered.filter(
        (orden) => orden.lineaProduccion.id === selectedLineaId
      );
    }

    setFilteredOrdenes(filtered);
  }, [searchTerm, selectedDate, selectedLineaId, ordenes]);

  // Calculate progress percentage
  const calculateProgress = (producidas: number, planificadas: number) => {
    const percentage = (producidas / planificadas) * 100;
    return Math.min(percentage, 100).toFixed(0);
  };

  // View order details
  const viewOrderDetails = (id: string) => {
    router.push(`/production-orders/${id}`);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedDate(undefined);
    setSelectedLineaId("all");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Cargando órdenes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-3 rounded-md border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search filter */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número o producto..."
              className="pl-8 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Date filter */}
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 border-border shadow-sm",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: es })
                  ) : (
                    <span>Filtrar por fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Production line filter */}
          <div>
            <Select value={selectedLineaId} onValueChange={setSelectedLineaId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Filtrar por línea" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las líneas</SelectItem>
                {lineasProduccion.map((linea) => (
                  <SelectItem key={linea.id} value={linea.id}>
                    {linea.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Reset filters button */}
          <div className="flex items-center">
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="h-10 w-full md:w-auto"
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Results count and table */}
      <div className="bg-white rounded-md border shadow-sm">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-lg sm:text-xl font-medium text-black">Lista de Órdenes</h3>
            {ordenes.length > 0 && (
              <span className="text-xs text-black bg-muted px-2 py-1 rounded-md">
                {filteredOrdenes.length} de {ordenes.length} {ordenes.length === 1 ? 'orden' : 'órdenes'}
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        {filteredOrdenes.length > 0 ? (
          <div className="px-4 sm:px-6 pb-4">
            <div className="rounded-md border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-medium">Orden #</TableHead>
                      <TableHead className="font-medium">Producto</TableHead>
                      <TableHead className="font-medium">Línea</TableHead>
                      <TableHead className="font-medium">Fecha</TableHead>
                      <TableHead className="font-medium">Turno</TableHead>
                      <TableHead className="font-medium">Progreso</TableHead>
                      <TableHead className="font-medium text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrdenes.map((orden) => (
                      <TableRow key={orden.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {orden.numeroOrden}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[250px]">
                            <div className="font-medium truncate">{orden.producto.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {orden.producto.sabor.nombre} • {orden.producto.tamaño.litros}L • {orden.producto.modelo.nombre}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{orden.lineaProduccion.nombre}</TableCell>
                        <TableCell>
                          {format(new Date(orden.fechaProduccion), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Turno {orden.turno}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className={cn(
                                  "h-2.5 rounded-full",
                                  parseInt(calculateProgress(orden.cajasProducidas, orden.cajasPlanificadas)) === 100
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                                )}
                                style={{
                                  width: `${calculateProgress(
                                    orden.cajasProducidas,
                                    orden.cajasPlanificadas
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs whitespace-nowrap">
                              {orden.cajasProducidas} / {orden.cajasPlanificadas}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost" 
                            size="icon"
                            onClick={() => viewOrderDetails(orden.id)}
                            className="h-9 w-9 text-primary hover:text-primary-dark hover:bg-primary/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="text-muted-foreground mb-2">
              No se encontraron órdenes de producción
            </div>
            <Button variant="outline" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 