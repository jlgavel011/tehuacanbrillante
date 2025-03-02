# Diseño de Base de Datos y API REST para Gestión de Producción

## 📊 1. Definición de la Base de Datos

### **Entidades y Atributos**

| Entidad               | Atributo                     | Tipo       | ¿Lista? | Descripción                                                                 |
|-----------------------|------------------------------|------------|---------|-----------------------------------------------------------------------------|
| **Caja**             | `ID` (PK)                    | ID         | Único   | Identificador único de caja.                                               |
|                       | `Numero_unidades`            | Number     | Único   | Número de unidades de producto que contiene la caja.                       |
| **Materia_prima**    | `ID` (PK)                    | ID         | Único   | Identificador único de materia prima.                                      |
|                       | `Nombre`                     | Text       | Único   | Nombre de la materia prima.                                                |
| **Modelo**           | `ID` (PK)                    | ID         | Único   | Identificador único del modelo (vidrio, pet, lata).                        |
|                       | `Nombre`                     | Text       | Único   | Nombre del modelo.                                                         |
| **Tipo_paro**        | `ID` (PK)                    | ID         | Único   | Identificador único de tipo de paro (calidad, mantenimiento, operativo).   |
|                       | `Nombre`                     | Text       | Único   | Nombre del tipo de paro.                                                   |
| **Sabor**            | `ID` (PK)                    | ID         | Único   | Identificador único del sabor.                                             |
|                       | `Nombre`                     | Text       | Único   | Nombre del sabor.                                                          |
| **Tamaño**           | `ID` (PK)                    | ID         | Único   | Identificador único del tamaño.                                            |
|                       | `Litros`                     | Number     | Único   | Capacidad en litros del producto.                                          |
| **Subsubsistema**    | `ID` (PK)                    | ID         | Único   | Identificador único del sub-sub-sistema.                                   |
|                       | `Nombre`                     | Text       | Único   | Nombre del sub-sub-sistema.                                                |
|                       | `Subsistema_ID` (FK)         | ID         | Único   | Sub-sistema al que pertenece.                                              |
| **Subsistema**       | `ID` (PK)                    | ID         | Único   | Identificador único del sub-sistema.                                       |
|                       | `Nombre`                     | Text       | Único   | Nombre del sub-sistema.                                                    |
|                       | `Sistema_ID` (FK)            | ID         | Único   | Sistema al que pertenece.                                                  |
| **Sistema**          | `ID` (PK)                    | ID         | Único   | Identificador único del sistema.                                           |
|                       | `Nombre`                     | Text       | Único   | Nombre del sistema.                                                        |
|                       | `Linea_produccion_ID` (FK)   | ID         | Único   | Línea de producción asignada.                                              |
| **Linea_produccion** | `ID` (PK)                    | ID         | Único   | Identificador único de la línea de producción.                             |
|                       | `Nombre`                     | Text       | Único   | Nombre de la línea.                                                        |
| **Producto**         | `ID` (PK)                    | ID         | Único   | Identificador único del producto.                                          |
|                       | `Nombre`                     | Text       | Único   | Nombre compuesto (Sabor + Tamaño + Modelo + Caja).                         |
|                       | `Caja_ID` (FK)               | ID         | Único   | Caja asociada al producto.                                                 |
|                       | `Modelo_ID` (FK)             | ID         | Único   | Modelo del producto.                                                       |
|                       | `Tamaño_ID` (FK)             | ID         | Único   | Tamaño del producto.                                                       |
|                       | `Sabor_ID` (FK)              | ID         | Único   | Sabor del producto.                                                        |
| **Produccion**       | `ID` (PK)                    | ID         | Único   | Identificador único de la orden de producción.                             |
|                       | `Numero_orden`               | Number     | Único   | Número de orden asignado.                                                  |
|                       | `Cajas_producidas`           | Number     | Único   | Cajas registradas como producidas.                                         |
|                       | `Cajas_planificadas`         | Number     | Único   | Cajas planificadas para producir.                                          |
|                       | `Linea_produccion_ID` (FK)   | ID         | Único   | Línea de producción asignada.                                              |
|                       | `Producto_ID` (FK)           | ID         | Único   | Producto a producir.                                                       |
|                       | `Turno`                      | Number     | Único   | Turno de producción (ej: 1, 2, 3).                                         |
| **Paro**             | `ID` (PK)                    | ID         | Único   | Identificador único del paro.                                              |
|                       | `Tiempo_minutos`             | Number     | Único   | Minutos de inactividad.                                                    |
|                       | `Tipo_paro_ID` (FK)          | ID         | Único   | Tipo de paro (calidad, mantenimiento, operativo).                          |
|                       | `Linea_produccion_ID` (FK)   | ID         | Único   | Línea de producción afectada.                                              |
|                       | `Subsistema_ID` (FK)         | ID         | Único   | Subsistema asociado al paro (opcional).                                    |
|                       | `Subsubsistema_ID` (FK)      | ID         | Único   | Sub-sub-sistema asociado al paro (opcional).                               |

