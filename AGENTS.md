# AGENTS.md — firmador-servicio

Backend Express (Node.js, JavaScript) de prueba de concepto académica: guarda los documentos del sistema de gestión documental de ejemplo, gestiona las solicitudes de firma entre `firmador-cliente` y `firmador-movil`, y lee los datos de las firmas. Escucha en el puerto 3000; la web se sirve aparte en el 8080. No firma ni maneja claves.

## Comandos

- Node 24. `npm install` · `npm start` (`node --env-file=.env src/servidor.js`) · `npm run dev` (lo mismo con `--watch`).
- Docker: imagen `node:24-alpine` con la carpeta `./datos` del proyecto montada en `/app/datos` para los datos persistentes; comandos en `INSTALL.md`.
- `.env` fuera de git; `.env.sample` con los nombres del §1 de la especificación y sin valores reales.
- El teléfono alcanza el servicio por `http://<IP-del-equipo>:3000` en la misma red (abrir el puerto en el cortafuegos si hace falta) o por el dominio. Nada de `localhost` ni IPs fijas en el código: todo por variables de entorno.

## Reglas no negociables

- Stack: Express y `node-forge`, módulos ES, sin TypeScript, sin ORM. Persistencia en `datos/db.json` y los PDF en `datos/archivos/{id}.pdf`, bajo `DIR_DATOS`. Dependencia nueva: justificar necesidad y licencia.
- Solo casos ideales: sin validaciones ni manejo detallado de errores mientras P2 no esté cerrado; un manejador final responde 500 con un mensaje genérico.
- Sin credenciales ni secretos compilados en la app: el móvil opera la solicitud con su ID (UUID v4). El enlace de apertura lleva solo el ID, la URL pública del servicio (`URL_PUBLICA`) y, opcionalmente, el nombre del sistema (`NOMBRE_SISTEMA`).
- Nada de contenido de PDF en logs ni en los datos guardados; solo nombres, hashes, estados y horas.
- Reemplazar el PDF por el firmado es una regla de negocio de este sistema de ejemplo, no del firmador móvil. Guardar el SHA-256 de lo entregado al móvil y del resultado.
- Los datos de firma se leen del PDF recibido, no de lo que declare el cliente o el móvil. Es una lectura, no una validación: no responder ni rotular nada como «firma válida».
- Fuera de alcance: claves, firma, emisión de certificados, autenticación real, HTTPS y producción.

## Forma de trabajo

- Git: el usuario gestiona _staging_ y commits. No ejecutes `git add/commit/mv/rm/stash/restore --staged`; usa `mv`/`rm`.
- Cambios mínimos y directos; indica qué FS-xx cubre cada cambio y cómo se verificó.
- Ante ambigüedad en un requisito, pregunta antes de implementar. No pidas confirmación para lo ya autorizado.
- Español en la comunicación y en nombres de archivos, funciones, variables y campos JSON; en inglés los términos de estándares y APIs (CMS, `ByteRange`, `SubFilter`, PAdES). Comentarios solo donde aporten.
- Código corto y legible en `src/`: `servidor.js` (solo HTTP: CORS, rutas, manejador 500), `documentos.js`, `solicitudes.js`, `firmas.js` y `datos.js`. Sin capas ni abstracciones que no se usen.
- Solo `datos.js` toca el almacenamiento y expone funciones `async` por operación (p. ej. `obtenerDocumento`, `guardarSolicitud`, `guardarArchivo`). El resto no conoce `db.json` ni rutas de archivos, para que el cambio previsto a PostgreSQL solo afecte a ese módulo.
- README solo cambia si queda incorrecto o hace falta para usar el servicio; breve y fiel al código.

## Verificación y cierre

- Sin pruebas automatizadas. Se verifica con `curl` y con el flujo completo en el teléfono cuando estén la web y FM-13.
- Al cerrar: qué cambió y dónde, cómo se verificó (comandos y respuestas relevantes) y limitaciones. No afirmes ejecuciones que no ocurrieron.
