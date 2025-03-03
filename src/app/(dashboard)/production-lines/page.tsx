"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash, ArrowRight, Shapes, Package } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ProductionLine = {
  id: string;
  name: string;
};

export default function ProductionLinesPage() {
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productionLineName, setProductionLineName] = useState("");
  const [currentProductionLine, setCurrentProductionLine] = useState<ProductionLine | null>(null);

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
      toast.error("No se pudieron cargar las líneas de producción");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionLines();
  }, []);

  const handleCreateProductionLine = async () => {
    if (!productionLineName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    try {
      const response = await fetch("/api/production-lines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: productionLineName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear la línea de producción");
      }

      toast.success("Línea de producción creada con éxito");
      setIsCreateDialogOpen(false);
      setProductionLineName("");
      fetchProductionLines();
    } catch (error) {
      console.error("Error creating production line:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear la línea de producción");
    }
  };

  const handleEditProductionLine = async () => {
    if (!productionLineName.trim() || !currentProductionLine) {
      toast.error("El nombre es requerido");
      return;
    }

    try {
      const response = await fetch(`/api/production-lines/${currentProductionLine.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: productionLineName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar la línea de producción");
      }

      toast.success("Línea de producción actualizada con éxito");
      setIsEditDialogOpen(false);
      setProductionLineName("");
      setCurrentProductionLine(null);
      fetchProductionLines();
    } catch (error) {
      console.error("Error updating production line:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar la línea de producción");
    }
  };

  const handleDeleteProductionLine = async () => {
    if (!currentProductionLine) return;

    try {
      const response = await fetch(`/api/production-lines/${currentProductionLine.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar la línea de producción");
      }

      toast.success("Línea de producción eliminada con éxito");
      setIsDeleteDialogOpen(false);
      setCurrentProductionLine(null);
      fetchProductionLines();
    } catch (error) {
      console.error("Error deleting production line:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar la línea de producción");
    }
  };

  const openEditDialog = (productionLine: ProductionLine) => {
    setCurrentProductionLine(productionLine);
    setProductionLineName(productionLine.name);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (productionLine: ProductionLine) => {
    setCurrentProductionLine(productionLine);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container px-4 py-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-black">Líneas de Producción</h1>
          <p className="text-sm md:text-base text-black mt-1">
            Gestiona tus líneas de producción, sistemas, subsistemas y sub-subsistemas.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)} 
          className="w-full sm:w-auto bg-primary hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Nueva línea
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-l-4 border-l-gray-300 hover:shadow-md transition-all bg-white">
              <CardHeader className="pb-1 px-3 sm:px-4">
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardFooter className="flex justify-between px-3 sm:px-4 pt-2 border-t">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {productionLines.length === 0 ? (
            <div className="col-span-full flex justify-center p-6 sm:p-10">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No hay líneas de producción. Crea una para comenzar.</p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)} 
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Nueva línea
                </Button>
              </div>
            </div>
          ) : (
            productionLines.map((productionLine) => (
              <Card 
                key={productionLine.id} 
                className="border-l-4 border-l-primary hover:shadow-lg transition-all group relative bg-white border shadow-sm"
              >
                <CardHeader className="pb-1 px-3 sm:px-4">
                  <div className="absolute top-2 right-2 bg-primary/10 rounded-full p-2">
                    <Shapes className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg md:text-xl text-black pr-8">
                    {productionLine.name}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t px-3 sm:px-4">
                  <div className="flex space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(productionLine)} className="h-8 w-8 text-primary hover:text-primary-dark hover:bg-primary/10">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar línea</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={() => openDeleteDialog(productionLine)} className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Eliminar línea</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="grid grid-cols-2 gap-1 w-full">
                    <Button 
                      variant="default" 
                      className="bg-amber-500 hover:bg-amber-600 text-white text-sm h-9"
                      asChild
                    >
                      <Link href={`/production-lines/${productionLine.id}/products`} className="flex items-center justify-center">
                        Productos
                      </Link>
                    </Button>
                    <Button 
                      variant="default" 
                      className="bg-secondary hover:bg-secondary/90 text-white text-sm h-9"
                      asChild
                    >
                      <Link href={`/production-lines/${productionLine.id}`} className="flex items-center justify-center">
                        Gestionar
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl text-black">Nueva Línea de Producción</DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-black">
              Crea una nueva línea de producción para organizar tus sistemas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm md:text-base">Nombre</Label>
              <Input
                id="name"
                placeholder="Nombre de la línea de producción"
                value={productionLineName}
                onChange={(e) => setProductionLineName(e.target.value)}
                className="text-sm md:text-base"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-4 sm:gap-3 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setProductionLineName("");
              }}
              className="w-full sm:w-auto order-2 sm:order-1 mb-2 sm:mb-0"
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleCreateProductionLine}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl text-black">Editar Línea de Producción</DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-black">
              Actualiza el nombre de la línea de producción.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="text-sm md:text-base">Nombre</Label>
              <Input
                id="edit-name"
                placeholder="Nombre de la línea de producción"
                value={productionLineName}
                onChange={(e) => setProductionLineName(e.target.value)}
                className="text-sm md:text-base"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-4 sm:gap-3 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setProductionLineName("");
                setCurrentProductionLine(null);
              }}
              className="w-full sm:w-auto order-2 sm:order-1 mb-2 sm:mb-0"
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleEditProductionLine}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl text-destructive">Eliminar Línea de Producción</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              ¿Estás seguro de que deseas eliminar la línea de producción "{currentProductionLine?.name}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-4 sm:gap-3 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setCurrentProductionLine(null);
              }}
              className="w-full sm:w-auto order-2 sm:order-1 mb-2 sm:mb-0"
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteProductionLine}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 