---

### **Tablas Intermedias (Relaciones M:N)**
| Tabla                          | Columnas                          | Descripción                                      |
|--------------------------------|-----------------------------------|--------------------------------------------------|
| `Producto_MateriaPrima`       | `Producto_ID`, `Materia_prima_ID` | Relaciona productos con sus materias primas.     |
| `Linea_produccion_Producto`   | `Linea_produccion_ID`, `Producto_ID` | Asigna productos a líneas de producción.         |
| `Sistema_Subsistema`          | `Sistema_ID`, `Subsistema_ID`     | Asigna subsistemas a sistemas.                   |
| `Subsistema_Subsubsistema`    | `Subsistema_ID`, `Subsubsistema_ID` | Asigna sub-sub-sistemas a subsistemas.           |

---

## 📌 2. Definición de Relaciones

### **Relaciones Principales**
- **`Linea_produccion` 1:N `Sistema`**: Una línea contiene múltiples sistemas.
- **`Sistema` 1:N `Subsistema`**: Un sistema contiene múltiples subsistemas.
- **`Subsistema` 1:N `Subsubsistema`**: Un subsistema contiene múltiples sub-sub-sistemas.
- **`Producto` M:N `Materia_prima`**: Un producto usa varias materias primas.
- **`Linea_produccion` M:N `Producto`**: Una línea produce múltiples productos.
- **`Produccion` N:1 `Linea_produccion`**: Una orden se asigna a una línea.
- **`Paro` N:1 `Tipo_paro`**: Un paro está asociado a un tipo.

### **Claves Primarias y Foráneas**
- **Claves Primarias**: Todas las entidades usan `ID` como PK.
- **Claves Foráneas**: Formato `[Entidad]_ID` (ej: `Linea_produccion_ID`).

---

## 📌 3. Definición de Endpoints REST

### **Productos**
| Método | Endpoint           | Descripción                         | Parámetros (Body)                                                                 | Ejemplo Respuesta                                                                 |
|--------|--------------------|-------------------------------------|-----------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| GET    | `/productos`       | Obtener todos los productos.        | -                                                                                 | ```json [{"id": 1, "nombre": "Limonada 1L vidrio", "caja_id": 5, ...}] ```       |
| POST   | `/productos`       | Crear un nuevo producto.            | ```json { "nombre": "Cola 0.5L lata", "caja_id": 2, ... } ```                     | ```json { "id": 2, "nombre": "Cola 0.5L lata", ... } ```                          |

### **Órdenes de Producción**
| Método | Endpoint           | Descripción                         | Parámetros (Body)                                                                 | Ejemplo Respuesta                                                                 |
|--------|--------------------|-------------------------------------|-----------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| POST   | `/ordenes`         | Crear una orden de producción.      | ```json { "cajas_planificadas": 100, "linea_produccion_id": 4, ... } ```           | ```json { "id": 101, "numero_orden": 5001, ... } ```                              |

### **Paros**
| Método | Endpoint           | Descripción                         | Parámetros (Body)                                                                 | Ejemplo Respuesta                                                                 |
|--------|--------------------|-------------------------------------|-----------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| POST   | `/paros`           | Registrar un paro.                  | ```json { "tiempo_minutos": 30, "tipo_paro_id": 2, ... } ```                      | ```json { "id": 25, "tiempo_minutos": 30, ... } ```                               |

### **Monitoreo**
| Método | Endpoint                          | Descripción                                 | Parámetros (URL)       | Ejemplo Respuesta                                                                 |
|--------|-----------------------------------|---------------------------------------------|------------------------|-----------------------------------------------------------------------------------|
| GET    | `/lineas/:id/produccion`          | Producción en tiempo real de una línea.     | `id`: ID de la línea   | ```json { "cajas_producidas": 85, "cajas_planificadas": 100, "paros": [...] } ``` |

---

## ⚠️ Consideraciones Finales
- **Normalización**: Estructura sin redundancias, con tablas intermedias para relaciones M:N.
- **Escalabilidad**: Diseño flexible para agregar nuevas entidades (ej: `Usuario`, `Turno`).
- **API RESTful**: Endpoints semánticos y métodos HTTP adecuados (GET, POST, etc.).