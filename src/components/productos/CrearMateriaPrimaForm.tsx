"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

interface CrearMateriaPrimaFormProps {
  onSuccess: (newMateriaPrima: { id: string; nombre: string }) => void;
}

const formSchema = z.object({
  nombre: z.string().min(1, "Este campo es requerido"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CrearMateriaPrimaForm({ onSuccess }: CrearMateriaPrimaFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [createdMateriaPrima, setCreatedMateriaPrima] = useState<{ id: string; nombre: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/materias-primas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: data.nombre,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear materia prima");
      }
      
      const newMateriaPrima = await response.json();
      toast.success("Materia prima creada exitosamente");
      form.reset();
      
      // Store the created materia prima but don't close modal yet
      setCreatedMateriaPrima(newMateriaPrima);
      
      // Call onSuccess but don't let it close the modal
      onSuccess(newMateriaPrima);
    } catch (error: any) {
      console.error("Error creating materia prima:", error);
      toast.error(error.message || "Error al crear materia prima");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuardarYCerrar = () => {
    if (createdMateriaPrima) {
      // The parent component will close the dialog
      onSuccess(createdMateriaPrima);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Materia Prima</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Azúcar, Agua, Colorante" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end gap-2 pt-4">
            {createdMateriaPrima ? (
              <Button 
                type="button" 
                variant="default" 
                onClick={handleGuardarYCerrar}
              >
                Guardar y Cerrar
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Materia Prima"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
} 