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

type System = {
  id: string;
  name: string;
  productionLineId: string;
};

type Subsystem = {
  id: string;
  name: string;
  systemId: string;
  system: System;
  createdAt: string;
  updatedAt: string;
};

export function SubsystemsTab() {
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSubsystem, setCurrentSubsystem] = useState<Subsystem | null>(null);
  const [newSubsystemName, setNewSubsystemName] = useState("");
  const [selectedSystemId, setSelectedSystemId] = useState("");

  const fetchSubsystems = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSystems = async () => {
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
    }
  };

  useEffect(() => {
    fetchSubsystems();
    fetchSystems();
  }, []);

  const handleCreateSubsystem = async () => {
    if (!newSubsystemName.trim() || !selectedSystemId) {
      toast.error("El nombre del subsistema y el sistema son requeridos");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/production-lines/subsystems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSubsystemName,
          systemId: selectedSystemId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el subsistema");
      }

      await fetchSubsystems();
      setNewSubsystemName("");
      setSelectedSystemId("");
      setIsDialogOpen(false);
      toast.success("Subsistema creado exitosamente");
    } catch (error: any) {
      console.error("Error creating subsystem:", error);
      toast.error(error.message || "Error al crear el subsistema");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubsystem = async () => {
    if (!currentSubsystem || !newSubsystemName.trim() || !selectedSystemId) {
      toast.error("El nombre del subsistema y el sistema son requeridos");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/production-lines/subsystems/${currentSubsystem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSubsystemName,
          systemId: selectedSystemId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el subsistema");
      }

      await fetchSubsystems();
      setNewSubsystemName("");
      setSelectedSystemId("");
      setCurrentSubsystem(null);
      setIsEditMode(false);
      setIsDialogOpen(false);
      toast.success("Subsistema actualizado exitosamente");
    } catch (error: any) {
      console.error("Error updating subsystem:", error);
      toast.error(error.message || "Error al actualizar el subsistema");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubsystem = async (id: string) => {
    if (confirm("¿Estás seguro que deseas eliminar este subsistema? Esta acción no se puede deshacer.")) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/production-lines/subsystems/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al eliminar el subsistema");
        }

        await fetchSubsystems();
        toast.success("Subsistema eliminado exitosamente");
      } catch (error: any) {
        console.error("Error deleting subsystem:", error);
        toast.error(error.message || "Error al eliminar el subsistema");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openCreateDialog = () => {
    setIsEditMode(false);
    setNewSubsystemName("");
    setSelectedSystemId("");
    setCurrentSubsystem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (subsystem: Subsystem) => {
    setIsEditMode(true);
    setCurrentSubsystem(subsystem);
    setNewSubsystemName(subsystem.name);
    setSelectedSystemId(subsystem.systemId);
    setIsDialogOpen(true);
  };

  const getSystemName = (systemId: string) => {
    const system = systems.find((s) => s.id === systemId);
    return system ? system.name : "N/A";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Subsistemas</h2>
        <Button onClick={openCreateDialog} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" /> Agregar Subsistema
        </Button>
      </div>

      {isLoading && subsystems.length === 0 ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : subsystems.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-black">
              <p>No hay subsistemas registrados.</p>
              <Button onClick={openCreateDialog} variant="link" className="mt-2">
                Crear un subsistema
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subsystems.map((subsystem) => (
            <Card key={subsystem.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-black">{subsystem.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 mb-4">
                  <span className="font-medium text-black">Sistema:</span>{" "}
                  <span className="text-black">{subsystem.system?.name || getSystemName(subsystem.systemId)}</span>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(subsystem)}
                    className="h-8 px-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteSubsystem(subsystem.id)}
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
              {isEditMode ? "Editar Subsistema" : "Crear Nuevo Subsistema"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Actualiza los detalles del subsistema seleccionado."
                : "Completa el formulario para crear un nuevo subsistema."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-black">Nombre</Label>
              <Input
                id="name"
                placeholder="Nombre del subsistema"
                value={newSubsystemName}
                onChange={(e) => setNewSubsystemName(e.target.value)}
                className="text-black"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="system" className="text-black">Sistema</Label>
              <Select
                value={selectedSystemId}
                onValueChange={setSelectedSystemId}
              >
                <SelectTrigger id="system" className="text-black">
                  <SelectValue placeholder="Selecciona un sistema" />
                </SelectTrigger>
                <SelectContent>
                  {systems.map((s) => (
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
              onClick={isEditMode ? handleUpdateSubsystem : handleCreateSubsystem}
              disabled={isLoading || !newSubsystemName.trim() || !selectedSystemId}
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