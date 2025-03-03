"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

interface CrearTamañoFormProps {
  onSuccess: (newTamaño: { id: string; litros: number }) => void;
}

const formSchema = z.object({
  litros: z.coerce.number().min(0.001, "El valor debe ser mayor a 0").refine(
    (val) => {
      // Check if the number has at most 3 decimal places
      const decimalStr = val.toString().split('.')[1] || '';
      return decimalStr.length <= 3;
    },
    {
      message: "El valor puede tener máximo 3 decimales"
    }
  ),
  nombre: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CrearTamañoForm({ onSuccess }: CrearTamañoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nombreGenerado, setNombreGenerado] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      litros: 0,
      nombre: "",
    },
  });

  // Generate nombre when litros changes
  useEffect(() => {
    const litros = form.watch("litros");
    if (litros) {
      const formattedLitros = parseFloat(litros.toFixed(3));
      const nombre = `${formattedLitros}L`;
      setNombreGenerado(nombre);
      form.setValue("nombre", nombre);
    }
  }, [form.watch("litros"), form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      // Format litros to 3 decimal places
      const formattedLitros = parseFloat(data.litros.toFixed(3));
      
      // Ensure nombre is set
      if (!data.nombre) {
        data.nombre = `${formattedLitros}L`;
      }
      
      const response = await fetch("/api/tamanos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          litros: formattedLitros
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear tamaño");
      }

      const newTamaño = await response.json();
      toast.success("Tamaño creado exitosamente");
      onSuccess(newTamaño);
    } catch (error: any) {
      console.error("Error creating tamaño:", error);
      toast.error(error.message || "Error al crear tamaño");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="litros"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Litros</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: 0.5, 1.125, 2.500" 
                    {...field} 
                    type="number"
                    step="0.001"
                    min="0.001"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Tamaño"}
          </Button>
        </form>
      </Form>
    </div>
  );
} 