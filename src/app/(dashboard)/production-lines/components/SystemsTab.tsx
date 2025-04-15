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
import ImportExportSystems from "@/components/production-lines/ImportExportSystems";

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
    // Listen for the custom event from HierarchicalView
    const handleEditSystem = (event: CustomEvent) => {
      const storedData = localStorage.getItem("editSystem");
      if (storedData) {
        const system = JSON.parse(storedData);
        setIsEditMode(true);
        setCurrentSystem(system);
        setNewSystemName(system.name);
        setSelectedProductionLineId(system.productionLineId);
        setIsDialogOpen(true);
        localStorage.removeItem("editSystem");
      }
    };

    // Add event listener
    document.addEventListener("editSystem", handleEditSystem as EventListener);

    // Check localStorage on initial load for any pre-selection
    const checkLocalStorage = () => {
      const preSelectedProductionLineId = localStorage.getItem("selectedProductionLineId");
      if (preSelectedProductionLineId) {
        setSelectedProductionLineId(preSelectedProductionLineId);
        // Only set it if we're opening the dialog
        localStorage.removeItem("selectedProductionLineId");
      }
      localStorage.removeItem("editSystem");
    };
    
    const fetchData = async () => {
      await fetchProductionLines();
      await fetchSystems();
      checkLocalStorage();
    };
    
    fetchData();

    // Clean up
    return () => {
      document.removeEventListener("editSystem", handleEditSystem as EventListener);
    };
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

  const getProductionLineName = (productionLineId: string) => {
    const productionLine = productionLines.find((pl) => pl.id === productionLineId);
    return productionLine ? productionLine.name : "N/A";
  };

  return (
    <div className="p-1">
      <Card>
        <CardHeader className="px-6 py-5 flex flex-row items-center justify-between bg-gray-50 border-b rounded-t-lg">
          <CardTitle className="text-lg font-medium">Sistemas</CardTitle>
          <div className="flex space-x-2">
            <ImportExportSystems />
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => {
                setIsEditMode(false);
                setNewSystemName("");
                setSelectedProductionLineId("");
                setIsDialogOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Nuevo sistema
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : systems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No hay sistemas creados aún.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditMode(false);
                  setNewSystemName("");
                  setSelectedProductionLineId("");
                  setIsDialogOpen(true);
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Crear primer sistema
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {systems.map((system) => (
                <div
                  key={system.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">{system.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Línea: {getProductionLineName(system.productionLineId)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCurrentSystem(system);
                        setNewSystemName(system.name);
                        setSelectedProductionLineId(system.productionLineId);
                        setIsEditMode(true);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSystem(system.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dialog for create/edit system */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Editar sistema" : "Crear nuevo sistema"}</DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Actualice la información del sistema"
                    : "Complete los campos para crear un nuevo sistema"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre del sistema</Label>
                  <Input
                    id="name"
                    placeholder="Ej. Sistema de envasado"
                    value={newSystemName}
                    onChange={(e) => setNewSystemName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="productionLine">Línea de producción</Label>
                  <Select
                    value={selectedProductionLineId}
                    onValueChange={setSelectedProductionLineId}
                  >
                    <SelectTrigger id="productionLine">
                      <SelectValue placeholder="Seleccionar línea de producción" />
                    </SelectTrigger>
                    <SelectContent>
                      {productionLines.map((line) => (
                        <SelectItem key={line.id} value={line.id}>
                          {line.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  onClick={isEditMode ? handleUpdateSystem : handleCreateSystem}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
} 