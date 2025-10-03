# Resumen de la Sesión de Depuración

## Objetivo
Levantar y verificar el entorno de desarrollo completo del sistema "Fanaticos" utilizando Docker Compose.

## Problemas Encontrados y Soluciones

### 1. El Demonio de Docker no estaba en ejecución
- **Síntoma:** El comando `docker-compose up` falló con el error `Cannot connect to the Docker daemon`.
- **Diagnóstico:** El servicio de Docker no estaba activo en el sistema anfitrión.
- **Solución:** Se instruyó al usuario para que ejecutara `sudo systemctl start docker` en su terminal para iniciar el servicio.

### 2. El Frontend de la Comercializadora no arrancaba
- **Síntoma:** El contenedor `frontend_comercializadora-1` se detenía inmediatamente después de iniciarse. Los logs mostraban el error `Error: Cannot find module '../../data/browsers'`.
- **Diagnóstico:** Este error apuntaba a una instalación corrupta o incompleta de la dependencia `caniuse-lite`, que es utilizada por `browserslist` y `react-scripts`. Un simple `npm install` (incluso forzando una reconstrucción sin caché) no solucionó el problema.
- **Solución:**
    1. Se modificó el archivo `frontend_comercializadora/package.json`.
    2. Se añadió un script `postinstall`: `"postinstall": "npx browserslist@latest --update-db"`.
    3. Este script fuerza la actualización de la base de datos de `caniuse-lite` cada vez que se ejecuta `npm install`.
    4. Se reconstruyó la imagen del contenedor con `docker-compose build frontend_comercializadora`. El nuevo script se ejecutó durante la construcción, reparando la dependencia.
    5. Se levantaron los contenedores de nuevo con `docker-compose up -d`.

### 3. Filtrado Incorrecto en Gestión de Pagos a Proveedores
- **Síntoma:** Al seleccionar un proveedor en el módulo de pagos, se mostraban órdenes de compra de todos los proveedores, no solo del seleccionado.
- **Diagnóstico:**
    1.  El frontend (`ComprasProveedor.js`, `PagosProveedor.js`) intentaba enviar el `supplier_id` en la llamada a la API.
    2.  La función de utilidad `api.list` en `frontend_manufacturera/src/utils/api.js` no estaba configurada para reenviar el objeto `params` a `axiosInstance.get`. Esto causaba que el `supplier_id` nunca llegara al backend.
    3.  El `PurchaseOrderViewSet` en el backend (`core/views.py`) no estaba filtrando por `supplier_id` cuando se recibía el parámetro.
    4.  El `PaymentViewSet` en el backend (`core/views.py`) no estaba filtrando por `purchase_order_id` cuando se recibía el parámetro.
    5.  La función `fetchPaymentHistory` en `PagosProveedor.js` estaba llamando incorrectamente al endpoint de órdenes de compra en lugar del endpoint de pagos.
- **Solución:**
    1.  Se modificó `frontend_manufacturera/src/utils/api.js` para que la función `list` aceptara y reenviara el objeto `params` a `axiosInstance.get`.
    2.  Se modificó `core/views.py` para que `PurchaseOrderViewSet.get_queryset` filtrara por `supplier_id`.
    3.  Se modificó `core/views.py` para que `PaymentViewSet.get_queryset` filtrara por `purchase_order_id`.
    4.  Se corrigió `PagosProveedor.js` para que `fetchPaymentHistory` llamara al endpoint `/payments/` y filtrara por `purchase_order`.
    5.  Se añadieron y luego se eliminaron `console.log` y `print` para depuración.
- **Estado:** Resuelto. El filtrado de órdenes de compra y pagos por proveedor funciona correctamente.

### 4. Estandarización de Condición IVA y Corrección de Flujo de Materias Primas
- **Síntoma:**
    1.  El campo "Condición IVA" en formularios de Clientes y Proveedores era de texto libre, sin opciones predefinidas.
    2.  Error al guardar una nueva Materia Prima: "supplier: This field may not be null." y "current_stock: A valid number is required.".
    3.  Error al guardar una nueva Materia Prima: "Nombre: raw material with this name already exists." a pesar de que la Materia Prima existía en DB pero no se mostraba en el listado del frontend.
- **Diagnóstico:**
    1.  Los campos `iva_condition` en los modelos `Client` y `Supplier` no tenían `choices` definidos. Los formularios de frontend usaban `TextField` en lugar de `Select`.
    2.  El campo `supplier` en el modelo `MateriaPrimaProveedor` era obligatorio (`null=False`), y el serializador no permitía `null`. El frontend enviaba `""` para un proveedor no seleccionado y `""` para `current_stock` vacío.
    3.  La lógica `handleSave` en `RawMaterialList.js` intentaba crear una nueva `RawMaterial` incluso si ya existía una con el mismo nombre.
    4.  El `RawMaterialViewSet` en el backend no filtraba por `name`, lo que impedía que el frontend encontrara `RawMaterial` existentes por nombre.
    5.  Un `TypeError` en el frontend (`existingRawMaterials.results is undefined`) debido a un acceso incorrecto a la respuesta de la API.
- **Solución:**
    1.  **Frontend:** Se modificaron `SupplierForm` y `ClientForm` para usar componentes `Select` con las opciones de IVA predefinidas. Se ajustó `handleChange` en `RawMaterialForm` para enviar `null` para `supplier` vacío y `0` para `current_stock` vacío.
    2.  **Backend (Modelos):** Se definieron `IVA_CONDITION_CHOICES` y se aplicaron a los campos `iva_condition` de los modelos `Client` y `Supplier`. Se hizo el campo `supplier` en `MateriaPrimaProveedor` opcional (`null=True, blank=True`) y se eliminó de `unique_together`.
    3.  **Backend (Serializadores):** Se hizo el campo `supplier` en `MateriaPrimaProveedorSerializer` opcional (`required=False, allow_null=True`).
    4.  **Backend (Vistas):** Se añadió un método `get_queryset` a `RawMaterialViewSet` para permitir el filtrado por `name`.
    5.  **Frontend (Lógica):** Se ajustó la lógica `handleSave` en `RawMaterialList.js` para primero buscar una `RawMaterial` existente por nombre y reutilizarla si se encuentra, antes de crear una nueva. Se corrigió el acceso a la respuesta de la API (`existingRawMaterials[0].id` en lugar de `existingRawMaterials.results[0].id`).
    6.  Se ejecutaron las migraciones de base de datos.
    7.  Se eliminaron todos los `console.log` y `print` de depuración.
- **Estado:** Resuelto. La estandarización de la condición de IVA y el flujo de creación/listado de Materias Primas funcionan correctamente.

## Estado Final
- **Todos los servicios están en línea y operativos.**
- **Backend:** Responde en `http://localhost:8000`.
- **Frontend Comercializadora:** Responde en `http://localhost:3001`.
- **Frontend Manufacturera:** Responde en `http://localhost:3002`.

La tarea de puesta en marcha se ha completado con éxito.