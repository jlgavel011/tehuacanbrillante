"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionLinesTab } from "./components/ProductionLinesTab";
import { SystemsTab } from "./components/SystemsTab";
import { SubsystemsTab } from "./components/SubsystemsTab";
import { SubsubsystemsTab } from "./components/SubsubsystemsTab";

export default function ProductionLinesPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-black">Líneas de Producción</h2>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Gestión de Líneas de Producción</CardTitle>
            <CardDescription>
              Gestiona las líneas de producción, sistemas, subsistemas y sub-subsistemas de la planta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="production-lines" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="production-lines" className="text-black">Líneas</TabsTrigger>
                <TabsTrigger value="systems" className="text-black">Sistemas</TabsTrigger>
                <TabsTrigger value="subsystems" className="text-black">Subsistemas</TabsTrigger>
                <TabsTrigger value="subsubsystems" className="text-black">Sub-subsistemas</TabsTrigger>
              </TabsList>
              <TabsContent value="production-lines">
                <ProductionLinesTab />
              </TabsContent>
              <TabsContent value="systems">
                <SystemsTab />
              </TabsContent>
              <TabsContent value="subsystems">
                <SubsystemsTab />
              </TabsContent>
              <TabsContent value="subsubsystems">
                <SubsubsystemsTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 