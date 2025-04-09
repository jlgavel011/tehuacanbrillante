import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Tag, Layers, Droplet, Box, Award, Gauge } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Products() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
        <p className="mt-2 text-gray-600">
          Aprenda a gestionar productos, atributos y materias primas en la plataforma Tehuacán Brillante.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">General</TabsTrigger>
          <TabsTrigger value="create">Crear Productos</TabsTrigger>
          <TabsTrigger value="raw-materials">Materias Primas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Acerca del Módulo de Productos</h2>
          
          <p className="text-gray-600">
            Este módulo es la base para la creación de órdenes de producción y el análisis. Aquí definirá todos los 
            productos que fabrica su empresa, con sus características específicas y los insumos necesarios para su producción.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white p-5 rounded-md border border-gray-200 flex flex-col items-center text-center">
              <div className="bg-blue-50 p-3 rounded-full mb-4">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Productos</h3>
              <p className="text-gray-600 text-sm">
                Cree y gestione los productos finales que ofrece su empresa con todas sus variantes y presentaciones.
              </p>
            </div>
            
            <div className="bg-white p-5 rounded-md border border-gray-200 flex flex-col items-center text-center">
              <div className="bg-green-50 p-3 rounded-full mb-4">
                <Tag className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Atributos</h3>
              <p className="text-gray-600 text-sm">
                Configure atributos como sabores, tamaños, modelos y tipos de empaque para clasificar sus productos.
              </p>
            </div>
            
            <div className="bg-white p-5 rounded-md border border-gray-200 flex flex-col items-center text-center">
              <div className="bg-purple-50 p-3 rounded-full mb-4">
                <Layers className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Materias Primas</h3>
              <p className="text-gray-600 text-sm">
                Registre y asigne las materias primas utilizadas en cada producto para el seguimiento de calidad.
              </p>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-8">Estructura de Productos</h3>
          
          <p className="text-gray-600">
            Cada producto en el sistema se compone de varios atributos que lo identifican de manera única:
          </p>
          
          <div className="bg-white p-5 rounded-md border border-gray-200 mt-4">
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="bg-blue-50 p-1 rounded-full mr-3 mt-1">
                  <Droplet className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Sabor</h4>
                  <p className="text-gray-600 text-sm">
                    Define el sabor del producto (Natural, Limón, Naranja, etc.)
                  </p>
                </div>
              </li>
              
              <li className="flex items-start">
                <div className="bg-green-50 p-1 rounded-full mr-3 mt-1">
                  <Gauge className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Tamaño</h4>
                  <p className="text-gray-600 text-sm">
                    Especifica el volumen del producto (600ml, 1L, 2L, etc.)
                  </p>
                </div>
              </li>
              
              <li className="flex items-start">
                <div className="bg-orange-50 p-1 rounded-full mr-3 mt-1">
                  <Award className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Modelo</h4>
                  <p className="text-gray-600 text-sm">
                    Indica el modelo o tipo específico de producto (Estándar, Premium, Light, etc.)
                  </p>
                </div>
              </li>
              
              <li className="flex items-start">
                <div className="bg-purple-50 p-1 rounded-full mr-3 mt-1">
                  <Box className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Caja</h4>
                  <p className="text-gray-600 text-sm">
                    Define el tipo de empaque y número de unidades por caja (12u, 24u, etc.)
                  </p>
                </div>
              </li>
            </ul>
          </div>
          
          <Alert className="mt-6">
            <AlertDescription>
              Todos estos atributos se combinan para generar automáticamente el nombre completo del producto, 
              por ejemplo: "Agua Natural 600ml Estándar 24u". Esta nomenclatura consistente facilita la 
              identificación y análisis de productos.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="create" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Crear un Nuevo Producto</h2>
          
          <p className="text-gray-600">
            Antes de crear un nuevo producto, asegúrese de haber configurado previamente los atributos necesarios 
            (sabores, tamaños, modelos y cajas). Si alguno no existe aún, podrá crearlo durante el proceso.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Pasos para Crear un Nuevo Producto</h3>
          
          <ol className="list-decimal pl-6 space-y-4 text-gray-600 mt-2">
            <li>
              <strong>Acceda al módulo de Productos</strong>
              <p className="mt-1">
                Haga clic en <strong>"Productos"</strong> en el menú de navegación lateral.
              </p>
            </li>
            
            <li>
              <strong>Inicie la creación</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"+ Nuevo Producto"</strong> ubicado en la parte superior derecha de la tabla de productos.
              </p>
            </li>
            
            <li>
              <strong>Seleccione la Caja</strong>
              <p className="mt-1">
                En el formulario, seleccione el tipo de caja del menú desplegable. Si necesita crear una nueva caja:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Haga clic en <strong>"+ Crear Caja"</strong></li>
                <li>Ingrese el número de unidades por caja</li>
                <li>Opcionalmente, añada un nombre descriptivo</li>
                <li>Haga clic en <strong>"Guardar"</strong></li>
              </ul>
            </li>
            
            <li>
              <strong>Seleccione el Modelo</strong>
              <p className="mt-1">
                Seleccione el modelo del producto del menú desplegable. Si necesita crear un nuevo modelo:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Haga clic en <strong>"+ Crear Modelo"</strong></li>
                <li>Ingrese el nombre del modelo</li>
                <li>Haga clic en <strong>"Guardar"</strong></li>
              </ul>
            </li>
            
            <li>
              <strong>Seleccione el Tamaño</strong>
              <p className="mt-1">
                Seleccione el tamaño del producto del menú desplegable. Si necesita crear un nuevo tamaño:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Haga clic en <strong>"+ Crear Tamaño"</strong></li>
                <li>Ingrese la cantidad en litros</li>
                <li>Opcionalmente, añada un nombre descriptivo</li>
                <li>Haga clic en <strong>"Guardar"</strong></li>
              </ul>
            </li>
            
            <li>
              <strong>Seleccione el Sabor</strong>
              <p className="mt-1">
                Seleccione el sabor del producto del menú desplegable. Si necesita crear un nuevo sabor:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Haga clic en <strong>"+ Crear Sabor"</strong></li>
                <li>Ingrese el nombre del sabor</li>
                <li>Haga clic en <strong>"Guardar"</strong></li>
              </ul>
            </li>
            
            <li>
              <strong>Asigne Materias Primas (opcional)</strong>
              <p className="mt-1">
                Seleccione las materias primas utilizadas en este producto marcando las casillas correspondientes. 
                Si necesita crear una nueva materia prima:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Haga clic en <strong>"+ Crear Materia Prima"</strong></li>
                <li>Ingrese el nombre de la materia prima</li>
                <li>Haga clic en <strong>"Guardar"</strong></li>
              </ul>
            </li>
            
            <li>
              <strong>Verifique el Nombre del Producto</strong>
              <p className="mt-1">
                El sistema generará automáticamente el nombre del producto combinando todos los atributos seleccionados. 
                Verifique que sea correcto.
              </p>
            </li>
            
            <li>
              <strong>Guarde el Producto</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"Crear Producto"</strong> para finalizar.
              </p>
            </li>
          </ol>
          
          <div className="bg-green-50 p-4 rounded-md border border-green-100 mt-6">
            <h3 className="text-lg font-semibold text-green-800">Resultado</h3>
            <p className="text-gray-700 mt-2">
              El nuevo producto aparecerá en la lista de productos y estará disponible para ser asignado a líneas 
              de producción y para crear órdenes de producción.
            </p>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-8">Editar un Producto Existente</h3>
          
          <p className="text-gray-600">
            Para modificar un producto ya creado:
          </p>
          
          <ol className="list-decimal pl-6 space-y-2 text-gray-600 mt-2">
            <li>Localice el producto en la tabla de productos</li>
            <li>Haga clic en el ícono de lápiz junto al producto</li>
            <li>Realice los cambios necesarios en los atributos o materias primas</li>
            <li>Haga clic en <strong>"Actualizar Producto"</strong> para guardar los cambios</li>
          </ol>
          
          <Alert className="mt-6">
            <AlertDescription>
              Al editar un producto, tenga en cuenta que estos cambios podrían afectar a órdenes de producción 
              existentes o a la asignación del producto a líneas de producción.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="raw-materials" className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800">Gestión de Materias Primas</h2>
          
          <p className="text-gray-600">
            Las materias primas son los insumos utilizados en la fabricación de sus productos. Registrarlas correctamente 
            es esencial para el seguimiento de calidad y el análisis de paros de producción.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-4">
            <h3 className="text-lg font-semibold text-blue-800">Importancia del Detalle</h3>
            <p className="text-gray-700 mt-2">
              Cuanto más detallada sea la información sobre las materias primas, mejor será su capacidad para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
              <li>Rastrear problemas de calidad hasta su origen</li>
              <li>Identificar qué materias primas generan más paros</li>
              <li>Analizar el impacto de diferentes proveedores</li>
              <li>Optimizar la selección de insumos</li>
            </ul>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Crear una Nueva Materia Prima</h3>
          
          <ol className="list-decimal pl-6 space-y-3 text-gray-600 mt-2">
            <li>
              <strong>Acceda al módulo de Productos</strong>
              <p className="mt-1">
                Haga clic en <strong>"Productos"</strong> en el menú de navegación lateral.
              </p>
            </li>
            
            <li>
              <strong>Seleccione la pestaña "Materias Primas"</strong>
              <p className="mt-1">
                En la parte superior de la página, haga clic en la pestaña <strong>"Materias Primas"</strong>.
              </p>
            </li>
            
            <li>
              <strong>Inicie la creación</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"+ Nueva Materia Prima"</strong> ubicado en la parte superior derecha.
              </p>
            </li>
            
            <li>
              <strong>Complete el formulario</strong>
              <p className="mt-1">
                En el diálogo que aparece:
              </p>
              <ul className="list-disc pl-6 mt-1">
                <li>Ingrese el <strong>nombre</strong> de la materia prima</li>
                <li>Si es relevante, añada información del <strong>proveedor</strong></li>
                <li>Agregue cualquier <strong>detalle adicional</strong> que pueda ser útil para identificar esta materia prima</li>
              </ul>
            </li>
            
            <li>
              <strong>Guarde la materia prima</strong>
              <p className="mt-1">
                Haga clic en el botón <strong>"Guardar"</strong> para crear la nueva materia prima.
              </p>
            </li>
          </ol>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Asignar Materias Primas a Productos</h3>
          
          <p className="text-gray-600">
            Hay dos maneras de asignar materias primas a un producto:
          </p>
          
          <h4 className="text-lg font-medium text-gray-800 mt-4">Método 1: Durante la creación del producto</h4>
          
          <ol className="list-decimal pl-6 space-y-2 text-gray-600 mt-2">
            <li>Siga los pasos para crear un nuevo producto</li>
            <li>En la sección de Materias Primas, marque todas las materias primas utilizadas en el producto</li>
            <li>Si alguna materia prima no existe, créela con el botón "+ Crear Materia Prima"</li>
            <li>Complete la creación del producto</li>
          </ol>
          
          <h4 className="text-lg font-medium text-gray-800 mt-4">Método 2: Editar un producto existente</h4>
          
          <ol className="list-decimal pl-6 space-y-2 text-gray-600 mt-2">
            <li>Localice el producto en la tabla de productos</li>
            <li>Haga clic en el ícono de lápiz para editar</li>
            <li>En la sección de Materias Primas, actualice la selección según sea necesario</li>
            <li>Haga clic en "Actualizar Producto" para guardar los cambios</li>
          </ol>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6">Recomendaciones para Materias Primas</h3>
          
          <ul className="list-disc pl-6 space-y-3 text-gray-600 mt-2">
            <li>
              <strong>Utilice nombres descriptivos y específicos</strong>
              <p className="mt-1">
                Por ejemplo, en lugar de simplemente "Tapa", use "Tapa 28mm azul proveedor XYZ"
              </p>
            </li>
            
            <li>
              <strong>Incluya información del proveedor cuando sea relevante</strong>
              <p className="mt-1">
                Esto facilita el seguimiento cuando hay problemas de calidad relacionados con un proveedor específico
              </p>
            </li>
            
            <li>
              <strong>Mantenga un catálogo actualizado</strong>
              <p className="mt-1">
                Revise y actualice regularmente su catálogo de materias primas a medida que cambian los proveedores o especificaciones
              </p>
            </li>
            
            <li>
              <strong>Capacite al personal</strong>
              <p className="mt-1">
                Asegúrese de que todos los usuarios conozcan las materias primas y cómo seleccionarlas correctamente durante el registro de paros
              </p>
            </li>
          </ul>
          
          <Alert className="mt-6">
            <AlertDescription>
              Recuerde que para aprovechar el rastreo de materias primas durante los paros, debe configurar un tipo de paro llamado 
              exactamente "Materia prima" en el módulo de Líneas de Producción.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
} 