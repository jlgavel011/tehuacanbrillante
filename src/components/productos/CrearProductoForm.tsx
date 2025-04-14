"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import CrearCajaForm from "./CrearCajaForm";
import CrearModeloForm from "./CrearModeloForm";
import CrearTamañoForm from "./CrearTamañoForm";
import CrearSaborForm from "./CrearSaborForm";
import CrearMateriaPrimaForm from "./CrearMateriaPrimaForm";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";

interface CrearProductoFormProps {
  onSuccess: () => void;
}

interface Caja {
  id: string;
  numeroUnidades: number;
  nombre?: string;
}

interface Modelo {
  id: string;
  nombre: string;
}

interface Tamaño {
  id: string;
  litros: number;
  nombre?: string;
}

interface Sabor {
  id: string;
  nombre: string;
}

interface MateriaPrima {
  id: string;
  nombre: string;
}

const formSchema = z.object({
  cajaId: z.string().min(1, "Selecciona una caja"),
  modeloId: z.string().min(1, "Selecciona un modelo"),
  tamañoId: z.string().min(1, "Selecciona un tamaño"),
  saborId: z.string().min(1, "Selecciona un sabor"),
  materiasPrimasIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CrearProductoForm({ onSuccess }: CrearProductoFormProps) {
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [tamaños, setTamaños] = useState<Tamaño[]>([]);
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [selectedMateriasPrimas, setSelectedMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nombreProducto, setNombreProducto] = useState("");
  
  // Dialogs state
  const [isCajaDialogOpen, setIsCajaDialogOpen] = useState(false);
  const [isModeloDialogOpen, setIsModeloDialogOpen] = useState(false);
  const [isTamañoDialogOpen, setIsTamañoDialogOpen] = useState(false);
  const [isSaborDialogOpen, setIsSaborDialogOpen] = useState(false);
  const [isMateriaPrimaDialogOpen, setIsMateriaPrimaDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cajaId: "",
      modeloId: "",
      tamañoId: "",
      saborId: "",
      materiasPrimasIds: [],
    },
  });

  const fetchCajas = async () => {
    try {
      const response = await fetch("/api/cajas");
      if (!response.ok) throw new Error("Error al cargar cajas");
      const data = await response.json();
      setCajas(data);
    } catch (error) {
      console.error("Error fetching cajas:", error);
      toast.error("Error al cargar cajas");
    }
  };

  const fetchModelos = async () => {
    try {
      const response = await fetch("/api/modelos");
      if (!response.ok) throw new Error("Error al cargar modelos");
      const data = await response.json();
      setModelos(data);
    } catch (error) {
      console.error("Error fetching modelos:", error);
      toast.error("Error al cargar modelos");
    }
  };

  const fetchTamaños = async () => {
    try {
      const response = await fetch("/api/tamanos");
      if (!response.ok) throw new Error("Error al cargar tamaños");
      const data = await response.json();
      setTamaños(data);
    } catch (error) {
      console.error("Error fetching tamaños:", error);
      toast.error("Error al cargar tamaños");
    }
  };

  const fetchSabores = async () => {
    try {
      const response = await fetch("/api/sabores-api");
      if (!response.ok) throw new Error("Error al cargar sabores");
      const data = await response.json();
      setSabores(data);
    } catch (error) {
      console.error("Error fetching sabores:", error);
      toast.error("Error al cargar sabores");
    }
  };

  const fetchMateriasPrimas = async () => {
    try {
      const response = await fetch("/api/materias-primas");
      if (!response.ok) throw new Error("Error al cargar materias primas");
      const data = await response.json();
      setMateriasPrimas(data);
    } catch (error) {
      console.error("Error fetching materias primas:", error);
      toast.error("Error al cargar materias primas");
    }
  };

  useEffect(() => {
    fetchCajas();
    fetchModelos();
    fetchTamaños();
    fetchSabores();
    fetchMateriasPrimas();
  }, []);

  // Update nombre when form values change
  useEffect(() => {
    const values = form.getValues();
    if (values.saborId && values.tamañoId && values.modeloId && values.cajaId) {
      const sabor = sabores.find(s => s.id === values.saborId);
      const tamaño = tamaños.find(t => t.id === values.tamañoId);
      const modelo = modelos.find(m => m.id === values.modeloId);
      const caja = cajas.find(c => c.id === values.cajaId);
      
      if (sabor && tamaño && modelo && caja) {
        // Format: SABOR + TAMAÑO + MODELO + CAJA
        setNombreProducto(`${sabor.nombre} ${tamaño.nombre || `${tamaño.litros}L`} ${modelo.nombre} ${caja.nombre || `${caja.numeroUnidades}u`}`);
      }
    }
  }, [form.watch("saborId"), form.watch("tamañoId"), form.watch("modeloId"), form.watch("cajaId"), sabores, tamaños, modelos, cajas]);

  const handleMateriaPrimaToggle = (materiaPrima: MateriaPrima) => {
    setSelectedMateriasPrimas(prev => {
      // Check if this materiaPrima is already selected
      const isSelected = prev.some(mp => mp.id === materiaPrima.id);
      
      if (isSelected) {
        // Remove it if already selected
        return prev.filter(mp => mp.id !== materiaPrima.id);
      } else {
        // Add it if not selected
        return [...prev, materiaPrima];
      }
    });
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      // Add selected materias primas IDs to form data
      data.materiasPrimasIds = selectedMateriasPrimas.map(mp => mp.id);
      
      const response = await fetch("/api/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          nombre: nombreProducto,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear producto");
      }
      
      onSuccess();
      form.reset();
      setSelectedMateriasPrimas([]);
    } catch (error: any) {
      console.error("Error creating producto:", error);
      toast.error(error.message || "Error al crear producto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCajaCreated = (newCaja: Caja) => {
    setIsCajaDialogOpen(false);
    fetchCajas().then(() => {
      // Auto-select the newly created caja
      form.setValue("cajaId", newCaja.id);
    });
  };

  const handleModeloCreated = (newModelo: Modelo) => {
    setIsModeloDialogOpen(false);
    fetchModelos().then(() => {
      // Auto-select the newly created modelo
      form.setValue("modeloId", newModelo.id);
    });
  };

  const handleTamañoCreated = (newTamaño: Tamaño) => {
    setIsTamañoDialogOpen(false);
    fetchTamaños().then(() => {
      // Auto-select the newly created tamaño
      form.setValue("tamañoId", newTamaño.id);
    });
  };

  const handleSaborCreated = (newSabor: Sabor) => {
    setIsSaborDialogOpen(false);
    fetchSabores().then(() => {
      // Auto-select the newly created sabor
      form.setValue("saborId", newSabor.id);
    });
  };

  const handleMateriaPrimaCreated = (newMateriaPrima: MateriaPrima) => {
    // Don't close the dialog automatically
    // setIsMateriaPrimaDialogOpen(false);
    
    // Just fetch materias primas and add the new one to selected
    fetchMateriasPrimas().then(() => {
      // Add the newly created materia prima to the selected list
      setSelectedMateriasPrimas(prev => [...prev, newMateriaPrima]);
    });
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Sabor Field */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="saborId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sabor</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
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
                          <Button type="button" variant="outline" size="icon">+</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Crear Nuevo Sabor</DialogTitle>
                          </DialogHeader>
                          <CrearSaborForm onSuccess={handleSaborCreated} />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tamaño Field */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="tamañoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamaño</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar" className="text-sm text-gray-500" />
                          </SelectTrigger>
                          <SelectContent>
                            {tamaños.map((tamaño) => (
                              <SelectItem key={tamaño.id} value={tamaño.id}>
                                {tamaño.litros} L
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <Dialog open={isTamañoDialogOpen} onOpenChange={setIsTamañoDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon">+</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Crear Nuevo Tamaño</DialogTitle>
                          </DialogHeader>
                          <CrearTamañoForm onSuccess={handleTamañoCreated} />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Modelo Field */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="modeloId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
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
                          <Button type="button" variant="outline" size="icon">+</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Crear Nuevo Modelo</DialogTitle>
                          </DialogHeader>
                          <CrearModeloForm onSuccess={handleModeloCreated} />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Caja Field */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="cajaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caja</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar" className="text-sm text-gray-500" />
                          </SelectTrigger>
                          <SelectContent>
                            {cajas.map((caja) => (
                              <SelectItem key={caja.id} value={caja.id}>
                                {caja.numeroUnidades} unidades
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <Dialog open={isCajaDialogOpen} onOpenChange={setIsCajaDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon">+</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Crear Nueva Caja</DialogTitle>
                          </DialogHeader>
                          <CrearCajaForm onSuccess={handleCajaCreated} />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Nombre del Producto (Autogenerado) */}
          <div className="space-y-2">
            <Label>Nombre del Producto</Label>
            <Input value={nombreProducto} readOnly className="bg-muted" />
            <p className="text-sm text-muted-foreground">
              El nombre se genera automáticamente a partir de los campos seleccionados
            </p>
          </div>

          {/* Materias Primas */}
          <div className="space-y-2">
            <Label>Materias Primas</Label>
            <div className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">Materias Primas Seleccionadas:</div>
                <Dialog open={isMateriaPrimaDialogOpen} onOpenChange={setIsMateriaPrimaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Agregar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Nueva Materia Prima</DialogTitle>
                    </DialogHeader>
                    <CrearMateriaPrimaForm onSuccess={handleMateriaPrimaCreated} />
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
                      onClick={() => handleMateriaPrimaToggle(mp)}
                    >
                      {mp.nombre} ✕
                    </Badge>
                  ))
                ) : (
                  <div className="text-muted-foreground">No hay materias primas seleccionadas</div>
                )}
              </div>
              
              <div className="mb-2 font-medium">Materias Primas Disponibles:</div>
              <ScrollArea className="h-40 w-full rounded-md border">
                <div className="p-4 flex flex-wrap gap-2">
                  {materiasPrimas
                    .filter(mp => !selectedMateriasPrimas.some(selected => selected.id === mp.id))
                    .map((mp) => (
                      <Badge 
                        key={mp.id} 
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => handleMateriaPrimaToggle(mp)}
                      >
                        {mp.nombre} +
                      </Badge>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Producto"}
          </Button>
        </form>
      </Form>
    </div>
  );
} 