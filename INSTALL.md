# 🛠️ Manual de instalación

## 📋 Requerimientos

- Docker ^24 (o Node 24 para ejecutarlo sin contenedor).
- `firmador-cliente` servido en el puerto 8080.
- Teléfono Android con `firmador-movil`, en la misma red que el equipo. Si el cortafuegos lo bloquea, abrir el puerto 3000.

## ⚙️ Configuración

```sh
cp .env.sample .env
```

Editar `ORIGEN_CLIENTE` en `.env` con la dirección exacta de la web (p. ej. `http://192.168.1.10:8080`).

## 🚀 Despliegue

```sh
docker build -t firmador-servicio .
docker run -d --name firmador-servicio -p 3000:3000 \
  --env-file .env -v ./datos:/app/datos firmador-servicio
```

Los documentos y las solicitudes se guardan en la carpeta `datos/` del proyecto (`db.json` y `archivos/{id}.pdf`), montada en el contenedor, y se conservan al recrearlo. Tras cualquier cambio en `src/`, reconstruir y recrear:

```sh
docker build -t firmador-servicio .
docker rm -f firmador-servicio
docker run -d --name firmador-servicio -p 3000:3000 \
  --env-file .env -v ./datos:/app/datos firmador-servicio
```

Sin Docker: `npm install` y `npm start`.

## ✅ Acceso y verificación

```sh
hostname -I | awk '{print $1}'                      # IP del equipo
curl -i http://localhost:3000/api/estado                  # debe responder 200 con estado OK y la hora
curl -i -X OPTIONS http://localhost:3000/api/documentos   # debe responder 204 con las cabeceras CORS
```
