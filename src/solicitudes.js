// FS-02 a FS-05, FS-07: solicitudes de firma y sus transiciones.
import { randomUUID } from 'node:crypto';
import * as datos from './datos.js';
import { reemplazarPorFirmado } from './documentos.js';

// El log no lleva el ID de la solicitud: basta conocerlo para operarla.
function registrar(solicitud, estado) {
  const hora = new Date().toISOString();
  solicitud.estado = estado;
  solicitud.eventos.push({ estado, hora });
  console.log(`${hora} documento ${solicitud.documentoId} solicitud ${estado}`);
}

export async function crear(documentoId, usuario) {
  const documento = await datos.obtenerDocumento(documentoId);
  const solicitud = {
    id: randomUUID(),
    documentoId,
    sha256: documento.sha256,
    sha256Resultado: null,
    solicitadoPor: usuario,
    estado: null,
    eventos: [],
  };
  registrar(solicitud, 'PENDIENTE');
  await datos.guardarSolicitud(solicitud);
  await datos.guardarDocumento({ ...documento, solicitudActual: solicitud.id });
  return {
    id: solicitud.id,
    estado: solicitud.estado,
    sha256Documento: solicitud.sha256,
    enlaceAplicacion: `firmadormovil://firmar/${solicitud.id}`,
  };
}

export async function consultar(id) {
  const solicitud = await datos.obtenerSolicitud(id);
  return { id: solicitud.id, documentoId: solicitud.documentoId, estado: solicitud.estado };
}

export async function iniciar(id) {
  const solicitud = await datos.obtenerSolicitud(id);
  registrar(solicitud, 'EN_PROCESO');
  await datos.guardarSolicitud(solicitud);
  const documento = await datos.obtenerDocumento(solicitud.documentoId);
  return { id: solicitud.id, nombre: documento.nombre, sha256: solicitud.sha256 };
}

export async function documentoAFirmar(id) {
  const solicitud = await datos.obtenerSolicitud(id);
  return datos.leerArchivo(solicitud.documentoId);
}

export async function recibirResultado(id, bytes) {
  const solicitud = await datos.obtenerSolicitud(id);
  solicitud.sha256Resultado = await reemplazarPorFirmado(solicitud.documentoId, bytes);
  registrar(solicitud, 'FIRMADA');
  await datos.guardarSolicitud(solicitud);
  return { id: solicitud.id, estado: solicitud.estado };
}

export async function rechazar(id) {
  const solicitud = await datos.obtenerSolicitud(id);
  registrar(solicitud, 'RECHAZADA');
  await datos.guardarSolicitud(solicitud);
  return { id: solicitud.id, estado: solicitud.estado };
}
