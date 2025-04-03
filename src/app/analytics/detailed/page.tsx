import { ProductionOrdersHistory } from "@/components/analytics/detailed-reports/ProductionOrdersHistory";
import { ProductionByHour } from "@/components/analytics/detailed-reports/ProductionByHour";
import { ProductionByLine } from "@/components/analytics/detailed-reports/ProductionByLine";
import { StopsRegistry } from "@/components/analytics/detailed-reports/StopsRegistry";

export default function DetailedReportsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Reportes Detallados</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Producción</h2>
          <div className="space-y-6">
            <ProductionOrdersHistory />
            <ProductionByHour />
            <ProductionByLine />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Paros</h2>
          <div className="space-y-6">
            <StopsRegistry />
          </div>
        </section>
      </div>
    </div>
  );
} 