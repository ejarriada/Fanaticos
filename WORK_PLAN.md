# Plan de Trabajo: Puesta en Marcha del Sistema

Este documento describe los pasos para restaurar y verificar el funcionamiento del sistema "Fanaticos" después de la recuperación de archivos y el cambio de directorio.

## 1. Diagnóstico y Correcciones Realizadas

Se ha realizado un análisis exhaustivo del sistema para identificar problemas derivados del cambio de entorno.

- **[CORREGIDO] Error de Comunicación Frontend-Backend:**
  - **Problema:** Los frontends (`frontend_manufacturera` y `frontend_comercializadora`) intentaban conectarse a `http://localhost:8000/api`. Dentro de Docker, `localhost` apunta al propio contenedor del frontend, no al del backend.
  - **Solución:** Se modificaron los archivos `src/utils/axiosInstance.js` en ambos frontends para que apunten al nombre del servicio de Docker: `http://backend:8000/api`. Este cambio es permanente y necesario para el funcionamiento en contenedores.

- **[VERIFICADO] Integridad de Archivos de Configuración:**
  - Se revisaron `sistema_fanaticos_backend/settings.py` y los `Dockerfile` de cada servicio.
  - **Resultado:** No se encontraron rutas absolutas o incorrectas. Utilizan rutas relativas, lo cual es una buena práctica.

- **[REVERTIDO] Cambio Temporal de Puertos:**
  - Se revirtieron los cambios en `docker-compose.yml` para mantener los puertos originales (`8000`, `3001`, `3002`).

## 2. Pasos para la Puesta en Marcha (Post-Reinicio)

- **[PENDIENTE] Reinicio del Equipo:**
  - **Acción:** El usuario reiniciará el equipo.
  - **Objetivo:** Liberar todos los puertos de red (`8000`, `3001`, `3002`) que estaban previamente ocupados.

- **[PENDIENTE] Levantar el Entorno Docker:**
  - **Comando:** `docker-compose up --build -d`
  - **Objetivo:** Construir las imágenes de los contenedores e iniciarlos en segundo plano una vez que los puertos estén libres.

## 3. Verificación Final

Una vez que los contenedores estén en ejecución:

1.  **Verificar Logs:** Ejecutar `docker-compose logs -f` para ver la salida de los tres contenedores y asegurar que no haya errores.
2.  **Verificar Backend:** Abrir en un navegador o usar `curl` para acceder a `http://localhost:8000/api/`. Se debería obtener una respuesta de la API.
3.  **Verificar Frontend Comercializadora:** Abrir en un navegador `http://localhost:3001`. Debería cargar la aplicación de React.
4.  **Verificar Frontend Manufacturera:** Abrir en un navegador `http://localhost:3002`. Debería cargar la aplicación de React.