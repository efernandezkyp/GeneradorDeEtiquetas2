# Debug Session: `label-create-error`

- Status: OPEN
- Fecha: 2026-06-16
- Sintoma: error al crear etiquetas en frontend desplegado en Vercel con backend desplegado en Render.
- Objetivo: identificar la causa exacta del fallo en `POST /api/labels` y del posible `GET /api/labels` asociado.

## Hipotesis iniciales

1. La empresa del usuario no tiene configurado `defaultDestinationCompany` y `LabelService` rechaza la creacion.
2. El backend en Render no tiene aplicadas todas las migraciones de PostgreSQL y falla al leer/escribir campos nuevos como `productsJson`, historial o defaults de company.
3. El backend en Render esta corriendo con un Prisma Client desactualizado respecto del schema desplegado.
4. El payload que envia el frontend no coincide con el DTO actual del backend y Zod devuelve error o una ruta posterior rompe por datos incompletos.
5. La creacion funciona pero el listado falla inmediatamente despues por un error en consultas de labels/historial, haciendo parecer que fallo la creacion.

## Evidencia a recolectar

- Request/response de `POST /api/labels` en Network.
- Response body exacto del error.
- Logs del servicio backend en Render en el momento del fallo.
- Estado de configuracion de la empresa del usuario autenticado.
- Resultado de `GET /api/labels` y, si aplica, stacktrace asociado.
