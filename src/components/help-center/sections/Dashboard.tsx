import React from "react";
import { ArrowRight } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          El Dashboard proporciona una visualización rápida y eficiente de los datos clave de producción, 
          permitiéndole monitorear el desempeño en tiempo real.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">¿Qué puede visualizar en el Dashboard?</h2>
        
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Métricas Clave</h3>
          <ul className="list-disc pl-6 space-y-3 text-gray-600">
            <li>
              <strong>Producción Total</strong> - Número total de cajas producidas en el período seleccionado
            </li>
            <li>
              <strong>Eficiencia de Producción</strong> - Porcentaje que representa la producción real frente a la planificada
            </li>
            <li>
              <strong>Tiempo de Paros</strong> - Tiempo total perdido debido a paros de producción, desglosado por tipo
            </li>
            <li>
              <strong>Órdenes Activas</strong> - Número de órdenes de producción actualmente en proceso
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Gráficos de Producción</h3>
          <ul className="list-disc pl-6 space-y-3 text-gray-600">
            <li>
              <strong>Producción por Línea</strong> - Visualización comparativa de la producción entre diferentes líneas
            </li>
            <li>
              <strong>Eficiencia por Turno</strong> - Análisis de la eficiencia de producción desglosada por turnos
            </li>
            <li>
              <strong>Tendencia de Producción</strong> - Evolución de la producción a lo largo del tiempo
            </li>
            <li>
              <strong>Distribución de Paros</strong> - Desglose visual de los diferentes tipos de paros y su impacto
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Indicadores de Desempeño</h3>
          <ul className="list-disc pl-6 space-y-3 text-gray-600">
            <li>
              <strong>Top Productos</strong> - Los productos con mayor producción en el período
            </li>
            <li>
              <strong>Líneas más Eficientes</strong> - Ranking de líneas de producción según su eficiencia
            </li>
            <li>
              <strong>Desempeño de Jefes de Línea</strong> - Evaluación comparativa del desempeño de los jefes de línea
            </li>
            <li>
              <strong>Alertas de Calidad</strong> - Notificaciones sobre desviaciones significativas en calidad
            </li>
          </ul>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mt-8">¿Por qué es funcional el Dashboard?</h2>
        
        <div className="space-y-4 mt-4">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 text-blue-700 rounded-full p-1 mt-1">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Toma de Decisiones Rápida</h4>
              <p className="text-gray-600">
                Acceda instantáneamente a información crítica para tomar decisiones ágiles basadas en datos actualizados.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 text-blue-700 rounded-full p-1 mt-1">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Detección Temprana de Problemas</h4>
              <p className="text-gray-600">
                Identifique rápidamente desviaciones y problemas para poder abordarlos antes de que escalen.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 text-blue-700 rounded-full p-1 mt-1">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Visibilidad del Progreso</h4>
              <p className="text-gray-600">
                Mantenga a todos los involucrados informados sobre el estado actual de la producción y el cumplimiento de objetivos.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 text-blue-700 rounded-full p-1 mt-1">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Optimización de Recursos</h4>
              <p className="text-gray-600">
                Analice el rendimiento para identificar oportunidades de mejora y optimizar la asignación de recursos.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mt-8">Cómo utilizar el Dashboard</h2>
        
        <div className="space-y-3 mt-2">
          <p className="text-gray-600">
            El dashboard está diseñado para ser intuitivo y fácil de usar:
          </p>
          
          <ol className="list-decimal pl-6 space-y-3 text-gray-600">
            <li>
              <strong>Inicie sesión</strong> en la plataforma Tehuacán Brillante.
            </li>
            <li>
              El dashboard se carga automáticamente como pantalla principal. Alternativamente, puede hacer clic en 
              <strong> "Dashboard"</strong> en el menú de navegación lateral.
            </li>
            <li>
              Utilice los <strong>filtros de fecha</strong> en la parte superior para ajustar el período de tiempo visualizado.
            </li>
            <li>
              Haga clic en cualquier <strong>gráfico o indicador</strong> para obtener información más detallada.
            </li>
            <li>
              Use el botón <strong>"Actualizar"</strong> para obtener los datos más recientes en tiempo real.
            </li>
            <li>
              Utilice los <strong>filtros adicionales</strong> para enfocarse en líneas, productos o turnos específicos.
            </li>
          </ol>
          
          <p className="text-gray-600 mt-4">
            Para un análisis más profundo, puede hacer clic en cualquier métrica para acceder a informes más detallados
            o dirigirse a la sección de Analítica para generar reportes personalizados.
          </p>
        </div>
      </div>
    </div>
  );
} 