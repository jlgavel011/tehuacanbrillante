"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

interface CrearCajaFormProps {
  onSuccess: (newCaja: { id: string; numeroUnidades: number }) => void;
}

const formSchema = z.object({
  numeroUnidades: z.coerce.number().min(1, "El valor debe ser mayor a 0"),
  nombre: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CrearCajaForm({ onSuccess }: CrearCajaFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nombreGenerado, setNombreGenerado] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numeroUnidades: 0,
      nombre: "",
    },
  });

  // Generate nombre when numeroUnidades changes
  useEffect(() => {
    const numeroUnidades = form.watch("numeroUnidades");
    if (numeroUnidades) {
      const nombre = `${numeroUnidades}u`;
      setNombreGenerado(nombre);
      form.setValue("nombre", nombre);
    }
  }, [form.watch("numeroUnidades"), form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      // Ensure nombre is set
      if (!data.nombre) {
        data.nombre = `${data.numeroUnidades}u`;
      }
      
      const response = await fetch("/api/cajas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear caja");
      }

      const newCaja = await response.json();
      toast.success("Caja creada exitosamente");
      onSuccess(newCaja);
    } catch (error: any) {
      console.error("Error creating caja:", error);
      toast.error(error.message || "Error al crear caja");
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
            name="numeroUnidades"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Unidades</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: 12" 
                    {...field} 
                    type="number"
                    min="1"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Caja"}
          </Button>
        </form>
      </Form>
    </div>
  );
} 