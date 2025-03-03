"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

interface CrearModeloFormProps {
  onSuccess: (newModelo: { id: string; nombre: string }) => void;
}

const formSchema = z.object({
  nombre: z.string().min(1, "Este campo es requerido"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CrearModeloForm({ onSuccess }: CrearModeloFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/modelos", {
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
        throw new Error(errorData.error || "Error al crear modelo");
      }
      
      const newModelo = await response.json();
      toast.success("Modelo creado exitosamente");
      form.reset();
      onSuccess(newModelo);
    } catch (error: any) {
      console.error("Error creating modelo:", error);
      toast.error(error.message || "Error al crear modelo");
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
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Modelo</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Vidrio, PET, Lata" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Modelo"}
          </Button>
        </form>
      </Form>
    </div>
  );
} 