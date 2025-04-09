import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FAQ() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Preguntas Frecuentes (FAQ)</h1>
        <p className="mt-2 text-gray-600">
          Encuentre respuestas a las preguntas más comunes sobre la plataforma Tehuacán Brillante.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <Accordion type="single" collapsible className="space-y-4">
          
          {/* Preguntas generales */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              Preguntas Generales
            </h2>
            
            <AccordionItem value="item-1" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Qué es Tehuacán Brillante?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                Tehuacán Brillante es una plataforma de gestión de producción diseñada específicamente para 
                optimizar y controlar los procesos productivos de la embotelladora. La plataforma permite 
                administrar líneas de producción, crear y dar seguimiento a órdenes de producción, gestionar 
                productos y materias primas, y generar reportes analíticos detallados.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Qué navegadores son compatibles con la plataforma?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                La plataforma es compatible con los navegadores web modernos, incluyendo:
                <ul className="list-disc pl-6 mt-2">
                  <li>Google Chrome (recomendado) - versión 90 o superior</li>
                  <li>Mozilla Firefox - versión 88 o superior</li>
                  <li>Microsoft Edge - versión 90 o superior</li>
                  <li>Safari - versión 14 o superior</li>
                </ul>
                Para una mejor experiencia, recomendamos mantener su navegador actualizado a la última versión.
              </AccordionContent>
            </AccordionItem>
          </div>
          
          {/* Preguntas sobre producción */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-green-500" />
              Producción y Órdenes
            </h2>
            
            <AccordionItem value="item-3" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Cómo puedo saber si una orden está retrasada?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                Las órdenes retrasadas se identifican fácilmente de varias maneras:
                <ul className="list-disc pl-6 mt-2">
                  <li>En el Dashboard, las órdenes retrasadas aparecen en la sección "Alertas" con un indicador rojo</li>
                  <li>En la vista de Lista de Órdenes, las órdenes retrasadas tienen un indicador de estado rojo</li>
                  <li>Al abrir una orden, verá un banner de advertencia si está retrasada</li>
                  <li>En los reportes, puede filtrar específicamente las órdenes retrasadas</li>
                </ul>
                Una orden se considera retrasada cuando su progreso real es menor al progreso esperado según la 
                fecha de entrega planificada.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Puedo modificar una orden de producción en curso?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                Sí, es posible modificar ciertos aspectos de una orden en curso, dependiendo de su rol y del 
                estado de la orden:
                <ul className="list-disc pl-6 mt-2">
                  <li>Puede ajustar la fecha de entrega</li>
                  <li>Puede aumentar o disminuir la cantidad total a producir</li>
                  <li>Puede actualizar la prioridad de la orden</li>
                  <li>Puede agregar comentarios o notas adicionales</li>
                </ul>
                Sin embargo, no es posible cambiar el producto asignado o la línea de producción una vez que 
                la orden está en progreso. Para estos cambios, sería necesario cancelar la orden actual y 
                crear una nueva.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Cómo registro un paro no planificado?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                Para registrar un paro no planificado:
                <ol className="list-decimal pl-6 mt-2">
                  <li>Navegue a la orden de producción afectada</li>
                  <li>Haga clic en el botón "Registrar Paro"</li>
                  <li>Seleccione el tipo de paro (mecánico, eléctrico, etc.)</li>
                  <li>Si es un paro de calidad, seleccione la materia prima afectada</li>
                  <li>Indique la hora de inicio y duración estimada</li>
                  <li>Agregue una descripción detallada del problema</li>
                  <li>Haga clic en "Guardar"</li>
                </ol>
                Cuando el paro finalice, deberá actualizar el registro indicando la hora de finalización 
                y cualquier acción correctiva implementada.
              </AccordionContent>
            </AccordionItem>
          </div>
          
          {/* Preguntas sobre análisis */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-purple-500" />
              Análisis y Reportes
            </h2>
            
            <AccordionItem value="item-6" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Cómo puedo exportar un reporte a Excel?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                Para exportar un reporte a Excel (formato CSV):
                <ol className="list-decimal pl-6 mt-2">
                  <li>Navegue a la sección "Análisis"</li>
                  <li>Seleccione el reporte que desee exportar</li>
                  <li>Configure los filtros y parámetros según necesite</li>
                  <li>Haga clic en el botón "Exportar" en la esquina superior derecha</li>
                  <li>Seleccione "CSV" en el menú desplegable</li>
                  <li>El archivo se descargará automáticamente a su dispositivo</li>
                </ol>
                Tenga en cuenta que algunos reportes muy extensos pueden tardar unos momentos en generarse y descargarse.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Cómo calcula el sistema la eficiencia de producción?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                El sistema calcula la eficiencia de producción utilizando la siguiente fórmula:
                <div className="bg-gray-50 p-3 rounded my-2 font-mono text-sm">
                  Eficiencia = (Producción Real / Producción Teórica) × 100%
                </div>
                Donde:
                <ul className="list-disc pl-6 mt-2">
                  <li><strong>Producción Real</strong>: Cantidad de cajas producidas durante el período</li>
                  <li><strong>Producción Teórica</strong>: Cantidad que debería haberse producido basado en:
                    <ul className="list-circle pl-6 mt-1">
                      <li>Velocidad nominal de la línea (cajas/hora)</li>
                      <li>Tiempo operativo (excluyendo paros planificados)</li>
                      <li>Factor de eficiencia estándar para el producto</li>
                    </ul>
                  </li>
                </ul>
                Esta métrica se presenta en los reportes estratégicos y puede desglosarse por línea, 
                producto o período de tiempo.
              </AccordionContent>
            </AccordionItem>
          </div>
        </Accordion>
      </div>
    </div>
  );
} 