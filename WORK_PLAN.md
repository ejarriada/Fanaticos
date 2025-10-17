# Plan de Trabajo: Implementación Frontend y Backend Comercializadora

## Estado Actual de la Sesión (viernes, 17 de octubre de 2025)

Se ha logrado estabilizar el backend y se han implementado los módulos iniciales del frontend para la aplicación `comercializadora`.

**Decisión Estratégica:** Para garantizar la estabilidad de la Manufacturera y cumplir estrictamente con la regla "NO romper funcionalidades de la Manufacturera", se ha decidido **no modificar** los archivos `core/models.py`, `core/views.py` y `core/serializers.py` en esta fase, a menos que sea estrictamente necesario para resolver dependencias críticas, como fue el caso del modelo `Warehouse`.

### Resumen de Logros de la Sesión:

- [x] **Crear App Django 'comercializadora':** La aplicación `comercializadora` ha sido creada.
- [x] **Registrar App:** `comercializadora` ha sido añadida a `INSTALLED_APPS` en `settings.py`.
- [x] **Definir Modelos Nuevos (Parcial):** El archivo `comercializadora/models.py` contiene la definición de los modelos `CommercialProduct`, `CommercialProductImage`, `CommercialInventory`, `ProductReservation`, `Promotion`, `LoyaltyCard`, `EcommerceSale`. Se han añadido valores por defecto a los campos no nulos para evitar prompts interactivos.
- [x] **Reversión Completa de `core`:** Los archivos `core/models.py`, `core/views.py` y `core/serializers.py` han sido restaurados a su estado original (último commit de `HEAD`).

### Problemas Pendientes (Resueltos en esta sesión):

-   La refactorización del modelo `Warehouse` (moverlo de `core` a `comercializadora` y adaptarlo) no se ha completado debido a las complejidades de las dependencias existentes en `core`. Se abordará creando un nuevo `comercializadora.Warehouse`.
    -   **Resolución:** Se movió el modelo `Warehouse` de `comercializadora/models.py` a `core/models.py` y se actualizaron las referencias en `core/models.py`, `core/serializers.py` y `core/views.py` para apuntar al modelo `Warehouse` en `core`. Se actualizó la importación en `comercializadora/models.py`.
-   La integración de productos comerciales en `SaleItem` y `DeliveryNoteItem` no se ha realizado. Se abordará creando nuevos modelos `comercializadora.CommercialSaleItem` y `comercializadora.InternalDeliveryNoteItem`.

## Plan de Trabajo:

**Fase 1 (Revisada): Backend - Estructura Segura y Aislada (Completada)**

- [x] **Definir `comercializadora.Warehouse`:** (Se movió a `core.models` y se manejó la dependencia)
- [x] **Definir Modelos de Venta y Remito para Comercializadora:**
    - [x] Crear `comercializadora.CommercialSale`
    - [x] Crear `comercializadora.CommercialSaleItem`
    - [x] Crear `comercializadora.InternalDeliveryNote`
    - [x] Crear `comercializadora.InternalDeliveryNoteItem`
- [x] **Definir `comercializadora.CommercialEmployee`:**
- [x] **Generar y Aplicar Migraciones:** Se generaron y aplicaron las migraciones para `core` y `comercializadora`.

**Fase 2: Backend - Capa de API (Comercializadora) (Completada)**

- [x] **Crear Serializers:** Implementar los serializers para todos los nuevos modelos en `comercializadora/serializers.py`.
- [x] **Crear Vistas y Endpoints:** Implementar los `ViewSets` con acciones personalizadas en `comercializadora/views.py`.
- [x] **Registrar Rutas:** Añadir las nuevas rutas de la API en `comercializadora/urls.py` e incluirlas en el router principal del proyecto (`sistema_fanaticos_backend/urls.py`).

**Fase 3: Frontend - Estructura de Módulos (Comercializadora) (Completada)**

- [x] **Revertir cambios redundantes en el frontend:**
    - [x] Eliminar rutas de módulos comerciales duplicados de `App.js`.
    - [x] Eliminar enlaces de módulos comerciales duplicados de `Sidebar.js`.
    - [x] Eliminar archivos de módulos comerciales duplicados de `src/components/modules/`.
