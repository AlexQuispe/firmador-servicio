import express from 'express';
import { comprobarDatos, iniciarDatos } from './datos.js';
import * as documentos from './documentos.js';
import * as solicitudes from './solicitudes.js';

const PUERTO = process.env.PUERTO ?? 3000;
const ORIGEN_CLIENTE = process.env.ORIGEN_CLIENTE;

const app = express();
const pdf = express.raw({ type: 'application/pdf', limit: '20mb' });

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', ORIGEN_CLIENTE);
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'X-Usuario, X-Nombre-Archivo, Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/estado', async (req, res) => {
  await comprobarDatos();
  res.json({ estado: 'OK', hora: new Date().toISOString() });
});

// Web
app.get('/api/documentos', async (req, res) => {
  res.json(await documentos.listar());
});

app.post('/api/documentos', pdf, async (req, res) => {
  const nombre = decodeURIComponent(req.get('X-Nombre-Archivo'));
  res.status(201).json(await documentos.subir(nombre, req.body, req.get('X-Usuario')));
});

app.get('/api/documentos/:id', async (req, res) => {
  res.json(await documentos.detalle(req.params.id));
});

app.get('/api/documentos/:id/archivo', async (req, res) => {
  const { nombre, bytes } = await documentos.archivo(req.params.id);
  res.attachment(nombre).type('application/pdf').send(bytes);
});

app.post('/api/documentos/:id/solicitudes', async (req, res) => {
  res.status(201).json(await solicitudes.crear(req.params.id, req.get('X-Usuario')));
});

app.get('/api/solicitudes/:id', async (req, res) => {
  res.json(await solicitudes.consultar(req.params.id));
});

// Móvil: sin credenciales, la solicitud se identifica por su ID.
app.post('/api/solicitudes/:id/iniciar', async (req, res) => {
  res.json(await solicitudes.iniciar(req.params.id));
});

app.get('/api/solicitudes/:id/documento', async (req, res) => {
  res.type('application/pdf').send(await solicitudes.documentoAFirmar(req.params.id));
});

app.post('/api/solicitudes/:id/resultado', pdf, async (req, res) => {
  res.json(await solicitudes.recibirResultado(req.params.id, req.body));
});

app.post('/api/solicitudes/:id/rechazo', async (req, res) => {
  res.json(await solicitudes.rechazar(req.params.id));
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ mensaje: 'Error interno del servicio' });
});

await iniciarDatos();
app.listen(PUERTO, '0.0.0.0', () => console.log(`firmador-servicio escuchando en el puerto ${PUERTO}`));
