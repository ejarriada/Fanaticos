# Plan de Trabajo: Fanaticos Manufactura

Este documento registra el plan de acción para probar, depurar y validar el frontend de Manufactura. Se actualizará a medida que completemos cada paso.

## Fase 1: Abastecimiento y Compras

**Objetivo:** Asegurar que el flujo de alta de proveedores, materias primas, compras y pagos funcione correctamente y que los datos se conecten entre los módulos.

### Sub-Fase 1.1: Módulo de Proveedores
- [x] **Análisis Inicial:** Analizar `ProveedoresModule.js` para encontrar el formulario de alta.
- [x] **Detección de Desconexión:** Identificar que el campo "Banco" era de texto libre en lugar de un desplegable.
- [x] **Investigación:** Encontrar el componente `BankForm` y la API de bancos en `BankManagement.js`.
- [x] **Refactorización y Integración:** Implementar la lógica para el alta de bancos desde el formulario de proveedores.
- [x] **Depuración:** Corregir errores de sintaxis y de compilación post-integración.
- [x] **Prueba de Usuario:** El usuario ha confirmado que el sistema compila y ha dado de alta un proveedor.

### Sub-Fase 1.2: Módulo de Materias Primas
- [x] **Análisis Inicial:** Analizar `MateriasPrimasModule.js` y `RawMaterialList.js` para encontrar el formulario de alta.
- [x] **Depuración (Campo Descripción):** Detectar y corregir el error que impedía ver la descripción en el modo de edición, modificando el `MateriaPrimaProveedorSerializer` en el backend.
- [x] **Detección de Inconsistencia:** Identificar que el modelo de datos permitía múltiples marcas por materia prima, contrario al requisito de negocio (una sola marca).
- [x] **Corrección de Modelo (Backend):** Modificar el modelo `MateriaPrimaProveedor` y su serializador para usar una relación `ForeignKey` (una marca) en lugar de `ManyToManyField` (muchas marcas).
- [x] **Migración de Base de Datos (Usuario):** El usuario ha aplicado las migraciones para actualizar la estructura de la base de datos.
- [x] **Corrección de Interfaz (Frontend):** Ajustar el formulario para usar un selector simple de marca, reflejando el cambio del backend.
- [x] **Prueba de Flujo:** El usuario ha confirmado la creación exitosa de una materia prima, asociando proveedor y marca.

### Desvío Técnico: Estandarización de Códigos QR
- [x] **Objetivo:** Unificar la generación de códigos QR para usar una única librería local y estandarizar el comportamiento en toda la aplicación.
- [x] **Análisis:** Detectar que el módulo `ProductionTracking` usaba un servicio de QR online.
- [x] **Refactorización (Frontend):** Extraer el diálogo de visualización de QR a un componente reutilizable (`QrCodeDisplayDialog.js`).
- [x] **Implementación (Backend):** Crear y mejorar las funciones `generate_qr_code` en los `ViewSet` correspondientes.
- [x] **Integración (Frontend):** Modificar todos los módulos (`RawMaterialList`, `ProductionOrderManagement`, `ProductionTracking`) para usar el flujo estandarizado.
- [x] **Depuración:** Corregir errores de compilación y de URL durante la integración.
- [x] **Prueba de Usuario:** El usuario ha confirmado que la funcionalidad de QR es ahora consistente y funciona como se espera.

### Sub-Fase 1.3: Compras y Pagos (En curso)
- [x] **Análisis:** Investigar los componentes `ComprasProveedor.js`, `NewPurchaseForm.js`, `PagosProveedor.js` y `CuentaCorrienteProveedor.js`.
- [x] **Rediseño y Conexión (Backend):**
  - [x] Modificar el modelo `PurchaseOrderItem` para que se vincule a `RawMaterial` en lugar de `Product`.
  - [x] Modificar el `PurchaseOrderSerializer` para incluir `supplier_name`, `user_name` y `total_amount` calculados, y para manejar la creación/actualización anidada de items.
  - [x] Modificar el `PurchaseOrderViewSet` para asignar automáticamente el usuario creador.
  - [x] Corregir errores de `NameError` (`User`, `F`) y `AssertionError` (`update` de anidados) en el backend.
  - [x] El usuario ha aplicado las migraciones necesarias.
- [x] **Implementación (Frontend):**
  - [x] Rediseñar `NewPurchaseForm.js` para la creación/edición de órdenes de compra basadas en items de materias primas.
  - [x] Modificar `ComprasProveedor.js` para mostrar las nuevas columnas (Proveedor, Usuario, Total) y añadir acciones de Editar/Eliminar.
  - [x] Conectar `ProveedoresModule.js` para pasar las props necesarias y manejar el refresco de la lista.
- [x] **Prueba de Flujo:**
  - [x] Simular la creación de una nueva orden de compra para una materia prima existente.
  - [x] Simular el registro de un pago (parcial o total) para esa compra.
- [x] **Verificación:**
  - [x] Comprobar que el stock de la materia prima no se ve afectado (la compra es un pedido, no una recepción).
  - [x] Comprobar que el estado de la cuenta corriente del proveedor se actualiza correctamente.
- [x] **Corrección de Filtrado:** Implementado el filtrado correcto de órdenes de compra y pagos por proveedor en el frontend y backend.

### Sub-Fase 1.4: Estandarización de Campos y Corrección de Flujo de Materias Primas
- [x] **Estandarización de Condición IVA (Frontend):**
  - [x] Modificado `SupplierForm` en `ProveedoresModule.js` para usar un `Select` con opciones predefinidas.
  - [x] Modificado `ClientForm` en `ClientList.js` para usar un `Select` con opciones predefinidas.
- [x] **Estandarización de Condición IVA (Backend):**
  - [x] Añadidas `IVA_CONDITION_CHOICES` a `core/models.py`.
  - [x] Aplicadas `IVA_CONDITION_CHOICES` a los campos `iva_condition` de los modelos `Client` y `Supplier`.
  - [x] Ejecutadas migraciones de base de datos (`makemigrations`, `migrate`).
- [x] **Corrección de Creación/Listado de Materia Prima:**
  - [x] Hecho el campo `supplier` en `MateriaPrimaProveedor` opcional (`null=True, blank=True`) en `core/models.py`.
  - [x] Eliminado `supplier` de `unique_together` en `MateriaPrimaProveedor` en `core/models.py`.
  - [x] Ejecutadas migraciones de base de datos (`makemigrations`, `migrate`).
  - [x] Hecho el campo `supplier` en `MateriaPrimaProveedorSerializer` opcional (`required=False, allow_null=True`) en `core/serializers.py`.
  - [x] Ajustada la función `handleChange` en `RawMaterialForm` (`RawMaterialList.js`) para enviar `null` para `supplier` vacío y `0` para `current_stock` vacío.
  - [x] Añadido filtrado por `name` en `RawMaterialViewSet` (`core/views.py`) para permitir la búsqueda de `RawMaterial` por nombre.
  - [x] Ajustada la lógica de `handleSave` en `RawMaterialList.js` para reutilizar `RawMaterial` existente o crear uno nuevo, y luego crear `MateriaPrimaProveedor`.
  - [x] Eliminados todos los `console.log` y `print` de depuración.
- [x] **Estado:** Completado. El flujo de creación/edición de Materias Primas y la estandarización de la condición de IVA funcionan correctamente.

---

## Fase 2: Diseño y Producción (Próximamente)

**Objetivo:** Validar la creación de productos finales, la asignación de costos y el flujo de órdenes de producción.

- [ ] ...

