import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Introduction() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Bienvenido al Centro de Ayuda</h1>
        <p className="mt-2 text-gray-600">
          Esta guía le ayudará a sacar el máximo provecho de la plataforma de gestión de producción Tehuacán Brillante.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Acerca de la Plataforma</h2>
        <p className="text-gray-600">
          Tehuacán Brillante es un sistema integral diseñado para optimizar la gestión de producción, 
          permitiéndole administrar líneas de producción, crear órdenes, monitorear el progreso en tiempo real 
          y generar análisis detallados para la toma de decisiones estratégicas.
        </p>

        <Alert className="my-4">
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Para aprovechar al máximo esta plataforma, le recomendamos explorar cada sección de este Centro de Ayuda. 
            Hemos incluido guías detalladas, tutoriales y consejos específicos para cada módulo.
          </AlertDescription>
        </Alert>

        <h3 className="text-xl font-semibold text-gray-800 mt-6">La Importancia de los Datos Precisos</h3>
        <p className="text-gray-600">
          Para obtener el máximo valor de la plataforma, es esencial:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-600">
          <li>
            <strong>Mantener consistencia en la nomenclatura</strong> - Use nombres descriptivos y consistentes para productos, 
            líneas de producción, sistemas y demás elementos.
          </li>
          <li>
            <strong>Asignar detalladamente las materias primas</strong> - Cuanto más detallada sea la información sobre 
            materias primas, mejor será la capacidad de rastrear problemas de calidad.
          </li>
          <li>
            <strong>Configurar correctamente las velocidades de producción</strong> - Las velocidades precisas son cruciales 
            para calcular correctamente la eficiencia.
          </li>
          <li>
            <strong>Registrar correctamente los paros de producción</strong> - Esto permitirá identificar áreas de mejora y 
            oportunidades para optimizar procesos.
          </li>
        </ul>

        <Alert variant="destructive" className="my-4">
          <AlertTitle>Precaución con la eliminación de datos</AlertTitle>
          <AlertDescription>
            Algunas acciones no pueden deshacerse, como la eliminación de líneas de producción o productos. 
            Antes de eliminar cualquier dato, asegúrese de que ya no es necesario para su operación.
          </AlertDescription>
        </Alert>

        <h3 className="text-xl font-semibold text-gray-800 mt-6">Capacitación del Personal</h3>
        <p className="text-gray-600">
          Es sumamente importante capacitar adecuadamente a los jefes de línea y demás personal que utilizará 
          la plataforma. Ellos son responsables de:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-600">
          <li>Registrar correctamente la producción diaria</li>
          <li>Documentar adecuadamente los paros y sus causas</li>
          <li>Verificar que los datos ingresados sean precisos</li>
          <li>Reportar cualquier discrepancia o problema con la plataforma</li>
        </ul>
        <p className="text-gray-600 mt-4">
          Una capacitación efectiva garantizará que los datos recopilados sean confiables, lo que a su vez 
          permitirá generar análisis atinados y de valor real para la toma de decisiones estratégicas.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mt-6">Estructura del Centro de Ayuda</h3>
        <p className="text-gray-600">
          Este centro de ayuda está organizado por módulos, siguiendo la misma estructura que la plataforma:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-600">
          <li>
            <strong>Dashboard</strong> - Visualización rápida de métricas clave y producción en tiempo real
          </li>
          <li>
            <strong>Órdenes</strong> - Creación y seguimiento de órdenes de producción
          </li>
          <li>
            <strong>Líneas de Producción</strong> - Configuración de líneas, sistemas, subsistemas y asociación con productos
          </li>
          <li>
            <strong>Productos</strong> - Creación y gestión de productos y sus atributos
          </li>
          <li>
            <strong>Analítica</strong> - Reportes estratégicos y explorador de datos
          </li>
          <li>
            <strong>Configuración</strong> - Administración de usuarios y roles
          </li>
          <li>
            <strong>Preguntas Frecuentes</strong> - Respuestas a dudas comunes
          </li>
        </ul>

        <p className="text-gray-600 mt-4">
          Utilice la barra de navegación para acceder a cada sección, o use el buscador para encontrar 
          rápidamente la información que necesita.
        </p>
      </div>
    </div>
  );
} 