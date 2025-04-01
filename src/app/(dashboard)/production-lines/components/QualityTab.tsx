"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type QualityDeviation = {
  id: string;
  nombre: string;
  lineaProduccionId: string;
  createdAt: string;
  updatedAt: string;
};

interface QualityTabProps {
  productionLineId: string;
}

export function QualityTab({ productionLineId }: QualityTabProps) {
  const [deviations, setDeviations] = useState<QualityDeviation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDeviation, setCurrentDeviation] = useState<QualityDeviation | null>(null);
  const [newDeviationName, setNewDeviationName] = useState("");

  const fetchDeviations = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching deviations for production line:", productionLineId);
      const response = await fetch(`/api/production-lines/${productionLineId}/quality-deviations`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error || "Unknown error"
        });
        throw new Error(errorData.error || "Error al cargar las desviaciones de calidad");
      }
      
      const data = await response.json();
      console.log("Received deviations:", data);
      setDeviations(data);
    } catch (error) {
      console.error("Error in fetchDeviations:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      toast.error(error instanceof Error ? error.message : "Error al cargar las desviaciones de calidad");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviations();
  }, [productionLineId]);

  const handleCreateDeviation = async () => {
    if (!newDeviationName.trim()) {
      toast.error("El nombre de la desviación es requerido");
      return;
    }

    if (!productionLineId) {
      toast.error("ID de línea de producción no válido");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Creating quality deviation:", {
        productionLineId,
        nombre: newDeviationName,
      });

      const url = `/api/production-lines/${productionLineId}/quality-deviations`;
      console.log("Request URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: newDeviationName.trim(),
        }),
        credentials: "include",
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Error al crear la desviación de calidad");
      }

      await fetchDeviations();
      setNewDeviationName("");
      setIsDialogOpen(false);
      toast.success("Desviación de calidad creada exitosamente");
    } catch (error: any) {
      console.error("Error creating quality deviation:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      toast.error(error.message || "Error al crear la desviación de calidad");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDeviation = async () => {
    if (!currentDeviation || !newDeviationName.trim()) {
      toast.error("El nombre de la desviación es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/production-lines/${productionLineId}/quality-deviations/${currentDeviation.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: newDeviationName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la desviación de calidad");
      }

      await fetchDeviations();
      setNewDeviationName("");
      setCurrentDeviation(null);
      setIsEditMode(false);
      setIsDialogOpen(false);
      toast.success("Desviación de calidad actualizada exitosamente");
    } catch (error: any) {
      console.error("Error updating quality deviation:", error);
      toast.error(error.message || "Error al actualizar la desviación de calidad");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDeviation = async (id: string) => {
    if (confirm("¿Estás seguro que deseas eliminar esta desviación de calidad? Esta acción no se puede deshacer.")) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/production-lines/${productionLineId}/quality-deviations/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al eliminar la desviación de calidad");
        }

        await fetchDeviations();
        toast.success("Desviación de calidad eliminada exitosamente");
      } catch (error: any) {
        console.error("Error deleting quality deviation:", error);
        toast.error(error.message || "Error al eliminar la desviación de calidad");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Desviaciones de Calidad</h3>
        <Button 
          onClick={() => {
            setIsEditMode(false);
            setCurrentDeviation(null);
            setNewDeviationName("");
            setIsDialogOpen(true);
          }}
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Añadir
        </Button>
      </div>

      {isLoading && deviations.length === 0 ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : deviations.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-sm text-gray-500">No hay desviaciones de calidad registradas.</p>
              <Button 
                variant="link" 
                onClick={() => {
                  setIsEditMode(false);
                  setCurrentDeviation(null);
                  setNewDeviationName("");
                  setIsDialogOpen(true);
                }}
                className="mt-2"
              >
                Crear una desviación de calidad
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deviations.map((deviation) => (
            <Card key={deviation.id} className="overflow-hidden hover:bg-accent transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {deviation.nombre}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsEditMode(true);
                      setCurrentDeviation(deviation);
                      setNewDeviationName(deviation.nombre);
                      setIsDialogOpen(true);
                    }}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteDeviation(deviation.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Desviación de Calidad" : "Nueva Desviación de Calidad"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Modifica los detalles de la desviación de calidad"
                : "Ingresa los detalles de la nueva desviación de calidad"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Nombre de la desviación"
                value={newDeviationName}
                onChange={(e) => setNewDeviationName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setNewDeviationName("");
                setCurrentDeviation(null);
                setIsEditMode(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={isEditMode ? handleUpdateDeviation : handleCreateDeviation}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                isEditMode ? "Actualizar" : "Crear"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 