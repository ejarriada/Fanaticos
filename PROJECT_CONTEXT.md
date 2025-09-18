# Contexto del Proyecto: Sistema de Información Interempresarial

## 0. Arquitectura del Sistema y Consideraciones Clave

El sistema está diseñado con una arquitectura de microservicios, dockerizada para facilitar el despliegue y la gestión. Se compone de:
*   **Un Backend Centralizado:** Implementado con Django REST Framework.
*   **Dos Frontends Separados:**
    *   `frontend_manufacturera`: Interfaz de usuario para la gestión de operaciones de manufactura.
    *   `frontend_comercializadora`: Interfaz de usuario para la gestión de operaciones comerciales.

**Consideraciones Clave para Evitar Errores:**
*   **Distinción de Frontends:** Es crucial recordar que existen dos frontends distintos. Las funcionalidades deben implementarse en el frontend correcto (`manufacturera` o `comercializadora`) según el dominio de la tarea.
*   **Módulo de Cotizaciones:** El módulo de gestión de cotizaciones (`QuotationManagement`) reside **exclusivamente** en `frontend_manufacturera`. Su formulario (`QuotationForm`) se integra como una **sub-pestaña** dentro de `QuotationManagement`, no como una página separada ni como un diálogo modal. Cualquier implementación de cotizaciones en `frontend_comercializadora` es errónea y debe ser revertida.

Este documento resume el estado actual del proyecto "Sistema de Información Interempresarial" para facilitar la reanudación del trabajo en futuras sesiones.

## 1. Visión General del Proyecto:
El objetivo es desarrollar un SI robusto y escalable para gestionar operaciones y finanzas de una empresa manufacturera de indumentaria y una empresa comercializadora. Se basa en una arquitectura multi-tenant con una única base de datos, un backend centralizado y dos frontends React separados.

## 2. Estado Actual del Backend (Django):

*   **Directorio del Proyecto:** `/home/esteban/GitHub/Sistema_Fanaticos/`
*   **Entorno Virtual:** `.venv/` (ubicado en la raíz del proyecto)
*   **Proyecto Django:** `sistema_fanaticos_backend`
*   **Aplicación Principal:** `core`
*   **Paquetes Instalados:** Django, Django REST Framework, djangorestframework-simplejwt, **dj_database_url, django-cors-headers**.

### Modelos de Base de Datos Definidos:

*   **Modelos Base:**
    *   `Tenant`: Representa cada empresa (manufacturera o comercializadora).
    *   `TenantAwareModel`: Clase abstracta para modelos que pertenecen a un tenant.
    *   `TenantManager`: Manager para filtrar automáticamente por tenant.
    *   `Product`: Modelo genérico para productos (utilizado por ambas empresas).
    *   `User`: Modelo de usuario personalizado.
    *   `SystemRole`: Modelo para definir roles de sistema.

*   **Flujo de Producción (Empresa Manufacturera):**
    *   `Process`: Define los procesos de fábrica (ej. Corte, Costura).
    *   `OrderNote`: Nota de Pedido del cliente.
    *   `ProductionOrder`: Orden de Producción por artículo/talle.
    *   `RawMaterial`: Materia prima con trazabilidad (QR).
    *   `CuttingOrder`: Orden de Corte que agrupa OPs.
    *   `ProductionProcessLog`: Registro de cada paso de la OP por proceso.

*   **Módulos de Comercialización (Empresa Comercializadora):**
    *   `Local`: Representa un local físico.
    *   `Sale`: Registro de ventas (físicas o e-commerce).
    *   `Inventory`: Stock de productos por local.
    *   `Supplier`: Proveedor (con CUIL/CUIT).
    *   `PurchaseOrder`: Orden de Compra.
    *   `PurchaseOrderItem`: Ítems de la Orden de Compra.

*   **Módulos Financieros (Comunes/Ambas Empresas):**
    *   `Account`: Cuenta contable.
    *   `CashRegister`: Caja o punto de venta.
    *   `Transaction`: Movimiento financiero.
    *   `Client`: Cliente (con CUIL/CUIT).
    *   `Invoice`: Factura (compra/venta).
    *   `Payment`: Registro de pagos/cobros.
    *   `BankStatement`: Extracto bancario.
    *   `BankTransaction`: Transacción bancaria.
    *   `Bank`: Banco.
    *   `PaymentMethodType`: Tipo de medio de pago.
    *   `FinancialCostRule`: Regla de costo financiero.
    *   `StockAdjustment`: Registro de ajustes manuales de stock para productos y materias primas.

*   **Módulos de Recursos Humanos:**
    *   `Factory`: Fábrica (para asociar empleados).
    *   `Role`: Rol de empleado.
    *   `Employee`: Información del empleado.
    *   `Salary`: Sueldos.
    *   `Vacation`: Vacaciones.
    *   `Permit`: Permisos.
    *   `MedicalRecord`: Carpetas médicas.

*   **Módulo de Cotizaciones/Presupuestos:**
    *   `Quotation`: Cotización/Presupuesto de venta.
    *   `QuotationItem`: Ítem de cotización.

