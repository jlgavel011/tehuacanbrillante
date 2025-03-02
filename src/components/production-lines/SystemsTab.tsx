"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type LineaProduccion = {
  id: string;
  nombre: string;
};

type Sistema = {
  id: string;
  nombre: string;
  lineaProduccionId: string;
  lineaProduccion: {
    nombre: string;
  };
};

export default function SystemsTab() {
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [lineasProduccion, setLineasProduccion] = useState<LineaProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [lineaProduccionId, setLineaProduccionId] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchSistemas();
    fetchLineasProduccion();
  }, []);

  const fetchSistemas = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/production-lines/systems");
      if (!response.ok) throw new Error("Error al cargar los sistemas");
      const data = await response.json();
      setSistemas(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los sistemas");
    } finally {
      setLoading(false);
    }
  };

  const fetchLineasProduccion = async () => {
    try {
      const response = await fetch("/api/production-lines");
      if (!response.ok) throw new Error("Error al cargar las líneas de producción");
      const data = await response.json();
      setLineasProduccion(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar las líneas de producción");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      toast.error("El nombre del sistema es requerido");
      return;
    }

    if (!lineaProduccionId) {
      toast.error("Debe seleccionar una línea de producción");
      return;
    }

    try {
      setSubmitLoading(true);
      
      const url = editingId 
        ? `/api/production-lines/systems/${editingId}` 
        : "/api/production-lines/systems";
      
      const method = editingId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          nombre,
          lineaProduccionId,
        }),
      });

      if (!response.ok) throw new Error("Error al guardar el sistema");
      
      await fetchSistemas();
      toast.success(editingId ? "Sistema actualizado correctamente" : "Sistema creado correctamente");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el sistema");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (sistema: Sistema) => {
    setEditingId(sistema.id);
    setNombre(sistema.nombre);
    setLineaProduccionId(sistema.lineaProduccionId);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este sistema? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const response = await fetch(`/api/production-lines/systems/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar el sistema");
      
      await fetchSistemas();
      toast.success("Sistema eliminado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el sistema");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setLineaProduccionId("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-black">Listado de Sistemas</h2>
          <p className="text-sm text-gray-500">Gestione los sistemas que componen las líneas de producción</p>
        </div>
        <Dialog open={open} onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="mr-2 h-4 w-4" /> Agregar sistema
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar' : 'Agregar'} Sistema</DialogTitle>
              <DialogDescription>
                {editingId 
                  ? 'Modifique los datos del sistema.' 
                  : 'Complete el formulario para agregar un nuevo sistema.'}
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
                    placeholder="Ingrese el nombre del sistema"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <label htmlFor="lineaProduccion" className="text-sm font-medium text-black">
                    Línea de Producción
                  </label>
                  <Select value={lineaProduccionId} onValueChange={setLineaProduccionId}>
                    <SelectTrigger id="lineaProduccion">
                      <SelectValue placeholder="Seleccione una línea de producción" />
                    </SelectTrigger>
                    <SelectContent>
                      {lineasProduccion.map((linea) => (
                        <SelectItem key={linea.id} value={linea.id}>
                          {linea.nombre}
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
      ) : sistemas.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <p className="text-gray-500">No hay sistemas registrados</p>
          <Button
            variant="link"
            onClick={() => setOpen(true)}
            className="mt-2"
          >
            Agregar un nuevo sistema
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Línea de Producción</TableHead>
                <TableHead className="w-[150px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sistemas.map((sistema) => (
                <TableRow key={sistema.id}>
                  <TableCell className="font-medium">{sistema.nombre}</TableCell>
                  <TableCell>{sistema.lineaProduccion.nombre}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(sistema)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(sistema.id)}
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