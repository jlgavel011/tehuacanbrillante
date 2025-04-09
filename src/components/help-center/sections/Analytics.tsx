import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart4, PieChart, LineChart, FileDown, Filter, ChartBar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Analítica</h1>
        <p className="mt-2 text-gray-600">
          Descubra cómo utilizar las herramientas de análisis para obtener información valiosa sobre su producción.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Reportes y Análisis</h2>
        <p className="text-gray-600">
          El módulo de Analítica le ofrece reportes detallados y herramientas para analizar 
          el rendimiento de su producción, identificar tendencias y tomar decisiones basadas en datos.
        </p>

        {/* Contenido adicional se incluirá aquí en futuras actualizaciones */}
      </div>

      <Tabs defaultValue="strategic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="strategic">Reportes Estratégicos</TabsTrigger>
          <TabsTrigger value="explorer">Explorador de Reportes</TabsTrigger>
          <TabsTrigger value="download">Descargar Reportes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="strategic" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Reportes Estratégicos</h2>
          
          <p className="text-gray-600">
            Los reportes estratégicos son análisis predefinidos que abordan las necesidades más comunes 
            de información para la toma de decisiones, calculados automáticamente a partir de sus datos de producción.
          </p>
          
          <div className="space-y-6 mt-4">
            <div className="bg-white p-5 rounded-md border border-gray-200">
              <div className="flex items-start">
                <div className="bg-blue-50 p-2 rounded-full mr-4">
                  <BarChart4 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Reportes de Producción</h3>
                  <p className="text-gray-600 mt-1">
                    Análisis detallados del volumen de producción por diversos criterios.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-medium text-gray-800">Producción Total por Producto</h4>
                      <p className="text-sm text-gray-600">
                        Muestra el volumen total de producción desglosado por producto, en cajas y litros.
                        <br /><strong>Valor:</strong> Identificar productos con mayor volumen de producción.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Producción por Línea</h4>
                      <p className="text-sm text-gray-600">
                        Analiza el volumen de producción por cada línea de producción.
                        <br /><strong>Valor:</strong> Evaluar la utilización de capacidad por línea.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Producción por Sabor/Modelo/Tamaño</h4>
                      <p className="text-sm text-gray-600">
                        Desglosa la producción según los atributos de los productos.
                        <br /><strong>Valor:</strong> Identificar tendencias en la demanda de características específicas.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Producción Planificada vs. Real</h4>
                      <p className="text-sm text-gray-600">
                        Compara el volumen planificado con el realmente producido.
                        <br /><strong>Valor:</strong> Evaluar precisión de la planificación y cumplimiento de metas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-md border border-gray-200">
              <div className="flex items-start">
                <div className="bg-green-50 p-2 rounded-full mr-4">
                  <ChartBar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Reportes de Eficiencia</h3>
                  <p className="text-gray-600 mt-1">
                    Análisis de la eficiencia y desempeño productivo.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-medium text-gray-800">Eficiencia por Línea</h4>
                      <p className="text-sm text-gray-600">
                        Calcula la eficiencia de cada línea basada en producción real vs. capacidad.
                        <br /><strong>Cálculo:</strong> (Cajas producidas / (Velocidad × Tiempo operativo)) × 100%
                        <br /><strong>Valor:</strong> Identificar líneas con oportunidades de mejora.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Eficiencia por Turno</h4>
                      <p className="text-sm text-gray-600">
                        Compara la eficiencia entre los diferentes turnos de producción.
                        <br /><strong>Valor:</strong> Detectar variaciones de desempeño entre turnos.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Tiempo Real vs. Planificado</h4>
                      <p className="text-sm text-gray-600">
                        Analiza la diferencia entre el tiempo estimado y el tiempo real de producción.
                        <br /><strong>Valor:</strong> Mejorar la precisión de los tiempos estimados.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Desempeño de Jefes de Línea</h4>
                      <p className="text-sm text-gray-600">
                        Evalúa el desempeño comparativo entre diferentes jefes de línea.
                        <br /><strong>Valor:</strong> Identificar mejores prácticas y necesidades de capacitación.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-md border border-gray-200">
              <div className="flex items-start">
                <div className="bg-red-50 p-2 rounded-full mr-4">
                  <PieChart className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Reportes de Paros</h3>
                  <p className="text-gray-600 mt-1">
                    Análisis detallados de los paros de producción y sus causas.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-medium text-gray-800">Paros por Tipo</h4>
                      <p className="text-sm text-gray-600">
                        Distribución de los paros según su clasificación (mantenimiento, calidad, operacional).
                        <br /><strong>Valor:</strong> Identificar las principales categorías de paros.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Paros por Sistema</h4>
                      <p className="text-sm text-gray-600">
                        Analiza qué sistemas generan más tiempo de paro.
                        <br /><strong>Valor:</strong> Priorizar sistemas para mantenimiento preventivo.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Paros por Materia Prima</h4>
                      <p className="text-sm text-gray-600">
                        Identifica qué materias primas generan más problemas de calidad.
                        <br /><strong>Valor:</strong> Mejorar la selección de proveedores y materias primas.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Paros por Hora/Día</h4>
                      <p className="text-sm text-gray-600">
                        Analiza la distribución temporal de los paros.
                        <br /><strong>Valor:</strong> Identificar patrones temporales para intervenir proactivamente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Alert className="mt-6">
            <AlertDescription>
              Para obtener el máximo valor de estos reportes, es esencial mantener actualizada la información 
              de producción y asegurarse de que los paros se registren con precisión, indicando el sistema, 
              subsistema y tipo de paro correcto.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="explorer" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Explorador de Reportes</h2>
          
          <p className="text-gray-600">
            El Explorador de Reportes es una herramienta flexible que le permite crear reportes personalizados
            según sus necesidades específicas, con múltiples opciones de visualización y filtrado.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Crear un Reporte Personalizado</h3>
          
          <ol className="list-decimal pl-6 space-y-4 text-gray-600 mt-2">
            <li>
              <strong>Acceda al Explorador de Reportes</strong>
              <p className="mt-1">
                Haga clic en <strong>"Analítica"</strong> en el menú lateral y luego en la pestaña <strong>"Explorador de Reportes"</strong>.
              </p>
            </li>
            
            <li>
              <strong>Seleccione el Tipo de Datos</strong>
              <p className="mt-1">
                Elija el conjunto de datos base sobre el que desea construir su reporte:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li><strong>Producción</strong> - Datos de volumen de producción</li>
                <li><strong>Eficiencia</strong> - Métricas de desempeño y eficiencia</li>
                <li><strong>Paros</strong> - Información sobre paros y sus causas</li>
                <li><strong>Órdenes</strong> - Datos relacionados con órdenes de producción</li>
              </ul>
            </li>
            
            <li>
              <strong>Configure los Filtros</strong>
              <p className="mt-1">
                Utilice los filtros disponibles para delimitar los datos que desea analizar:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <h4 className="font-medium text-gray-800">Filtros Temporales</h4>
                  <ul className="list-disc pl-6 mt-1 text-sm">
                    <li>Rango de fechas</li>
                    <li>Turno específico</li>
                    <li>Día de la semana</li>
                    <li>Mes o trimestre</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Filtros de Entidades</h4>
                  <ul className="list-disc pl-6 mt-1 text-sm">
                    <li>Línea de producción</li>
                    <li>Producto específico</li>
                    <li>Sabor, modelo o tamaño</li>
                    <li>Jefe de línea</li>
                  </ul>
                </div>
              </div>
            </li>
            
            <li>
              <strong>Seleccione Dimensiones y Métricas</strong>
              <p className="mt-1">
                Elija qué datos desea ver y cómo desea agruparlos:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li><strong>Dimensiones</strong> - Cómo desea segmentar los datos (por producto, línea, fecha, etc.)</li>
                <li><strong>Métricas</strong> - Qué valores desea medir (cajas producidas, eficiencia, tiempo de paro, etc.)</li>
                <li><strong>Agregaciones</strong> - Cómo desea calcular los totales (suma, promedio, máximo, etc.)</li>
              </ul>
            </li>
            
            <li>
              <strong>Elija el Tipo de Visualización</strong>
              <p className="mt-1">
                Seleccione cómo desea visualizar los datos:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <div className="flex justify-center mb-2">
                    <ChartBar className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Gráfico de Barras</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <div className="flex justify-center mb-2">
                    <LineChart className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">Gráfico de Líneas</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <div className="flex justify-center mb-2">
                    <PieChart className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium">Gráfico de Pastel</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <div className="flex justify-center mb-2">
                    <Filter className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium">Tabla de Datos</span>
                </div>
              </div>
            </li>
            
            <li>
              <strong>Genere el Reporte</strong>
              <p className="mt-1">
                Haga clic en <strong>"Generar Reporte"</strong> para visualizar los resultados según los criterios seleccionados.
              </p>
            </li>
            
            <li>
              <strong>Interactúe con el Reporte</strong>
              <p className="mt-1">
                Una vez generado, puede:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Hacer clic en elementos del gráfico para filtrar o ver detalles</li>
                <li>Cambiar entre diferentes visualizaciones</li>
                <li>Ajustar filtros para refinar el análisis</li>
                <li>Descargar los datos o la visualización</li>
              </ul>
            </li>
          </ol>
          
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-6">
            <h3 className="text-lg font-semibold text-blue-800">Casos de Uso Comunes</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
              <li>
                <strong>Análisis de tendencias</strong> - Utilice gráficos de líneas para ver la evolución de la producción o eficiencia a lo largo del tiempo
              </li>
              <li>
                <strong>Comparaciones</strong> - Compare el desempeño entre diferentes líneas, productos o períodos con gráficos de barras
              </li>
              <li>
                <strong>Distribuciones</strong> - Analice la distribución de paros por tipo o sistema con gráficos de pastel
              </li>
              <li>
                <strong>Datos detallados</strong> - Exporte tablas completas para análisis más profundos en herramientas externas
              </li>
            </ul>
          </div>
        </TabsContent>
        
        <TabsContent value="download" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Descargar Reportes</h2>
          
          <p className="text-gray-600">
            La plataforma permite exportar reportes en diferentes formatos para compartirlos o realizar 
            análisis adicionales en otras herramientas.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Formatos Disponibles</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="bg-white p-5 rounded-md border border-gray-200">
              <div className="flex items-start">
                <div className="bg-green-50 p-2 rounded-full mr-4">
                  <FileDown className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">CSV (Valores Separados por Comas)</h4>
                  <p className="text-gray-600 mt-1">
                    Formato ideal para importar datos a hojas de cálculo como Excel, Google Sheets o herramientas 
                    de análisis de datos.
                  </p>
                  <h5 className="font-medium text-gray-700 mt-3">Cómo exportar a CSV:</h5>
                  <ol className="list-decimal pl-6 mt-1 text-sm">
                    <li>Genere el reporte deseado</li>
                    <li>Haga clic en el botón "Descargar" en la esquina superior derecha</li>
                    <li>Seleccione "CSV" del menú desplegable</li>
                    <li>El archivo se descargará automáticamente</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-md border border-gray-200">
              <div className="flex items-start">
                <div className="bg-red-50 p-2 rounded-full mr-4">
                  <FileDown className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">PDF (Documento Portátil)</h4>
                  <p className="text-gray-600 mt-1">
                    Formato ideal para compartir reportes visuales con gráficos y tablas en un formato listo para 
                    presentaciones e impresión.
                  </p>
                  <h5 className="font-medium text-gray-700 mt-3">Cómo exportar a PDF:</h5>
                  <ol className="list-decimal pl-6 mt-1 text-sm">
                    <li>Genere el reporte deseado</li>
                    <li>Asegúrese de que la visualización sea como desea que aparezca en el PDF</li>
                    <li>Haga clic en el botón "Descargar" en la esquina superior derecha</li>
                    <li>Seleccione "PDF" del menú desplegable</li>
                    <li>El archivo se generará y descargará automáticamente</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          
          <Alert className="mt-6">
            <AlertDescription>
              Los reportes descargados contienen datos según los permisos del usuario que los genera. 
              Asegúrese de que los destinatarios tengan la autorización adecuada para acceder a esa información.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
} 