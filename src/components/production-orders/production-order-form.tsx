"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Define the form schema
const formSchema = z.object({
  productoId: z.string({
    required_error: "Por favor selecciona un producto",
  }),
  lineaProduccionId: z.string({
    required_error: "Por favor selecciona una línea de producción",
  }),
  fechaProduccion: z.date({
    required_error: "Por favor selecciona una fecha",
  }),
  turno: z.coerce.number().min(1).max(3),
  numeroOrden: z.coerce.number({
    required_error: "Por favor ingresa un número de orden",
  }).min(1, {
    message: "El número de orden debe ser mayor a 0",
  }),
  cajasPlanificadas: z.coerce.number().min(1, {
    message: "El número de cajas debe ser mayor a 0",
  }),
});

type ProductionOrderFormValues = z.infer<typeof formSchema>;

// Define interfaces for data
interface Producto {
  id: string;
  nombre: string;
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

export default function ProductionOrderForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [lineasProduccion, setLineasProduccion] = useState<LineaProduccion[]>([]);

  // Initialize form with default values
  const form = useForm<ProductionOrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      turno: 1,
      fechaProduccion: new Date(),
      cajasPlanificadas: 100,
      numeroOrden: 10000,
    },
  });

  // Watch the lineaProduccionId to filter products
  const selectedLineaProduccionId = form.watch("lineaProduccionId");

  // Effect to filter products when a production line is selected
  useEffect(() => {
    if (selectedLineaProduccionId) {
      const fetchProductsForLine = async () => {
        try {
          const res = await fetch(`/api/production-lines/${selectedLineaProduccionId}/products`);
          if (res.ok) {
            const data = await res.json();
            // Use products that are associated with this production line
            const productsInLine = Array.isArray(data.productosEnLinea) 
              ? data.productosEnLinea.map((item: any) => ({
                  id: item.productoId,
                  nombre: item.producto.nombre
                }))
              : [];
            setFilteredProductos(productsInLine);
            
            // Reset product selection if the current product is not in the filtered list
            const currentProductId = form.getValues("productoId");
            if (currentProductId && !productsInLine.some((p: {id: string; nombre: string}) => p.id === currentProductId)) {
              form.setValue("productoId", "");
            }
          }
        } catch (error) {
          console.error("Error fetching products for production line:", error);
          toast.error("No se pudieron cargar los productos para esta línea de producción");
        }
      };
      
      fetchProductsForLine();
    } else {
      setFilteredProductos([]);
    }
  }, [selectedLineaProduccionId, form]);

  // Fetch products and production lines on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all products (for reference)
        const productosRes = await fetch("/api/productos");
        if (productosRes.ok) {
          const productosData = await productosRes.json();
          setProductos(productosData);
        }

        // Fetch production lines
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
        toast.error("No se pudieron cargar los datos necesarios");
      }
    };

    fetchData();
  }, []);

  // Handle form submission
  const onSubmit = async (values: ProductionOrderFormValues) => {
    try {
      setIsLoading(true);

      // Additional validation - make sure product is valid for the selected production line
      if (filteredProductos.length > 0 && !filteredProductos.some((p: {id: string; nombre: string}) => p.id === values.productoId)) {
        toast.error("El producto seleccionado no está disponible para esta línea de producción");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/ordenes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          // Format the date as ISO string for the API
          fechaProduccion: values.fechaProduccion.toISOString(),
        }),
      });

      let errorMessage = "Error al crear la orden de producción";
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError);
        }
        
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      toast.success("Orden de producción creada con éxito");
      router.push("/production-orders");
    } catch (error) {
      console.error("Error creating production order:", error);
      const errorMessage = error instanceof Error && error.message 
        ? error.message 
        : "Error al crear la orden de producción";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* Production Line Selection (Now first) */}
          <FormField
            control={form.control}
            name="lineaProduccionId"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Línea de Producción</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una línea" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {lineasProduccion.map((linea) => (
                      <SelectItem key={linea.id} value={linea.id}>
                        {linea.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs text-muted-foreground">
                  Selecciona la línea de producción
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Product Selection (Now second) */}
          <FormField
            control={form.control}
            name="productoId"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Producto</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!selectedLineaProduccionId || filteredProductos.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={
                          !selectedLineaProduccionId 
                            ? "Primero selecciona una línea" 
                            : filteredProductos.length === 0 
                              ? "No hay productos en esta línea" 
                              : "Selecciona un producto"
                        } 
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredProductos.map((producto) => (
                      <SelectItem key={producto.id} value={producto.id}>
                        {producto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs text-muted-foreground">
                  {!selectedLineaProduccionId 
                    ? "Primero selecciona una línea de producción" 
                    : filteredProductos.length === 0
                      ? "No hay productos asignados a esta línea"
                      : `Selecciona el producto a producir (${filteredProductos.length} productos disponibles)`}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Production Date */}
          <FormField
            control={form.control}
            name="fechaProduccion"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Fecha de Producción</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal h-10 border-border shadow-sm",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Selecciona una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription className="text-xs text-muted-foreground">
                  Fecha en la que se realizará la producción
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Shift */}
          <FormField
            control={form.control}
            name="turno"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Turno</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un turno" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Turno 1</SelectItem>
                    <SelectItem value="2">Turno 2</SelectItem>
                    <SelectItem value="3">Turno 3</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs text-muted-foreground">
                  Turno en el que se realizará la producción
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Order Number (Required) */}
          <FormField
            control={form.control}
            name="numeroOrden"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Número de Orden</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Número de orden"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : parseInt(value));
                    }}
                  />
                </FormControl>
                <FormDescription className="text-xs text-muted-foreground">
                  Número único que identifica la orden de producción
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Planned Boxes */}
          <FormField
            control={form.control}
            name="cajasPlanificadas"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Cajas Planificadas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Número de cajas"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-muted-foreground">
                  Número de cajas que se planea producir
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full md:w-auto" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Orden de Producción"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 