"use client";

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  ConnectionLineType,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  NodeProps,
  OnEdgesChange,
  OnNodesChange,
  Position,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  Connection,
  OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ChevronDown, ChevronRight, Edit, Trash, Plus, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Tipos de datos
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

// Funciones genéricas para manejar los tipos
function isProductionLine(item: ProductionLine | System | Subsystem | Subsubsystem): item is ProductionLine {
  return !('productionLineId' in item) && !('systemId' in item) && !('subsystemId' in item);
}

function isSystem(item: ProductionLine | System | Subsystem | Subsubsystem): item is System {
  return 'productionLineId' in item;
}

function isSubsystem(item: ProductionLine | System | Subsystem | Subsubsystem): item is Subsystem {
  return 'systemId' in item;
}

function isSubsubsystem(item: ProductionLine | System | Subsystem | Subsubsystem): item is Subsubsystem {
  return 'subsystemId' in item;
}

// Tipos para los nodos y aristas
type NodeData = {
  label: string;
  type: 'productionLine' | 'system' | 'subsystem' | 'subsubsystem';
  expanded?: boolean;
  original: ProductionLine | System | Subsystem | Subsubsystem;
  parentId?: string;
  onAdd?: Function;
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
};

type CustomNode = Node<NodeData>;

// Propiedades del componente principal
interface HierarchyTreeViewProps {
  productionLines: ProductionLine[];
  systems: System[];
  subsystems: Subsystem[];
  subsubsystems: Subsubsystem[];
  onAddSystem: () => void;
  onEditSystem: (system: System) => void;
  onDeleteSystem: (systemId: string) => void;
  onAddSubsystem: (systemId: string) => void;
  onEditSubsystem: (subsystem: Subsystem) => void;
  onDeleteSubsystem: (subsystemId: string) => void;
  onAddSubsubsystem: (subsystemId: string) => void;
  onEditSubsubsystem: (subsubsystem: Subsubsystem) => void;
  onDeleteSubsubsystem: (subsubsystemId: string) => void;
  onEditProductionLine: (productionLine: ProductionLine) => void;
  onDeleteProductionLine: (productionLineId: string) => void;
  onAddProductionLine: () => void;
  onUpdateHierarchy: (changes: { nodeId: string, newParentId: string, type: string }) => void;
}

// Estilos
const defaultNodeStyle = {
  background: '#ffffff',
  color: '#000000',
  border: '1px solid #e2e8f0',
  borderRadius: '4px',
  borderColor: '#e2e8f0',
  borderWidth: '1px'
};

