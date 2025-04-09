import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Layers, Server, Settings, Database } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProductionLines() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Líneas de Producción</h1>
        <p className="mt-2 text-gray-600">
          Aprenda a gestionar sus líneas de producción, sistemas, subsistemas y productos asociados.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Gestión de Líneas de Producción</h2>
        <p className="text-gray-600">
          El módulo de Líneas de Producción le permite configurar y administrar todas las líneas de 
          producción de su embotelladora, junto con sus sistemas y subsistemas asociados.
        </p>

        {/* Contenido adicional se incluirá aquí en futuras actualizaciones */}
      </div>

      <Alert>
        <AlertTitle>Importante</AlertTitle>
        <AlertDescription>
          La correcta configuración de este módulo es fundamental para el funcionamiento óptimo de toda la plataforma. 
          Dedique el tiempo necesario para estructurar adecuadamente sus líneas de producción y sus componentes.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">General</TabsTrigger>
          <TabsTrigger value="lines">Líneas</TabsTrigger>
          <TabsTrigger value="systems">Sistemas</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="stops">Paros</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Estructura Jerárquica</h2>
          
          <p className="text-gray-600">
            El módulo de Líneas de Producción utiliza una estructura jerárquica de 4 niveles que permite mapear 
            con precisión todos los componentes de su planta productiva:
          </p>
          
          <div className="bg-white p-5 rounded-md border border-gray-200 mt-4">
            <div className="flex space-x-4 mb-6">
              <div className="w-1/4 bg-blue-50 p-3 rounded-md border border-blue-100 flex flex-col items-center">
                <Network className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Línea de Producción</span>
                <span className="text-xs text-gray-500 mt-1">Nivel 1</span>
              </div>
              <div className="w-1/4 bg-indigo-50 p-3 rounded-md border border-indigo-100 flex flex-col items-center">
                <Server className="h-8 w-8 text-indigo-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Sistema</span>
                <span className="text-xs text-gray-500 mt-1">Nivel 2</span>
              </div>
              <div className="w-1/4 bg-purple-50 p-3 rounded-md border border-purple-100 flex flex-col items-center">
                <Layers className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Subsistema</span>
                <span className="text-xs text-gray-500 mt-1">Nivel 3</span>
              </div>
              <div className="w-1/4 bg-pink-50 p-3 rounded-md border border-pink-100 flex flex-col items-center">
                <Settings className="h-8 w-8 text-pink-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Sub-subsistema</span>
                <span className="text-xs text-gray-500 mt-1">Nivel 4</span>
              </div>
            </div>
            
            <ul className="list-disc pl-6 space-y-3 text-gray-600">
              <li>
                <strong>Línea de Producción (Nivel 1)</strong>: Es la unidad principal que engloba todo el proceso productivo para un tipo específico de producto. 
                Ejemplo: "Línea de Agua 1"
              </li>
              <li>
                <strong>Sistema (Nivel 2)</strong>: Representa los principales sistemas que componen una línea de producción. 
                Ejemplo: "Sistema de Llenado", "Sistema de Empaque"
              </li>
              <li>
                <strong>Subsistema (Nivel 3)</strong>: Componentes específicos dentro de un sistema. 
                Ejemplo: "Enjuagadora", "Llenadora", "Etiquetadora"
              </li>
              <li>
                <strong>Sub-subsistema (Nivel 4)</strong>: Elementos individuales dentro de un subsistema. 
                Ejemplo: "Motor Principal", "Sensor de Nivel", "Bomba de Presión"
              </li>
            </ul>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Relaciones entre Componentes</h3>
          
          <p className="text-gray-600">
            La configuración de esta estructura permite:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-2">
            <li>Asignar productos específicos a líneas de producción</li>
            <li>Establecer velocidades de producción (cajas/hora) para cada producto en cada línea</li>
            <li>Mapear con precisión el origen de los paros de producción</li>
            <li>Generar análisis detallados para identificar puntos de mejora</li>
          </ul>
        </TabsContent>
        
        <TabsContent value="lines" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Crear y Gestionar Líneas de Producción</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-4">Crear una Nueva Línea de Producción</h3>
          
          <ol className="list-decimal pl-6 space-y-3 text-gray-600 mt-2">
            <li>
              <strong>Acceda al módulo de Líneas de Producción</strong>
              <p className="mt-1">
                Haga clic en <strong>"Líneas de Producción"</strong> en el menú de navegación lateral.
              </p>
            </li>
            
            <li>
              <strong>Seleccione la pestaña "Líneas"</strong>
              <p className="mt-1">
                En la parte superior de la página, haga clic en la pestaña <strong>"Líneas"</strong>.
              </p>
            </li>
            
            <li>
              <strong>Inicie la creación</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"+ Agregar línea"</strong> ubicado en la parte superior derecha de la tabla.
              </p>
            </li>
            
            <li>
              <strong>Ingrese la información</strong>
              <p className="mt-1">
                En el diálogo que aparece, ingrese el <strong>nombre</strong> de la línea de producción.
                Use un nombre descriptivo y fácil de identificar.
              </p>
            </li>
            
            <li>
              <strong>Guarde la línea</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"Guardar"</strong> para crear la nueva línea de producción.
              </p>
            </li>
          </ol>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Editar o Eliminar una Línea</h3>
          
          <ul className="list-disc pl-6 space-y-3 text-gray-600 mt-2">
            <li>
              <strong>Para editar:</strong> Haga clic en el ícono de lápiz junto a la línea que desea modificar, actualice el nombre y haga clic en "Actualizar".
            </li>
            <li>
              <strong>Para eliminar:</strong> Haga clic en el ícono de papelera junto a la línea que desea eliminar y confirme la acción.
              <div className="bg-yellow-50 p-2 rounded-md mt-1 text-sm">
                <strong>Precaución:</strong> Eliminar una línea también eliminará todos sus sistemas, subsistemas y sub-subsistemas asociados,
                así como las relaciones con productos. Esta acción no puede deshacerse.
              </div>
            </li>
          </ul>
        </TabsContent>
        
        <TabsContent value="systems" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Gestionar Sistemas, Subsistemas y Sub-subsistemas</h2>
          
          <p className="text-gray-600">
            La configuración de sistemas y sus componentes es crucial para realizar un seguimiento preciso de los paros de producción 
            y para el análisis de puntos de mejora.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-4">Crear Sistemas (Nivel 2)</h3>
          
          <ol className="list-decimal pl-6 space-y-3 text-gray-600 mt-2">
            <li>
              <strong>Acceda al módulo de Líneas de Producción</strong>
              <p className="mt-1">
                Haga clic en <strong>"Líneas de Producción"</strong> en el menú de navegación lateral.
              </p>
            </li>
            
            <li>
              <strong>Seleccione la pestaña "Sistemas"</strong>
              <p className="mt-1">
                En la parte superior de la página, haga clic en la pestaña <strong>"Sistemas"</strong>.
              </p>
            </li>
            
            <li>
              <strong>Inicie la creación</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"+ Agregar sistema"</strong> ubicado en la parte superior derecha de la tabla.
              </p>
            </li>
            
            <li>
              <strong>Complete el formulario</strong>
              <p className="mt-1">
                En el diálogo que aparece:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Seleccione la <strong>línea de producción</strong> a la que pertenecerá este sistema</li>
                <li>Ingrese el <strong>nombre del sistema</strong> (por ejemplo, "Sistema de Llenado")</li>
                <li>Añada una <strong>descripción</strong> breve si lo desea</li>
              </ul>
            </li>
            
            <li>
              <strong>Guarde el sistema</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"Guardar"</strong> para crear el nuevo sistema.
              </p>
            </li>
          </ol>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Crear Subsistemas (Nivel 3)</h3>
          
          <ol className="list-decimal pl-6 space-y-3 text-gray-600 mt-2">
            <li>
              <strong>Acceda a la pestaña "Subsistemas"</strong>
              <p className="mt-1">
                En la parte superior de la página, haga clic en la pestaña <strong>"Subsistemas"</strong>.
              </p>
            </li>
            
            <li>
              <strong>Inicie la creación</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"+ Agregar subsistema"</strong> ubicado en la parte superior derecha.
              </p>
            </li>
            
            <li>
              <strong>Complete el formulario</strong>
              <p className="mt-1">
                En el diálogo que aparece:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Seleccione el <strong>sistema</strong> al que pertenecerá este subsistema</li>
                <li>Ingrese el <strong>nombre del subsistema</strong> (por ejemplo, "Llenadora")</li>
                <li>Añada una <strong>descripción</strong> si es necesario</li>
              </ul>
            </li>
            
            <li>
              <strong>Guarde el subsistema</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"Guardar"</strong> para crear el nuevo subsistema.
              </p>
            </li>
          </ol>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Crear Sub-subsistemas (Nivel 4)</h3>
          
          <ol className="list-decimal pl-6 space-y-3 text-gray-600 mt-2">
            <li>
              <strong>Acceda a la pestaña "Sub-subsistemas"</strong>
              <p className="mt-1">
                En la parte superior de la página, haga clic en la pestaña <strong>"Sub-subsistemas"</strong>.
              </p>
            </li>
            
            <li>
              <strong>Inicie la creación</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"+ Agregar sub-subsistema"</strong> ubicado en la parte superior derecha.
              </p>
            </li>
            
            <li>
              <strong>Complete el formulario</strong>
              <p className="mt-1">
                En el diálogo que aparece:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Seleccione el <strong>subsistema</strong> al que pertenecerá este sub-subsistema</li>
                <li>Ingrese el <strong>nombre del sub-subsistema</strong> (por ejemplo, "Motor Principal")</li>
                <li>Añada una <strong>descripción</strong> si es necesario</li>
              </ul>
            </li>
            
            <li>
              <strong>Guarde el sub-subsistema</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"Guardar"</strong> para crear el nuevo sub-subsistema.
              </p>
            </li>
          </ol>
          
          <Alert className="mt-6">
            <AlertTitle>Recomendación</AlertTitle>
            <AlertDescription>
              Utilice nombres consistentes y descriptivos en todos los niveles. Esto facilitará la identificación 
              rápida de componentes durante el registro de paros y el análisis posterior.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Asignar Productos y Velocidades</h2>
          
          <p className="text-gray-600">
            Para crear órdenes de producción, primero debe asociar productos a las líneas de producción y configurar 
            sus velocidades de producción en cajas por hora.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-4">Asignar un Producto a una Línea</h3>
          
          <ol className="list-decimal pl-6 space-y-3 text-gray-600 mt-2">
            <li>
              <strong>Acceda al módulo de Líneas de Producción</strong>
              <p className="mt-1">
                Haga clic en <strong>"Líneas de Producción"</strong> en el menú de navegación lateral.
              </p>
            </li>
            
            <li>
              <strong>Seleccione la pestaña "Productos y Velocidades"</strong>
              <p className="mt-1">
                En la parte superior de la página, haga clic en la pestaña <strong>"Productos y Velocidades"</strong>.
              </p>
            </li>
            
            <li>
              <strong>Inicie la asignación</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"+ Asignar Producto"</strong> ubicado en la parte superior derecha.
              </p>
            </li>
            
            <li>
              <strong>Complete el formulario</strong>
              <p className="mt-1">
                En el diálogo que aparece:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Seleccione la <strong>línea de producción</strong> a la que desea asignar el producto</li>
                <li>Seleccione el <strong>producto</strong> de la lista desplegable</li>
                <li>Ingrese la <strong>velocidad de producción</strong> en cajas por hora</li>
              </ul>
            </li>
            
            <li>
              <strong>Guarde la asignación</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"Guardar"</strong> para crear la asignación.
              </p>
            </li>
          </ol>
          
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-6">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Importancia de las Velocidades Precisas
            </h3>
            <p className="text-gray-700 mt-2">
              La velocidad de producción (cajas/hora) es un valor crítico que afecta directamente:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
              <li>El cálculo de eficiencia de producción</li>
              <li>La estimación de tiempo para completar órdenes</li>
              <li>La planificación de la capacidad de producción</li>
              <li>El análisis de desempeño de las líneas</li>
            </ul>
            <p className="text-gray-700 mt-2">
              Asegúrese de ingresar valores precisos basados en mediciones reales de la capacidad de producción.
            </p>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Editar o Eliminar Asignaciones</h3>
          
          <ul className="list-disc pl-6 space-y-3 text-gray-600 mt-2">
            <li>
              <strong>Para editar:</strong> Haga clic en el ícono de lápiz junto a la asignación que desea modificar, 
              actualice la velocidad y haga clic en "Actualizar".
            </li>
            <li>
              <strong>Para eliminar:</strong> Haga clic en el ícono de papelera junto a la asignación que desea eliminar y confirme la acción.
              <div className="bg-yellow-50 p-2 rounded-md mt-1 text-sm">
                <strong>Nota:</strong> Eliminar una asignación impedirá crear órdenes de producción para ese producto en esa línea.
              </div>
            </li>
          </ul>
        </TabsContent>
        
        <TabsContent value="stops" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Configurar Paros de Calidad</h2>
          
          <p className="text-gray-600">
            Los paros de calidad son eventos que detienen la producción debido a desviaciones en la calidad del producto.
            Configurarlos correctamente es esencial para el análisis de causas raíz y la mejora continua.
          </p>
          
          <Alert variant="destructive" className="my-4">
            <AlertTitle>¡Muy Importante!</AlertTitle>
            <AlertDescription>
              Es fundamental crear un paro llamado exactamente <strong>"Materia prima"</strong> con "M" mayúscula 
              para que el sistema pueda rastrear correctamente las materias primas del producto y asignarlas durante el registro de paros.
            </AlertDescription>
          </Alert>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-4">Crear un Paro de Calidad</h3>
          
          <ol className="list-decimal pl-6 space-y-3 text-gray-600 mt-2">
            <li>
              <strong>Acceda al módulo de Líneas de Producción</strong>
              <p className="mt-1">
                Haga clic en <strong>"Líneas de Producción"</strong> en el menú de navegación lateral.
              </p>
            </li>
            
            <li>
              <strong>Seleccione la pestaña "Paros de Calidad"</strong>
              <p className="mt-1">
                En la parte superior de la página, haga clic en la pestaña <strong>"Paros de Calidad"</strong>.
              </p>
            </li>
            
            <li>
              <strong>Inicie la creación</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"+ Agregar paro"</strong> ubicado en la parte superior derecha.
              </p>
            </li>
            
            <li>
              <strong>Complete el formulario</strong>
              <p className="mt-1">
                En el diálogo que aparece:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Ingrese el <strong>nombre del paro</strong> (recuerde crear uno llamado exactamente "Materia prima")</li>
                <li>Añada una <strong>descripción</strong> detallada que ayude a los usuarios a entender cuándo debe utilizarse este tipo de paro</li>
              </ul>
            </li>
            
            <li>
              <strong>Guarde el paro</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"Guardar"</strong> para crear el nuevo paro de calidad.
              </p>
            </li>
          </ol>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Tipos de Paros Recomendados</h3>
          
          <p className="text-gray-600">
            Además del paro "Materia prima", se recomienda crear los siguientes tipos de paros de calidad:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-2">
            <li>
              <strong>Desviación de peso</strong> - Para problemas relacionados con el peso del producto fuera de especificación
            </li>
            <li>
              <strong>Color incorrecto</strong> - Para problemas relacionados con la apariencia visual del producto
            </li>
            <li>
              <strong>Nivel de llenado</strong> - Para problemas relacionados con el volumen de llenado
            </li>
            <li>
              <strong>Etiquetado</strong> - Para problemas relacionados con la aplicación o calidad de etiquetas
            </li>
            <li>
              <strong>Tapado</strong> - Para problemas relacionados con el sellado o tapado del producto
            </li>
            <li>
              <strong>Codificación</strong> - Para problemas relacionados con la impresión de fechas o códigos
            </li>
          </ul>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-6">
            <h3 className="text-lg font-semibold text-gray-800">Registro de Paros</h3>
            <p className="text-gray-600 mt-2">
              Una vez configurados, estos paros de calidad estarán disponibles durante el registro de paros 
              en el seguimiento de órdenes de producción. Al seleccionar "Materia prima", el sistema mostrará 
              automáticamente las materias primas asociadas al producto en producción.
            </p>
          </div>
          
          <Alert className="mt-6">
            <AlertDescription>
              La precisión en el registro de paros es fundamental para generar análisis significativos. 
              Capacite a su personal para seleccionar correctamente el tipo de paro y proporcionar información detallada.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
} 