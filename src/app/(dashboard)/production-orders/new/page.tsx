import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProductionOrderForm from "@/components/production-orders/production-order-form";

export const metadata = {
  title: "Nueva Orden de Producción | Tehuacán Brillante",
  description: "Crear una nueva orden de producción para las líneas de embotellado",
};

export default function NewProductionOrderPage() {
  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center mb-2">
        <Link href="/production-orders">
          <Button variant="ghost" size="sm" className="flex items-center h-8 px-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>
      
      <div className="bg-white rounded-md border shadow-sm p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-black mb-6">Nueva Orden de Producción</h1>
        <ProductionOrderForm />
      </div>
    </div>
  );
} 