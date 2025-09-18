# Visión del Sistema de Información Interempresarial Centralizado

Este documento describe la visión general para el desarrollo de un Sistema de Información (SI) robusto y escalable, diseñado para gestionar integralmente las operaciones y la información financiera de dos entidades con una relación comercial cercana: una empresa manufacturera de indumentaria y una empresa comercializadora. El objetivo principal es proporcionar una visión unificada y transparente en tiempo real del estado de funcionamiento de cada unidad de negocio y de las empresas globalmente.

## Empresas Involucradas:
*   **Empresa Manufacturera de Indumentaria:** Con dos fábricas (Medias e Indumentaria), gestiona producción, insumos, mantenimiento, operarios y costos.
*   **Empresa Comercializadora:** Con 3 locales físicos y una rama de e-commerce (Tienda Nube, Mercado Libre), gestiona ventas, inventario, costos financieros y adquisición de insumos.

## Arquitectura Clave:
El sistema se basará en una Arquitectura Orientada a Servicios (SOA) o de Microservicios.
*   **Base de Datos Única (Multi-tenant):** Ambas empresas compartirán la misma instancia de base de datos. El aislamiento de datos se garantizará mediante una columna `id_empresa` en cada tabla, filtrando todas las consultas y operaciones. Solo el dashboard gerencial podrá consolidar información sin este filtro.
*   **Backend Centralizado:** Un único backend servirá a ambas empresas.
*   **Frontends Separados:** Se desarrollarán dos aplicaciones web frontend completamente separadas, una para la empresa manufacturera y otra para la comercializadora, cada una con características y experiencias de usuario diferenciadas.

## Capas Principales:
*   **Capa de Presentación:** Dos frontends React separados, Dashboard Gerencial y Portal de Colaboración.
*   **Capa de Lógica de Negocio:** Módulos Financiero y de Inventario/Logística.
*   **Capa de Integración de Datos:** APIs RESTful para comunicación interna y con plataformas externas.
*   **Capa de Datos:** PostgreSQL como base de datos principal.

## Seguridad:
La seguridad es una prioridad absoluta, con autenticación/autorización robustas (RBAC), encriptación de datos, auditoría y protección contra ataques comunes, especialmente crucial en un modelo multi-tenant.

## Tecnologías Recomendadas:
*   **Backend:** Python (Django/Django REST Framework)
*   **Base de Datos:** PostgreSQL
*   **Frontend:** React (dos aplicaciones separadas)

## Módulos y Flujos de Proceso Clave:

La arquitectura de datos se ha refinado para reflejar con mayor precisión los flujos de negocio interconectados entre las áreas comercial y de manufactura.

### 1. Flujo Comercial y de Preventa

Este flujo se origina en la interacción con el cliente y culmina en una orden para la fábrica.

*   **`Design` (Diseño):** Es la entidad central del producto. Actúa como una "receta" que define qué materias primas y procesos se necesitan, incluyendo cantidades y orden secuencial.
*   **`Quotation` (Cotización):** Un documento no vinculante para un cliente, que contiene una lista de `QuotationItem`s basados en los `Design`s. Permite negociar antes de una venta.
*   **`Sale` (Venta):** La transacción comercial formal. Se puede originar a partir de una `Quotation` aceptada o crearse directamente. Contiene `SaleItem`s que detallan los diseños vendidos, cantidades y precios unitarios.
*   **`OrderNote` (Nota de Pedido):** **Generada automáticamente** al crear una `Sale`. Es el documento que formaliza la solicitud interna a la fábrica y actúa como disparador del proceso de producción.

### 2. Flujo de Producción (Empresa Manufacturera)

Este flujo se activa a partir de una `OrderNote` y gestiona la fabricación del producto.

*   **`ProductionOrder` (Orden de Producción):** Una `OrderNote` puede generar una o varias órdenes de producción, cada una para un `Design` específico. Aquí se detalla talle, color y cantidad a producir.
*   **`RawMaterial` (Materia Prima):** Materiales base para la producción. Ahora incluyen un campo `cost` para el cálculo de costos del producto.
*   **`Process` (Proceso de Fábrica):** Pasos individuales del proceso productivo (ej. corte, costura). También incluyen un campo `cost`.
*   **`CuttingOrder` (Orden de Corte):** Agrupa varias `ProductionOrder`s para optimizar el uso de materiales.
*   **`ProductionProcessLog` (Registro de Proceso):** Registra el avance de una `ProductionOrder` a través de los distintos `Process`.
*   **`DeliveryNote` (Remito):** Documento para registrar la salida de producto terminado del inventario para su entrega al cliente, cerrando el ciclo iniciado por la `Sale`.

### 3. Módulos de Soporte y Financieros

Estos módulos son transversales y dan soporte a las operaciones.

*   **Gestión de Inventario:**
    *   `Inventory`: Stock de producto terminado en los locales.
    *   `StockAdjustment`: Permite la corrección manual del stock de `RawMaterial` y `Product` con permisos de administrador.
*   **Módulos Financieros:**
    *   `Account` (Cuenta Contable): Ahora incluye un `account_type` ('Ingreso', 'Egreso', etc.) que es clave para los reportes financieros.
    *   `Transaction` (Transacción Contable): Registra todos los movimientos de dinero.
    *   `Client`, `Supplier`, `PurchaseOrder`, `Invoice`, `Payment`, etc., se mantienen como soporte fundamental del ciclo comercial y de aprovisionamiento.