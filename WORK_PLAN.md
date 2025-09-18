# Plan de Trabajo

**Objetivo General:** Sistematizar y completar el desarrollo del frontend de Manufactura basándose en las funcionalidades definidas en `FrontendManufactura.txt`.

---

### **Hoja de Ruta - Módulos Pendientes**

El trabajo se organizará en los siguientes módulos, abordados secuencialmente.

**1. Módulo: Gestión de Nota de Pedido (En Progreso)**

> **Lógica de Negocio Clave:**
> *   **Creación Manual:** La Nota de Pedido **no** se crea automáticamente. Un usuario la genera manualmente a partir de una Venta que aún no esté asociada a otra nota de pedido.
> *   **Estado Automático:** El estado de la Nota de Pedido (`Pendiente`, `En proceso`, `Terminada`) se actualiza de forma automática según el estado de las Órdenes de Producción que se generen a partir de ella.


*   **Backend:**
    *   [X] **Modelo `OrderNote`:** Modelo verificado en `core/models.py`.
    *   [X] **Serializador `OrderNoteSerializer`:** Creado el serializador en `core/serializers.py` para resolver el crash del backend.
    *   [X] **Vista `OrderNoteViewSet`:** ViewSet verificado en `core/views.py`.
    *   [ ] **Endpoint:** Registrar la URL en `core/urls.py`.

*   **Frontend (Manufactura):**
    *   [ ] **Componente `OrderNoteManagement.js`:**
        *   Crear la interfaz para listar las notas de pedido existentes (`/components/modules/OrderNoteManagement.js`).
        *   La tabla debe mostrar: ID, Cliente, Detalle de Venta, Fecha de Entrega, Vendedor, Monto.
        *   Añadir botones para Ver, Editar y Borrar.
    *   [ ] **Componente `OrderNoteForm.js`:**
        *   Crear un formulario para crear/editar una `OrderNote`.
        *   El formulario debe permitir seleccionar una `Venta` existente.
        *   Al seleccionar la venta, debe autocompletar los datos del cliente y los productos asociados.
        *   Debe incluir un campo para seleccionar la `Fecha de Entrega`.
    *   [ ] **Integración:** Conectar los componentes del frontend con los endpoints del backend.
    *   [ ] **Navegación:** Añadir el módulo al menú lateral (`Sidebar.js`) y a las rutas de la aplicación (`App.js`).

**2. Módulo: Gestión de Orden de Producción (En Re-diseño)**

> **Lógica de Negocio Clave:** La creación de una OP puede originarse desde una Venta (a través de una Nota de Pedido) o por una Decisión Comercial Interna. El formulario debe soportar ambos flujos.

*   **Etapa 1: Backend (Flexibilizar Modelos y API)**
    *   [ ] **Modelo `ProductionOrder`:**
        *   [ ] Modificar `order_note` para que sea opcional (`null=True, blank=True`).
        *   [ ] Añadir `base_product = ForeignKey(Product, null=True, blank=True)` para la plantilla de talles.
        *   [ ] Añadir `equipo = CharField`.
        *   [ ] Añadir `detalle_equipo = CharField`.
        *   [ ] Añadir `customization_details = JSONField` para los "Datos del Pedido".
    *   [ ] **Modelo `ProductionOrderFile`:**
        *   [ ] Añadir `file_type = CharField` (escudo, sponsor, template).
    *   [ ] **Serializadores:**
        *   [ ] Actualizar `ProductionOrderSerializer` y `ProductionOrderFileSerializer` para reflejar los nuevos campos.
    *   [ ] **Migraciones:**
        *   [ ] Crear y aplicar las migraciones de base de datos.

*   **Etapa 2: Frontend (Nuevo Flujo de Creación)**
    *   [ ] **Componente `ProductionOrderManagement.js`:**
        *   Al pulsar "Nueva Orden", en lugar de un selector de tipo, mostrar un diálogo que pregunte: "A partir de una Venta" o "Decisión Comercial Interna".
    *   [ ] **Componente `ProductionOrderFormIndumentaria.js`:**
        *   Reestructurar el componente para que su estado inicial dependa de la opción elegida.

