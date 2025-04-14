import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CrearCajaForm from "./CrearCajaForm";
import CrearModeloForm from "./CrearModeloForm";
import CrearTamañoForm from "./CrearTamañoForm";
import CrearSaborForm from "./CrearSaborForm";
import CrearMateriaPrimaForm from "./CrearMateriaPrimaForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";

// Interfaces for the entities
interface Caja {
  id: string;
  nombre: string;
  numeroUnidades?: number;
}

interface Modelo {
  id: string;
  nombre: string;
}

interface Tamano {
  id: string;
  nombre: string;
  litros?: number;
}

interface Sabor {
  id: string;
  nombre: string;
}

interface MateriaPrima {
  id: string;
  nombre: string;
}

interface ProductoMateriaPrima {
  materiaPrima: MateriaPrima;
}

interface Producto {
  id: string;
  nombre: string;
  cajaId: string;
  caja: Caja;
  modeloId: string;
  modelo: Modelo;
  tamañoId: string;
  tamaño: Tamano;
  saborId: string;
  sabor: Sabor;
  materiasPrimas: ProductoMateriaPrima[];
}

// Props for the component
interface EditarProductoFormProps {
  producto: Producto;
  onSuccess: () => void;
}

// Form schema
const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  cajaId: z.string().min(1, "La caja es requerida"),
  modeloId: z.string().min(1, "El modelo es requerido"),
  tamañoId: z.string().min(1, "El tamaño es requerido"),
  saborId: z.string().min(1, "El sabor es requerido"),
  materiasPrimasIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditarProductoForm({ producto, onSuccess }: EditarProductoFormProps) {
  // State for the data
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [tamanos, setTamanos] = useState<Tamano[]>([]);
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [selectedMateriasPrimas, setSelectedMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [materiaPrimaSearch, setMateriaPrimaSearch] = useState("");
  
  // Dialog states
  const [isCajaDialogOpen, setIsCajaDialogOpen] = useState(false);
  const [isModeloDialogOpen, setIsModeloDialogOpen] = useState(false);
  const [isTamanoDialogOpen, setIsTamanoDialogOpen] = useState(false);
  const [isSaborDialogOpen, setIsSaborDialogOpen] = useState(false);
  const [isMateriaPrimaDialogOpen, setIsMateriaPrimaDialogOpen] = useState(false);
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);

  // Initialize form with product data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: producto.nombre,
      cajaId: producto.cajaId,
      modeloId: producto.modeloId,
      tamañoId: producto.tamañoId,
      saborId: producto.saborId,
      materiasPrimasIds: producto.materiasPrimas.map(pm => pm.materiaPrima.id),
    },
  });

  // Set up selected materias primas from the product
  useEffect(() => {
    if (producto.materiasPrimas) {
      setSelectedMateriasPrimas(producto.materiasPrimas.map(pm => pm.materiaPrima));
    }
  }, [producto]);

  // Fetch data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cajas
        const cajasResponse = await fetch("/api/cajas");
        if (cajasResponse.ok) {
          const cajasData = await cajasResponse.json();
          setCajas(cajasData);
        }

        // Fetch modelos
        const modelosResponse = await fetch("/api/modelos");
        if (modelosResponse.ok) {
          const modelosData = await modelosResponse.json();
          setModelos(modelosData);
        }

        // Fetch tamanos
        const tamanosResponse = await fetch("/api/tamanos");
        if (tamanosResponse.ok) {
          const tamanosData = await tamanosResponse.json();
          setTamanos(tamanosData);
        }

        // Fetch sabores
        const saboresResponse = await fetch("/api/sabores-api");
        if (saboresResponse.ok) {
          const saboresData = await saboresResponse.json();
          setSabores(saboresData);
        }

        // Fetch materias primas
        const materiasPrimasResponse = await fetch("/api/materias-primas");
        if (materiasPrimasResponse.ok) {
          const materiasPrimasData = await materiasPrimasResponse.json();
          setMateriasPrimas(materiasPrimasData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error al cargar los datos");
      }
    };

    fetchData();
  }, []);

  // Auto-generate product name based on selections
  useEffect(() => {
    const watchCajaId = form.watch("cajaId");
    const watchModeloId = form.watch("modeloId");
    const watchTamañoId = form.watch("tamañoId");
    const watchSaborId = form.watch("saborId");

    const selectedCaja = cajas.find(caja => caja.id === watchCajaId);
    const selectedModelo = modelos.find(modelo => modelo.id === watchModeloId);
    const selectedTamaño = tamanos.find(tamano => tamano.id === watchTamañoId);
    const selectedSabor = sabores.find(sabor => sabor.id === watchSaborId);

    if (selectedCaja && selectedModelo && selectedTamaño && selectedSabor) {
      // Format: SABOR + TAMAÑO + MODELO + CAJA
      const generatedName = `${selectedSabor.nombre} ${selectedTamaño.nombre} ${selectedModelo.nombre} ${selectedCaja.nombre}`;
      form.setValue("nombre", generatedName);
    }
  }, [form.watch("cajaId"), form.watch("modeloId"), form.watch("tamañoId"), form.watch("saborId"), cajas, modelos, tamanos, sabores, form]);

  // Handle materia prima selection
  const toggleMateriaPrima = (materiaPrima: MateriaPrima) => {
    const isSelected = selectedMateriasPrimas.some(mp => mp.id === materiaPrima.id);
    
    let newSelected: MateriaPrima[];
    
    if (isSelected) {
      // Remove if already selected
      newSelected = selectedMateriasPrimas.filter(mp => mp.id !== materiaPrima.id);
    } else {
      // Add if not selected
      newSelected = [...selectedMateriasPrimas, materiaPrima];
    }
    
    // Update the selected materias primas
    setSelectedMateriasPrimas(newSelected);
    
    // Update the form value outside of the state setter
    form.setValue("materiasPrimasIds", newSelected.map(mp => mp.id));
  };

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/productos/${producto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el producto");
      }

      toast.success("Producto actualizado correctamente");
      onSuccess();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar el producto");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new entity creation
  const handleNewCaja = (newCaja: { id: string; nombre: string } | { id: string; numeroUnidades: number }) => {
    const updatedCajas = [...cajas, newCaja as Caja];
    setCajas(updatedCajas);
    form.setValue("cajaId", newCaja.id);
    setIsCajaDialogOpen(false);
  };

  const handleNewModelo = (newModelo: { id: string; nombre: string }) => {
    const updatedModelos = [...modelos, newModelo];
    setModelos(updatedModelos);
    form.setValue("modeloId", newModelo.id);
    setIsModeloDialogOpen(false);
  };

  const handleNewTamano = (newTamano: { id: string; nombre: string } | { id: string; litros: number }) => {
    const updatedTamanos = [...tamanos, newTamano as Tamano];
    setTamanos(updatedTamanos);
    form.setValue("tamañoId", newTamano.id);
    setIsTamanoDialogOpen(false);
  };

  const handleNewSabor = (newSabor: { id: string; nombre: string }) => {
    const updatedSabores = [...sabores, newSabor];
    setSabores(updatedSabores);
    form.setValue("saborId", newSabor.id);
    setIsSaborDialogOpen(false);
  };

  const handleNewMateriaPrima = (newMateriaPrima: { id: string; nombre: string }) => {
    // First update the materias primas list
    const updatedMateriasPrimas = [...materiasPrimas, newMateriaPrima];
    setMateriasPrimas(updatedMateriasPrimas);
    
    // Then update the selected materias primas
    const updatedSelected = [...selectedMateriasPrimas, newMateriaPrima];
    setSelectedMateriasPrimas(updatedSelected);
    
    // Finally update the form value
    form.setValue("materiasPrimasIds", updatedSelected.map(mp => mp.id));
    
    // Don't close the dialog automatically
    // setIsMateriaPrimaDialogOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Caja Field */}
          <FormField
            control={form.control}
            name="cajaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caja</FormLabel>
                <div className="flex space-x-2">
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" className="text-sm text-gray-500" />
                      </SelectTrigger>
                      <SelectContent>
                        {cajas.map((caja) => (
                          <SelectItem key={caja.id} value={caja.id}>
                            {caja.nombre || `${caja.numeroUnidades} unidades`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <Dialog open={isCajaDialogOpen} onOpenChange={setIsCajaDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" type="button">+</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nueva Caja</DialogTitle>
                      </DialogHeader>
                      <CrearCajaForm onSuccess={handleNewCaja} />
                    </DialogContent>
                  </Dialog>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Modelo Field */}
          <FormField
            control={form.control}
            name="modeloId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <div className="flex space-x-2">
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" className="text-sm text-gray-500" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelos.map((modelo) => (
                          <SelectItem key={modelo.id} value={modelo.id}>
                            {modelo.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <Dialog open={isModeloDialogOpen} onOpenChange={setIsModeloDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" type="button">+</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Modelo</DialogTitle>
                      </DialogHeader>
                      <CrearModeloForm onSuccess={handleNewModelo} />
                    </DialogContent>
                  </Dialog>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tamaño Field */}
          <FormField
            control={form.control}
            name="tamañoId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tamaño</FormLabel>
                <div className="flex space-x-2">
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" className="text-sm text-gray-500" />
                      </SelectTrigger>
                      <SelectContent>
                        {tamanos.map((tamano) => (
                          <SelectItem key={tamano.id} value={tamano.id}>
                            {tamano.nombre || `${tamano.litros} L`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <Dialog open={isTamanoDialogOpen} onOpenChange={setIsTamanoDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" type="button">+</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Tamaño</DialogTitle>
                      </DialogHeader>
                      <CrearTamañoForm onSuccess={handleNewTamano} />
                    </DialogContent>
                  </Dialog>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sabor Field */}
          <FormField
            control={form.control}
            name="saborId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sabor</FormLabel>
                <div className="flex space-x-2">
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" className="text-sm text-gray-500" />
                      </SelectTrigger>
                      <SelectContent>
                        {sabores.map((sabor) => (
                          <SelectItem key={sabor.id} value={sabor.id}>
                            {sabor.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <Dialog open={isSaborDialogOpen} onOpenChange={setIsSaborDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" type="button">+</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Sabor</DialogTitle>
                      </DialogHeader>
                      <CrearSaborForm onSuccess={handleNewSabor} />
                    </DialogContent>
                  </Dialog>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Materias Primas Field */}
        <FormField
          control={form.control}
          name="materiasPrimasIds"
          render={() => (
            <FormItem>
              <FormLabel>Materias Primas</FormLabel>
              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">Materias Primas Seleccionadas:</div>
                  <Dialog open={isMateriaPrimaDialogOpen} onOpenChange={setIsMateriaPrimaDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" type="button" size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Agregar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nueva Materia Prima</DialogTitle>
                      </DialogHeader>
                      <CrearMateriaPrimaForm onSuccess={handleNewMateriaPrima} />
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedMateriasPrimas.length > 0 ? (
                    selectedMateriasPrimas.map((mp) => (
                      <Badge 
                        key={mp.id} 
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => toggleMateriaPrima(mp)}
                      >
                        {mp.nombre} ✕
                      </Badge>
                    ))
                  ) : (
                    <div className="text-muted-foreground">No hay materias primas seleccionadas</div>
                  )}
                </div>
                
                <div className="mb-2 font-medium">Materias Primas Disponibles:</div>
                
                {/* Buscador de materias primas */}
                <div className="mb-3">
                  <Input
                    type="text"
                    placeholder="Buscar materia prima..."
                    value={materiaPrimaSearch}
                    onChange={(e) => setMateriaPrimaSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <ScrollArea className="h-40 w-full rounded-md border">
                  <div className="p-4 flex flex-wrap gap-2">
                    {materiasPrimas
                      .filter(mp => !selectedMateriasPrimas.some(selected => selected.id === mp.id))
                      .filter(mp => mp.nombre.toLowerCase().includes(materiaPrimaSearch.toLowerCase()))
                      .map((mp) => (
                        <Badge 
                          key={mp.id} 
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => toggleMateriaPrima(mp)}
                        >
                          {mp.nombre} +
                        </Badge>
                      ))}
                  </div>
                </ScrollArea>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 mt-4">
          <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
              >
                Cancelar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Si cancelas, perderás todos los cambios realizados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continuar editando</AlertDialogCancel>
                <AlertDialogAction onClick={onSuccess}>
                  Cancelar edición
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              "Actualizar Producto"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
