# AGENTS.md — firmador-servicio

Backend Express (Node.js, JavaScript) de prueba de concepto académica: guarda los documentos del sistema de gestión documental de ejemplo, gestiona las solicitudes de firma entre `firmador-cliente` y `firmador-movil`, y lee los datos de las firmas. Escucha en el puerto 3000; la web se sirve aparte en el 8080. No firma ni maneja claves.

## Fuente de verdad

- Requisitos FS-xx, modelo, API y simplificaciones: `docs/ESPECIFICACIONES_TECNICAS.md`. Léela por secciones según la tarea; no la copies aquí ni la reformules en el código. Si la API cambia, actualiza primero la especificación.
- Lo que la web espera: `../firmador-cliente/docs/ESPECIFICACIONES_TECNICAS.md`.
- Lado móvil (enlace y llamadas, FM-13): `../firmador-movil/docs/ESPECIFICACIONES_TECNICAS.md`, §6.
- Contexto de la monografía: `../../AGENTS.md`, `../../docs/prueba_de_concepto.md`, `../../docs/indicadores.md`. Consúltalos solo si la tarea toca evaluación o redacción.

## Prioridad y orden

Todo el repositorio es P2 (iteración I5, RF07) y se hace antes que la web, que depende de él. Orden: base (Express, CORS para `ORIGEN_CLIENTE`, `db.json`) → documentos (FS-01) → solicitudes y rutas del móvil (FS-02 a FS-04, FS-07) → resultado y extracción de firmas (FS-05, FS-06). P3 (FS-08, FS-09) solo con P2 cerrado. Si el tiempo no alcanza, lo pendiente se informa como no evaluado (riesgo R5).

## Comandos

- Node 24. `npm install` · `npm start` (`node --env-file=.env servidor.js`) · `npm run dev` (lo mismo con `--watch`).
- `.env` fuera de git; `.env.example` con los nombres del §1 de la especificación y sin valores reales.
- Mientras no exista FM-13, el móvil se simula con `curl`. Para la extracción de firmas, usar los PDF firmados por el teléfono en `../../evidencias/I3_firma_pdf/` e `I4_validacion/` (solo lectura; no modificarlos ni moverlos).
- El teléfono alcanza el servicio por `http://<IP-del-equipo>:3000` en la misma red (abrir el puerto en el cortafuegos si hace falta) o por el dominio. Nada de `localhost` ni IPs fijas en el código: todo por variables de entorno.

## Reglas no negociables

- Stack: Express y `node-forge`, módulos ES, sin TypeScript, sin ORM ni base de datos. Dependencia nueva: justificar necesidad y licencia.
- Solo casos ideales: sin validaciones ni manejo detallado de errores mientras P2 no esté cerrado; un manejador final responde 500 con un mensaje genérico.
- Sin credenciales ni secretos compilados en la app: el móvil opera la solicitud con su ID (UUID v4). El enlace de apertura lleva solo el ID.
- Nada de contenido de PDF en logs ni en `db.json`; solo nombres, hashes, estados y horas.
- Reemplazar el PDF por el firmado es una regla de negocio de este sistema de ejemplo, no del firmador móvil. Guardar el SHA-256 de lo entregado al móvil y del resultado.
- Los datos de firma se leen del PDF recibido, no de lo que declare el cliente o el móvil. Es una lectura, no una validación: no responder ni rotular nada como «firma válida».
- Fuera de alcance: claves, firma, emisión de certificados, autenticación real, HTTPS y producción.

## Evidencia

Cada ejecución de prueba se registra en `../../evidencias/I5_<nombre>/` con los campos de la §6 de la especificación (horas de los eventos y hashes). Ejecuciones previas a la definición de indicadores son de desarrollo, no resultados. No afirmar en código, commits ni docs validez legal, equivalencia de seguridad ni compatibilidad institucional.

## Forma de trabajo

- Git: el usuario gestiona _staging_ y commits. No ejecutes `git add/commit/mv/rm/stash/restore --staged`; usa `mv`/`rm`.
- Cambios mínimos y directos; indica qué FS-xx cubre cada cambio y cómo se verificó.
- Ante ambigüedad en un requisito, pregunta antes de implementar. No pidas confirmación para lo ya autorizado.
- Español en la comunicación y en nombres de archivos, funciones, variables y campos JSON; en inglés los términos de estándares y APIs (CMS, `ByteRange`, `SubFilter`, PAdES). Comentarios solo donde aporten.
- Código corto y legible: pocos archivos (p. ej. `servidor.js`, `datos.js`, `firmas.js`), sin capas ni abstracciones que no se usen.
- README solo cambia si queda incorrecto o hace falta para usar el servicio; breve y fiel al código.

## Verificación y cierre

- Sin pruebas automatizadas. Se verifica con `curl` y con el flujo completo en el teléfono cuando estén la web y FM-13.
- Al cerrar: qué cambió y dónde, cómo se verificó (comandos y respuestas relevantes) y limitaciones. No afirmes ejecuciones que no ocurrieron.
