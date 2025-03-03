"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Edit, Trash, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface MobileSystemsViewProps {
  systems: System[];
  subsystems: Subsystem[];
  subsubsystems: Subsubsystem[];
  onAddSystem: (productionLineId?: string) => void;
  onEditSystem: (system: System) => void;
  onDeleteSystem: (systemId: string) => void;
  onAddSubsystem: (systemId: string) => void;
  onEditSubsystem: (subsystem: Subsystem) => void;
  onDeleteSubsystem: (subsystemId: string) => void;
  onAddSubsubsystem: (subsystemId: string) => void;
  onEditSubsubsystem: (subsubsystem: Subsubsystem) => void;
  onDeleteSubsubsystem: (subsubsystemId: string) => void;
  productionLineId: string;
}

export function MobileSystemsView({
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
  productionLineId,
}: MobileSystemsViewProps) {
  const [expandedSystems, setExpandedSystems] = useState<Record<string, boolean>>({});
  const [expandedSubsystems, setExpandedSubsystems] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleSystem = (systemId: string) => {
    setExpandedSystems((prev) => ({
      ...prev,
      [systemId]: !prev[systemId],
    }));
  };

  const toggleSubsystem = (subsystemId: string) => {
    setExpandedSubsystems((prev) => ({
      ...prev,
      [subsystemId]: !prev[subsystemId],
    }));
  };

  const filteredSystems = systems.filter((system) =>
    system.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Sistemas</h3>
          <Button 
            size="sm" 
            onClick={() => onAddSystem(productionLineId)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Añadir Sistema
          </Button>
        </div>
        <Input
          placeholder="Buscar sistemas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-2"
        />
      </div>

      {filteredSystems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No se encontraron sistemas
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSystems.map((system) => {
            const systemSubsystems = subsystems.filter(
              (subsystem) => subsystem.systemId === system.id
            );
            const isExpanded = expandedSystems[system.id] || false;

            return (
              <Card key={system.id} className="border border-gray-200 shadow-sm">
                <CardHeader className="p-3 pb-0">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleSystem(system.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-500 mr-1" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500 mr-1" />
                      )}
                      <CardTitle className="text-base font-medium">
                        {system.name}
                      </CardTitle>
                      <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200">
                        {systemSubsystems.length} subsistemas
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onAddSubsystem(system.id)}
                        title="Añadir subsistema"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEditSystem(system)}
                        title="Editar sistema"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDeleteSystem(system.id)}
                        title="Eliminar sistema"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-3 pt-2">
                    {systemSubsystems.length === 0 ? (
                      <div className="text-sm text-gray-500 py-2">
                        No hay subsistemas
                      </div>
                    ) : (
                      <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                        {systemSubsystems.map((subsystem) => {
                          const subsystemSubsubsystems = subsubsystems.filter(
                            (subsubsystem) => subsubsystem.subsystemId === subsystem.id
                          );
                          const isSubsystemExpanded = expandedSubsystems[subsystem.id] || false;

                          return (
                            <div key={subsystem.id} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between">
                                <div 
                                  className="flex items-center cursor-pointer"
                                  onClick={() => toggleSubsystem(subsystem.id)}
                                >
                                  {isSubsystemExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500 mr-1" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500 mr-1" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {subsystem.name}
                                  </span>
                                  <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200 text-xs">
                                    {subsystemSubsubsystems.length} subsubsistemas
                                  </Badge>
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => onAddSubsubsystem(subsystem.id)}
                                    title="Añadir subsubsistema"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => onEditSubsystem(subsystem)}
                                    title="Editar subsistema"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={() => onDeleteSubsystem(subsystem.id)}
                                    title="Eliminar subsistema"
                                  >
                                    <Trash className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {isSubsystemExpanded && subsystemSubsubsystems.length > 0 && (
                                <div className="mt-1 pl-4 space-y-1 border-l-2 border-gray-100">
                                  {subsystemSubsubsystems.map((subsubsystem) => (
                                    <div key={subsubsystem.id} className="flex items-center justify-between py-1">
                                      <span className="text-xs">{subsubsystem.name}</span>
                                      <div className="flex space-x-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5"
                                          onClick={() => onEditSubsubsystem(subsubsystem)}
                                          title="Editar subsubsistema"
                                        >
                                          <Edit className="h-2.5 w-2.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 text-destructive hover:text-destructive"
                                          onClick={() => onDeleteSubsubsystem(subsubsystem.id)}
                                          title="Eliminar subsubsistema"
                                        >
                                          <Trash className="h-2.5 w-2.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 