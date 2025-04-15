"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HierarchyTreeView } from "@/app/(dashboard)/production-lines/components/HierarchyTreeView";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot
} from "react-beautiful-dnd";
import ImportExportSystems from "@/components/production-lines/ImportExportSystems";

type ProductionLine = {
  id: string;
  name: string;
};

type System = {
  id: string;
  name: string;
  productionLineId: string;
  productionLine: {
    name: string;
  };
};

type Subsystem = {
  id: string;
  name: string;
  systemId: string;
  system: {
    name: string;
    productionLine: {
      name: string;
    };
  };
};

type Subsubsystem = {
  id: string;
  name: string;
  subsystemId: string;
  subsystem: {
    name: string;
    system: {
      name: string;
    };
  };
};

type HierarchicalViewProps = {
  productionLineId?: string;
};

export function HierarchicalView({ productionLineId }: HierarchicalViewProps) {
  // State management for data
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [subsubsystems, setSubsubsystems] = useState<Subsubsystem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search states
  const [systemSearch, setSystemSearch] = useState('');
  const [subsystemSearch, setSubsystemSearch] = useState('');
  const [subsubsystemSearch, setSubsubsystemSearch] = useState('');

  // State for dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{id: string, type: string, name: string} | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'productionLine' | 'system' | 'subsystem' | 'subsubsystem'>('productionLine');
  const [itemName, setItemName] = useState('');
  const [currentItemId, setCurrentItemId] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [isReorganizeDialogOpen, setIsReorganizeDialogOpen] = useState(false);
  const [reorganizeInfo, setReorganizeInfo] = useState<{nodeId: string, newParentId: string, type: string, nodeName: string, parentName: string} | null>(null);
  const [dialogAction, setDialogAction] = useState<'create' | 'edit'>('create');

  // Fetch all data on component mount
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [linesRes, systemsRes, subsystemsRes, subsubsystemsRes] = await Promise.all([
        productionLineId 
          ? fetch(`/api/production-lines/${productionLineId}`)
          : fetch('/api/production-lines'),
        fetch('/api/production-lines/systems'),
        fetch('/api/production-lines/subsystems'),
        fetch('/api/production-lines/subsubsystems'),
      ]);

      if (!linesRes.ok || !systemsRes.ok || !subsystemsRes.ok || !subsubsystemsRes.ok) {
        throw new Error('Error fetching data');
      }

      let linesData;
      
      // Handle different response formats based on whether we're fetching a single line or all lines
      if (productionLineId) {
        const singleLine = await linesRes.json();
        linesData = [singleLine]; // Convert single object to array
      } else {
        linesData = await linesRes.json();
      }
      
      const [systemsData, subsystemsData, subsubsystemsData] = await Promise.all([
        systemsRes.json(),
        subsystemsRes.json(),
        subsubsystemsRes.json(),
      ]);

      setProductionLines(linesData);
      
      // Filter data based on productionLineId if provided
      if (productionLineId) {
        setSystems(systemsData.filter((system: System) => system.productionLineId === productionLineId));
        const filteredSystems = systemsData.filter((system: System) => system.productionLineId === productionLineId);
        const systemIds = filteredSystems.map((system: System) => system.id);
        
        const filteredSubsystems = subsystemsData.filter((subsystem: Subsystem) => 
          systemIds.includes(subsystem.systemId)
        );
        setSubsystems(filteredSubsystems);
        
        const subsystemIds = filteredSubsystems.map((subsystem: Subsystem) => subsystem.id);
        setSubsubsystems(subsubsystemsData.filter((subsubsystem: Subsubsystem) => 
          subsystemIds.includes(subsubsystem.subsystemId)
        ));
      } else {
        setSystems(systemsData);
        setSubsystems(subsystemsData);
        setSubsubsystems(subsubsystemsData);
      }
    } catch (error) {
      console.error('Error fetching hierarchical data:', error);
      toast.error('Error al cargar los datos jerárquicos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Event handlers
  const handleAddProductionLine = () => {
    setDialogType('productionLine');
    setDialogAction('create');
    setItemName('');
    setIsDialogOpen(true);
  };

  const handleAddSystem = (productionLineId: string) => {
    setDialogType('system');
    setDialogAction('create');
    setSelectedParentId(productionLineId);
    setItemName('');
    setIsDialogOpen(true);
  };

  const handleAddSubsystem = (systemId: string) => {
    setDialogType('subsystem');
    setDialogAction('create');
    setSelectedParentId(systemId);
    setItemName('');
    setIsDialogOpen(true);
  };

  const handleAddSubsubsystem = (subsystemId: string) => {
    setDialogType('subsubsystem');
    setDialogAction('create');
    setSelectedParentId(subsystemId);
    setItemName('');
    setIsDialogOpen(true);
  };

  // Handle delete operations
  const handleDeleteProductionLine = (id: string) => {
    const productionLine = productionLines.find(pl => pl.id === id);
    if (!productionLine) return;
    
    const hasSystems = systems.some(s => s.productionLineId === id);
    if (hasSystems) {
      toast.error('No se puede eliminar una línea con sistemas asociados');
      return;
    }
    
    setDeleteInfo({ id, type: 'productionLine', name: productionLine.name });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSystem = (id: string) => {
    const system = systems.find(s => s.id === id);
    if (!system) return;
    
    const hasSubsystems = subsystems.some(s => s.systemId === id);
    if (hasSubsystems) {
      toast.error('No se puede eliminar un sistema con subsistemas asociados');
      return;
    }
    
    setDeleteInfo({ id, type: 'system', name: system.name });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSubsystem = (id: string) => {
    const subsystem = subsystems.find(s => s.id === id);
    if (!subsystem) return;
    
    const hasSubsubsystems = subsubsystems.some(s => s.subsystemId === id);
    if (hasSubsubsystems) {
      toast.error('No se puede eliminar un subsistema con subsubsistemas asociados');
      return;
    }
    
    setDeleteInfo({ id, type: 'subsystem', name: subsystem.name });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSubsubsystem = (id: string) => {
    const subsubsystem = subsubsystems.find(s => s.id === id);
    if (!subsubsystem) return;
    
    setDeleteInfo({ id, type: 'subsubsystem', name: subsubsystem.name });
    setIsDeleteDialogOpen(true);
  };

  // Handle the actual delete operation
  const confirmDelete = async () => {
    if (!deleteInfo) return;
    
    try {
      let endpoint = '';
      switch (deleteInfo.type) {
        case 'productionLine':
          endpoint = `/api/production-lines/${deleteInfo.id}`;
          break;
        case 'system':
          endpoint = `/api/production-lines/systems/${deleteInfo.id}`;
          break;
        case 'subsystem':
          endpoint = `/api/production-lines/subsystems/${deleteInfo.id}`;
          break;
        case 'subsubsystem':
          endpoint = `/api/production-lines/subsubsystems/${deleteInfo.id}`;
          break;
      }
      
      const response = await fetch(endpoint, { method: 'DELETE' });
      
      if (!response.ok) {
        const data = await response.json();
        
        // En lugar de lanzar un error, lo manejamos directamente
        if (data && data.error) {
          console.log(`Error del servidor: ${data.error}`);
          toast.error(data.error);
          setIsDeleteDialogOpen(false);
          setDeleteInfo(null);
          return;
        } else {
          console.log(`Error genérico al eliminar ${getTypeLabel(deleteInfo.type).toLowerCase()}`);
          toast.error(`Error al eliminar el ${getTypeLabel(deleteInfo.type).toLowerCase()}`);
          setIsDeleteDialogOpen(false);
          setDeleteInfo(null);
          return;
        }
      }
      
      // Update local state
      switch (deleteInfo.type) {
        case 'productionLine':
          setProductionLines(prev => prev.filter(pl => pl.id !== deleteInfo.id));
          break;
        case 'system':
          setSystems(prev => prev.filter(s => s.id !== deleteInfo.id));
          break;
        case 'subsystem':
          setSubsystems(prev => prev.filter(s => s.id !== deleteInfo.id));
          break;
        case 'subsubsystem':
          setSubsubsystems(prev => prev.filter(s => s.id !== deleteInfo.id));
          break;
      }
      
      toast.success(`${getTypeLabel(deleteInfo.type)} eliminado correctamente`);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(error instanceof Error ? error.message : `Error al eliminar el ${getTypeLabel(deleteInfo.type).toLowerCase()}`);
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteInfo(null);
    }
  };

  // Helper function to get readable label for each type
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'productionLine': return 'Línea de producción';
      case 'system': return 'Sistema';
      case 'subsystem': return 'Subsistema';
      case 'subsubsystem': return 'Subsubsistema';
      default: return type;
    }
  };

  // Edit handlers
  const handleEditProductionLine = (productionLine: ProductionLine) => {
    setDialogType('productionLine');
    setDialogAction('edit');
    setItemName(productionLine.name);
    setCurrentItemId(productionLine.id);
    setIsDialogOpen(true);
  };

  const handleEditSystem = (system: System) => {
    setDialogType('system');
    setDialogAction('edit');
    setItemName(system.name);
    setCurrentItemId(system.id);
    setSelectedParentId(system.productionLineId);
    setIsDialogOpen(true);
  };

  const handleEditSubsystem = (subsystem: Subsystem) => {
    setDialogType('subsystem');
    setDialogAction('edit');
    setItemName(subsystem.name);
    setCurrentItemId(subsystem.id);
    setSelectedParentId(subsystem.systemId);
    setIsDialogOpen(true);
  };

  const handleEditSubsubsystem = (subsubsystem: Subsubsystem) => {
    setDialogType('subsubsystem');
    setDialogAction('edit');
    setItemName(subsubsystem.name);
    setCurrentItemId(subsubsystem.id);
    setSelectedParentId(subsubsystem.subsystemId);
    setIsDialogOpen(true);
  };

  // Handle hierarchy updates (drag and drop)
  const handleUpdateHierarchy = async (changes: { nodeId: string, newParentId: string, type: string }) => {
    const { nodeId, newParentId, type } = changes;

    // Get names for confirmation dialog
    let nodeName = '';
    let parentName = '';

    if (type === 'system') {
      const system = systems.find(s => s.id === nodeId);
      if (!system) return;
      nodeName = system.name;
      
      const newProductionLine = productionLines.find(pl => pl.id === newParentId);
      if (!newProductionLine) return;
      parentName = newProductionLine.name;
    } else if (type === 'subsystem') {
      const subsystem = subsystems.find(s => s.id === nodeId);
      if (!subsystem) return;
      nodeName = subsystem.name;
      
      const newSystem = systems.find(s => s.id === newParentId);
      if (!newSystem) return;
      parentName = newSystem.name;
    } else if (type === 'subsubsystem') {
      const subsubsystem = subsubsystems.find(s => s.id === nodeId);
      if (!subsubsystem) return;
      nodeName = subsubsystem.name;
      
      const newSubsystem = subsystems.find(s => s.id === newParentId);
      if (!newSubsystem) return;
      parentName = newSubsystem.name;
    }

    // Show confirmation dialog
    setReorganizeInfo({
      nodeId,
      newParentId,
      type,
      nodeName,
      parentName
    });
    setIsReorganizeDialogOpen(true);
  };

  // Handle the actual hierarchy update
  const confirmReorganize = async () => {
    if (!reorganizeInfo) return;
    
    try {
      const { nodeId, newParentId, type } = reorganizeInfo;
      let endpoint = '';
      let body: any = {};
      
      switch (type) {
        case 'system':
          endpoint = `/api/production-lines/systems/${nodeId}`;
          body = { productionLineId: newParentId };
          break;
        case 'subsystem':
          endpoint = `/api/production-lines/subsystems/${nodeId}`;
          body = { systemId: newParentId };
          break;
        case 'subsubsystem':
          endpoint = `/api/production-lines/subsubsystems/${nodeId}`;
          body = { subsystemId: newParentId };
          break;
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al reorganizar');
      }
      
      // Update local state
      if (type === 'system') {
        setSystems(prev => prev.map(s => s.id === nodeId ? { ...s, productionLineId: newParentId } : s));
      } else if (type === 'subsystem') {
        setSubsystems(prev => prev.map(s => s.id === nodeId ? { ...s, systemId: newParentId } : s));
      } else if (type === 'subsubsystem') {
        setSubsubsystems(prev => prev.map(s => s.id === nodeId ? { ...s, subsystemId: newParentId } : s));
      }
      
      toast.success('Elemento reorganizado correctamente');
    } catch (error) {
      console.error('Error reorganizing:', error);
      toast.error(error instanceof Error ? error.message : 'Error al reorganizar');
    } finally {
      setIsReorganizeDialogOpen(false);
      setReorganizeInfo(null);
    }
  };

  // Function to handle drag and drop
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // If dropped outside a droppable area or in the same place
    if (!destination || (destination.droppableId === source.droppableId)) {
      return;
    }
    
    // Extract information about the dragged item
    const [sourceType, sourceParentId] = source.droppableId.split(':');
    const [destType, destParentId] = destination.droppableId.split(':');
    
    // Handle different types of moves
    if (sourceType === 'system' && destType === 'system') {
      // Move a system to another production line
      if (sourceParentId !== destParentId) {
        handleUpdateHierarchy({
          nodeId: draggableId,
          newParentId: destParentId,
          type: 'system'
        });
      }
    } else if (sourceType === 'subsystem' && destType === 'subsystem') {
      // Move a subsystem to another system
      if (sourceParentId !== destParentId) {
        handleUpdateHierarchy({
          nodeId: draggableId,
          newParentId: destParentId,
          type: 'subsystem'
        });
      }
    } else if (sourceType === 'subsubsystem' && destType === 'subsubsystem') {
      // Move a subsubsystem to another subsystem
      if (sourceParentId !== destParentId) {
        handleUpdateHierarchy({
          nodeId: draggableId,
          newParentId: destParentId,
          type: 'subsubsystem'
        });
      }
    }
  };

  // Handle scrolling to related items when clicking on a card
  const scrollToRelatedItems = (itemId: string, itemType: string) => {
    // Determine what to scroll to based on item type
    let targetId;
    
    if (itemType === 'system') {
      // When a system is clicked, scroll to its subsystems container
      // First check if the system has any subsystems
      const hasSubsystems = subsystems.some(sub => sub.systemId === itemId);
      if (hasSubsystems) {
        targetId = `subsystem-container-${itemId}`;
      }
    } else if (itemType === 'subsystem') {
      // When a subsystem is clicked, scroll to its subsubsystems container
      // First check if the subsystem has any subsubsystems
      const hasSubsubsystems = subsubsystems.some(sub => sub.subsystemId === itemId);
      if (hasSubsubsystems) {
        targetId = `subsubsystem-container-${itemId}`;
      }
    }
    
    if (targetId) {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        // Scroll the element into view with smooth behavior
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Briefly highlight the container to draw attention
        targetElement.classList.add('bg-primary/5');
        setTimeout(() => {
          targetElement.classList.remove('bg-primary/5');
        }, 1500);
      }
    }
  };

  // Render item for each level of the hierarchy
  const renderItem = (item: any, type: string) => {
    return (
      <div 
        className="p-3 mb-2 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group cursor-pointer"
        onClick={() => scrollToRelatedItems(item.id, type)}
      >
        <div className="flex justify-between items-center">
          <span className="font-medium truncate">{item.name}</span>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-gray-500 hover:text-primary hover:bg-primary/10" 
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (type === 'productionLine') handleEditProductionLine(item);
                else if (type === 'system') handleEditSystem(item);
                else if (type === 'subsystem') handleEditSubsystem(item);
                else if (type === 'subsubsystem') handleEditSubsubsystem(item);
              }}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-gray-500 hover:text-destructive hover:bg-destructive/10" 
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (type === 'productionLine') handleDeleteProductionLine(item.id);
                else if (type === 'system') handleDeleteSystem(item.id);
                else if (type === 'subsystem') handleDeleteSubsystem(item.id);
                else if (type === 'subsubsystem') handleDeleteSubsubsystem(item.id);
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {type === 'system' && item.productionLine && (
          <div className="text-xs text-muted-foreground mt-1">Línea: {item.productionLine.name}</div>
        )}
        {type === 'subsystem' && item.system && (
          <div className="text-xs text-muted-foreground mt-1">Sistema: <span className="font-bold">{item.system.name}</span></div>
        )}
        {type === 'subsubsystem' && item.subsystem && (
          <div className="text-xs text-muted-foreground mt-1">Subsistema: <span className="font-bold">{item.subsystem.name}</span></div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex justify-end mb-4">
            <ImportExportSystems />
          </div>
          <div className="grid grid-cols-3 gap-6 px-4 pb-6">
            {/* Systems Column */}
            <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg text-primary">Sistemas</h3>
                <Badge variant="outline">{systems.length}</Badge>
              </div>
              
              <div className="mb-3">
                <div className="relative">
                  <Input 
                    placeholder="Buscar sistemas..." 
                    value={systemSearch}
                    onChange={(e) => setSystemSearch(e.target.value)}
                    className="pl-8"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 max-h-[calc(100vh-270px)] overflow-y-auto pr-2">
                {productionLines.map(line => (
                  <div key={line.id} className="space-y-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                      <span className="truncate">{line.name}</span>
                    </div>
                    <Droppable droppableId={`system:${line.id}`} isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="space-y-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700"
                        >
                          {systems
                            .filter(system => system.productionLineId === line.id)
                            .filter(system => system.name.toLowerCase().includes(systemSearch.toLowerCase()))
                            .map((system, index) => (
                              <Draggable key={system.id} draggableId={system.id} index={index}>
                                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={cn(
                                      "transition-all",
                                      snapshot.isDragging && "ring-2 ring-primary"
                                    )}
                                  >
                                    {renderItem(system, 'system')}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start text-muted-foreground hover:text-primary" 
                            onClick={() => handleAddSystem(line.id)}
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Agregar Sistema
                          </Button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </div>

            {/* Subsystems Column */}
            <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg text-primary">Subsistemas</h3>
                <Badge variant="outline">{subsystems.length}</Badge>
              </div>
              
              <div className="mb-3">
                <div className="relative">
                  <Input 
                    placeholder="Buscar subsistemas..." 
                    value={subsystemSearch}
                    onChange={(e) => setSubsystemSearch(e.target.value)}
                    className="pl-8"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 max-h-[calc(100vh-270px)] overflow-y-auto pr-2">
                {systems.map(system => (
                  <div key={system.id} className="space-y-3" id={`subsystem-container-${system.id}`}>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                      <span className="truncate">{system.name}</span>
                    </div>
                    <Droppable droppableId={`subsystem:${system.id}`} isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="space-y-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700"
                        >
                          {subsystems
                            .filter(subsystem => subsystem.systemId === system.id)
                            .filter(subsystem => subsystem.name.toLowerCase().includes(subsystemSearch.toLowerCase()))
                            .map((subsystem, index) => (
                              <Draggable key={subsystem.id} draggableId={subsystem.id} index={index}>
                                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={cn(
                                      "transition-all",
                                      snapshot.isDragging && "ring-2 ring-primary"
                                    )}
                                  >
                                    {renderItem(subsystem, 'subsystem')}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start text-muted-foreground hover:text-primary" 
                            onClick={() => handleAddSubsystem(system.id)}
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Agregar Subsistema
                          </Button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </div>

            {/* Subsubsystems Column */}
            <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg text-primary">Subsubsistemas</h3>
                <Badge variant="outline">{subsubsystems.length}</Badge>
              </div>
              
              <div className="mb-3">
                <div className="relative">
                  <Input 
                    placeholder="Buscar subsubsistemas..." 
                    value={subsubsystemSearch}
                    onChange={(e) => setSubsubsystemSearch(e.target.value)}
                    className="pl-8"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 max-h-[calc(100vh-270px)] overflow-y-auto pr-2">
                {subsystems.map(subsystem => (
                  <div key={subsystem.id} className="space-y-3" id={`subsubsystem-container-${subsystem.id}`}>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                      <span className="truncate">{subsystem.name}</span>
                    </div>
                    <Droppable droppableId={`subsubsystem:${subsystem.id}`} isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="space-y-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700"
                        >
                          {subsubsystems
                            .filter(subsubsystem => subsubsystem.subsystemId === subsystem.id)
                            .filter(subsubsystem => subsubsystem.name.toLowerCase().includes(subsubsystemSearch.toLowerCase()))
                            .map((subsubsystem, index) => (
                              <Draggable key={subsubsystem.id} draggableId={subsubsystem.id} index={index}>
                                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={cn(
                                      "transition-all",
                                      snapshot.isDragging && "ring-2 ring-primary"
                                    )}
                                  >
                                    {renderItem(subsubsystem, 'subsubsystem')}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start text-muted-foreground hover:text-primary" 
                            onClick={() => handleAddSubsubsystem(subsystem.id)}
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Agregar Subsubsistema
                          </Button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar el {deleteInfo?.type && getTypeLabel(deleteInfo.type).toLowerCase()} "{deleteInfo?.name}"?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Eliminar</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reorganize Confirmation Dialog */}
      <AlertDialog open={isReorganizeDialogOpen} onOpenChange={setIsReorganizeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Reorganización</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea mover "{reorganizeInfo?.nodeName}" a "{reorganizeInfo?.parentName}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsReorganizeDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmReorganize}>Confirmar</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogAction === 'create' ? (
                <>
                  <PlusIcon className="h-5 w-5 text-primary" />
                  Nuevo {getTypeLabel(dialogType)}
                </>
              ) : (
                <>
                  <PencilIcon className="h-5 w-5 text-primary" />
                  Editar {getTypeLabel(dialogType)}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'create' 
                ? `Ingrese el nombre para crear un nuevo ${getTypeLabel(dialogType).toLowerCase()}.`
                : `Modifique el nombre del ${getTypeLabel(dialogType).toLowerCase()}.`
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            
            if (!itemName.trim()) {
              toast.error("El nombre es requerido");
              return;
            }
            
            try {
              // Handle creation
              if (dialogAction === 'create') {
                let endpoint = '';
                let body: Record<string, string> = {};
                
                switch (dialogType) {
                  case 'productionLine':
                    endpoint = '/api/production-lines';
                    body = { name: itemName };
                    break;
                  case 'system':
                    endpoint = '/api/production-lines/systems';
                    body = { 
                      name: itemName,
                      productionLineId: selectedParentId 
                    };
                    break;
                  case 'subsystem':
                    endpoint = '/api/production-lines/subsystems';
                    body = { 
                      name: itemName,
                      systemId: selectedParentId 
                    };
                    break;
                  case 'subsubsystem':
                    endpoint = '/api/production-lines/subsubsystems';
                    body = { 
                      name: itemName,
                      subsystemId: selectedParentId 
                    };
                    break;
                }
                
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body)
                });
                
                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(data.error || `Error al crear ${getTypeLabel(dialogType).toLowerCase()}`);
                }
                
                const newItem = await response.json();
                
                // Update local state
                switch (dialogType) {
                  case 'productionLine':
                    setProductionLines(prev => [...prev, newItem]);
                    break;
                  case 'system':
                    setSystems(prev => [...prev, newItem]);
                    break;
                  case 'subsystem':
                    setSubsystems(prev => [...prev, newItem]);
                    break;
                  case 'subsubsystem':
                    setSubsubsystems(prev => [...prev, newItem]);
                    break;
                }
                
                toast.success(`${getTypeLabel(dialogType)} creado correctamente`);
              } 
              // Handle updates
              else if (dialogAction === 'edit') {
                let endpoint = '';
                let body: Record<string, string> = {};
                
                switch (dialogType) {
                  case 'productionLine':
                    endpoint = `/api/production-lines/${currentItemId}`;
                    body = { name: itemName };
                    break;
                  case 'system':
                    endpoint = `/api/production-lines/systems/${currentItemId}`;
                    body = { 
                      name: itemName,
                      productionLineId: selectedParentId 
                    };
                    break;
                  case 'subsystem':
                    endpoint = `/api/production-lines/subsystems/${currentItemId}`;
                    body = { 
                      name: itemName,
                      systemId: selectedParentId 
                    };
                    break;
                  case 'subsubsystem':
                    endpoint = `/api/production-lines/subsubsystems/${currentItemId}`;
                    body = { 
                      name: itemName,
                      subsystemId: selectedParentId 
                    };
                    break;
                }
                
                const response = await fetch(endpoint, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body)
                });
                
                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(data.error || `Error al actualizar ${getTypeLabel(dialogType).toLowerCase()}`);
                }
                
                const updatedItem = await response.json();
                
                // Update local state
                switch (dialogType) {
                  case 'productionLine':
                    setProductionLines(prev => prev.map(item => item.id === currentItemId ? {...item, name: itemName} : item));
                    break;
                  case 'system':
                    setSystems(prev => prev.map(item => item.id === currentItemId ? {...item, name: itemName, productionLineId: selectedParentId} : item));
                    break;
                  case 'subsystem':
                    setSubsystems(prev => prev.map(item => item.id === currentItemId ? {...item, name: itemName, systemId: selectedParentId} : item));
                    break;
                  case 'subsubsystem':
                    setSubsubsystems(prev => prev.map(item => item.id === currentItemId ? {...item, name: itemName, subsystemId: selectedParentId} : item));
                    break;
                }
                
                toast.success(`${getTypeLabel(dialogType)} actualizado correctamente`);
              }
              
              // Close the dialog and reset form
              setIsDialogOpen(false);
              setItemName('');
              setCurrentItemId('');
              setSelectedParentId('');
            } catch (error) {
              console.error('Error in dialog action:', error);
              toast.error(error instanceof Error ? error.message : 'Error al procesar la solicitud');
            } finally {
              setIsDialogOpen(false);
              setItemName('');
              setSelectedParentId('');
              setCurrentItemId('');
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-left">Nombre</Label>
                <Input
                  id="name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder={`Nombre del ${getTypeLabel(dialogType).toLowerCase()}`}
                  className="col-span-3"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between sm:justify-end gap-2 mt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {dialogAction === 'create' ? 'Crear' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 