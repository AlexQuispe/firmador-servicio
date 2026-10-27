// FS-02 a FS-05, FS-07: solicitudes de firma y sus transiciones.
import { randomUUID } from 'node:crypto';
import * as datos from './datos.js';
import { reemplazarPorFirmado } from './documentos.js';

// URL base por la que el teléfono alcanza este servicio (IP de la red local o dominio).
const URL_PUBLICA = process.env.URL_PUBLICA;
// Nombre que el móvil muestra al titular junto con el host (opcional).
const NOMBRE_SISTEMA = process.env.NOMBRE_SISTEMA;
const parametrosEnlace = new URLSearchParams({ servicio: URL_PUBLICA, ...(NOMBRE_SISTEMA && { sistema: NOMBRE_SISTEMA }) });

// El log no lleva el ID de la solicitud: basta conocerlo para operarla.
function registrar(solicitud, estado) {
  const hora = new Date().toISOString();
  solicitud.estado = estado;
  solicitud.eventos.push({ estado, hora });
  console.log(`${hora} documento ${solicitud.documentoId} solicitud ${estado}`);
}

async function obtener(id) {
  const solicitud = await datos.obtenerSolicitud(id);
  if (!solicitud) throw Object.assign(new Error('Solicitud no encontrada'), { status: 404 });
  return solicitud;
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
    // Intent URI: Chrome solo lo entrega a este paquete, no a otra app con el mismo esquema.
    // Lleva la URL del servicio para que el móvil sepa a quién responder, y el nombre que muestra al titular.
    enlaceAplicacion: `intent://firmar/${solicitud.id}?${parametrosEnlace}#Intent;scheme=firmadormovil;package=bo.edu.umsa.firmadormovil;end`,
  };
}

export async function consultar(id) {
  const solicitud = await obtener(id);
  return { id: solicitud.id, documentoId: solicitud.documentoId, estado: solicitud.estado };
}

export async function iniciar(id) {
  const solicitud = await obtener(id);
  registrar(solicitud, 'EN_PROCESO');
  await datos.guardarSolicitud(solicitud);
  const documento = await datos.obtenerDocumento(solicitud.documentoId);
  return { id: solicitud.id, nombre: documento.nombre, sha256: solicitud.sha256 };
}

export async function documentoAFirmar(id) {
  const solicitud = await obtener(id);
  return datos.leerArchivo(solicitud.documentoId);
}

export async function recibirResultado(id, bytes) {
  const solicitud = await obtener(id);
  solicitud.sha256Resultado = await reemplazarPorFirmado(solicitud.documentoId, bytes);
  registrar(solicitud, 'FIRMADA');
  await datos.guardarSolicitud(solicitud);
  return { id: solicitud.id, estado: solicitud.estado };
}

export async function rechazar(id) {
  const solicitud = await obtener(id);
  registrar(solicitud, 'RECHAZADA');
  await datos.guardarSolicitud(solicitud);
  return { id: solicitud.id, estado: solicitud.estado };
}
