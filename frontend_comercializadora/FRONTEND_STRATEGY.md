### Estrategia de Mejora del Frontend

1.  **Biblioteca de Componentes: Material-UI (MUI)**
    *   **Fundamento:** Usaremos MUI como la única biblioteca de componentes. Esto nos proporcionará un conjunto completo de elementos (tablas, formularios, botones, diálogos, etc.) con un diseño profesional y cohesivo.
    *   **Instalación:** Se añadirán las dependencias de MUI (`@mui/material`, `@emotion/react`, `@emotion/styled`) al proyecto.

2.  **Patrón de Diseño para Módulos (Unicidad):**
    *   **Vistas CRUD Estándar:** Para cada módulo de gestión (Clientes, Proveedores, etc.), implementaremos un patrón consistente:
        *   Una **vista principal** que mostrará los datos en una tabla de MUI (`<Table>`).
        *   Esta tabla incluirá funcionalidades de **búsqueda y filtrado**.
        *   Un botón principal para **"Añadir Nuevo"** que abrirá un diálogo (modal).
    *   **Formularios en Diálogos (Modales):** Para las acciones de **Crear y Editar**, usaremos un componente de diálogo (`<Dialog>`) de MUI. Esto evita tener que navegar a una página separada para formularios sencillos, haciendo la experiencia de usuario más fluida.

3.  **Gestión de Estilos y Tema:**
    *   **Tema Centralizado:** Crearemos un archivo `src/theme.js` para definir un tema de MUI personalizado. Aquí configuraremos la paleta de colores, la tipografía (fuente Roboto) y otros estilos globales para que toda la aplicación comparta la misma identidad visual.
    *   **Estilos por Componente:** Para estilos específicos, usaremos el `sx` prop de MUI, que permite escribir CSS directamente en el componente de una manera encapsulada y eficiente.

4.  **Interacción con la API:**
    *   **Capa de API Centralizada:** Verificaremos y utilizaremos un archivo `src/utils/api.js` que gestionará todas las llamadas al backend con `axios`. Este centralizador se encargará de añadir automáticamente las cabeceras necesarias en cada petición (como el token de autenticación y el `X-Tenant-ID`).
