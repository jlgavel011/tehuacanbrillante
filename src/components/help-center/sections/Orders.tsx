import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, ListChecks, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Orders() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Módulo de Órdenes de Producción</h1>
        <p className="mt-2 text-gray-600">
          El módulo de Órdenes de Producción le permite crear, gestionar y dar seguimiento a las órdenes de producción 
          en sus líneas de producción, facilitando la planificación y monitoreo de su proceso productivo.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">General</TabsTrigger>
          <TabsTrigger value="create">Crear Órdenes</TabsTrigger>
          <TabsTrigger value="track">Seguimiento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Descripción General</h2>
          
          <p className="text-gray-600">
            El módulo de Órdenes de Producción es una herramienta fundamental que le permite:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-2">
            <li>Programar la producción para cada línea</li>
            <li>Asignar productos específicos a cada orden</li>
            <li>Establecer metas de producción en cajas</li>
            <li>Monitorear el progreso en tiempo real</li>
            <li>Analizar la eficiencia de cada orden completada</li>
          </ul>
          
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-4">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center">
              <ListChecks className="h-5 w-5 mr-2" />
              Características Principales
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
              <li>
                <strong>Programación por fecha y turno</strong> - Asigne órdenes a días y turnos específicos para optimizar la utilización de recursos
              </li>
              <li>
                <strong>Validación de disponibilidad</strong> - El sistema verifica automáticamente que la línea seleccionada esté disponible para el período programado
              </li>
              <li>
                <strong>Filtrado inteligente de productos</strong> - Solo muestra productos compatibles con la línea de producción seleccionada
              </li>
              <li>
                <strong>Cálculo automático de tiempo estimado</strong> - Basado en la cantidad de cajas planificadas y la velocidad configurada
              </li>
              <li>
                <strong>Seguimiento del progreso</strong> - Visualice en tiempo real la producción actual vs. planificada
              </li>
            </ul>
          </div>
          
          <Alert className="mt-6">
            <AlertDescription>
              Para aprovechar al máximo este módulo, asegúrese de que todas sus líneas de producción estén correctamente 
              configuradas con sus sistemas, subsistemas y productos asociados.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="create" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Crear una Orden de Producción</h2>
          
          <p className="text-gray-600">
            Siga estos pasos para crear una nueva orden de producción:
          </p>
          
          <ol className="list-decimal pl-6 space-y-4 text-gray-600 mt-2">
            <li>
              <strong>Acceda al módulo de Órdenes</strong>
              <p className="mt-1">
                Haga clic en <strong>"Órdenes"</strong> en el menú de navegación lateral.
              </p>
            </li>
            
            <li>
              <strong>Inicie la creación</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"+ Nueva Orden"</strong> ubicado en la parte superior derecha de la pantalla.
              </p>
            </li>
            
            <li>
              <strong>Seleccione la línea de producción</strong>
              <p className="mt-1">
                En el formulario que aparece, use el menú desplegable para seleccionar la <strong>línea de producción</strong> donde se ejecutará la orden.
              </p>
            </li>
            
            <li>
              <strong>Seleccione el producto</strong>
              <p className="mt-1">
                Elija el <strong>producto</strong> a producir del menú desplegable. Solo se mostrarán productos previamente asociados a la línea seleccionada.
              </p>
              <div className="bg-yellow-50 p-2 rounded mt-1 text-sm">
                <strong>Nota:</strong> Si no ve el producto deseado, primero debe asociarlo a la línea en el módulo de Líneas de Producción.
              </div>
            </li>
            
            <li>
              <strong>Establezca la fecha y turno</strong>
              <p className="mt-1">
                Seleccione la <strong>fecha de producción</strong> utilizando el calendario y elija el <strong>turno</strong> (1, 2 o 3) en que se realizará.
              </p>
            </li>
            
            <li>
              <strong>Ingrese el número de orden</strong>
              <p className="mt-1">
                Escriba un <strong>número único de orden</strong> para su identificación. Este puede seguir la convención de su empresa.
              </p>
            </li>
            
            <li>
              <strong>Defina la cantidad planificada</strong>
              <p className="mt-1">
                Ingrese el número de <strong>cajas planificadas</strong> a producir durante esta orden.
              </p>
            </li>
            
            <li>
              <strong>Guarde la orden</strong>
              <p className="mt-1">
                Revise toda la información ingresada y haga clic en el botón <strong>"Crear Orden"</strong>.
              </p>
            </li>
          </ol>
          
          <div className="bg-green-50 p-4 rounded-md border border-green-100 mt-6 flex">
            <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-green-800">Resultado Esperado</h3>
              <p className="text-gray-700">
                Una vez creada, la orden aparecerá en la lista de órdenes activas. El sistema calculará automáticamente 
                el tiempo estimado de producción basado en la velocidad configurada para ese producto en esa línea.
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="track" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Seguimiento de Órdenes</h2>
          
          <p className="text-gray-600">
            Monitorear el progreso de sus órdenes de producción es clave para garantizar la eficiencia operativa:
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Visualización de Órdenes Activas</h3>
          
          <ol className="list-decimal pl-6 space-y-3 text-gray-600 mt-2">
            <li>
              <strong>Acceda a la lista de órdenes</strong>
              <p className="mt-1">
                Haga clic en <strong>"Órdenes"</strong> en el menú lateral para ver todas las órdenes.
              </p>
            </li>
            
            <li>
              <strong>Utilice los filtros</strong>
              <p className="mt-1">
                En la parte superior de la tabla de órdenes, use los filtros para:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Filtrar por <strong>estado</strong> (En espera, En proceso, Completada)</li>
                <li>Filtrar por <strong>rango de fechas</strong></li>
                <li>Filtrar por <strong>línea de producción</strong></li>
                <li>Filtrar por <strong>producto</strong></li>
              </ul>
            </li>
            
            <li>
              <strong>Visualice los detalles</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"Ver Detalles"</strong> o en la fila de cualquier orden para acceder a su información completa.
              </p>
            </li>
          </ol>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Detalles de la Orden</h3>
          
          <p className="text-gray-600">
            En la vista detallada de una orden, podrá:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-2">
            <li>
              <strong>Ver el estado actual</strong> - Indicado con un código de color (amarillo: en espera, verde: en proceso, azul: completada)
            </li>
            <li>
              <strong>Monitorear la producción en tiempo real</strong> - Cajas producidas vs. planificadas
            </li>
            <li>
              <strong>Revisar paros asociados</strong> - Lista de paros registrados durante esta orden
            </li>
            <li>
              <strong>Ver la eficiencia actual</strong> - Porcentaje calculado basado en la producción vs. tiempo utilizado
            </li>
            <li>
              <strong>Acceder al historial de actualizaciones</strong> - Registro de cambios y actualizaciones realizadas
            </li>
          </ul>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Actualización de Progreso</h3>
          
          <p className="text-gray-600">
            Para actualizar el progreso de una orden:
          </p>
          
          <ol className="list-decimal pl-6 space-y-3 text-gray-600 mt-2">
            <li>
              Dentro de la vista detallada de una orden, haga clic en el botón <strong>"Actualizar Progreso"</strong>
            </li>
            <li>
              Ingrese la <strong>cantidad actual de cajas producidas</strong>
            </li>
            <li>
              Si corresponde, agregue <strong>comentarios o notas</strong> sobre el avance
            </li>
            <li>
              Haga clic en <strong>"Guardar"</strong> para actualizar la información
            </li>
          </ol>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Cierre de Órdenes</h3>
          
          <p className="text-gray-600">
            Cuando una orden se ha completado:
          </p>
          
          <ol className="list-decimal pl-6 space-y-3 text-gray-600 mt-2">
            <li>
              Acceda a los detalles de la orden
            </li>
            <li>
              Haga clic en el botón <strong>"Completar Orden"</strong>
            </li>
            <li>
              Confirme los valores finales de producción
            </li>
            <li>
              Agregue cualquier <strong>comentario final</strong> o nota relevante
            </li>
            <li>
              Haga clic en <strong>"Confirmar"</strong> para marcar la orden como completada
            </li>
          </ol>
          
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-6">
            <h3 className="text-lg font-semibold text-blue-800">Análisis Post-Producción</h3>
            <p className="text-gray-700">
              Las órdenes completadas quedan disponibles en el módulo de Analítica, donde podrá generar reportes 
              detallados de eficiencia, comparativos de producción planificada vs. real, y análisis de paros asociados.
            </p>
          </div>
          
          <Alert className="mt-6">
            <AlertDescription>
              Las órdenes completadas permanecen visibles en el historial para su consulta y análisis, 
              lo que permite evaluar el desempeño histórico y realizar comparativas en los reportes analíticos.
            </AlertDescription>
          </Alert>
          
          <Alert className="mt-6">
            <AlertDescription>
              Recuerde que el registro detallado de paros es fundamental para el análisis posterior y la mejora 
              continua de sus procesos productivos. Incentive a los operadores a ser precisos en esta información.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
} 