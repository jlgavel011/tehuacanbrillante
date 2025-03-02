"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Subsistema = {
  id: string;
  nombre: string;
  sistemaId: string;
  sistema: {
    nombre: string;
  };
};

type Subsubsistema = {
  id: string;
  nombre: string;
  subsistemaId: string;
  subsistema: {
    nombre: string;
    sistema: {
      nombre: string;
      lineaProduccion: {
        nombre: string;
      };
    };
  };
};

export default function SubsubsystemsTab() {
  const [subsubsistemas, setSubsubsistemas] = useState<Subsubsistema[]>([]);
  const [subsistemas, setSubsistemas] = useState<Subsistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [subsistemaId, setSubsistemaId] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchSubsubsistemas();
    fetchSubsistemas();
  }, []);

  const fetchSubsubsistemas = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/production-lines/subsubsystems");
      if (!response.ok) throw new Error("Error al cargar los sub-subsistemas");
      const data = await response.json();
      setSubsubsistemas(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los sub-subsistemas");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubsistemas = async () => {
    try {
      const response = await fetch("/api/production-lines/subsystems");
      if (!response.ok) throw new Error("Error al cargar los subsistemas");
      const data = await response.json();
      setSubsistemas(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los subsistemas");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      toast.error("El nombre del sub-subsistema es requerido");
      return;
    }

    if (!subsistemaId) {
      toast.error("Debe seleccionar un subsistema");
      return;
    }

    try {
      setSubmitLoading(true);
      
      const url = editingId 
        ? `/api/production-lines/subsubsystems/${editingId}` 
        : "/api/production-lines/subsubsystems";
      
      const method = editingId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          nombre,
          subsistemaId,
        }),
      });

      if (!response.ok) throw new Error("Error al guardar el sub-subsistema");
      
      await fetchSubsubsistemas();
      toast.success(editingId ? "Sub-subsistema actualizado correctamente" : "Sub-subsistema creado correctamente");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el sub-subsistema");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (subsubsistema: Subsubsistema) => {
    setEditingId(subsubsistema.id);
    setNombre(subsubsistema.nombre);
    setSubsistemaId(subsubsistema.subsistemaId);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este sub-subsistema? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const response = await fetch(`/api/production-lines/subsubsystems/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar el sub-subsistema");
      
      await fetchSubsubsistemas();
      toast.success("Sub-subsistema eliminado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el sub-subsistema");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setSubsistemaId("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-black">Listado de Sub-subsistemas</h2>
          <p className="text-sm text-gray-500">Gestione los sub-subsistemas que componen los subsistemas</p>
        </div>
        <Dialog open={open} onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="mr-2 h-4 w-4" /> Agregar sub-subsistema
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar' : 'Agregar'} Sub-subsistema</DialogTitle>
              <DialogDescription>
                {editingId 
                  ? 'Modifique los datos del sub-subsistema.' 
                  : 'Complete el formulario para agregar un nuevo sub-subsistema.'}
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
                    placeholder="Ingrese el nombre del sub-subsistema"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <label htmlFor="subsistema" className="text-sm font-medium text-black">
                    Subsistema
                  </label>
                  <Select value={subsistemaId} onValueChange={setSubsistemaId}>
                    <SelectTrigger id="subsistema">
                      <SelectValue placeholder="Seleccione un subsistema" />
                    </SelectTrigger>
                    <SelectContent>
                      {subsistemas.map((subsistema) => (
                        <SelectItem key={subsistema.id} value={subsistema.id}>
                          {subsistema.nombre} - {subsistema.sistema.nombre}
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
      ) : subsubsistemas.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <p className="text-gray-500">No hay sub-subsistemas registrados</p>
          <Button
            variant="link"
            onClick={() => setOpen(true)}
            className="mt-2"
          >
            Agregar un nuevo sub-subsistema
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Subsistema</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead>Línea de Producción</TableHead>
                <TableHead className="w-[150px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subsubsistemas.map((subsubsistema) => (
                <TableRow key={subsubsistema.id}>
                  <TableCell className="font-medium">{subsubsistema.nombre}</TableCell>
                  <TableCell>{subsubsistema.subsistema.nombre}</TableCell>
                  <TableCell>{subsubsistema.subsistema.sistema.nombre}</TableCell>
                  <TableCell>{subsubsistema.subsistema.sistema.lineaProduccion.nombre}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(subsubsistema)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(subsubsistema.id)}
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