// Componente para el nodo personalizado
function CustomNode({ id, data, isConnectable, selected }: NodeProps<NodeData>) {
  const { label, type, expanded = true, original, onAdd, onEdit, onDelete } = data;
  const reactFlowInstance = useReactFlow();

  const toggleExpand = () => {
    const nodesToUpdate = reactFlowInstance.getNodes().map((node) => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            expanded: !expanded,
          },
        };
      }
      return node;
    });

    reactFlowInstance.setNodes(nodesToUpdate);
  };

  const renderActions = () => {
    if (type === 'productionLine') {
      return (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              if (onAdd) onAdd();
            }}
            title="Añadir sistema"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(original);
            }}
            title="Editar línea de producción"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete(original.id);
            }}
            title="Eliminar línea de producción"
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    }

    if (type === 'system') {
      return (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              if (onAdd) onAdd();
            }}
            title="Añadir subsistema"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(original);
            }}
            title="Editar sistema"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete(original.id);
            }}
            title="Eliminar sistema"
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    }

    if (type === 'subsystem') {
      return (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              if (onAdd) onAdd();
            }}
            title="Añadir subsubsistema"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(original);
            }}
            title="Editar subsistema"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete(original.id);
            }}
            title="Eliminar subsistema"
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    }

    if (type === 'subsubsystem') {
      return (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(original);
            }}
            title="Editar subsubsistema"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete(original.id);
            }}
            title="Eliminar subsubsistema"
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    }

    return null;
  };

  const getNodeStyles = () => {
    let styles = { ...defaultNodeStyle };

    switch (type) {
      case 'productionLine':
        styles = {
          ...styles,
          background: '#f0f9ff',
          borderColor: '#bae6fd',
        };
        break;
      case 'system':
        styles = {
          ...styles,
          background: '#f0fdf4',
          borderColor: '#bbf7d0',
        };
        break;
      case 'subsystem':
        styles = {
          ...styles,
          background: '#fef9c3',
          borderColor: '#fde047',
        };
        break;
      case 'subsubsystem':
        styles = {
          ...styles,
          background: '#fdf2f8',
          borderColor: '#fbcfe8',
        };
        break;
    }

    if (selected) {
      styles = {
        ...styles,
        borderColor: '#3b82f6',
        borderWidth: '2px',
      };
    }

    return styles;
  };

  return (
    <div
      className={cn(
        'p-2 min-w-48 shadow-sm cursor-grab rounded-md text-left',
        selected && 'ring-2 ring-primary'
      )}
      style={getNodeStyles()}
    >
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2">
          {(type === 'productionLine' || type === 'system' || type === 'subsystem') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={toggleExpand}
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <div className="font-medium truncate max-w-32">{label}</div>
        </div>
        <div className="flex items-center">
          <div className="handle-wrapper relative">
            <Button variant="ghost" size="icon" className="h-6 w-6 handle cursor-grab absolute opacity-0">
              <Grip className="h-3.5 w-3.5" />
            </Button>
          </div>
          {renderActions()}
        </div>
      </div>
    </div>
  );
}

// Registro de nodos personalizados
const nodeTypes = {
  custom: CustomNode,
};

