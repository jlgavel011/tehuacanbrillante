"use client";

import { useState } from "react";
import { Card } from "@tremor/react";
import { ProductionChiefPerformance } from "@/components/analytics/reports/ProductionChiefPerformance";
import { MostEfficientDays } from "@/components/analytics/reports/MostEfficientDays";
import { MostEfficientHours } from "@/components/analytics/reports/MostEfficientHours";
import { MostProducedProducts } from "@/components/analytics/reports/MostProducedProducts";
import { MostProducedFlavors } from "@/components/analytics/reports/MostProducedFlavors";
import { MostProducedModels } from "@/components/analytics/reports/MostProducedModels";
import { MostProducedSizes } from "@/components/analytics/reports/MostProducedSizes";
import { RawMaterialsWithIssues } from "@/components/analytics/reports/RawMaterialsWithIssues";
import { QualityDeviationsImpact } from "@/components/analytics/reports/QualityDeviationsImpact";
import { TotalStops } from "@/components/analytics/reports/TotalStops";
import { StopsByType } from "@/components/analytics/reports/StopsByType";
import { MaintenanceStopsByLine } from "@/components/analytics/reports/MaintenanceStopsByLine";
import { MaintenanceStopsBySystem } from "@/components/analytics/reports/MaintenanceStopsBySystem";
import { MaintenanceStopsBySubsystem } from "@/components/analytics/reports/MaintenanceStopsBySubsystem";
import { MaintenanceStopsBySubsubsystem } from "@/components/analytics/reports/MaintenanceStopsBySubsubsystem";
import { OperationalStopsByLine } from "@/components/analytics/reports/OperationalStopsByLine";
import { OperationalStopsBySystem } from "@/components/analytics/reports/OperationalStopsBySystem";
import { OperationalStopsBySubsystem } from "@/components/analytics/reports/OperationalStopsBySubsystem";
import { OperationalStopsBySubsubsystem } from "@/components/analytics/reports/OperationalStopsBySubsubsystem";
import { MostUsedBoxes } from "@/components/analytics/reports/MostUsedBoxes";
import { TotalProductionByProduct } from "@/components/analytics/reports/TotalProductionByProduct";
import { ProductionByFlavor } from "@/components/analytics/reports/ProductionByFlavor";
import { ProductionByModel } from "@/components/analytics/reports/ProductionByModel";
import { ProductionBySize } from "@/components/analytics/reports/ProductionBySize";
import { ProductionByBoxType } from "@/components/analytics/reports/ProductionByBoxType";
import { TotalProductionByProductLiters } from "@/components/analytics/reports/TotalProductionByProductLiters";
import { ProductionByFlavorLiters } from "@/components/analytics/reports/ProductionByFlavorLiters";
import { ProductionByModelLiters } from "@/components/analytics/reports/ProductionByModelLiters";
import { ProductionBySizeLiters } from "@/components/analytics/reports/ProductionBySizeLiters";
import { ProductionByLineLiters } from "@/components/analytics/reports/ProductionByLineLiters";
import { TotalProductionByProductBoxes } from "@/components/analytics/reports/TotalProductionByProductBoxes";
import { ProductionByFlavorBoxes } from "@/components/analytics/reports/ProductionByFlavorBoxes";
import { ProductionByModelBoxes } from "@/components/analytics/reports/ProductionByModelBoxes";
import { ProductionBySizeBoxes } from "@/components/analytics/reports/ProductionBySizeBoxes";
import { LineChiefPerformance } from "@/components/analytics/reports/LineChiefPerformance";
import { StopsBySystem } from "@/components/analytics/reports/StopsBySystem";
import { StopsByRawMaterial } from "@/components/analytics/reports/StopsByRawMaterial";
import { StopsByQualityDeviation } from "@/components/analytics/reports/StopsByQualityDeviation";
import { StopsByTime } from "@/components/analytics/reports/StopsByTime";
import { StopsByDay } from "@/components/analytics/reports/StopsByDay";
import { StopsTable } from "@/components/analytics/reports/StopsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { CompareWithFilter } from "@/components/reports/CompareWithFilter";
import { DateRangeProvider, useDateRange } from "@/context/DateRangeContext";
import { cn } from "@/lib/utils";
import { useProductsIndicators } from "@/hooks/useProductsIndicators";

