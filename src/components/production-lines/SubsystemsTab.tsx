"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Sistema = {
  id: string;
  nombre: string;
  lineaProduccionId: string;
};

type Subsistema = {
  id: string;
  nombre: string;
  sistemaId: string;
  sistema: {
    nombre: string;
    lineaProduccion: {
      nombre: string;
    };
  };
};

export default function SubsystemsTab() {
  const [subsistemas, setSubsistemas] = useState<Subsistema[]>([]);
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [sistemaId, setSistemaId] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchSubsistemas();
    fetchSistemas();
  }, []);

  const fetchSubsistemas = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/production-lines/subsystems");
      if (!response.ok) throw new Error("Error al cargar los subsistemas");
      const data = await response.json();
      setSubsistemas(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los subsistemas");
    } finally {
      setLoading(false);
    }
  };

  const fetchSistemas = async () => {
    try {
      const response = await fetch("/api/production-lines/systems");
      if (!response.ok) throw new Error("Error al cargar los sistemas");
      const data = await response.json();
      setSistemas(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los sistemas");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      toast.error("El nombre del subsistema es requerido");
      return;
    }

    if (!sistemaId) {
      toast.error("Debe seleccionar un sistema");
      return;
    }

    try {
      setSubmitLoading(true);
      
      const url = editingId 
        ? `/api/production-lines/subsystems/${editingId}` 
        : "/api/production-lines/subsystems";
      
      const method = editingId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          nombre,
          sistemaId,
        }),
      });

      if (!response.ok) throw new Error("Error al guardar el subsistema");
      
      await fetchSubsistemas();
      toast.success(editingId ? "Subsistema actualizado correctamente" : "Subsistema creado correctamente");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el subsistema");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (subsistema: Subsistema) => {
    setEditingId(subsistema.id);
    setNombre(subsistema.nombre);
    setSistemaId(subsistema.sistemaId);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este subsistema? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const response = await fetch(`/api/production-lines/subsystems/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar el subsistema");
      
      await fetchSubsistemas();
      toast.success("Subsistema eliminado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el subsistema");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setSistemaId("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-black">Listado de Subsistemas</h2>
          <p className="text-sm text-gray-500">Gestione los subsistemas que componen los sistemas</p>
        </div>
        <Dialog open={open} onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="mr-2 h-4 w-4" /> Agregar subsistema
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar' : 'Agregar'} Subsistema</DialogTitle>
              <DialogDescription>
                {editingId 
                  ? 'Modifique los datos del subsistema.' 
                  : 'Complete el formulario para agregar un nuevo subsistema.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-2">
                  <label htmlFor="nombre" className="text-sm font-medium text-black">
                    Nombre
                  </label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ingrese el nombre del subsistema"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <label htmlFor="sistema" className="text-sm font-medium text-black">
                    Sistema
                  </label>
                  <Select value={sistemaId} onValueChange={setSistemaId}>
                    <SelectTrigger id="sistema">
                      <SelectValue placeholder="Seleccione un sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      {sistemas.map((sistema) => (
                        <SelectItem key={sistema.id} value={sistema.id}>
                          {sistema.nombre}
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
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitLoading}>
                  {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? 'Actualizar' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="w-full py-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : subsistemas.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <p className="text-gray-500">No hay subsistemas registrados</p>
          <Button
            variant="link"
            onClick={() => setOpen(true)}
            className="mt-2"
          >
            Agregar un nuevo subsistema
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead>Línea de Producción</TableHead>
                <TableHead className="w-[150px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subsistemas.map((subsistema) => (
                <TableRow key={subsistema.id}>
                  <TableCell className="font-medium">{subsistema.nombre}</TableCell>
                  <TableCell>{subsistema.sistema.nombre}</TableCell>
                  <TableCell>{subsistema.sistema.lineaProduccion.nombre}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(subsistema)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(subsistema.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 