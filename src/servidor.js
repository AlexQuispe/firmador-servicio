import express from 'express';
import { comprobarDatos, iniciarDatos } from './datos.js';

const PUERTO = process.env.PUERTO ?? 3000;
const ORIGEN_CLIENTE = process.env.ORIGEN_CLIENTE;

const app = express();

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

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ mensaje: 'Error interno del servicio' });
});

await iniciarDatos();
app.listen(PUERTO, '0.0.0.0', () => console.log(`firmador-servicio escuchando en el puerto ${PUERTO}`));
