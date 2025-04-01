"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QualityTab } from "../components/QualityTab";
// Dynamic import of the HierarchicalView component
const DynamicHierarchicalView = dynamic(
  () => import('../components/HierarchicalView').then(mod => mod.HierarchicalView),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-[600px] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    ) 
  }
);
// Dynamic import of the MobileSystemsView component
const DynamicMobileSystemsView = dynamic(
  () => import('../components/MobileSystemsView').then(mod => mod.MobileSystemsView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full flex items-center justify-center p-8">
        <Skeleton className="w-full h-[400px]" />
      </div>
    )
  }
);
type ProductionLine = {
  id: string;
  nombre: string;
  name?: string; // Keep for backward compatibility
};
type System = {
  id: string;
  name: string;
  productionLineId: string;
  lineaProduccionId?: string;
  productionLine?: {
    nombre: string;
    name?: string;
  };
};
type Subsystem = {
  id: string;
  name: string;
  systemId: string;
  sistemaId?: string;
  system?: {
    name: string;
    productionLine?: {
      nombre: string;
      name?: string;
    };
  };
};
type Subsubsystem = {
  id: string;
  name: string;
  subsystemId: string;
  subsistemaId?: string;
  subsystem?: {
    name: string;
    system?: {
      name: string;
    };
  };
};
export default function ProductionLineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [productionLine, setProductionLine] = useState<ProductionLine | null>(null);
  const [systems, setSystems] = useState<System[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [subsubsystems, setSubsubsystems] = useState<Subsubsystem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'system' | 'subsystem' | 'subsubsystem'>('system');
  const [dialogAction, setDialogAction] = useState<'create' | 'update' | 'delete'>('create');
  const [itemName, setItemName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Reorganization confirmation state
  const [showReorganizeConfirm, setShowReorganizeConfirm] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ nodeId: string; newParentId: string; type: string } | null>(null);
  // Add state to track screen size
  const [isMobile, setIsMobile] = useState(false);
  
  // Check screen size on component mount and window resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  useEffect(() => {
    fetchData();
  }, [id]);
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch production line details
      const lineResponse = await fetch(`/api/production-lines/${id}`);
      if (!lineResponse.ok) {
        throw new Error('No se pudo obtener la línea de producción');
      }
      const lineData = await lineResponse.json();
      console.log('Production line data:', lineData);
      setProductionLine(lineData);
      // Fetch systems for this production line
      const systemsResponse = await fetch(`/api/production-lines/systems?productionLineId=${id}`);
      if (!systemsResponse.ok) {
        throw new Error('No se pudieron obtener los sistemas');
      }
      const systemsData = await systemsResponse.json();
      setSystems(systemsData);
      // Fetch all subsystems
      const subsystemsResponse = await fetch('/api/production-lines/subsystems');
      if (!subsystemsResponse.ok) {
        throw new Error('No se pudieron obtener los subsistemas');
      }
      const subsystemsData = await subsystemsResponse.json();
      
      // Filter subsystems that belong to the systems of this production line
      const relevantSubsystems = subsystemsData.filter((subsystem: Subsystem) => 
        systemsData.some((system: System) => system.id === subsystem.systemId)
      );
      setSubsystems(relevantSubsystems);
      // Fetch all subsubsystems
      const subsubsystemsResponse = await fetch('/api/production-lines/subsubsystems');
      if (!subsubsystemsResponse.ok) {
        throw new Error('No se pudieron obtener los subsubsistemas');
      }
      const subsubsystemsData = await subsubsystemsResponse.json();
      
      // Filter subsubsystems that belong to the subsystems of this production line
      const relevantSubsubsystems = subsubsystemsData.filter((subsubsystem: Subsubsystem) => 
        relevantSubsystems.some((subsystem: Subsystem) => subsystem.id === subsubsystem.subsystemId)
      );
      setSubsubsystems(relevantSubsubsystems);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar datos');
      toast.error('Error al cargar los datos de la jerarquía');
    } finally {
      setIsLoading(false);
    }
  };
  const openCreateDialog = (type: 'system' | 'subsystem' | 'subsubsystem', parentId?: string) => {
    setDialogType(type);
    setDialogAction('create');
    setItemName('');
    setSelectedParentId(parentId || '');
    setIsDialogOpen(true);
  };
  const openEditDialog = (
    type: 'system' | 'subsystem' | 'subsubsystem', 
    item: System | Subsystem | Subsubsystem
  ) => {
    setDialogType(type);
    setDialogAction('update');
    setItemName(item.name);
    setSelectedItemId(item.id);
    
    if ('productionLineId' in item) {
      setSelectedParentId(item.productionLineId);
    } else if ('systemId' in item) {
      setSelectedParentId(item.systemId);
    } else if ('subsystemId' in item) {
      setSelectedParentId(item.subsystemId);
    }
    
    setIsDialogOpen(true);
  };
  const openDeleteDialog = (
    type: "system" | "subsystem" | "subsubsystem",
    itemId: string,
    itemName: string
  ) => {
    setDialogType(type);
    setDialogAction("delete");
    setSelectedItemId(itemId);
    setSelectedItemName(itemName);
    setIsDialogOpen(true);
  };
  const handleCreateItem = async () => {
    if (!itemName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    setIsSubmitting(true);
    try {
      let endpoint = '';
      let body: any = { name: itemName };
      if (dialogType === 'system') {
        endpoint = '/api/production-lines/systems';
        body.productionLineId = id;
      } else if (dialogType === 'subsystem') {
        endpoint = '/api/production-lines/subsystems';
        if (!selectedParentId) {
          throw new Error('No se seleccionó un sistema padre');
        }
        body.systemId = selectedParentId;
      } else if (dialogType === 'subsubsystem') {
        endpoint = '/api/production-lines/subsubsystems';
        if (!selectedParentId) {
          throw new Error('No se seleccionó un subsistema padre');
        }
        body.subsystemId = selectedParentId;
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`Error al crear ${getTypeLabel(dialogType).toLowerCase()}`);
      }
      toast.success(`${getTypeLabel(dialogType)} creado exitosamente`);
      setIsDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleUpdateItem = async () => {
    if (!itemName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    setIsSubmitting(true);
    try {
      let endpoint = '';
      let body: any = { name: itemName };
      if (dialogType === 'system') {
        endpoint = `/api/production-lines/systems/${selectedItemId}`;
        body.productionLineId = selectedParentId || id;
      } else if (dialogType === 'subsystem') {
        endpoint = `/api/production-lines/subsystems/${selectedItemId}`;
        if (!selectedParentId) {
          throw new Error('No se seleccionó un sistema padre');
        }
        body.systemId = selectedParentId;
      } else if (dialogType === 'subsubsystem') {
        endpoint = `/api/production-lines/subsubsystems/${selectedItemId}`;
        if (!selectedParentId) {
          throw new Error('No se seleccionó un subsistema padre');
        }
        body.subsystemId = selectedParentId;
      }
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`Error al actualizar ${getTypeLabel(dialogType).toLowerCase()}`);
      }
      toast.success(`${getTypeLabel(dialogType)} actualizado exitosamente`);
      setIsDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteItem = async () => {
    setIsSubmitting(true);
    try {
      let endpoint = '';
      if (dialogType === 'system') {
        endpoint = `/api/production-lines/systems/${selectedItemId}`;
      } else if (dialogType === 'subsystem') {
        endpoint = `/api/production-lines/subsystems/${selectedItemId}`;
      } else if (dialogType === 'subsubsystem') {
        endpoint = `/api/production-lines/subsubsystems/${selectedItemId}`;
      }
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Error al eliminar ${getTypeLabel(dialogType).toLowerCase()}`);
      }
      toast.success(`${getTypeLabel(dialogType)} eliminado exitosamente`);
      setIsDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleUpdateHierarchy = async (changes: { nodeId: string; newParentId: string; type: string }) => {
    // Store changes and show confirmation dialog
    setPendingChanges(changes);
    setShowReorganizeConfirm(true);
  };
  const confirmReorganize = async () => {
    if (!pendingChanges) return;
    
    setIsSubmitting(true);
    
    try {
      const { nodeId, newParentId, type } = pendingChanges;
      
      let endpoint = '';
      let body: any = {};
      
      if (type === 'system') {
        endpoint = `/api/production-lines/systems/${nodeId}`;
        body.productionLineId = newParentId;
      } else if (type === 'subsystem') {
        endpoint = `/api/production-lines/subsystems/${nodeId}`;
        body.systemId = newParentId;
      } else if (type === 'subsubsystem') {
        endpoint = `/api/production-lines/subsubsystems/${nodeId}`;
        body.subsystemId = newParentId;
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        throw new Error(`Error al reorganizar ${type}`);
      }
      
      toast.success('Jerarquía actualizada exitosamente');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating hierarchy:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar la reorganización');
    } finally {
      setIsSubmitting(false);
      setShowReorganizeConfirm(false);
      setPendingChanges(null);
    }
  };
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'system': return 'Sistema';
      case 'subsystem': return 'Subsistema';
      case 'subsubsystem': return 'Subsubsistema';
      default: return type;
    }
  };
  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/production-lines">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex-1">
            <Skeleton className="h-4 w-1/4 mb-2" />
            <Skeleton className="h-8 w-1/3" />
          </div>
        </div>
        <Card className="mx-2">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[600px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/production-lines">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-medium text-muted-foreground">Error</h2>
            <h1 className="text-2xl font-bold text-red-500">Error de carga</h1>
          </div>
        </div>
        <Card className="mx-2">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-6">
              <p className="text-lg text-red-500 mb-4">{error}</p>
              <Button onClick={fetchData}>Reintentar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/production-lines')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {productionLine?.nombre || productionLine?.name || 'Línea de Producción'}
          </h1>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : (
        <>
          {/* Conditional rendering based on screen size */}
          {isMobile ? (
            <DynamicMobileSystemsView
              systems={systems}
              subsystems={subsystems}
              subsubsystems={subsubsystems}
              onAddSystem={() => openCreateDialog('system')}
              onEditSystem={(system) => openEditDialog('system', system)}
              onDeleteSystem={(systemId) => openDeleteDialog('system', systemId, systems.find(s => s.id === systemId)?.name || '')}
              onAddSubsystem={(systemId) => {
                setSelectedParentId(systemId);
                openCreateDialog('subsystem', systemId);
              }}
              onEditSubsystem={(subsystem) => openEditDialog('subsystem', subsystem)}
              onDeleteSubsystem={(subsystemId) => openDeleteDialog('subsystem', subsystemId, subsystems.find(s => s.id === subsystemId)?.name || '')}
              onAddSubsubsystem={(subsystemId) => {
                setSelectedParentId(subsystemId);
                openCreateDialog('subsubsystem', subsystemId);
              }}
              onEditSubsubsystem={(subsubsystem) => openEditDialog('subsubsystem', subsubsystem)}
              onDeleteSubsubsystem={(subsubsystemId) => openDeleteDialog('subsubsystem', subsubsystemId, subsubsystems.find(s => s.id === subsubsystemId)?.name || '')}
              productionLineId={id}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Tabs defaultValue="systems" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="systems" className="flex-1">Sistemas</TabsTrigger>
                    <TabsTrigger value="quality" className="flex-1">Desviación de Calidad</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="systems" className="p-6">
                    <DynamicHierarchicalView productionLineId={id} />
                  </TabsContent>
                  
                  <TabsContent value="quality" className="p-6">
                    <QualityTab productionLineId={id} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'create' 
                ? `Nuevo ${getTypeLabel(dialogType).toLowerCase()}` 
                : dialogAction === 'update'
                  ? `Editar ${getTypeLabel(dialogType).toLowerCase()}`
                  : `Eliminar ${getTypeLabel(dialogType).toLowerCase()}`
              }
            </DialogTitle>
            {dialogAction === 'delete' && (
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar "{selectedItemName}"?
                Esta acción no se puede deshacer.
              </DialogDescription>
            )}
          </DialogHeader>
          {dialogAction !== 'delete' ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder={`Nombre del ${getTypeLabel(dialogType).toLowerCase()}`}
                />
              </div>
              {dialogType === 'subsystem' && (
                <div className="space-y-2">
                  <Label htmlFor="parentSystem">Sistema</Label>
                  <Select
                    value={selectedParentId}
                    onValueChange={setSelectedParentId}
                  >
                    <SelectTrigger id="parentSystem">
                      <SelectValue placeholder="Seleccionar sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      {systems.map((system) => (
                        <SelectItem key={system.id} value={system.id}>
                          {system.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {dialogType === 'subsubsystem' && (
                <div className="space-y-2">
                  <Label htmlFor="parentSubsystem">Subsistema</Label>
                  <Select
                    value={selectedParentId}
                    onValueChange={setSelectedParentId}
                  >
                    <SelectTrigger id="parentSubsystem">
                      <SelectValue placeholder="Seleccionar subsistema" />
                    </SelectTrigger>
                    <SelectContent>
                      {subsystems.map((subsystem) => (
                        <SelectItem key={subsystem.id} value={subsystem.id}>
                          {subsystem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={dialogAction === 'create' ? handleCreateItem : handleUpdateItem}
                  disabled={isSubmitting || !itemName.trim()}
                >
                  {isSubmitting ? 'Procesando...' : dialogAction === 'create' ? 'Crear' : 'Actualizar'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteItem}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Procesando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      {/* Reorganize Confirmation Dialog */}
      <Dialog open={showReorganizeConfirm} onOpenChange={setShowReorganizeConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reorganización</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas mover este elemento a una nueva ubicación en la jerarquía?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowReorganizeConfirm(false);
                setPendingChanges(null);
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmReorganize}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
