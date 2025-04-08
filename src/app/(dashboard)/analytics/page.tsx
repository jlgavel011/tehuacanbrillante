"use client";

import { useState } from "react";
import { Card } from "@tremor/react";
import { ProductionChiefPerformance } from "@/components/analytics/reports/ProductionChiefPerformance";
import { MostProducedProducts } from "@/components/analytics/reports/MostProducedProducts";
import { MostProducedFlavors } from "@/components/analytics/reports/MostProducedFlavors";
import { MostProducedModels } from "@/components/analytics/reports/MostProducedModels";
import { MostProducedSizes } from "@/components/analytics/reports/MostProducedSizes";
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
import { TotalProductionByProductBoxes } from "@/components/analytics/reports/TotalProductionByProductBoxes";
import { ProductionByFlavorBoxes } from "@/components/analytics/reports/ProductionByFlavorBoxes";
import { ProductionByModelBoxes } from "@/components/analytics/reports/ProductionByModelBoxes";
import { ProductionBySizeBoxes } from "@/components/analytics/reports/ProductionBySizeBoxes";
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
import { MostProducedBoxes } from "@/components/analytics/reports/MostProducedBoxes";
import { useStopsIndicators } from "@/hooks/useStopsIndicators";
import { StopsByLine } from "@/components/analytics/reports/StopsByLine";
import { QualityDeviationStops } from "@/components/analytics/reports/QualityDeviationStops";
import { RawMaterialStops } from "@/components/analytics/reports/RawMaterialStops";
import { useProductionIndicators } from "@/hooks/useProductionIndicators";
import { ProductionEfficiency } from "@/components/analytics/reports/ProductionEfficiency";
import { EfficiencyByLine } from "@/components/analytics/reports/EfficiencyByLine";
import { EfficiencyByShift } from "@/components/analytics/reports/EfficiencyByShift";
import { HourlyProductionEfficiency } from '@/components/analytics/reports/HourlyProductionEfficiency';
import RealVsPlannedTime from "@/components/analytics/reports/RealVsPlannedTime";
import RealVsPlannedTimeByLine from "@/components/analytics/reports/RealVsPlannedTimeByLine";
import RealVsPlannedTimeByShift from "@/components/analytics/reports/RealVsPlannedTimeByShift";
import RealVsPlannedTimeByOperator from "@/components/analytics/reports/RealVsPlannedTimeByOperator";
import { PlannedVsProducedBoxesByLineChief } from "@/components/analytics/reports/PlannedVsProducedBoxesByLineChief";
import { PlannedVsProducedBoxesByLine } from "@/components/analytics/reports/PlannedVsProducedBoxesByLine";
import { PlannedVsProducedBoxesByShift } from "@/components/analytics/reports/PlannedVsProducedBoxesByShift";
import { ProductionHeatmapByDay } from "@/components/analytics/reports/ProductionHeatmapByDay";
import { ProductionHeatmapByHour } from "@/components/analytics/reports/ProductionHeatmapByHour";
import { ReportBuilder } from "@/components/analytics/reports/ReportBuilder";
import { ReportViewer } from "@/components/analytics/reports/ReportViewer";

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
    totalBoxes: totalProductBoxes, 
    productsComparison,
    flavorsComparison,
    modelsComparison,
    boxesComparison,
    isLoading: productsLoading 
  } = useProductsIndicators();

  const {
    totalStops,
    totalStopTime,
    stopsComparison,
    stopTimeComparison,
    isLoading: stopsLoading
  } = useStopsIndicators();

  const {
    totalBoxes,
    totalLiters,
    isLoading: productionLoading,
    error: productionError,
    averageEfficiency,
    averageHourlyEfficiency,
    timeEfficiency,
    timeInefficiency
  } = useProductionIndicators();

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
              Explorador de Reportes
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Enlaces rápidos a secciones */}
        <div className="flex flex-wrap gap-2 bg-white rounded-lg p-3 shadow-sm mb-4">
          <a href="#eficiencia" className="px-3 py-1.5 rounded-full bg-[#e8f6e9] text-sm font-medium hover:bg-[#d1f0d5] transition-colors">
            Eficiencia de Producción
          </a>
          <a href="#usuarios" className="px-3 py-1.5 rounded-full bg-[#f9e8f7] text-sm font-medium hover:bg-[#f5d6f0] transition-colors">
            Usuarios y Días
          </a>
          <a href="#productos" className="px-3 py-1.5 rounded-full bg-[#e2f1f8] text-sm font-medium hover:bg-[#cbe6f2] transition-colors">
            Productos
          </a>
          <a href="#paros" className="px-3 py-1.5 rounded-full bg-[#fff7e1] text-sm font-medium hover:bg-[#ffefc0] transition-colors">
            Paros
          </a>
        </div>

        <TabsContent value="strategic" className="space-y-4 mt-2">
          {/* Sección: Eficiencia de producción */}
          <div id="eficiencia" className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4 p-2 rounded-md bg-[#e8f6e9]">Eficiencia de Producción</h2>
            
            {/* Nuevas tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#e8f6e9] p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cumplimiento al Plan</span>
                </div>
                <div className="mt-2 flex items-center">
                  <span className="text-2xl font-bold text-green-700">{productionLoading ? '-' : `${(averageEfficiency * 100).toFixed(1)}%`}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                    Producción vs Plan
                  </span>
                </div>
              </div>
              
              <div className="bg-[#e8f6e9] p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Eficiencia Velocidad de Líneas</span>
                </div>
                <div className="mt-2 flex items-center">
                  <span className="text-2xl font-bold text-green-700">{productionLoading ? '-' : `${(averageHourlyEfficiency * 100).toFixed(1)}%`}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                    Cajas por Hora
                  </span>
                </div>
              </div>
              
              <div className="bg-[#e8f6e9] p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Eficiencia Tiempo de Producción</span>
                </div>
                <div className="mt-2 flex items-center">
                  {timeEfficiency < 0 ? (
                    <>
                      <span className="text-2xl font-bold text-green-700">
                        {productionLoading ? '-' : `${(timeEfficiency * -1).toFixed(1)}%`}
                      </span>
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Eficiencia
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-red-700">
                        {productionLoading ? '-' : `${timeInefficiency.toFixed(1)}%`}
                      </span>
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                        Ineficiencia
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* Eficiencia de Producción a lo largo del tiempo (ancho completo) */}
              <div className="col-span-1 md:col-span-2">
                <ProductionEfficiency />
              </div>
              
              {/* Línea 1 */}
              <RealVsPlannedTime />
              <HourlyProductionEfficiency />
              
              {/* Línea 2 */}
              <PlannedVsProducedBoxesByLine />
              <RealVsPlannedTimeByLine />
              
              {/* Línea 3 */}
              <PlannedVsProducedBoxesByShift />
              <RealVsPlannedTimeByShift />
            </div>
          </div>

          {/* Usuarios y Eficiencia */}
          <div id="usuarios" className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4 p-2 rounded-md bg-[#f9e8f7]">Usuarios y Días</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <PlannedVsProducedBoxesByLineChief />
              <RealVsPlannedTimeByOperator />
              <ProductionHeatmapByDay />
              <ProductionHeatmapByHour />
            </div>
          </div>

          {/* Productos */}
          <div id="productos" className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4 p-2 rounded-md bg-[#e2f1f8]">Productos</h2>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total litros producidos</span>
                  {productionLoading ? (
                    <div className="h-4 w-16 animate-pulse bg-blue-100 rounded"></div>
                  ) : productionError ? (
                    <span className="text-xs text-red-500">Error al cargar</span>
                  ) : null}
                </div>
                <div className="mt-2">
                  {productionLoading ? (
                    <div className="h-8 w-32 animate-pulse bg-blue-100 rounded"></div>
                  ) : productionError ? (
                    <span className="text-2xl font-bold text-red-500">Error</span>
                  ) : (
                    <span className="text-2xl font-bold">{totalLiters.toLocaleString()} L</span>
                  )}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total cajas producidas</span>
                  {productionLoading ? (
                    <div className="h-4 w-16 animate-pulse bg-blue-100 rounded"></div>
                  ) : productionError ? (
                    <span className="text-xs text-red-500">Error al cargar</span>
                  ) : null}
                </div>
                <div className="mt-2">
                  {productionLoading ? (
                    <div className="h-8 w-32 animate-pulse bg-blue-100 rounded"></div>
                  ) : productionError ? (
                    <span className="text-2xl font-bold text-red-500">Error</span>
                  ) : (
                    <span className="text-2xl font-bold">{totalBoxes.toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipos de productos producidos</span>
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <MostProducedProducts />
              </div>
              <MostProducedFlavors />
              <MostProducedModels />
              <MostProducedSizes />
              <MostProducedBoxes />
            </div>
          </div>

          {/* Sección: Paros */}
          <div id="paros" className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4 p-2 rounded-md bg-[#fff7e1]">Paros</h2>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
              <div className="bg-[#fff7e1] p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Paros</span>
                  <span className={cn(
                    "text-xs",
                    stopsComparison.isIncrease ? "text-red-600" : "text-green-600"
                  )}>
                    {stopsComparison.formattedPercentage}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{totalStops.toLocaleString("es-MX")}</span>
                </div>
              </div>

              <div className="bg-[#fff7e1] p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tiempo Total en Paros</span>
                  <span className={cn(
                    "text-xs",
                    stopTimeComparison.isIncrease ? "text-red-600" : "text-green-600"
                  )}>
                    {stopTimeComparison.formattedPercentage}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{totalStopTime.toLocaleString("es-MX")} min</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <StopsByType />
                <StopsByLine />
              </div>
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
              <h3 className="text-lg font-medium mt-6">Por Calidad</h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <QualityDeviationStops />
                <RawMaterialStops />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4 p-2 rounded-md bg-[#e2f1f8]">Explorador de Reportes Avanzado</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg shadow-sm">
                <ReportBuilder />
              </div>
              <div className="lg:col-span-3">
                <ReportViewer />
              </div>
            </div>
          </div>
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