*   **Etapa 3: Frontend (Lógica Condicional)**
    *   [ ] **Flujo "A partir de una Venta":**
        *   [ ] Mostrar selector de `OrderNote`.
        *   [ ] Al seleccionar `OrderNote`, mostrar un nuevo selector con los productos de la venta para elegir el `base_product`.
        *   [ ] Autocompletar la sección "Datos del Cliente".
    *   [ ] **Flujo "Decisión Comercial Interna":**
        *   [ ] Ocultar la sección "Datos del Cliente".
        *   [ ] Mostrar un selector con todos los productos fabricables para elegir el `base_product`.

*   **Etapa 4: Frontend (Construcción de Secciones)**
    *   [ ] **Sección "Datos de la Orden":** Implementar los 6 campos (`Nota de pedido`, `Equipo`, `Detalle del Equipo`, `Fecha`, `Fecha Estimada`, `Estado`).
    *   [ ] **Sección "Datos del Cliente":** Implementar los campos de solo lectura que se autocompletan.
    *   [ ] **Sección "Datos del Pedido":** Implementar la grilla de 13 campos de personalización (Escudo, Marca, Tela, etc.).
    *   [ ] **Sección "Detalles del Pedido":** Mover el campo de texto `details` a esta sección.
    *   [ ] **Sección "Plantilla de Talles":**
        *   [ ] Implementar el formulario para añadir Talle/Cantidad/Arquero, basado en los talles del `base_product` seleccionado.
        *   [ ] Implementar la tabla para listar, editar y borrar los talles agregados.
    *   [ ] **Sección "Escudos y Sponsors":**
        *   [ ] Implementar los 3 botones de subida de archivos.
        *   [ ] Implementar el listado de archivos subidos.
    *   [ ] **Revisar Vista General:** Asegurar que la presentación de la Orden de Producción sea clara y completa, mostrando todos los datos relevantes de forma legible.

**3. Módulo: Seguimiento de Orden de Producción (Pendiente)**

*   **Backend:**
    *   [ ] **Modelo `ProductionProcessLog`:** Crear un modelo para registrar el avance de una OP por los distintos procesos (Corte, Costura, etc.).
    *   [ ] **Lógica de Transición:** Implementar la lógica para cambiar el estado y la etapa de una OP.
*   **Frontend:**
    *   [ ] **Componente `ProductionTracking.js`:** Crear la interfaz para visualizar el estado de una OP, sus detalles y permitir el avance entre procesos.

**4. Módulo: Gestión de Inventario (Pendiente)**

*   **Backend:**
    *   [ ] **Modelos:** Revisar/crear modelos para `Warehouse` (Almacén), `StockMateriaPrima`, y `StockProductoTerminado`.
    *   [ ] **Vistas:** Crear vistas para consultar el stock actual.
*   **Frontend:**
    *   [ ] **Componentes de Inventario:** Crear interfaces para visualizar el stock de materias primas y productos terminados por almacén.

**5. Módulo: Gestión de Remitos (Pendiente)**

*   **Backend:**
    *   [ ] **Modelo `DeliveryNote`:** Crear el modelo para los remitos (de venta e internos).
    *   [ ] **Serializador y Vista:** Implementar el CRUD para los remitos.
*   **Frontend:**
    *   [ ] **Componentes `DeliveryNoteManagement.js` y `DeliveryNoteForm.js`:** Crear las interfaces para gestionar y generar remitos.

**6. Módulo: Gestión de RRHH (Pendiente)**

*   **Backend:**
    *   [ ] **Modelos:** Revisar/crear modelos para `Employee`, `Salary`, `Vacation`, `MedicalRecord`, etc.
    *   [ ] **Serializadores y Vistas:** Implementar los endpoints para gestionar la información de RRHH.
*   **Frontend:**
    *   [ ] **Módulo `RRHHModule.js`:** Agrupar componentes para la gestión de empleados, salarios, ausentismo, etc.

**7. Módulo: Gestión de Administración (Pendiente)**

*   **Backend:**
    *   [ ] **Modelos:** Revisar/crear modelos para `Factory` (Fábrica) y `Process` (Proceso).
    *   [ ] **Serializadores y Vistas:** Implementar los endpoints correspondientes.
