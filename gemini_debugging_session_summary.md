# Resumen de Sesión de Depuración: Creación de Remitos

## Problema Inicial
El usuario reportó que la creación de un **Remito** (`DeliveryNote`) fallaba, inicialmente con un error 500 en el backend.

## Proceso de Depuración y Soluciones Aplicadas

La resolución de este problema requirió una depuración profunda a través de múltiples capas de la aplicación, descubriendo una cascada de errores:

1.  **Error 1 (500 - `OperationalError`):** `no such column: core_deliverynote.tipo`.
    *   **Causa:** El modelo `DeliveryNote` en `models.py` había sido modificado, pero las migraciones no se habían creado ni aplicado.
    *   **Solución:** Se intentó crear la migración, pero falló secuencialmente debido a nuevos campos no nulables sin valor por defecto (`created_at`, `fecha`, `origen`). Se corrigió el modelo para añadir valores por defecto o permitir nulos y se ejecutaron `makemigrations` y `migrate` con éxito.

2.  **Error 2 (400 - `Bad Request`):** `Invalid pk "3" - object does not exist` en el campo `destino`.
    *   **Causa:** Se descubrió que el formulario del frontend (`NuevoRemitoForm.js`) enviaba incorrectamente el ID del **Cliente** en el campo `destino` cuando el tipo de remito era "Venta".
    *   **Solución:** Se modificó la función `handleSubmit` en el frontend para enviar `destino: null` cuando el tipo es "Venta", lo cual es la lógica correcta según el modelo del backend.

3.  **Error 3 (500 - `NameError`):** `name 'serializers' is not defined`.
    *   **Causa:** El archivo `core/views.py` intentaba lanzar una `ValidationError` sin haber importado el módulo `serializers` de DRF.
    *   **Solución:** Se añadió `from rest_framework import serializers` al archivo `core/views.py`.

4.  **Error 4 (500 - Lógica de Negocio):** El `NameError` anterior ocultaba una `ValidationError` con el mensaje "Se requiere especificar una venta".
    *   **Causa:** El método `perform_create` buscaba la venta asociada con la clave incorrecta: `validated_data.get('sale')` en lugar de `validated_data.get('venta_asociada')`.
    *   **Solución:** Se corrigió el nombre del campo a `venta_asociada` en `core/views.py`.

5.  **Error 5 (500 - `ValueError`):** `Cannot query "Venta #3 ...": Must be "DeliveryNote" instance`.
    *   **Causa:** Al calcular las cantidades ya entregadas, la consulta al ORM usaba un nombre de campo incorrecto en el filtro: `delivery_note__sale` en lugar de `delivery_note__venta_asociada`.
    *   **Solución:** Se corrigió la consulta en `core/views.py`.

6.  **Error 6 (500 - `FieldError`):** `Cannot resolve keyword 'local' into field`.
    *   **Causa:** El código intentaba consultar el modelo `Inventory` usando el campo `local`, cuando el nombre correcto del campo es `warehouse`.
    *   **Solución:** Se reemplazaron dos ocurrencias de `local=...` por `warehouse=...` en `core/views.py`.

7.  **Error 7 (ERR_NETWORK - `IndentationError`):** El servidor del backend dejó de responder.
    *   **Causa:** Una de las correcciones anteriores, realizada con la herramienta `replace`, introdujo un error de sintaxis (indentación incorrecta) en `core/views.py`, impidiendo que el servidor se iniciara.
    *   **Solución:** Se reemplazó el método `perform_create` completo con una versión íntegra que contenía todas las correcciones y la sintaxis correcta.

8.  **Error 8 (500 - `ValueError`):** `Cannot query "Fábrica...": Must be "Warehouse" instance`.
    *   **Causa:** Se descubrió un error de lógica fundamental. El código ignoraba el almacén de "Origen" seleccionado y hardcodeaba la búsqueda de stock en un `Local` llamado "Fábrica", confundiendo el modelo `Local` con el modelo `Warehouse`.
    *   **Solución:** Se reescribió la lógica de `perform_create` para eliminar la creación del `Local` "Fábrica" y en su lugar usar el `origen_warehouse` (el almacén de origen seleccionado en el formulario) para todas las operaciones de consulta y descuento de stock.

9.  **Estado Final (400 - `Bad Request`):** `"No hay registro de inventario..."`.
    *   **Causa:** El código ahora funciona correctamente y lanza una validación de negocio porque no hay datos de stock para el producto en el almacén seleccionado.
    *   **Conclusión:** El ciclo de depuración de código ha finalizado con éxito. El problema restante es un asunto de datos que el usuario debe resolver desde la propia aplicación.

## Conclusión de la Sesión
La funcionalidad de creación de remitos ha sido reparada exitosamente después de una intensa y profunda sesión de depuración que abarcó desde la base de datos hasta la lógica de negocio del backend y el frontend. El sistema ahora es más robusto y proporciona validaciones correctas.