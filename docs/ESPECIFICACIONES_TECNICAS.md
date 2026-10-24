# Especificaciones técnicas — Firmador servicio

**Versión:** 0.2 · **Estado:** contrato preliminar · **Prioridad:** P2 · **Trazabilidad:** requisito RF07 de la monografía (apartado 3.2.2).

## 1. Arquitectura

API REST (NestJS) entre la web y el móvil. No ejecuta operaciones con claves privadas. El cliente y el móvil usan credenciales distintas. HTTPS fuera de pruebas locales.

Simplificaciones de la PoC (declaradas, no aptas para producción):

- 🔑 Autenticación con un token estático por actor (`CLIENTE_TOKEN`, `MOVIL_TOKEN`) en variables de entorno.
- 💾 Persistencia en disco local o SQLite; el PDF se borra al expirar la solicitud.
- 🔁 Polling del cliente; sin notificaciones push.

## 2. API v1

| Método | Ruta                                 | Actor   | Propósito                               |
| ------ | ------------------------------------ | ------- | --------------------------------------- |
| POST   | `/api/v1/solicitudes`                | Cliente | Crear solicitud y subir PDF (multipart) |
| GET    | `/api/v1/solicitudes/{id}`           | Cliente | Estado y metadatos                      |
| POST   | `/api/v1/solicitudes/{id}/tomar`     | Móvil   | Reservar (`PENDIENTE` → `EN_PROCESO`)   |
| GET    | `/api/v1/solicitudes/{id}/documento` | Móvil   | Descargar el PDF original               |
| POST   | `/api/v1/solicitudes/{id}/resultado` | Móvil   | Subir el PDF firmado                    |
| POST   | `/api/v1/solicitudes/{id}/rechazo`   | Móvil   | Registrar rechazo                       |
| GET    | `/api/v1/solicitudes/{id}/firmado`   | Cliente | Descargar el PDF firmado                |

Respuesta de creación (ejemplo):

```json
{
  "id": "uuid",
  "estado": "PENDIENTE",
  "sha256Documento": "hex",
  "expiraEn": "2026-10-25T18:00:00Z",
  "enlaceAplicacion": "https://<dominio>/firmar/uuid"
}
```

El enlace solo lleva el ID; nunca tokens.

## 3. Requisitos

| ID    | Requisito                                               | Verificación              |
| ----- | ------------------------------------------------------- | ------------------------- |
| FS-01 | Registrar la solicitud con el PDF y su SHA-256          | Prueba de API             |
| FS-02 | Rechazar las peticiones sin el token del actor correcto | Prueba de acceso denegado |
| FS-03 | Aplicar las transiciones válidas y la caducidad         | Pruebas de transición     |
| FS-04 | Entregar el original solo al móvil                      | Prueba de autorización    |
| FS-05 | Guardar el firmado sin sobrescribir el original         | Comparación de SHA-256    |
| FS-06 | Bloquear una segunda toma o un resultado repetido       | Prueba de repetición      |
| FS-07 | Entregar el firmado solo al cliente                     | Prueba de acceso denegado |
| FS-08 | Registrar eventos sin secretos ni contenido del PDF     | Revisión de logs          |

## 4. Seguridad

- No confiar en el ID como credencial; validar tamaño y tipo real del PDF; CORS restrictivo.
- Al recibir el resultado, comprobar que corresponde a la solicitud. Opcionalmente, verificar la firma con un validador independiente.
- App Links: publicar `/.well-known/assetlinks.json` si el servicio controla el dominio de apertura.

## 5. Evaluación

Aporta evidencia para RF07: solicitudes completadas extremo a extremo, casos de acceso indebido bloqueados y tiempo desde la creación hasta el resultado (separando la espera del usuario). Los indicadores formales los fija la monografía en el apartado 3.2.6.

## 6. Fuera de alcance

Gestión real de identidades, almacenamiento persistente de producción, colas, push y validación con efectos legales.
