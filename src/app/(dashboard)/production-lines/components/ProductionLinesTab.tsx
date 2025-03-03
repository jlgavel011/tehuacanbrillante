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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ProductionLine = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export function ProductionLinesTab() {
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProductionLine, setCurrentProductionLine] = useState<ProductionLine | null>(null);
  const [newProductionLineName, setNewProductionLineName] = useState("");

  const fetchProductionLines = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Listen for the custom event from HierarchicalView
    const handleEditProductionLine = (event: CustomEvent) => {
      const storedData = localStorage.getItem("editProductionLine");
      if (storedData) {
        const productionLine = JSON.parse(storedData);
        setIsEditMode(true);
        setCurrentProductionLine(productionLine);
        setNewProductionLineName(productionLine.name);
        setIsDialogOpen(true);
        localStorage.removeItem("editProductionLine");
      }
    };

    // Add event listener
    document.addEventListener("editProductionLine", handleEditProductionLine as EventListener);

    // Check localStorage on initial load for any pre-selection
    const checkLocalStorage = () => {
      // This would be set from the hierarchical view when a user clicks "Add" on a production line
      localStorage.removeItem("editProductionLine");
    };
    
    checkLocalStorage();
    fetchProductionLines();

    // Clean up
    return () => {
      document.removeEventListener("editProductionLine", handleEditProductionLine as EventListener);
    };
  }, []);

  const handleCreateProductionLine = async () => {
    if (!newProductionLineName.trim()) {
      toast.error("El nombre de la línea de producción es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/production-lines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newProductionLineName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la línea de producción");
      }

      await fetchProductionLines();
      setNewProductionLineName("");
      setIsDialogOpen(false);
      toast.success("Línea de producción creada exitosamente");
    } catch (error: any) {
      console.error("Error creating production line:", error);
      toast.error(error.message || "Error al crear la línea de producción");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProductionLine = async () => {
    if (!currentProductionLine || !newProductionLineName.trim()) {
      toast.error("El nombre de la línea de producción es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/production-lines/${currentProductionLine.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newProductionLineName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la línea de producción");
      }

      await fetchProductionLines();
      setNewProductionLineName("");
      setCurrentProductionLine(null);
      setIsEditMode(false);
      setIsDialogOpen(false);
      toast.success("Línea de producción actualizada exitosamente");
    } catch (error: any) {
      console.error("Error updating production line:", error);
      toast.error(error.message || "Error al actualizar la línea de producción");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProductionLine = async (id: string) => {
    if (confirm("¿Estás seguro que deseas eliminar esta línea de producción? Esta acción no se puede deshacer.")) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/production-lines/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al eliminar la línea de producción");
        }

        await fetchProductionLines();
        toast.success("Línea de producción eliminada exitosamente");
      } catch (error: any) {
        console.error("Error deleting production line:", error);
        toast.error(error.message || "Error al eliminar la línea de producción");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Líneas de Producción</h3>
        <Button 
          id="add-production-line-button"
          onClick={() => {
            setIsEditMode(false);
            setCurrentProductionLine(null);
            setNewProductionLineName("");
            setIsDialogOpen(true);
          }}
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Añadir
        </Button>
      </div>

      {isLoading && productionLines.length === 0 ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : productionLines.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-black">
              <p>No hay líneas de producción registradas.</p>
              <Button 
                onClick={() => {
                  setIsEditMode(false);
                  setCurrentProductionLine(null);
                  setNewProductionLineName("");
                  setIsDialogOpen(true);
                }}
                variant="link"
                className="mt-2"
              >
                Crear una línea de producción
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productionLines.map((productionLine) => (
            <Card key={productionLine.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-black">{productionLine.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditMode(true);
                      setCurrentProductionLine(productionLine);
                      setNewProductionLineName(productionLine.name);
                      setIsDialogOpen(true);
                    }}
                    className="h-8 px-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteProductionLine(productionLine.id)}
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
              {isEditMode ? "Editar Línea de Producción" : "Crear Nueva Línea de Producción"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Actualiza los detalles de la línea de producción seleccionada."
                : "Completa el formulario para crear una nueva línea de producción."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-black">Nombre</Label>
              <Input
                id="name"
                placeholder="Nombre de la línea de producción"
                value={newProductionLineName}
                onChange={(e) => setNewProductionLineName(e.target.value)}
                className="text-black"
              />
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
              onClick={isEditMode ? handleUpdateProductionLine : handleCreateProductionLine}
              disabled={isLoading || !newProductionLineName.trim()}
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