### Serializadores, Vistas y URLs (API RESTful):
Se han implementado serializadores, vistas (ViewSets) y URLs para la mayoría de los modelos definidos, siguiendo un patrón `TenantAware` para la gestión multi-tenant. Esto incluye:
*   Modelos Base: `Tenant`, `Product`, `User`, `SystemRole`.
*   Flujo de Producción: `Process`, `OrderNote`, `ProductionOrder`, `RawMaterial`, `CuttingOrder`, `ProductionProcessLog`.
*   Comercialización: `Local`, `Sale`, `Inventory`, `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`.
*   Financieros: `Account`, `CashRegister`, `Transaction`, `Client`, `Invoice`, `Payment`, `BankStatement`, `BankTransaction`, `Bank`, `PaymentMethodType`, `FinancialCostRule`, `StockAdjustment`.
*   Recursos Humanos: `Factory`, `EmployeeRole`, `Employee`, `Salary`, `Vacation`, `Permit`, `MedicalRecord`.
*   Cotizaciones: `Quotation`, `QuotationItem`.

Además, se han implementado vistas de API específicas para dashboards de Fabricación, Comercialización y Gestión.

## 3. Estado Actual del Frontend:

*   **Aplicación Manufacturera (`frontend_manufacturera`):**
    *   Aplicación React con integración de Material-UI.
    *   **Módulos Implementados (CRUD):**
        *   Gestión de Usuarios
        *   Gestión de Procesos
        *   Gestión de Notas de Pedido
        *   Gestión de Órdenes de Producción
        *   Gestión de Materia Prima
        *   Gestión de Órdenes de Corte
        *   Gestión de Registros de Proceso de Producción
        *   Gestión de Cuentas
        *   Gestión de Cajas
        *   Gestión de Transacciones
        *   Gestión de Clientes
        *   Gestión de Facturas
        *   Gestión de Pagos
        *   Gestión de Extractos Bancarios
        *   Gestión de Bancos
        *   Gestión de Tipos de Pago
        *   Gestión de Reglas de Costo Financiero
        *   Gestión de Fábricas
        *   Gestión de Roles de Empleado
        *   Gestión de Empleados
        *   Gestión de Salarios
        *   Gestión de Vacaciones
        *   Gestión de Permisos
        *   Gestión de Historial Médico
        *   **Gestión de Cotizaciones:** Implementado con una interfaz de pestañas, donde el formulario de creación/edición se integra como una sub-pestaña.
        *   **Gestión de Inventario (Consolidado):** Módulo con pestañas para Materia Prima y Productos Terminados.
        *   **Ajuste de Stock:** Funcionalidad integrada en el módulo de Inventario para realizar correcciones manuales de stock.
    *   **Estado:** La mayoría de los módulos están implementados y funcionales. Se han realizado depuraciones y correcciones de errores de compilación e importación.

*   **Aplicación Comercializadora (`frontend_comercializadora`):**
    *   Aplicación React básica creada. Se asume una estructura de módulos paralela a la manufacturera, enfocada en ventas y comercialización.
    *   **Nota Importante:** El módulo de cotizaciones fue erróneamente implementado aquí en una sesión anterior y ha sido completamente removido.

## 4. Arquitectura de Despliegue (Docker):
(Se mantiene la descripción existente)

## 5. Tareas Realizadas Recientemente:
*   **Implementación y Depuración de Módulos Frontend:**
    *   Sincronización y corrección del módulo de Gestión de Usuarios en `frontend_manufacturera`.
    *   Implementación y verificación de los módulos de Gestión de Procesos y Notas de Pedido.
    *   Implementación del módulo consolidado de Gestión de Inventario (Materia Prima y Productos Terminados).
    *   Implementación de la funcionalidad de Ajuste de Stock en el módulo de Inventario.
    *   Implementación del módulo de Gestión de Extractos Bancarios.
*   **Desarrollo y Depuración de Backend para Ajuste de Stock:**
    *   Creación del modelo `StockAdjustment`, su serializador, vista y URL.
    *   Implementación de la lógica de actualización de stock mediante señales.
    *   Resolución de errores de dependencias (`dj_database_url`, `django-cors-headers`).
    *   Resolución de errores de importación (`NameError`) en `core/serializers.py` y `core/views.py`.
*   **Documentación:**
    *   Generación del archivo `estructura.md` con la estructura de directorios del proyecto.
    *   Actualización continua de `WORK_PLAN.md` y `gemini_debugging_session_summary.md`.

## 6. Próximos Pasos:
*   **Verificación Crítica (Backend):** El usuario debe ejecutar `docker-compose exec backend python manage.py migrate` para asegurar que todas las migraciones del backend se apliquen correctamente.
*   **Verificación Crítica (Frontend - Login):** El usuario debe verificar si el problema de "Tenant ID not available" al iniciar sesión se ha resuelto.
*   **Verificación (Frontend - Ajuste de Stock):** El usuario debe probar la funcionalidad de ajuste de stock en el módulo de "Inventario" (crear, modificar, verificar actualización de stock).
*   **Próxima Gran Tarea:** Una vez confirmadas las verificaciones anteriores, se abordará la **Gestión de Ventas** para el frontend de manufactura, con la aclaración de requisitos que se discutió previamente.