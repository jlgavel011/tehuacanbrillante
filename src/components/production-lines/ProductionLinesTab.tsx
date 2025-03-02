"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type LineaProduccion = {
  id: string;
  nombre: string;
};

export default function ProductionLinesTab() {
  const [lineasProduccion, setLineasProduccion] = useState<LineaProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchLineasProduccion();
  }, []);

  const fetchLineasProduccion = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/production-lines");
      if (!response.ok) throw new Error("Error al cargar las líneas de producción");
      const data = await response.json();
      setLineasProduccion(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar las líneas de producción");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      toast.error("El nombre de la línea es requerido");
      return;
    }

    try {
      setSubmitLoading(true);
      
      const url = editingId 
        ? `/api/production-lines/${editingId}` 
        : "/api/production-lines";
      
      const method = editingId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre }),
      });

      if (!response.ok) throw new Error("Error al guardar la línea de producción");
      
      await fetchLineasProduccion();
      toast.success(editingId ? "Línea actualizada correctamente" : "Línea creada correctamente");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la línea de producción");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (linea: LineaProduccion) => {
    setEditingId(linea.id);
    setNombre(linea.nombre);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta línea de producción? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const response = await fetch(`/api/production-lines/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar la línea de producción");
      
      await fetchLineasProduccion();
      toast.success("Línea eliminada correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar la línea de producción");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-black">Listado de Líneas de Producción</h2>
          <p className="text-sm text-gray-500">Gestione las líneas de producción de la planta</p>
        </div>
        <Dialog open={open} onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="mr-2 h-4 w-4" /> Agregar línea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar' : 'Agregar'} Línea de Producción</DialogTitle>
              <DialogDescription>
                {editingId 
                  ? 'Modifique los datos de la línea de producción.' 
                  : 'Complete el formulario para agregar una nueva línea de producción.'}
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
                    placeholder="Ingrese el nombre de la línea"
                    required
                  />
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
      ) : lineasProduccion.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <p className="text-gray-500">No hay líneas de producción registradas</p>
          <Button
            variant="link"
            onClick={() => setOpen(true)}
            className="mt-2"
          >
            Agregar una nueva línea
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-[150px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineasProduccion.map((linea) => (
                <TableRow key={linea.id}>
                  <TableCell className="font-medium">{linea.nombre}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(linea)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(linea.id)}
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