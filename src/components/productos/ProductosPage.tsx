"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Package, Search, X } from "lucide-react";
import CrearProductoForm from "@/components/productos/CrearProductoForm";
import EditarProductoForm from "@/components/productos/EditarProductoForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface Producto {
  id: string;
  nombre: string;
  cajaId: string;
  caja: { id: string; nombre: string; numeroUnidades?: number };
  modeloId: string;
  modelo: { id: string; nombre: string };
  tamañoId: string;
  tamaño: { id: string; nombre: string; litros?: number };
  saborId: string;
  sabor: { id: string; nombre: string };
  materiasPrimas: Array<{
    materiaPrima: {
      id: string;
      nombre: string;
    }
  }>;
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [isCrearDialogOpen, setIsCrearDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCloseConfirmDialogOpen, setIsCloseConfirmDialogOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  const fetchProductos = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/productos");
      
      if (!response.ok) {
        throw new Error("Error al cargar productos");
      }
      
      const data = await response.json();
      setProductos(data);
      setFilteredProductos(data);
    } catch (error) {
      console.error("Error fetching productos:", error);
      toast.error("Error al cargar productos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  // Filter products based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProductos(productos);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = productos.filter(producto => 
      producto.nombre.toLowerCase().includes(query) ||
      producto.caja.nombre?.toLowerCase().includes(query) ||
      producto.modelo.nombre.toLowerCase().includes(query) ||
      producto.tamaño.nombre?.toLowerCase().includes(query) ||
      producto.sabor.nombre.toLowerCase().includes(query)
    );
    
    setFilteredProductos(filtered);
  }, [searchQuery, productos]);

  const handleEditClick = (producto: Producto) => {
    setIsEditLoading(true);
    setSelectedProducto(producto);
    setIsEditDialogOpen(true);
    // Simulate loading time for data preparation
    setTimeout(() => {
      setIsEditLoading(false);
    }, 500);
  };

  const handleDeleteClick = (producto: Producto) => {
    setSelectedProducto(producto);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProducto) return;
    
    try {
      const response = await fetch(`/api/productos/${selectedProducto.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Error al eliminar el producto");
      }
      
      // Remove the deleted product from the state
      const updatedProductos = productos.filter(p => p.id !== selectedProducto.id);
      setProductos(updatedProductos);
      setFilteredProductos(updatedProductos);
      toast.success("Producto eliminado correctamente");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar el producto");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">Productos</h1>
        <Dialog open={isCrearDialogOpen} onOpenChange={(open) => {
          if (open) {
            setIsCreateLoading(true);
            setIsCrearDialogOpen(open);
            // Simulate loading time for data preparation
            setTimeout(() => {
              setIsCreateLoading(false);
            }, 500);
          } else {
            setIsCrearDialogOpen(open);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Crear Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl text-black">Crear Nuevo Producto</DialogTitle>
            </DialogHeader>
            
            {isCreateLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-2 text-sm text-muted-foreground">Cargando formulario...</p>
              </div>
            ) : (
              <CrearProductoForm onSuccess={() => {
                setIsCrearDialogOpen(false);
                fetchProductos();
              }} />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-lg sm:text-xl text-black">Lista de Productos</CardTitle>
            {!isLoading && productos.length > 0 && (
              <span className="text-xs text-black bg-muted px-2 py-1 rounded-md">
                {filteredProductos.length} de {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-4">
          {/* Search Bar */}
          {!isLoading && productos.length > 0 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar productos por nombre, caja, modelo, tamaño o sabor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="ml-3 text-sm text-muted-foreground">Cargando productos...</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-10">
              <Package className="h-16 w-16 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground mb-2">No hay productos registrados</p>
              <p className="text-xs text-muted-foreground mb-6 max-w-md mx-auto">
                Los productos te permiten organizar tus artículos con sus características como caja, modelo, tamaño y sabor.
              </p>
              <Button 
                onClick={() => setIsCrearDialogOpen(true)}
                className="mx-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Producto
              </Button>
            </div>
          ) : filteredProductos.length === 0 ? (
            <div className="text-center py-10">
              <Search className="h-16 w-16 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground mb-2">No se encontraron resultados</p>
              <p className="text-xs text-muted-foreground mb-6 max-w-md mx-auto">
                No hay productos que coincidan con "{searchQuery}". Intenta con otra búsqueda.
              </p>
              <Button 
                variant="outline"
                onClick={clearSearch}
                className="mx-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar búsqueda
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <ScrollArea className="w-full rounded-md border-0 shadow-sm h-[calc(100vh-300px)]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[25%]">Nombre</TableHead>
                        <TableHead className="w-[15%]">Caja</TableHead>
                        <TableHead className="w-[15%]">Modelo</TableHead>
                        <TableHead className="w-[15%]">Tamaño</TableHead>
                        <TableHead className="w-[15%]">Sabor</TableHead>
                        <TableHead className="w-[15%] text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProductos.map((producto) => (
                        <TableRow key={producto.id}>
                          <TableCell className="font-medium">{producto.nombre}</TableCell>
                          <TableCell>{producto.caja.nombre || `${producto.caja.numeroUnidades} unidades`}</TableCell>
                          <TableCell>{producto.modelo.nombre}</TableCell>
                          <TableCell>{producto.tamaño.nombre || `${producto.tamaño.litros} L`}</TableCell>
                          <TableCell>{producto.sabor.nombre}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditClick(producto)}
                                className="h-9 w-9 text-primary hover:text-primary-dark hover:bg-primary/10"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteClick(producto)}
                                className="h-9 w-9 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredProductos.map((producto) => (
                  <Card key={producto.id} className="overflow-hidden border-0 shadow-md border-l-4 border-l-primary">
                    <CardHeader className="p-4 pb-2 bg-muted/30">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-medium">{producto.nombre}</CardTitle>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7 text-primary hover:text-primary-dark hover:bg-primary/10"
                            onClick={() => handleEditClick(producto)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(producto)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Caja</p>
                          <p className="truncate">{producto.caja.nombre || `${producto.caja.numeroUnidades} unidades`}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Modelo</p>
                          <p className="truncate">{producto.modelo.nombre}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tamaño</p>
                          <p className="truncate">{producto.tamaño.nombre || `${producto.tamaño.litros} L`}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sabor</p>
                          <p className="truncate">{producto.sabor.nombre}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          // Only allow closing the dialog if we're not in the middle of editing
          if (open === false) {
            // Show confirmation dialog instead of browser confirm
            setIsCloseConfirmDialogOpen(true);
          } else {
            setIsEditDialogOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-black">Editar Producto</DialogTitle>
          </DialogHeader>
          
          {isEditLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">Cargando datos del producto...</p>
            </div>
          ) : (
            selectedProducto && (
              <EditarProductoForm 
                producto={selectedProducto} 
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  fetchProductos();
                }} 
              />
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <AlertDialog open={isCloseConfirmDialogOpen} onOpenChange={setIsCloseConfirmDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Si cierras sin guardar, perderás todos los cambios realizados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-4 sm:gap-3 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1 mb-2 sm:mb-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="w-full sm:w-auto order-1 sm:order-2"
              onClick={() => {
                setIsCloseConfirmDialogOpen(false);
                setIsEditDialogOpen(false);
              }}
            >
              Cerrar sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-destructive">Eliminar Producto</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              ¿Estás seguro de que deseas eliminar el producto "{selectedProducto?.nombre}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-4 sm:gap-3 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1 mb-2 sm:mb-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 order-1 sm:order-2"
              onClick={handleDeleteConfirm}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 