*   **Frontend:**
    *   [ ] **Módulo `AdminModule.js`:** Agrupar componentes para la gestión de usuarios, fábricas y roles.

**8. Módulo: Gestión Contable/Finanzas (Pendiente)**

*   **Backend:**
    *   [ ] **Modelos:** Revisar/crear modelos para `CashBox` (Caja), `Check` (Cheque), `Expense` (Gasto), etc.
    *   [ ] **Serializadores y Vistas:** Implementar los endpoints para la gestión financiera.
*   **Frontend:**
    *   [ ] **Módulo `FinanzasModule.js`:** Agrupar componentes para la gestión de cajas, gastos, cheques y resúmenes financieros.

**9. Módulo: Refinamiento y Coherencia de UI/UX (Opcional)**

> **Nota:** Este es un módulo de mejora continua. Las tareas aquí listadas pueden ser abordadas en cualquier momento para mejorar la experiencia de usuario.

*   [ ] **Unificar Flujo CRUD:** Estandarizar la gestión de datos (Crear, Leer, Actualizar, Borrar) para que siga un único patrón en toda la aplicación.
    *   **Patrón Dominante Identificado:** La mayoría de los módulos (`Clientes`, `Productos`, `Notas de Pedido`) usan un listado en tabla con un formulario de creación/edición en un **diálogo modal**.
    *   **Inconsistencias a Evaluar:**
        *   **Módulo de Presupuestos:** Usa una interfaz de **pestañas (tabs)** en lugar de un diálogo. Evaluar si migrarlo al patrón de diálogo mejoraría la consistencia.
        *   **Módulo de Proveedores:** El componente de listado no es autocontenido y delega la acción de edición a un componente padre. Evaluar refactorizarlo para que gestione su propio estado y formulario, como los demás módulos.
        *   **Módulo de Ventas:** Actualmente funciona como un reporte de solo lectura. Confirmar si este es el comportamiento deseado o si debería alinearse al patrón CRUD estándar.
    *   **Acción Recomendada:** Para nuevos módulos como "Órdenes de Producción", adoptar el patrón de **diálogo modal** para mantener la coherencia.

**10. Módulo: Pruebas y Armonización**

*   [ ] **Ejecutar Tests:** Implementar y ejecutar una suite de pruebas para el frontend de manufactura para asegurar la estabilidad y detectar regresiones.
*   [ ] **Armonizar Código:** Realizar una revisión general del código del frontend de manufactura para unificar estilos, componentes y lógica, mejorando la mantenibilidad.

---

### **Tareas Completadas (Historial)**

*   **Backend:**
    *   Corregido `IndentationError` en `core/views.py`.
    *   Corregida la consulta en `get_current_account_balance` en `core/views.py`.
    *   `ProductSerializer`: Añadido `cost` como `SerializerMethodField`.
    *   `Quotation` model: Añadido `quotation_id` y `user`.
    *   `QuotationItem` model: Cambiado `design` a `product`.
    *   `SaleItemSerializer` y `SaleSerializer` actualizados.
    *   `QuotationViewSet`: Refactorizado `perform_create`.
    *   Migraciones de datos y de base de datos correspondientes.
    *   `core/serializers.py`: Reordenadas las definiciones para resolver `NameError`s.
    *   `QuotationSerializer`: Corregido para aceptar `client_id` y manejar correctamente la creación de `QuotationItem`.

*   **Frontend (Manufactura):**
    *   Corregida la carga de datos en `ClientList.js` y `CuentaPorCliente.js`.
    *   `CuentaPorCliente.js`: Implementado formulario "Agregar Movimiento".
    *   Renombrado módulo "Cotizaciones" a "Presupuestos".
    *   `ProductosFinalesList.js`: Corregida lógica de "Costo" y "Precio de Fábrica".
    *   `QuotationForm.js`: Mejoras de UX, refactorización y cambio de `Design` a `Product`.
    *   `QuotationManagement.js`: Mejoras de UX post-guardado y añadida columna "Usuario".
    *   Corregido error de compilación por `export default` duplicado.
