// Único módulo que conoce el almacenamiento: db.json y los PDF bajo DIR_DATOS.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIR_DATOS = process.env.DIR_DATOS ?? 'datos';
const RUTA_DB = join(DIR_DATOS, 'db.json');
const DIR_ARCHIVOS = join(DIR_DATOS, 'archivos');

async function leerDb() {
  return JSON.parse(await readFile(RUTA_DB, 'utf8'));
}

async function escribirDb(db) {
  await writeFile(RUTA_DB, JSON.stringify(db, null, 2));
}

export async function iniciarDatos() {
  await mkdir(DIR_ARCHIVOS, { recursive: true });
  try {
    await readFile(RUTA_DB);
  } catch {
    await escribirDb({ documentos: {}, solicitudes: {} });
  }
}

export async function comprobarDatos() {
  await leerDb();
}

export async function listarDocumentos() {
  return Object.values((await leerDb()).documentos);
}

export async function obtenerDocumento(id) {
  return (await leerDb()).documentos[id];
}

export async function guardarDocumento(documento) {
  const db = await leerDb();
  db.documentos[documento.id] = documento;
  await escribirDb(db);
}

export async function obtenerSolicitud(id) {
  return (await leerDb()).solicitudes[id];
}

export async function guardarSolicitud(solicitud) {
  const db = await leerDb();
  db.solicitudes[solicitud.id] = solicitud;
  await escribirDb(db);
}

export async function leerArchivo(id) {
  return readFile(join(DIR_ARCHIVOS, `${id}.pdf`));
}

export async function guardarArchivo(id, bytes) {
  await writeFile(join(DIR_ARCHIVOS, `${id}.pdf`), bytes);
}
