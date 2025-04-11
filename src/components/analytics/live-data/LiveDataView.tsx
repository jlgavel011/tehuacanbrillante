import { useLiveData } from "@/hooks/useLiveData";
import { LineaProduccionCard } from "./LineaProduccionCard";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function LiveDataView() {
  const { data: lineasProduccion, isLoading, error, refresh } = useLiveData(30000); // Refresh every 30 seconds
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-md">
              <Skeleton className="h-8 w-1/2 mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No se pudieron cargar los datos en vivo de las líneas de producción
          <div className="mt-2">
            <Button size="sm" onClick={refresh} variant="outline" className="gap-1">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (lineasProduccion.length === 0) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Sin datos</AlertTitle>
        <AlertDescription>
          No se encontraron líneas de producción en el sistema
        </AlertDescription>
      </Alert>
    );
  }
  
  // Group lines by status
  const lineasActivas = lineasProduccion.filter(linea => linea.estado === "activo");
  const lineasInactivas = lineasProduccion.filter(linea => linea.estado === "inactivo");
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Datos en Vivo</h2>
        <Button variant="outline" size="sm" onClick={refresh} className="gap-1">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>
      
      {lineasActivas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-md font-medium">Líneas Activas ({lineasActivas.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lineasActivas.map(linea => (
              <LineaProduccionCard key={linea.id} lineaData={linea} />
            ))}
          </div>
        </div>
      )}
      
      {lineasInactivas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-md font-medium">Líneas Inactivas ({lineasInactivas.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lineasInactivas.map(linea => (
              <LineaProduccionCard key={linea.id} lineaData={linea} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 