- [x] **Adaptar módulos existentes:**
    - [x] `SaleManagement` (para `CommercialSale`s usando `commercial/commercial-sales/` endpoint).
        - [x] Actualizar `SalesList.js` (cambiar endpoint de `api.list` y `api.remove`)
    - [x] `InventoryManagement` (para `CommercialInventory`s usando `commercial/commercial-inventories/` endpoint y `CommercialProduct`s usando `commercial/commercial-products/` endpoint).
        - [x] Actualizar `InventoryForm` (cambiar fetching de `products` a `commercial/commercial-products/`)
        - [x] Actualizar `fetchInventories` (cambiar endpoint)
        - [x] Actualizar `handleSaveInventory` (cambiar endpoints)
        - [x] Actualizar `handleDeleteInventory` (cambiar endpoint)
        - [x] Actualizar `fetchProducts` (cambiar endpoint)
        - [x] Actualizar `handleSaveProduct` (cambiar endpoints)
        - [x] Actualizar `handleDeleteProduct` (cambiar endpoint)
    - [x] `DeliveryNoteManagement` (renombrado a `InternalDeliveryNoteManagement` para `InternalDeliveryNote`)
        - [x] Renombrar `DeliveryNoteManagement.js` a `InternalDeliveryNoteManagement.js`.
        - [x] Renombrar `DeliveryNoteForm` a `InternalDeliveryNoteForm`.
        - [x] Actualizar `InternalDeliveryNoteForm` (eliminar fetching de `sales` y `products`, añadir fetching de `commercial_products` y `warehouses`, adaptar campos).
        - [x] Actualizar `InternalDeliveryNoteManagement` (cambiar endpoints, actualizar tabla).
        - [x] Actualizar `App.js` (import y ruta).
        - [x] Actualizar `Sidebar.js` (enlace).
    - [x] `EmployeeManagement` (para `CommercialEmployee`)
        - [x] Adaptar `EmployeeManagement.js` para `CommercialEmployee` (eliminar campos de `core.Employee`, adaptar `formData`, `handleSubmit`, `fetchEmployees`, `handleSave`, `handleDelete`, actualizar tabla).
- [x] **Crear nuevos módulos (sin contrapartes existentes):**
    - [x] `CommercialProductManagement` (para `CommercialProduct`)
        - [x] Crear `CommercialProductManagement.js`
        - [x] Crear `CommercialProductList.js`
        - [x] Integrar `CommercialProductList.js` en `CommercialProductManagement.js`
        - [x] Añadir ruta `/commercial-products` en `App.js`
        - [x] Añadir enlace en `Sidebar.js`
        - [x] Implementar lógica de obtención y visualización de datos en `CommercialProductList.js`
    - [x] `ProductReservationManagement` (para `ProductReservation`)
        - [x] Crear `ProductReservationManagement.js`
        - [x] Crear `ProductReservationList.js`
        - [x] Integrar `ProductReservationList.js` en `ProductReservationManagement.js`
        - [x] Añadir ruta `/product-reservations` en `App.js`
        - [x] Añadir enlace en `Sidebar.js`
        - [x] Implementar lógica de obtención y visualización de datos en `ProductReservationList.js`
    - [x] `PromotionManagement` (para `Promotion`)
        - [x] Crear `PromotionManagement.js`
        - [x] Crear `PromotionList.js`
        - [x] Integrar `PromotionList.js` en `PromotionManagement.js`
        - [x] Añadir ruta `/promotions` en `App.js`
        - [x] Añadir enlace en `Sidebar.js`
        - [x] Implementar lógica de obtención y visualización de datos en `PromotionList.js`
    - [x] `LoyaltyCardManagement` (para `LoyaltyCard`)
        - [x] Crear `LoyaltyCardManagement.js`
        - [x] Crear `LoyaltyCardList.js`
        - [x] Integrar `LoyaltyCardList.js` en `LoyaltyCardManagement.js`
        - [x] Añadir ruta `/loyalty-cards` en `App.js`
        - [x] Añadir enlace en `Sidebar.js`
        - [x] Implementar lógica de obtención y visualización de datos en `LoyaltyCardList.js`
    - [x] `EcommerceSaleManagement` (para `EcommerceSale`)
        - [x] Crear `EcommerceSaleManagement.js`
        - [x] Crear `EcommerceSaleList.js`
        - [x] Integrar `EcommerceSaleList.js` en `EcommerceSaleManagement.js`
        - [x] Añadir ruta `/ecommerce-sales` en `App.js`
        - [x] Añadir enlace en `Sidebar.js`
        - [x] Implementar lógica de obtención y visualización de datos en `EcommerceSaleList.js`

**Próximos Pasos:**

-   **Fase 4: Implementación de Formularios y Funcionalidad CRUD Completa (Comercializadora) (Completada)**
    -   [x] Implementar formularios de creación/edición para cada módulo de frontend.
    -   [x] Añadir funcionalidad de creación, edición y eliminación a los componentes de lista.
    -   [x] Integrar validación de formularios y manejo de errores.

-   **Fase 5: Refinamiento y Pruebas (Comercializadora)**
    -   Realizar pruebas exhaustivas de la API y el frontend.
    -   Ajustar la interfaz de usuario y la experiencia del usuario.
    -   Optimizar el rendimiento.

-   **Fase 6: Documentación y Despliegue (Comercializadora)**
    -   Actualizar la documentación del proyecto.
    -   Preparar la aplicación para el despliegue en un entorno de producción.
