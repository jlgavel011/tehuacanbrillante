import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Clock, Package2, Triangle, AlertCircle, Settings, TestTube } from "lucide-react";
import { LineaProduccionLiveInfo } from "@/hooks/useLiveData";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface LineaProduccionCardProps {
  lineaData: LineaProduccionLiveInfo;
}

export function LineaProduccionCard({ lineaData }: LineaProduccionCardProps) {
  const isActive = lineaData.estado === "activo";
  
  // Format time display (hours and minutes)
  const formatTime = (timeInHours: number) => {
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  if (!isActive) {
    return (
      <Card className="shadow-md bg-yellow-50 h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold flex items-center">
              {lineaData.nombre}
              <Badge variant="outline" className="ml-2 bg-yellow-200 text-yellow-800">
                <span className="mr-1 inline-block w-2 h-2 rounded-full bg-yellow-400"></span>
                Inactiva
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-center text-yellow-600">
            <Triangle className="w-10 h-10 mb-4" />
            <p className="text-lg font-medium">Sin producción activa</p>
            <p className="text-sm mt-2 text-gray-500">Esta línea no tiene órdenes de producción en proceso</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Extract needed data for active production line
  const { ordenProduccion, datosActuales } = lineaData;
  
  if (!ordenProduccion) {
    return null; // This shouldn't happen but for type safety
  }
  
  // Calculate progress percentage
  const progressPorcentaje = (ordenProduccion.cajasProducidas / ordenProduccion.cajasPlanificadas) * 100;
  
  return (
    <Card className="shadow-md bg-white h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center">
            {lineaData.nombre}
            <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
              <span className="mr-1 inline-block w-2 h-2 rounded-full bg-green-500"></span>
              Activa
            </Badge>
          </CardTitle>
        </div>
        <div className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-x-4">
          <div className="font-medium">{ordenProduccion.producto.nombre}</div>
          <div className="text-xs flex flex-wrap gap-2 mt-1">
            <span>Modelo: {ordenProduccion.producto.modelo}</span>
            <span>Sabor: {ordenProduccion.producto.sabor}</span>
            <span>Tamaño: {ordenProduccion.producto.tamaño}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Datos globales de la orden */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="text-md font-semibold mb-3 text-blue-800 border-b border-blue-100 pb-1">Datos Globales de la Orden</h3>
          
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Número de Orden</p>
              <p className="font-medium text-lg">{ordenProduccion.numeroOrden}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Cajas Producidas</p>
              <p className="font-medium text-lg">{ordenProduccion.cajasProducidas.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Cajas Planificadas</p>
              <p className="font-medium text-lg">{ordenProduccion.cajasPlanificadas.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Unidades por Caja</p>
              <p className="font-medium text-lg">{ordenProduccion.producto.unidadesPorCaja}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Progreso Total de la Orden</span>
              <span className={`${progressPorcentaje >= 100 ? 'text-green-600' : 'text-blue-600'} font-medium`}>
                {progressPorcentaje.toFixed(1)}%
              </span>
            </div>
            <Progress value={progressPorcentaje} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Tiempo Planeado</p>
              <p className="font-medium text-md flex items-center">
                <Clock className="w-4 h-4 mr-1 text-blue-500" />
                {ordenProduccion.tiempoPlan ? formatTime(ordenProduccion.tiempoPlan) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tiempo Transcurrido Total</p>
              <p className={`font-medium text-md flex items-center ${ordenProduccion.tiempoTranscurrido > (ordenProduccion.tiempoPlan || 0) ? 'text-red-600' : ''}`}>
                <Clock className={`w-4 h-4 mr-1 ${ordenProduccion.tiempoTranscurrido > (ordenProduccion.tiempoPlan || 0) ? 'text-red-500' : 'text-blue-500'}`} />
                {formatTime(ordenProduccion.tiempoTranscurrido)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Datos en vivo (última apertura) */}
        {datosActuales && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold mb-3 text-green-800 border-b border-green-100 pb-1 flex justify-between items-end">
              <span>Datos en Vivo</span>
              <span className="text-xs font-normal">
                {datosActuales.activo ? 
                  <Badge className="bg-green-100 text-green-800">Sesión Activa</Badge> : 
                  <Badge className="bg-amber-100 text-amber-800">Última Sesión</Badge>
                }
              </span>
            </h3>
            <div className="text-xs text-gray-600 mb-3">
              Desde {formatDistanceToNow(new Date(datosActuales.fechaInicio), { addSuffix: true, locale: es })}
            </div>
            
            {/* Paros */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
              <div className="bg-white p-3 rounded shadow-sm">
                <p className="text-xs text-red-500 flex items-center mb-1">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Paros Totales
                </p>
                <p className="font-medium text-lg">
                  {datosActuales.parosTotales.cantidad}
                  <span className="text-xs text-gray-500 ml-1">
                    ({datosActuales.parosTotales.tiempo} min)
                  </span>
                </p>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <p className="text-xs text-orange-500 flex items-center mb-1">
                  <Settings className="w-3 h-3 mr-1" />
                  Mantenimiento
                </p>
                <p className="font-medium text-lg">
                  {datosActuales.parosMantenimiento.cantidad}
                  <span className="text-xs text-gray-500 ml-1">
                    ({datosActuales.parosMantenimiento.tiempo} min)
                  </span>
                </p>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <p className="text-xs text-purple-500 flex items-center mb-1">
                  <Package2 className="w-3 h-3 mr-1" />
                  Operación
                </p>
                <p className="font-medium text-lg">
                  {datosActuales.parosOperacion.cantidad}
                  <span className="text-xs text-gray-500 ml-1">
                    ({datosActuales.parosOperacion.tiempo} min)
                  </span>
                </p>
              </div>

              <div className="bg-white p-3 rounded shadow-sm">
                <p className="text-xs text-blue-500 flex items-center mb-1">
                  <TestTube className="w-3 h-3 mr-1" />
                  Calidad
                </p>
                <p className="font-medium text-lg">
                  {datosActuales.parosCalidad.cantidad}
                  <span className="text-xs text-gray-500 ml-1">
                    ({datosActuales.parosCalidad.tiempo} min)
                  </span>
                </p>
              </div>
            </div>
            
            <Separator className="my-3" />
            
            {/* Rendimiento actual */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Cajas desde apertura</p>
                <p className="font-medium text-lg">{datosActuales.cajasProducidas.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Tiempo desde apertura</p>
                <p className="font-medium text-lg">{formatTime(datosActuales.tiempoTranscurrido)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Promedio actual</p>
                <p className="font-medium text-lg">{Math.round(datosActuales.promedioCajasActual)} cajas/h</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Promedio planeado</p>
                <p className="font-medium text-lg">{Math.round(datosActuales.promedioPlanificado)} cajas/h</p>
              </div>
            </div>
            
            {/* Indicadores de eficiencia */}
            <div className="bg-white p-3 rounded shadow-sm mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Rendimiento vs Plan</span>
                <Badge className={`text-sm px-3 py-1 ${
                  datosActuales.comparacionPromedio >= 1 
                    ? "bg-green-100 text-green-800" 
                    : datosActuales.comparacionPromedio >= 0.8
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}>
                  {formatPercentage(datosActuales.comparacionPromedio)}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tiempo est. para terminar</p>
                <p className="font-medium text-md">{formatTime(datosActuales.tiempoEstimadoRestante)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Tiempo faltante vs plan</p>
                <p className={`font-medium text-md ${datosActuales.tiempoFaltanteVsPlan >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {datosActuales.tiempoFaltanteVsPlan >= 0 ? '+' : ''}
                  {formatTime(Math.abs(datosActuales.tiempoFaltanteVsPlan))}
                </p>
              </div>
            </div>
            
            <div className="text-sm text-right mt-4 font-medium">
              Jefe: {datosActuales.jefeProduccion}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 