function AnalyticsContent() {
  const { 
    date, 
    setDate, 
    selectedPeriod, 
    setSelectedPeriod,
    comparisonPeriod,
    setComparisonPeriod,
  } = useDateRange();
  
  const { 
    totalProducts, 
    totalFlavors, 
    totalModels, 
    totalBoxes, 
    productsComparison,
    flavorsComparison,
    modelsComparison,
    boxesComparison,
    isLoading 
  } = useProductsIndicators();

  return (
    <div className="flex flex-col gap-4 p-4 bg-background">
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Analítica y Reportes</h1>
        <div className="flex items-center gap-4">
          <DateRangeFilter
            date={date}
            onDateChange={setDate}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
          <CompareWithFilter
            selectedComparison={comparisonPeriod}
            onComparisonChange={setComparisonPeriod}
          />
        </div>
      </div>

      <Tabs defaultValue="strategic" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="strategic" className="data-[state=active]:bg-primary/10">
              Reportes Estratégicos
            </TabsTrigger>
            <TabsTrigger value="detailed" className="data-[state=active]:bg-primary/10">
              Reportes Detallados
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="strategic" className="space-y-4 mt-2">
          {/* Usuarios y Eficiencia */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Usuarios y Eficiencia</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <LineChiefPerformance />
              <MostEfficientDays />
              <MostEfficientHours />
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Productos</h2>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Productos</span>
                  <span className={cn(
                    "text-xs",
                    productsComparison.isIncrease ? "text-green-600" : "text-red-600"
                  )}>
                    {productsComparison.formattedPercentage}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{totalProducts.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Sabores</span>
                  <span className={cn(
                    "text-xs",
                    flavorsComparison.isIncrease ? "text-green-600" : "text-red-600"
                  )}>
                    {flavorsComparison.formattedPercentage}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{totalFlavors.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Modelos</span>
                  <span className={cn(
                    "text-xs",
                    modelsComparison.isIncrease ? "text-green-600" : "text-red-600"
                  )}>
                    {modelsComparison.formattedPercentage}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{totalModels.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Cajas</span>
                  <span className={cn(
                    "text-xs",
                    boxesComparison.isIncrease ? "text-green-600" : "text-red-600"
                  )}>
                    {boxesComparison.formattedPercentage}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{totalBoxes.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <MostProducedProducts />
              </div>
              <MostProducedFlavors />
              <MostProducedModels />
              <MostProducedSizes />
              <MostUsedBoxes />
            </div>
          </div>

          {/* Sección: Calidad */}
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Calidad</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <QualityDeviationsImpact />
              <RawMaterialsWithIssues />
            </div>
          </Card>

          {/* Sección: Paros */}
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Paros</h2>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Por Mantenimiento</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <MaintenanceStopsByLine />
                <MaintenanceStopsBySystem />
                <MaintenanceStopsBySubsystem />
                <MaintenanceStopsBySubsubsystem />
              </div>
              <h3 className="text-lg font-medium mt-6">Por Operación</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <OperationalStopsByLine />
                <OperationalStopsBySystem />
                <OperationalStopsBySubsystem />
                <OperationalStopsBySubsubsystem />
              </div>
            </div>
          </Card>

          {/* Sección: Producción por Cajas */}
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Producción por Cajas</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <TotalProductionByProductBoxes />
              <ProductionByFlavorBoxes />
              <ProductionByModelBoxes />
              <ProductionBySizeBoxes />
              <ProductionByBoxType />
            </div>
          </Card>

          {/* Sección: Producción por Litros */}
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Producción por Litros</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <TotalProductionByProductLiters />
              <ProductionByFlavorLiters />
              <ProductionByModelLiters />
              <ProductionBySizeLiters />
              <ProductionByLineLiters />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Registro de Paros</h2>
            <StopsTable />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <DateRangeProvider>
      <AnalyticsContent />
    </DateRangeProvider>
  );
} 