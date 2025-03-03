import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import ProductionOrdersList from "@/components/production-orders/production-orders-list";

export const metadata = {
  title: "Órdenes de Producción | Tehuacán Brillante",
  description: "Gestión de órdenes de producción para las líneas de embotellado",
};

export default function ProductionOrdersPage() {
  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">Órdenes de Producción</h1>
        <Link href="/production-orders/new">
          <Button className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Orden
          </Button>
        </Link>
      </div>
      
      <ProductionOrdersList />
    </div>
  );
} 