// Componente principal
export function HierarchyTreeViewComponent({
  productionLines,
  systems,
  subsystems,
  subsubsystems,
  onAddSystem,
  onEditSystem,
  onDeleteSystem,
  onAddSubsystem,
  onEditSubsystem,
  onDeleteSubsystem,
  onAddSubsubsystem,
  onEditSubsubsystem,
  onDeleteSubsubsystem,
  onEditProductionLine,
  onDeleteProductionLine,
  onAddProductionLine,
  onUpdateHierarchy,
}: HierarchyTreeViewProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [lastLayoutedNodes, setLastLayoutedNodes] = useState<Node[]>([]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  // Organización automática de nodos
  const getLayoutedElements = (
    productionLines: ProductionLine[],
    systems: System[],
    subsystems: Subsystem[],
    subsubsystems: Subsubsystem[]
  ) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const spacing = 180;
    const nodeWidth = 200;
    const nodeHeight = 40;

    // Nodos de líneas de producción
    productionLines.forEach((pl, plIndex) => {
      const plNode: CustomNode = {
        id: `pl-${pl.id}`,
        type: 'custom',
        position: { x: 0, y: plIndex * spacing },
        data: {
          label: pl.name,
          type: 'productionLine',
          original: pl,
          expanded: true,
          onAdd: () => onAddSystem(),
          onEdit: onEditProductionLine,
          onDelete: onDeleteProductionLine,
        },
      };
      nodes.push(plNode);
    });

    // Nodos de sistemas
    const filteredSystems = systems;
    filteredSystems.forEach((system, sIndex) => {
      const parentIndex = productionLines.findIndex((pl) => pl.id === system.productionLineId);
      const plNode = nodes.find((n) => n.id === `pl-${system.productionLineId}`);
      
      if (plNode && plNode.data.expanded) {
        const systemNode: CustomNode = {
          id: `system-${system.id}`,
          type: 'custom',
          position: {
            x: nodeWidth + 50,
            y: parentIndex * spacing + sIndex * 60,
          },
          data: {
            label: system.name,
            type: 'system',
            original: system,
            parentId: system.productionLineId,
            expanded: true,
            onAdd: () => onAddSubsystem(system.id),
            onEdit: onEditSystem,
            onDelete: onDeleteSystem,
          },
        };
        nodes.push(systemNode);
        
        edges.push({
          id: `e-pl-${system.productionLineId}-system-${system.id}`,
          source: `pl-${system.productionLineId}`,
          target: `system-${system.id}`,
          type: 'smoothstep',
          animated: true,
        });
      }
    });

    // Nodos de subsistemas
    const filteredSubsystems = subsystems;
    filteredSubsystems.forEach((subsystem, ssIndex) => {
      const systemNode = nodes.find((n) => n.id === `system-${subsystem.systemId}`);
      
      if (systemNode && systemNode.data.expanded) {
        const subsystemNode: CustomNode = {
          id: `subsystem-${subsystem.id}`,
          type: 'custom',
          position: {
            x: nodeWidth * 2 + 100,
            y: systemNode.position.y + ssIndex * 40,
          },
          data: {
            label: subsystem.name,
            type: 'subsystem',
            original: subsystem,
            parentId: subsystem.systemId,
            expanded: true,
            onAdd: () => onAddSubsubsystem(subsystem.id),
            onEdit: onEditSubsystem,
            onDelete: onDeleteSubsystem,
          },
        };
        nodes.push(subsystemNode);
        
        edges.push({
          id: `e-system-${subsystem.systemId}-subsystem-${subsystem.id}`,
          source: `system-${subsystem.systemId}`,
          target: `subsystem-${subsystem.id}`,
          type: 'smoothstep',
          animated: true,
        });
      }
    });

    // Nodos de subsubsistemas
    const filteredSubsubsystems = subsubsystems;
    filteredSubsubsystems.forEach((subsubsystem, sssIndex) => {
      const subsystemNode = nodes.find((n) => n.id === `subsystem-${subsubsystem.subsystemId}`);
      
      if (subsystemNode && subsystemNode.data.expanded) {
        const subsubsystemNode: CustomNode = {
          id: `subsubsystem-${subsubsystem.id}`,
          type: 'custom',
          position: {
            x: nodeWidth * 3 + 150,
            y: subsystemNode.position.y + sssIndex * 30,
          },
          data: {
            label: subsubsystem.name,
            type: 'subsubsystem',
            original: subsubsystem,
            parentId: subsubsystem.subsystemId,
            onEdit: onEditSubsubsystem,
            onDelete: onDeleteSubsubsystem,
          },
        };
        nodes.push(subsubsystemNode);
        
        edges.push({
          id: `e-subsystem-${subsubsystem.subsystemId}-subsubsystem-${subsubsystem.id}`,
          source: `subsystem-${subsubsystem.subsystemId}`,
          target: `subsubsystem-${subsubsystem.id}`,
          type: 'smoothstep',
          animated: true,
        });
      }
    });

    return { nodes, edges };
  };

  // Actualizar los nodos cuando cambian los datos
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      productionLines,
      systems,
      subsystems,
      subsubsystems
    );
    
    // Conservar el estado expandido de los nodos
    const updatedNodes = layoutedNodes.map((node) => {
      const existingNode = lastLayoutedNodes.find((n) => n.id === node.id);
      if (existingNode && 'expanded' in existingNode.data) {
        return {
          ...node,
          data: {
            ...node.data,
            expanded: existingNode.data.expanded,
          },
        };
      }
      return node;
    });
    
    setNodes(updatedNodes);
    setEdges(layoutedEdges);
    setLastLayoutedNodes(updatedNodes);
  }, [productionLines, systems, subsystems, subsubsystems]);

  // Configuración adicional
  const proOptions = { hideAttribution: true };

  return (
    <div className="h-[600px] w-full bg-background border border-border rounded-md">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        attributionPosition="bottom-right"
        className="bg-background"
      />
    </div>
  );
}

// Wrapper con Provider
export function HierarchyTreeView(props: HierarchyTreeViewProps) {
  return (
    <ReactFlowProvider>
      <HierarchyTreeViewComponent {...props} />
    </ReactFlowProvider>
  );
}