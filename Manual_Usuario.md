# Manual de Usuario: Sistema de Información Interempresarial

Este manual proporciona instrucciones para configurar, ejecutar e interactuar con el proyecto "Sistema de Información Interempresarial".

## 1. Visión General del Proyecto

El Sistema de Información Interempresarial está diseñado para gestionar las operaciones y finanzas de una empresa manufacturera de indumentaria y una empresa comercializadora. Se basa en una arquitectura multi-tenant con un backend centralizado (Django) y dos frontends separados (React).

## 2. Configuración y Despliegue con Docker Compose

Para configurar y desplegar la aplicación, asegúrate de tener Docker y Docker Compose instalados en tu sistema. Luego, sigue estos pasos:

1.  **Clonar el Repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd Sistema_Fanaticos
    ```

2.  **Construir las Imágenes de Docker:**
    Navega a la raíz del proyecto (donde se encuentra `docker-compose.yml`) y ejecuta:
    ```bash
    docker-compose build
    ```

3.  **Iniciar los Servicios de la Aplicación:**
    Este comando levantará los contenedores para el backend, los frontends y la base de datos en segundo plano:
    ```bash
    docker-compose up -d
    ```

4.  **Aplicar Migraciones de la Base de Datos:**
    Es crucial hacer esto después de que el contenedor de la base de datos esté en funcionamiento. Ejecuta:
    ```bash
    docker-compose exec backend python manage.py migrate
    ```

5.  **Crear un Superusuario (Opcional):**
    Para acceder al panel de administración de Django, puedes crear un superusuario ejecutando:
    ```bash
    docker-compose exec backend python manage.py createsuperuser
    ```

## 3. Interacción con la Aplicación

### Acceso a Dashboards

Los dashboards se han integrado en las aplicaciones frontend. Además de los dashboards existentes, el **Dashboard de Gestión** ahora incluye la funcionalidad de **Crecimiento Proyectado**.

*   **Dashboard de Fabricación:** Acceder a través de la aplicación `frontend_manufacturera`.
*   **Dashboard de Comercialización:** Acceder a través de la aplicación `frontend_comercializadora`.
*   **Dashboard de Gestión:** Acceder a través de la aplicación `frontend_comercializadora`. Incluye gráficos de Crecimiento Proyectado para Producción, Ventas y Datos Financieros.

### Endpoints de la API (para desarrolladores/pruebas)

Los siguientes endpoints de la API están disponibles en `http://localhost:8000/api/`:

*   **Modelos Generales:**
    *   `/tenants/`
    *   `/products/`
    *   `/users/`
    *   `/roles/`
    *   `/processes/`
    *   `/order-notes/`
    *   `/production-orders/`
    *   `/raw-materials/`
    *   `/cutting-orders/`
    *   `/production-process-logs/`
    *   `/locals/`
    *   `/sales/`
    *   `/inventories/`
    *   `/suppliers/`
    *   `/purchase-orders/`
    *   `/purchase-order-items/`
    *   `/accounts/`
    *   `/cash-registers/`
    *   `/transactions/`
    *   `/clients/`
    *   `/invoices/`
    *   `/payments/`
    *   `/bank-statements/`
    *   `/bank-transactions/`
    *   `/banks/`
    *   `/payment-method-types/`
    *   `/financial-cost-rules/`
    *   `/factories/`
    *   `/employees/`
    *   `/salaries/`
    *   `/vacations/`
    *   `/permits/`
    *   `/medical-records/`
    *   `/quotations/`
    *   `/quotation-items/`

*   **Endpoints del Dashboard de Fabricación:**
    *   `/manufacturing/production-volume/`
    *   `/manufacturing/process-completion-rate/`
    *   `/manufacturing/raw-material-consumption/`
    *   `/manufacturing/defective-products-rate/`

*   **Endpoints del Dashboard de Comercialización:**
    *   `/trading/sales-volume/`
    *   `/trading/inventory-turnover-rate/`
    *   `/trading/supplier-performance/`

*   **Endpoints del Dashboard de Gestión:**
    *   `/management/overall-profit-loss/`
    *   `/management/current-balance/`
    *   `/management/revenue-expenses/`
    *   `/management/projected-growth/` (Nuevo: Crecimiento Proyectado)

Para acceder a los datos de un tenant específico, agregue `?tenant_id=<ID_DEL_TENANT>` a la URL del endpoint.
