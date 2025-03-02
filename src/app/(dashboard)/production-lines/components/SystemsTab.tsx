import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Pencil, Trash2, Loader2, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ProductionLine = {
  id: string;
  name: string;
};

type System = {
  id: string;
  name: string;
  productionLineId: string;
  productionLine: ProductionLine;
  createdAt: string;
  updatedAt: string;
};

export function SystemsTab() {
  const [systems, setSystems] = useState<System[]>([]);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSystem, setCurrentSystem] = useState<System | null>(null);
  const [newSystemName, setNewSystemName] = useState("");
  const [selectedProductionLineId, setSelectedProductionLineId] = useState("");

  const fetchSystems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/production-lines/systems");
      if (!response.ok) {
        throw new Error("Error al cargar los sistemas");
      }
      const data = await response.json();
      setSystems(data);
    } catch (error) {
      console.error("Error fetching systems:", error);
      toast.error("Error al cargar los sistemas");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductionLines = async () => {
    try {
      const response = await fetch("/api/production-lines");
      if (!response.ok) {
        throw new Error("Error al cargar las líneas de producción");
      }
      const data = await response.json();
      setProductionLines(data);
    } catch (error) {
      console.error("Error fetching production lines:", error);
      toast.error("Error al cargar las líneas de producción");
    }
  };

  useEffect(() => {
    fetchSystems();
    fetchProductionLines();
  }, []);

  const handleCreateSystem = async () => {
    if (!newSystemName.trim() || !selectedProductionLineId) {
      toast.error("El nombre del sistema y la línea de producción son requeridos");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/production-lines/systems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSystemName,
          productionLineId: selectedProductionLineId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el sistema");
      }

      await fetchSystems();
      setNewSystemName("");
      setSelectedProductionLineId("");
      setIsDialogOpen(false);
      toast.success("Sistema creado exitosamente");
    } catch (error: any) {
      console.error("Error creating system:", error);
      toast.error(error.message || "Error al crear el sistema");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSystem = async () => {
    if (!currentSystem || !newSystemName.trim() || !selectedProductionLineId) {
      toast.error("El nombre del sistema y la línea de producción son requeridos");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/production-lines/systems/${currentSystem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSystemName,
          productionLineId: selectedProductionLineId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el sistema");
      }

      await fetchSystems();
      setNewSystemName("");
      setSelectedProductionLineId("");
      setCurrentSystem(null);
      setIsEditMode(false);
      setIsDialogOpen(false);
      toast.success("Sistema actualizado exitosamente");
    } catch (error: any) {
      console.error("Error updating system:", error);
      toast.error(error.message || "Error al actualizar el sistema");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSystem = async (id: string) => {
    if (confirm("¿Estás seguro que deseas eliminar este sistema? Esta acción no se puede deshacer.")) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/production-lines/systems/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al eliminar el sistema");
        }

        await fetchSystems();
        toast.success("Sistema eliminado exitosamente");
      } catch (error: any) {
        console.error("Error deleting system:", error);
        toast.error(error.message || "Error al eliminar el sistema");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openCreateDialog = () => {
    setIsEditMode(false);
    setNewSystemName("");
    setSelectedProductionLineId("");
    setCurrentSystem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (system: System) => {
    setIsEditMode(true);
    setCurrentSystem(system);
    setNewSystemName(system.name);
    setSelectedProductionLineId(system.productionLineId);
    setIsDialogOpen(true);
  };

  const getProductionLineName = (productionLineId: string) => {
    const productionLine = productionLines.find((pl) => pl.id === productionLineId);
    return productionLine ? productionLine.name : "N/A";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Sistemas</h2>
        <Button onClick={openCreateDialog} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" /> Agregar Sistema
        </Button>
      </div>

      {isLoading && systems.length === 0 ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : systems.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-black">
              <p>No hay sistemas registrados.</p>
              <Button onClick={openCreateDialog} variant="link" className="mt-2">
                Crear un sistema
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map((system) => (
            <Card key={system.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-black">{system.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 mb-4">
                  <span className="font-medium text-black">Línea de Producción:</span>{" "}
                  <span className="text-black">{system.productionLine?.name || getProductionLineName(system.productionLineId)}</span>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(system)}
                    className="h-8 px-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteSystem(system.id)}
                    className="h-8 px-2"
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
              {isEditMode ? "Editar Sistema" : "Crear Nuevo Sistema"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Actualiza los detalles del sistema seleccionado."
                : "Completa el formulario para crear un nuevo sistema."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-black">Nombre</Label>
              <Input
                id="name"
                placeholder="Nombre del sistema"
                value={newSystemName}
                onChange={(e) => setNewSystemName(e.target.value)}
                className="text-black"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productionLine" className="text-black">Línea de Producción</Label>
              <Select
                value={selectedProductionLineId}
                onValueChange={setSelectedProductionLineId}
              >
                <SelectTrigger id="productionLine" className="text-black">
                  <SelectValue placeholder="Selecciona una línea de producción" />
                </SelectTrigger>
                <SelectContent>
                  {productionLines.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id}>
                      {pl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={isEditMode ? handleUpdateSystem : handleCreateSystem}
              disabled={isLoading || !newSystemName.trim() || !selectedProductionLineId}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditMode ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 