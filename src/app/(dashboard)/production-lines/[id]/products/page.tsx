"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProductionLine = {
  id: string;
  nombre: string;
};

type ProductionLineWithSpeed = {
  id: string;
  nombre: string;
  velocidadProduccion: number | null;
};

type Producto = {
  id: string;
  nombre: string;
  sabor: {
    nombre: string;
  };
  tamaño: {
    litros: number;
    nombre?: string;
  };
  modelo: {
    nombre: string;
  };
  caja: {
    numeroUnidades: number;
    nombre?: string;
  };
  otherProductionLines?: ProductionLineWithSpeed[];
};

type ProductoEnLinea = {
  id: string;
  productoId: string;
  lineaProduccionId: string;
  velocidadProduccion?: number | null;
  producto: Producto;
};

export default function ProductsPage() {
  const params = useParams();
  const router = useRouter();
  const lineaId = params.id as string;

  const [productionLine, setProductionLine] = useState<ProductionLine | null>(null);
  const [productsInLine, setProductsInLine] = useState<ProductoEnLinea[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Producto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch production line details and products
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch production line details
      const lineResponse = await fetch(`/api/production-lines/${lineaId}`);
      if (!lineResponse.ok) {
        throw new Error("Error al cargar la línea de producción");
      }
      const lineData = await lineResponse.json();
      setProductionLine(lineData);
      
      // Fetch products in the production line
      const productsResponse = await fetch(`/api/production-lines/${lineaId}/products`);
      if (!productsResponse.ok) {
        throw new Error("Error al cargar los productos");
      }
      const productsData = await productsResponse.json();
      
      // Ensure productosEnLinea is an array before setting state
      const productosEnLinea = Array.isArray(productsData.productosEnLinea) 
        ? productsData.productosEnLinea 
        : [];
      
      // Log the raw data to see what's coming from the API
      console.log('Raw productosEnLinea data:', JSON.stringify(productosEnLinea, null, 2));
      
      // Check if velocidadProduccion is present in the data
      productosEnLinea.forEach((product: ProductoEnLinea) => {
        console.log(`Product ${product.productoId} has velocidadProduccion:`, 'velocidadProduccion' in product);
        console.log(`Product ${product.productoId} velocidadProduccion value:`, product.velocidadProduccion);
        console.log(`Product ${product.productoId} velocidadProduccion type:`, typeof product.velocidadProduccion);
        
        // If velocidadProduccion is missing or null, set it to 0
        if (product.velocidadProduccion == null) {
          console.log(`Setting velocidadProduccion to 0 for product ${product.productoId}`);
          product.velocidadProduccion = 0;
        }
      });
        
      setProductsInLine(productosEnLinea);
      setAvailableProducts(Array.isArray(productsData.availableProducts) 
        ? productsData.availableProducts 
        : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("No se pudieron cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lineaId]);

  // Add a product to the production line
  const handleAddProduct = async (productoId: string) => {
    try {
      setUpdatingProductId(productoId); // Show loading state
      
      // Find the product name for better feedback
      const product = availableProducts.find(p => p.id === productoId);
      const productName = product?.nombre || "Producto";
      
      console.log(`Adding product ${productoId} to line ${lineaId} for cajas/hora configuration`);
      
      const response = await fetch(`/api/production-lines/${lineaId}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productoId }),
      });

      const data = await response.json();
      console.log("Response data:", data);
      
      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.message}: ${data.details}`
          : data.message || "Error al agregar el producto para configuración de cajas/hora";
        throw new Error(errorMessage);
      }

      toast.success(`${productName} agregado con éxito. Ahora puede configurar las cajas/hora.`);
      fetchData();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error(error instanceof Error ? error.message : "Error al agregar el producto para configuración de cajas/hora");
    } finally {
      setUpdatingProductId(null); // Clear loading state
    }
  };

  // Remove a product from the production line
  const handleRemoveProduct = async (productoId: string) => {
    try {
      setUpdatingProductId(productoId); // Show loading state
      
      // Find the product name for better feedback
      const product = productsInLine.find(item => item.productoId === productoId);
      const productName = product?.producto.nombre || "Producto";
      
      console.log(`Removing product ${productoId} from line ${lineaId} (removing cajas/hora configuration)`);
      
      const response = await fetch(`/api/production-lines/${lineaId}/products?productoId=${productoId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      console.log("Response data:", data);
      
      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.message}: ${data.details}`
          : data.message || "Error al eliminar el producto y su configuración de cajas/hora";
        throw new Error(errorMessage);
      }

      toast.success(`${productName} y su configuración de cajas/hora eliminados con éxito`);
      fetchData();
    } catch (error) {
      console.error("Error removing product:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar el producto y su configuración de cajas/hora");
    } finally {
      setUpdatingProductId(null); // Clear loading state
    }
  };

  // Update the production speed of a product
  const handleUpdateSpeed = async (productoId: string, velocidadProduccion: number) => {
    setUpdatingProductId(productoId);
    try {
      console.log(`Updating speed for product ${productoId} to ${velocidadProduccion} cajas/hora`);
      
      // Find the current product to get its name for better feedback
      const currentProduct = productsInLine.find(item => item.productoId === productoId);
      const productName = currentProduct?.producto.nombre || "Producto";
      
      // Log the current velocidadProduccion value
      console.log(`Current velocidadProduccion for product ${productoId}:`, currentProduct?.velocidadProduccion);
      console.log(`Current velocidadProduccion type:`, typeof currentProduct?.velocidadProduccion);
      console.log(`velocidadProduccion field exists:`, currentProduct && 'velocidadProduccion' in currentProduct);
      
      // Make a direct fetch request to update the database
      const response = await fetch(`/api/direct-update-speed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          lineaId, 
          productoId, 
          velocidadProduccion 
        }),
      });

      const data = await response.json();
      console.log("Response data:", data);
      
      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.message}: ${data.details}`
          : data.message || "Error al actualizar la velocidad en cajas/hora";
        throw new Error(errorMessage);
      }

      toast.success(`Velocidad de ${productName} actualizada a ${velocidadProduccion.toLocaleString()} cajas/hora`);
      
      // Refresh the data to get the updated velocidadProduccion
      fetchData();
    } catch (error) {
      console.error("Error updating speed:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar la velocidad en cajas/hora");
    } finally {
      setUpdatingProductId(null);
    }
  };

  // Filter available products based on search query
  const filteredAvailableProducts = availableProducts.filter((product) =>
    product.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container px-4 py-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/production-lines">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-black">
              Gestión de Productos
            </h1>
          </div>
          <p className="text-sm md:text-base text-black mt-1">
            {productionLine ? `Línea: ${productionLine.nombre}` : "Cargando..."}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side: Assigned Products */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Productos Asignados</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configura la velocidad de producción para cada producto en cajas por hora.
                Las velocidades guardadas se muestran debajo de cada producto.
              </p>
            </CardHeader>
            <CardContent>
              {productsInLine.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay productos asignados a esta línea de producción.
                </div>
              ) : (
                <div className="space-y-4">
                  {productsInLine.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 mb-3 sm:mb-0">
                        <p className="font-medium">{item.producto.nombre}</p>
                        {item.velocidadProduccion != null && (
                          <p className="text-sm font-medium text-primary mt-1">
                            Velocidad actual: {item.velocidadProduccion.toLocaleString()} cajas/hora
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                        <div className="w-full sm:w-auto">
                          <Label htmlFor={`speed-${item.id}`} className="text-xs text-muted-foreground mb-1 block">
                            Velocidad (cajas/hora)
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`speed-${item.id}`}
                              type="number"
                              placeholder="Velocidad"
                              className="w-full sm:w-36"
                              defaultValue={item.velocidadProduccion != null ? item.velocidadProduccion : 0}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value !== item.velocidadProduccion) {
                                  handleUpdateSpeed(item.productoId, value);
                                } else if (e.target.value === '' && item.velocidadProduccion != null) {
                                  // Reset to current value if field is emptied
                                  e.target.value = item.velocidadProduccion.toString();
                                }
                              }}
                              disabled={updatingProductId === item.productoId}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              onClick={() => handleRemoveProduct(item.productoId)}
                              disabled={updatingProductId === item.productoId}
                            >
                              {updatingProductId === item.productoId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right side: Available Products */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Productos Disponibles</CardTitle>
              <p className="text-sm text-muted-foreground">
                Productos que pueden ser asignados a esta línea de producción.
                Se muestra información sobre otras líneas donde ya están asignados.
              </p>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredAvailableProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? "No se encontraron productos que coincidan con la búsqueda."
                    : "No hay productos disponibles para agregar."}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAvailableProducts.map((product) => (
                    <div key={product.id} className="flex flex-col p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{product.nombre}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-primary hover:text-primary-dark hover:bg-primary/10"
                          onClick={() => handleAddProduct(product.id)}
                          disabled={updatingProductId === product.id}
                        >
                          {updatingProductId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      {product.otherProductionLines && product.otherProductionLines.length > 0 && (
                        <div className="mt-1 text-xs">
                          <p className="font-medium text-muted-foreground">También asignado a:</p>
                          <ul className="mt-1 space-y-1">
                            {product.otherProductionLines.map((line) => (
                              <li key={line.id} className="flex items-center justify-between">
                                <span>{line.nombre}</span>
                                {line.velocidadProduccion && (
                                  <span className="text-primary font-medium">
                                    {line.velocidadProduccion.toLocaleString()} cajas/hora
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 