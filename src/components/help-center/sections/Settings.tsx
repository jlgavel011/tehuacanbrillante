import React from "react";
import { UserCog, UserPlus, Shield, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Configuración</h1>
        <p className="mt-2 text-gray-600">
          El módulo de Configuración le permite administrar usuarios, asignar roles y gestionar permisos 
          en la plataforma Tehuacán Brillante.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-start">
            <div className="bg-purple-50 p-2 rounded-full mr-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Gestión de Usuarios</h2>
              <p className="mt-1 text-gray-600">
                Administre los usuarios que tienen acceso a la plataforma y asigne roles adecuados según sus responsabilidades.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4">Ver Usuarios</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-600 mt-2">
                <li>
                  Haga clic en <strong>"Configuración"</strong> en el menú de navegación lateral
                </li>
                <li>
                  Seleccione la sección <strong>"Usuarios"</strong> (mostrada por defecto)
                </li>
                <li>
                  Visualice la lista de usuarios activos en la plataforma, con información sobre su nombre, correo electrónico, rol y estado
                </li>
                <li>
                  Utilice la barra de búsqueda para encontrar usuarios específicos
                </li>
              </ol>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4">Crear Nuevo Usuario</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-600 mt-2">
                <li>
                  En la sección de Usuarios, haga clic en el botón <strong>"+ Nuevo Usuario"</strong> ubicado en la parte superior derecha
                </li>
                <li>
                  Complete el formulario con la siguiente información:
                  <ul className="list-disc pl-6 mt-1">
                    <li><strong>Nombre</strong>: Nombre completo del usuario</li>
                    <li><strong>Correo Electrónico</strong>: Dirección de correo que servirá como identificador único</li>
                    <li><strong>Rol</strong>: Seleccione el rol adecuado del menú desplegable</li>
                    <li><strong>Contraseña</strong>: Establezca una contraseña temporal (el usuario deberá cambiarla en su primer inicio de sesión)</li>
                    <li><strong>Confirmación de Contraseña</strong>: Repita la contraseña para confirmar</li>
                  </ul>
                </li>
                <li>
                  Haga clic en <strong>"Crear Usuario"</strong> para completar el proceso
                </li>
                <li>
                  El sistema enviará automáticamente un correo electrónico al nuevo usuario con sus credenciales de acceso
                </li>
              </ol>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4">Editar Usuario</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-600 mt-2">
                <li>
                  En la lista de usuarios, localice al usuario que desea modificar
                </li>
                <li>
                  Haga clic en el ícono de lápiz (editar) en la fila correspondiente
                </li>
                <li>
                  Actualice la información necesaria en el formulario
                </li>
                <li>
                  Haga clic en <strong>"Guardar Cambios"</strong> para aplicar las modificaciones
                </li>
              </ol>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4">Desactivar/Reactivar Usuario</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-600 mt-2">
                <li>
                  Para desactivar: En la lista de usuarios, haga clic en el interruptor de estado en la columna "Activo"
                </li>
                <li>
                  Confirme la acción en el diálogo que aparece
                </li>
                <li>
                  Para reactivar: Siga el mismo proceso en un usuario inactivo
                </li>
              </ol>
              
              <Alert className="mt-4">
                <AlertDescription>
                  Los usuarios desactivados no podrán iniciar sesión en la plataforma, pero sus datos y acciones 
                  históricas se mantienen para referencias y auditorías.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-start">
            <div className="bg-blue-50 p-2 rounded-full mr-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Roles y Permisos</h2>
              <p className="mt-1 text-gray-600">
                Los roles definen qué acciones puede realizar cada usuario en la plataforma. La asignación adecuada 
                de roles es fundamental para mantener la seguridad y eficiencia operativa.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4">Roles Disponibles</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h4 className="font-semibold text-gray-800">Administrador</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Control total sobre la plataforma, incluyendo la gestión de usuarios y configuraciones del sistema.
                  </p>
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500">Permisos:</span>
                    <ul className="list-disc pl-5 mt-1 text-xs text-gray-600">
                      <li>Acceso completo a todos los módulos</li>
                      <li>Gestión de usuarios y roles</li>
                      <li>Configuración del sistema</li>
                      <li>Análisis avanzados</li>
                      <li>Eliminación de datos</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h4 className="font-semibold text-gray-800">Gerente de Producción</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Gestión completa de la producción, incluyendo líneas, órdenes y análisis.
                  </p>
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500">Permisos:</span>
                    <ul className="list-disc pl-5 mt-1 text-xs text-gray-600">
                      <li>Gestión de líneas de producción</li>
                      <li>Creación y seguimiento de órdenes</li>
                      <li>Gestión de productos</li>
                      <li>Acceso a todos los reportes</li>
                      <li>Visualización de usuarios</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h4 className="font-semibold text-gray-800">Jefe de Línea</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Monitoreo y actualización de órdenes de producción asignadas a su línea.
                  </p>
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500">Permisos:</span>
                    <ul className="list-disc pl-5 mt-1 text-xs text-gray-600">
                      <li>Visualización de órdenes asignadas</li>
                      <li>Actualización de progreso de producción</li>
                      <li>Registro de paros</li>
                      <li>Acceso a reportes básicos</li>
                      <li>Sin acceso a configuración</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6">Asignar Roles</h3>
              
              <p className="text-gray-600 mt-2">
                La asignación de roles se realiza durante la creación de usuarios o mediante la edición de perfiles existentes:
              </p>
              
              <ol className="list-decimal pl-6 space-y-2 text-gray-600 mt-2">
                <li>
                  <strong>Al crear un nuevo usuario</strong>: Seleccione el rol apropiado del menú desplegable en el formulario de creación
                </li>
                <li>
                  <strong>Al editar un usuario existente</strong>:
                  <ol className="list-decimal pl-6 mt-1">
                    <li>Localice al usuario en la lista</li>
                    <li>Haga clic en el ícono de edición</li>
                    <li>Modifique el rol desde el menú desplegable</li>
                    <li>Guarde los cambios</li>
                  </ol>
                </li>
              </ol>
              
              <Alert className="mt-4">
                <AlertDescription>
                  La asignación cuidadosa de roles y permisos es fundamental para la seguridad de los datos y el 
                  funcionamiento correcto de la plataforma. Revise periódicamente los permisos asignados para 
                  mantener la política de seguridad actualizada.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-start">
            <div className="bg-green-50 p-2 rounded-full mr-4">
              <UserCog className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Gestión de Perfil</h2>
              <p className="mt-1 text-gray-600">
                Cada usuario puede gestionar su propio perfil, actualizar su información personal y cambiar su contraseña.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4">Acceder a su Perfil</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-600 mt-2">
                <li>
                  Haga clic en su nombre o avatar en la esquina superior derecha de la interfaz
                </li>
                <li>
                  Seleccione <strong>"Mi Perfil"</strong> en el menú desplegable
                </li>
              </ol>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4">Actualizar Información Personal</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-600 mt-2">
                <li>
                  En la página de Perfil, haga clic en <strong>"Editar Perfil"</strong>
                </li>
                <li>
                  Actualice la información según sea necesario:
                  <ul className="list-disc pl-6 mt-1">
                    <li>Nombre completo</li>
                    <li>Información de contacto</li>
                    <li>Foto de perfil (opcional)</li>
                  </ul>
                </li>
                <li>
                  Haga clic en <strong>"Guardar Cambios"</strong> para aplicar las modificaciones
                </li>
              </ol>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4">Cambiar Contraseña</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-600 mt-2">
                <li>
                  En la página de Perfil, haga clic en <strong>"Cambiar Contraseña"</strong>
                </li>
                <li>
                  Complete el formulario:
                  <ul className="list-disc pl-6 mt-1">
                    <li>Contraseña actual</li>
                    <li>Nueva contraseña</li>
                    <li>Confirmación de nueva contraseña</li>
                  </ul>
                </li>
                <li>
                  Haga clic en <strong>"Actualizar Contraseña"</strong> para confirmar el cambio
                </li>
              </ol>
              
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-4">
                <h4 className="font-medium text-blue-800">Recomendaciones de Seguridad</h4>
                <ul className="list-disc pl-6 mt-2 text-gray-700">
                  <li>Utilice contraseñas fuertes con al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos</li>
                  <li>No comparta sus credenciales con otros usuarios</li>
                  <li>Cambie su contraseña regularmente (recomendado cada 90 días)</li>
                  <li>Cierre sesión cuando no esté utilizando la plataforma, especialmente en dispositivos compartidos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 