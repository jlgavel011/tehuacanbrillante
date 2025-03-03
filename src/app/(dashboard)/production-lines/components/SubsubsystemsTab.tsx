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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Subsystem = {
  id: string;
  name: string;
  systemId: string;
};

type Subsubsystem = {
  id: string;
  name: string;
  subsystemId: string;
  subsystem: Subsystem;
  createdAt: string;
  updatedAt: string;
};

export function SubsubsystemsTab() {
  const [subsubsystems, setSubsubsystems] = useState<Subsubsystem[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSubsubsystem, setCurrentSubsubsystem] = useState<Subsubsystem | null>(null);
  const [newSubsubsystemName, setNewSubsubsystemName] = useState("");
  const [selectedSubsystemId, setSelectedSubsystemId] = useState("");

  const fetchSubsubsystems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/production-lines/subsubsystems");
      if (!response.ok) {
        throw new Error("Error al cargar los sub-subsistemas");
      }
      const data = await response.json();
      setSubsubsystems(data);
    } catch (error) {
      console.error("Error fetching subsubsystems:", error);
      toast.error("Error al cargar los sub-subsistemas");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubsystems = async () => {
    try {
      const response = await fetch("/api/production-lines/subsystems");
      if (!response.ok) {
        throw new Error("Error al cargar los subsistemas");
      }
      const data = await response.json();
      setSubsystems(data);
    } catch (error) {
      console.error("Error fetching subsystems:", error);
      toast.error("Error al cargar los subsistemas");
    }
  };

  useEffect(() => {
    // Listen for the custom event from HierarchicalView
    const handleEditSubsubsystem = (event: CustomEvent) => {
      const storedData = localStorage.getItem("editSubsubsystem");
      if (storedData) {
        const subsubsystem = JSON.parse(storedData);
        setIsEditMode(true);
        setCurrentSubsubsystem(subsubsystem);
        setNewSubsubsystemName(subsubsystem.name);
        setSelectedSubsystemId(subsubsystem.subsystemId);
        setIsDialogOpen(true);
        localStorage.removeItem("editSubsubsystem");
      }
    };

    // Add event listener
    document.addEventListener("editSubsubsystem", handleEditSubsubsystem as EventListener);

    // Check localStorage on initial load for any pre-selection
    const checkLocalStorage = () => {
      const preSelectedSubsystemId = localStorage.getItem("selectedSubsystemId");
      if (preSelectedSubsystemId) {
        setSelectedSubsystemId(preSelectedSubsystemId);
        // Only set it if we're opening the dialog
        localStorage.removeItem("selectedSubsystemId");
      }
      localStorage.removeItem("editSubsubsystem");
    };
    
    const fetchData = async () => {
      await fetchSubsystems();
      await fetchSubsubsystems();
      checkLocalStorage();
    };
    
    fetchData();

    // Clean up
    return () => {
      document.removeEventListener("editSubsubsystem", handleEditSubsubsystem as EventListener);
    };
  }, []);

  const handleCreateSubsubsystem = async () => {
    if (!newSubsubsystemName.trim() || !selectedSubsystemId) {
      toast.error("El nombre del sub-subsistema y el subsistema son requeridos");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/production-lines/subsubsystems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSubsubsystemName,
          subsystemId: selectedSubsystemId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el sub-subsistema");
      }

      await fetchSubsubsystems();
      setNewSubsubsystemName("");
      setSelectedSubsystemId("");
      setIsDialogOpen(false);
      toast.success("Sub-subsistema creado exitosamente");
    } catch (error: any) {
      console.error("Error creating subsubsystem:", error);
      toast.error(error.message || "Error al crear el sub-subsistema");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubsubsystem = async () => {
    if (!currentSubsubsystem || !newSubsubsystemName.trim() || !selectedSubsystemId) {
      toast.error("El nombre del sub-subsistema y el subsistema son requeridos");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/production-lines/subsubsystems/${currentSubsubsystem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSubsubsystemName,
          subsystemId: selectedSubsystemId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el sub-subsistema");
      }

      await fetchSubsubsystems();
      setNewSubsubsystemName("");
      setSelectedSubsystemId("");
      setCurrentSubsubsystem(null);
      setIsEditMode(false);
      setIsDialogOpen(false);
      toast.success("Sub-subsistema actualizado exitosamente");
    } catch (error: any) {
      console.error("Error updating subsubsystem:", error);
      toast.error(error.message || "Error al actualizar el sub-subsistema");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubsubsystem = async (id: string) => {
    if (confirm("¿Estás seguro que deseas eliminar este sub-subsistema? Esta acción no se puede deshacer.")) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/production-lines/subsubsystems/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al eliminar el sub-subsistema");
        }

        await fetchSubsubsystems();
        toast.success("Sub-subsistema eliminado exitosamente");
      } catch (error: any) {
        console.error("Error deleting subsubsystem:", error);
        toast.error(error.message || "Error al eliminar el sub-subsistema");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getSubsystemName = (subsystemId: string) => {
    const subsystem = subsystems.find((s) => s.id === subsystemId);
    return subsystem ? subsystem.name : "N/A";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Sub-subsistemas</h3>
        <Button 
          id="add-subsubsystem-button"
          onClick={() => {
            setIsEditMode(false);
            setCurrentSubsubsystem(null);
            setNewSubsubsystemName("");
            setSelectedSubsystemId("");
            setIsDialogOpen(true);
          }}
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Añadir
        </Button>
      </div>

      {isLoading && subsubsystems.length === 0 ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : subsubsystems.length === 0 ? (
        <Card className="bg-white border shadow-sm">
          <CardContent className="py-10">
            <div className="text-center text-black">
              <p>No hay sub-subsistemas registrados.</p>
              <Button 
                onClick={() => {
                  setIsEditMode(false);
                  setCurrentSubsubsystem(null);
                  setNewSubsubsystemName("");
                  setSelectedSubsystemId("");
                  setIsDialogOpen(true);
                }}
                variant="link"
                className="mt-2"
              >
                Crear un sub-subsistema
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subsubsystems.map((subsubsystem) => (
            <Card key={subsubsystem.id} className="overflow-hidden bg-white border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-black">{subsubsystem.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 mb-4">
                  <span className="font-medium text-black">Subsistema:</span>{" "}
                  <span className="text-black">{subsubsystem.subsystem?.name || getSubsystemName(subsubsystem.subsystemId)}</span>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditMode(true);
                      setCurrentSubsubsystem(subsubsystem);
                      setNewSubsubsystemName(subsubsystem.name);
                      setSelectedSubsystemId(subsubsystem.subsystemId);
                      setIsDialogOpen(true);
                    }}
                    className="h-8 px-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteSubsubsystem(subsubsystem.id)}
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
              {isEditMode ? "Editar Sub-subsistema" : "Crear Nuevo Sub-subsistema"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Actualiza los detalles del sub-subsistema seleccionado."
                : "Completa el formulario para crear un nuevo sub-subsistema."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-black">Nombre</Label>
              <Input
                id="name"
                placeholder="Nombre del sub-subsistema"
                value={newSubsubsystemName}
                onChange={(e) => setNewSubsubsystemName(e.target.value)}
                className="text-black"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subsystem" className="text-black">Subsistema</Label>
              <Select
                value={selectedSubsystemId}
                onValueChange={setSelectedSubsystemId}
              >
                <SelectTrigger id="subsystem" className="text-black">
                  <SelectValue placeholder="Selecciona un subsistema" />
                </SelectTrigger>
                <SelectContent>
                  {subsystems.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
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
              onClick={isEditMode ? handleUpdateSubsubsystem : handleCreateSubsubsystem}
              disabled={isLoading || !newSubsubsystemName.trim() || !selectedSubsystemId}
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