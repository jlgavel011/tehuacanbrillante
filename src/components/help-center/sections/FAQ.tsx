import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Info, FileStack, Settings, Code } from "lucide-react";

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
              <Info className="h-5 w-5 text-blue-500" />
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

            <AccordionItem value="item-3" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Cómo puedo cambiar mi contraseña?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                Para cambiar su contraseña:
                <ol className="list-decimal pl-6 mt-2">
                  <li>Haga clic en su perfil en la esquina superior derecha</li>
                  <li>Seleccione "Configuración de cuenta"</li>
                  <li>En la sección "Seguridad", haga clic en "Cambiar contraseña"</li>
                  <li>Ingrese su contraseña actual</li>
                  <li>Ingrese y confirme su nueva contraseña</li>
                  <li>Haga clic en "Guardar cambios"</li>
                </ol>
                Su nueva contraseña debe tener al menos 8 caracteres e incluir letras, números y caracteres especiales para mayor seguridad.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Es posible personalizar mi dashboard?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                Sí, puede personalizar su dashboard según sus necesidades:
                <ul className="list-disc pl-6 mt-2">
                  <li>Haga clic en el botón "Personalizar" en la esquina superior derecha del dashboard</li>
                  <li>Arrastre y suelte los widgets para reorganizarlos</li>
                  <li>Haga clic en el icono de configuración de cada widget para ajustar sus parámetros</li>
                  <li>Utilice el botón "Añadir widget" para incluir nuevos elementos</li>
                  <li>Los widgets que no necesite pueden minimizarse o eliminarse</li>
                </ul>
                Los cambios se guardarán automáticamente y persistirán entre sesiones para su cuenta.
              </AccordionContent>
            </AccordionItem>
          </div>
          
          {/* Preguntas sobre producción */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FileStack className="h-5 w-5 text-green-500" />
              Producción y Órdenes
            </h2>
            
            <AccordionItem value="item-5" className="border-b border-gray-200 py-2">
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
            
            <AccordionItem value="item-6" className="border-b border-gray-200 py-2">
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
            
            <AccordionItem value="item-7" className="border-b border-gray-200 py-2">
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

            <AccordionItem value="item-8" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Cómo puedo ver el historial de paros de una línea de producción?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                Para ver el historial de paros de una línea específica:
                <ol className="list-decimal pl-6 mt-2">
                  <li>Vaya a la sección "Líneas de Producción"</li>
                  <li>Seleccione la línea de producción que desea analizar</li>
                  <li>Haga clic en la pestaña "Historial de Paros"</li>
                  <li>Utilice los filtros disponibles para definir el período de tiempo</li>
                  <li>Puede filtrar por tipo de paro, duración o impacto</li>
                </ol>
                Esta información es útil para identificar patrones y problemas recurrentes que puedan necesitar mantenimiento preventivo.
              </AccordionContent>
            </AccordionItem>
          </div>
          
          {/* Preguntas sobre análisis */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-500" />
              Análisis y Reportes
            </h2>
            
            <AccordionItem value="item-9" className="border-b border-gray-200 py-2">
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
            
            <AccordionItem value="item-10" className="border-b border-gray-200 py-2">
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

            <AccordionItem value="item-11" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Puedo programar informes automatizados?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                Sí, puede programar informes para que se generen y envíen automáticamente:
                <ol className="list-decimal pl-6 mt-2">
                  <li>Vaya a la sección "Análisis" &gt; "Informes Programados"</li>
                  <li>Haga clic en "Crear Nuevo Informe Programado"</li>
                  <li>Seleccione el tipo de informe que desea programar</li>
                  <li>Configure los parámetros y filtros necesarios</li>
                  <li>Defina la frecuencia (diaria, semanal, mensual)</li>
                  <li>Especifique los destinatarios del correo electrónico</li>
                  <li>Establezca un asunto y mensaje personalizado (opcional)</li>
                  <li>Haga clic en "Guardar y Activar"</li>
                </ol>
                Los informes se generarán y enviarán automáticamente según la programación establecida, incluso si no está conectado al sistema.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Cómo puedo comparar el rendimiento entre diferentes líneas?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                Para comparar el rendimiento entre diferentes líneas de producción:
                <ol className="list-decimal pl-6 mt-2">
                  <li>Vaya a la sección "Análisis" &gt; "Comparativa de Rendimiento"</li>
                  <li>Seleccione "Líneas de Producción" en el menú desplegable</li>
                  <li>Elija las líneas que desea comparar (máximo 5 para mejor visualización)</li>
                  <li>Establezca el período de tiempo para la comparación</li>
                  <li>Seleccione las métricas de rendimiento (eficiencia, productividad, tiempo de actividad, etc.)</li>
                  <li>Haga clic en "Generar Comparativa"</li>
                </ol>
                El sistema mostrará gráficos comparativos que le permitirán identificar fácilmente qué líneas tienen mejor rendimiento y en qué aspectos específicos.
              </AccordionContent>
            </AccordionItem>
          </div>

          {/* Preguntas sobre soporte técnico */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Code className="h-5 w-5 text-amber-500" />
              Soporte Técnico
            </h2>
            
            <AccordionItem value="item-13" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Cómo puedo reportar un error en la plataforma?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                Para reportar un error técnico:
                <ol className="list-decimal pl-6 mt-2">
                  <li>Haga clic en el icono de soporte (?) en la esquina inferior derecha</li>
                  <li>Seleccione "Reportar un problema"</li>
                  <li>Complete el formulario con la siguiente información:
                    <ul className="list-disc pl-6 mt-1">
                      <li>Descripción detallada del error</li>
                      <li>Pasos para reproducir el problema</li>
                      <li>Capturas de pantalla si es posible</li>
                      <li>Información sobre su navegador y sistema</li>
                    </ul>
                  </li>
                  <li>Haga clic en "Enviar reporte"</li>
                </ol>
                Nuestro equipo de soporte técnico revisará su reporte y se pondrá en contacto con usted si se requiere información adicional.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-14" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Cómo puedo solicitar una nueva funcionalidad?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                Para solicitar una nueva funcionalidad:
                <ol className="list-decimal pl-6 mt-2">
                  <li>Haga clic en el icono de soporte (?) en la esquina inferior derecha</li>
                  <li>Seleccione "Solicitar nueva funcionalidad"</li>
                  <li>Complete el formulario detallando:
                    <ul className="list-disc pl-6 mt-1">
                      <li>Descripción de la funcionalidad deseada</li>
                      <li>Justificación y beneficios esperados</li>
                      <li>Usuarios/departamentos que se beneficiarían</li>
                      <li>Urgencia o prioridad sugerida</li>
                    </ul>
                  </li>
                  <li>Haga clic en "Enviar solicitud"</li>
                </ol>
                Las solicitudes de nuevas funcionalidades son revisadas por nuestro equipo de producto durante las reuniones trimestrales de planificación. Las mejoras aprobadas se incorporan al plan de desarrollo según su prioridad.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-15" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Qué debo hacer si la plataforma está lenta o inaccesible?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                Si experimenta problemas de rendimiento:
                <ol className="list-decimal pl-6 mt-2">
                  <li>Verifique su conexión a internet</li>
                  <li>Intente recargar la página (Ctrl+F5)</li>
                  <li>Borre la caché del navegador y las cookies</li>
                  <li>Intente acceder desde otro navegador</li>
                  <li>Si el problema persiste, contacte a soporte técnico a través de:
                    <ul className="list-disc pl-6 mt-1">
                      <li>Teléfono de soporte: (55) 1234-5678</li>
                      <li>Correo: soporte@tehuacanbrillante.com</li>
                      <li>Chat en vivo (horario: 8:00 a 18:00, lunes a viernes)</li>
                    </ul>
                  </li>
                </ol>
                Para problemas críticos fuera del horario regular, contamos con soporte de emergencia 24/7 al (55) 8765-4321.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-16" className="border-b border-gray-200 py-2">
              <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                ¿Con qué frecuencia se actualiza la plataforma?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2 pl-4">
                La plataforma Tehuacán Brillante sigue un calendario de actualizaciones regular:
                <ul className="list-disc pl-6 mt-2">
                  <li><strong>Actualizaciones menores (correcciones):</strong> Semanales, generalmente aplicadas durante mantenimientos nocturnos los martes</li>
                  <li><strong>Actualizaciones de funcionalidad:</strong> Mensuales, implementadas el último domingo de cada mes</li>
                  <li><strong>Actualizaciones mayores:</strong> Trimestrales, con nuevas capacidades significativas</li>
                </ul>
                Antes de cada actualización mayor, enviamos un correo informativo detallando las nuevas funcionalidades y cambios importantes. Para actualizaciones que requieran capacitación, organizamos sesiones de formación virtual con al menos una semana de anticipación.
              </AccordionContent>
            </AccordionItem>
          </div>
        </Accordion>
      </div>
    </div>
  );
} 