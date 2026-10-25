// FS-01, FS-05, FS-06: documentos, su estado y el reemplazo por el PDF firmado.
import { createHash, randomUUID } from 'node:crypto';
import * as datos from './datos.js';
import { extraerFirmas } from './firmas.js';

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function solicitudActual(documento) {
  return documento.solicitudActual ? datos.obtenerSolicitud(documento.solicitudActual) : null;
}

function estado(documento, solicitud) {
  if (solicitud?.estado === 'PENDIENTE' || solicitud?.estado === 'EN_PROCESO') return 'EN_CURSO';
  if (solicitud?.estado === 'RECHAZADA') return 'RECHAZADA';
  return documento.firmas.length ? 'FIRMADO' : 'SIN_FIRMA';
}

async function resumen(documento) {
  const ultima = documento.firmas.at(-1);
  return {
    id: documento.id,
    nombre: documento.nombre,
    tamano: documento.tamano,
    subidoPor: documento.subidoPor,
    subidoEn: documento.subidoEn,
    estado: estado(documento, await solicitudActual(documento)),
    cantidadFirmas: documento.firmas.length,
    ultimaFirma: ultima ? { titular: ultima.titular, fechaDeclarada: ultima.fechaDeclarada } : null,
  };
}

// El más reciente primero.
export async function listar() {
  const lista = await datos.listarDocumentos();
  lista.sort((a, b) => b.subidoEn.localeCompare(a.subidoEn));
  return Promise.all(lista.map(resumen));
}

export async function subir(nombre, bytes, usuario) {
  const documento = {
    id: randomUUID(),
    nombre,
    tamano: bytes.length,
    sha256: sha256(bytes),
    subidoPor: usuario,
    subidoEn: new Date().toISOString(),
    firmas: [],
    solicitudActual: null,
  };
  await datos.guardarArchivo(documento.id, bytes);
  await datos.guardarDocumento(documento);
  console.log(`${documento.subidoEn} documento ${documento.id} subido`);
  return resumen(documento);
}

export async function detalle(id) {
  const documento = await datos.obtenerDocumento(id);
  const solicitud = await solicitudActual(documento);
  return {
    id: documento.id,
    nombre: documento.nombre,
    tamano: documento.tamano,
    sha256: documento.sha256,
    subidoPor: documento.subidoPor,
    subidoEn: documento.subidoEn,
    estado: estado(documento, solicitud),
    firmas: documento.firmas,
    solicitudActual: solicitud && {
      id: solicitud.id,
      estado: solicitud.estado,
      solicitadoPor: solicitud.solicitadoPor,
      eventos: solicitud.eventos,
    },
  };
}

export async function archivo(id) {
  const documento = await datos.obtenerDocumento(id);
  return { nombre: documento.nombre, bytes: await datos.leerArchivo(id) };
}

// Regla de este sistema de ejemplo: el PDF firmado reemplaza al anterior.
export async function reemplazarPorFirmado(id, bytes) {
  const documento = await datos.obtenerDocumento(id);
  const firmado = { ...documento, tamano: bytes.length, sha256: sha256(bytes), firmas: extraerFirmas(bytes) };
  await datos.guardarArchivo(id, bytes);
  await datos.guardarDocumento(firmado);
  return firmado.sha256;
}
