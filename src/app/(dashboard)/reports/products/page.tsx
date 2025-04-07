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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { downloadCSV } from "@/lib/utils/csv";
import { Download } from "lucide-react";

interface ProductData {
  nombre: string;
  cantidad: number;
  porcentaje: number;
  modelo: string;
  sabor: string;
  tamaño: string;
  caja: number;
  litros?: number;
  litrosPorcentaje?: number;
}

export default function ProductsReport() {
  const router = useRouter();
  const { selectedPeriod, setSelectedPeriod, date, setDate } = useDateRangeFilter();
  const [data, setData] = useState<ProductData[]>([]);
  const [filteredData, setFilteredData] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ProductData | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("todos");
  const [selectedFlavor, setSelectedFlavor] = useState<string>("todos");
  const [selectedSize, setSelectedSize] = useState<string>("todos");
  const [selectedUnitsPerBox, setSelectedUnitsPerBox] = useState<string>("todos");

  // Obtener valores únicos para los filtros
  const uniqueModels = Array.from(new Set(data.map((item) => item.modelo))).sort();
  const uniqueFlavors = Array.from(new Set(data.map((item) => item.sabor))).sort();
  const uniqueSizes = Array.from(new Set(data.map((item) => item.tamaño))).sort();
  const uniqueUnitsPerBox = Array.from(
    new Set(
      data
        .map((item) => item.caja)
        .filter((units): units is number => units !== undefined && units !== null)
    )
  ).sort((a, b) => a - b);

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

        // Obtener datos de cajas producidas
        const boxesResponse = await fetch(`/api/analytics/most-produced-products?${params}`);
        if (!boxesResponse.ok) throw new Error("Error al cargar los datos de cajas");
        const boxesResult = await boxesResponse.json();
        
        // Obtener datos de litros producidos
        const litersResponse = await fetch(`/api/analytics/most-produced-products-liters?${params}`);
        if (!litersResponse.ok) throw new Error("Error al cargar los datos de litros");
        const litersResult = await litersResponse.json();
        
        // Crear un mapa para combinar productos
        const productMap = new Map<string, ProductData>();
        
        // Primero, agregar todos los productos del reporte de cajas
        boxesResult.forEach((item: any) => {
          productMap.set(item.nombre, {
            ...item,
            litros: 0,
            litrosPorcentaje: 0
          });
        });
        
        // Luego actualizar o agregar los productos del reporte de litros
        litersResult.forEach((item: any) => {
          if (productMap.has(item.nombre)) {
            // Actualizar producto existente
            const product = productMap.get(item.nombre)!;
            productMap.set(item.nombre, {
              ...product,
              litros: item.litros,
              litrosPorcentaje: item.porcentaje
            });
          } else {
            // Agregar nuevo producto que solo aparece en el reporte de litros
            productMap.set(item.nombre, {
              nombre: item.nombre,
              modelo: item.modelo,
              sabor: item.sabor,
              tamaño: item.tamaño,
              caja: 0, // No tenemos información de cajas
              cantidad: 0,
              porcentaje: 0,
              litros: item.litros,
              litrosPorcentaje: item.porcentaje
            });
          }
        });
        
        // Convertir el mapa a un array
        const combinedData = Array.from(productMap.values());
        
        console.log("Datos combinados:", combinedData);
        setData(combinedData);
        setFilteredData(combinedData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [date]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedModel !== "todos") {
      filtered = filtered.filter((item) => item.modelo === selectedModel);
    }

    if (selectedFlavor !== "todos") {
      filtered = filtered.filter((item) => item.sabor === selectedFlavor);
    }

    if (selectedSize !== "todos") {
      filtered = filtered.filter((item) => item.tamaño === selectedSize);
    }

    if (selectedUnitsPerBox !== "todos") {
      filtered = filtered.filter((item) => item.caja === Number(selectedUnitsPerBox));
    }

    setFilteredData(filtered);
  }, [data, searchTerm, selectedModel, selectedFlavor, selectedSize, selectedUnitsPerBox]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedModel("todos");
    setSelectedFlavor("todos");
    setSelectedSize("todos");
    setSelectedUnitsPerBox("todos");
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleDownload = () => {
    // Preparar los datos para CSV incluyendo litros
    const csvData = filteredData.map(item => ({
      Producto: item.nombre,
      Modelo: item.modelo,
      Sabor: item.sabor,
      Tamaño: item.tamaño,
      "Unidades/Caja": item.caja,
      "Cajas Producidas": item.cantidad,
      "% Cajas": `${item.porcentaje.toFixed(1)}%`,
      "Litros Producidos": item.litros || 0,
      "% Litros": `${(item.litrosPorcentaje || 0).toFixed(1)}%`
    }));
    
    downloadCSV(csvData, "reporte_productos");
  };

  const handleSelectItem = (item: ProductData) => {
    if (selectedItem && selectedItem.nombre === item.nombre) {
      setSelectedItem(null); // Deseleccionar si ya está seleccionado
    } else {
      setSelectedItem(item); // Seleccionar nuevo elemento
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedItem) return;
    
    // Filtrar el elemento seleccionado de los datos
    const updatedData = data.filter(item => item.nombre !== selectedItem.nombre);
    setData(updatedData);
    
    // Actualizar también los datos filtrados
    const updatedFilteredData = filteredData.filter(item => item.nombre !== selectedItem.nombre);
    setFilteredData(updatedFilteredData);
    
    // Limpiar la selección
    setSelectedItem(null);
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
            <h1 className="text-2xl font-semibold">Reporte de Producción por Producto</h1>
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
          <h1 className="text-2xl font-semibold">Reporte de Producción por Producto</h1>
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
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-[450px]"
                  />
                  <div className="flex gap-2">
                    {selectedItem && (
                      <Button variant="destructive" onClick={handleDeleteSelected}>
                        Eliminar seleccionado
                      </Button>
                    )}
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
                <div className="grid grid-cols-4 gap-4">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los modelos</SelectItem>
                      {uniqueModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedFlavor} onValueChange={setSelectedFlavor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por sabor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los sabores</SelectItem>
                      {uniqueFlavors.map((flavor) => (
                        <SelectItem key={flavor} value={flavor}>
                          {flavor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tamaños</SelectItem>
                      {uniqueSizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedUnitsPerBox} onValueChange={setSelectedUnitsPerBox}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unidades por caja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las unidades</SelectItem>
                      {uniqueUnitsPerBox.map((units) => (
                        <SelectItem key={units.toString()} value={units.toString()}>
                          {units} unidades
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Sabor</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead className="text-right">Unidades/Caja</TableHead>
                      <TableHead className="text-right">Cajas Producidas</TableHead>
                      <TableHead className="text-right">% Cajas</TableHead>
                      <TableHead className="text-right">Litros Producidos</TableHead>
                      <TableHead className="text-right">% Litros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow 
                        key={item.nombre} 
                        className={`cursor-pointer ${selectedItem?.nombre === item.nombre ? 'bg-muted' : ''}`}
                        onClick={() => handleSelectItem(item)}
                      >
                        <TableCell>{item.nombre}</TableCell>
                        <TableCell>{item.modelo}</TableCell>
                        <TableCell>{item.sabor}</TableCell>
                        <TableCell>{item.tamaño}</TableCell>
                        <TableCell className="text-right">
                          {item.caja ?? '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.cantidad.toLocaleString("es-MX")}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.porcentaje.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {(item.litros || 0).toLocaleString("es-MX", { 
                            maximumFractionDigits: 2 
                          })} L
                        </TableCell>
                        <TableCell className="text-right">
                          {(item.litrosPorcentaje || 0).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedItem && (
                <div className="p-4 border rounded-md bg-muted/30">
                  <h3 className="text-lg font-medium mb-2">Elemento seleccionado:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-medium">Producto:</span> {selectedItem.nombre}</div>
                    <div><span className="font-medium">Modelo:</span> {selectedItem.modelo}</div>
                    <div><span className="font-medium">Sabor:</span> {selectedItem.sabor}</div>
                    <div><span className="font-medium">Tamaño:</span> {selectedItem.tamaño}</div>
                    <div><span className="font-medium">Cajas:</span> {selectedItem.cantidad.toLocaleString("es-MX")}</div>
                    <div><span className="font-medium">Litros:</span> {(selectedItem.litros || 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })} L</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
} 