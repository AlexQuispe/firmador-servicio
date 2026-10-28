# 🛠️ Manual de instalación

## 📋 Requerimientos

- Docker ^24 (o Node 24 para ejecutarlo sin contenedor).
- `firmador-cliente` servido en el puerto 8080.
- Teléfono Android con `firmador-movil`, en la misma red que el equipo. Si el cortafuegos lo bloquea, abrir el puerto 3000.
- Para el flujo de escritorio, Jacobitus Escritorio abierto en la computadora donde se usa el navegador.

## ⚙️ Configuración

```sh
cp .env.sample .env
```

Editar `ORIGEN_CLIENTE` en `.env` con los orígenes exactos de la web, separados por comas. Para abrir la web por IP en Android y por `localhost` en la computadora, usar por ejemplo `http://192.168.1.10:8080,http://localhost:8080`. En producción, incluir el origen HTTPS exacto de la web, por ejemplo `https://firma.ejemplo.bo`.

Editar también `URL_PUBLICA` con la URL base por la que el teléfono alcanza el servicio, sin barra final: `http://<IP-del-equipo>:3000` en la red local (el móvil solo admite HTTP hacia IP privadas) o `https://<dominio>`. Viaja en el enlace de cada solicitud. `NOMBRE_SISTEMA` (opcional) es el nombre que el teléfono muestra al titular junto con el host; va sin comillas, porque Docker las tomaría como parte del valor.

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
curl -i -X OPTIONS http://localhost:3000/api/documentos \
  -H 'Origin: http://localhost:8080'                      # debe responder 204 con las cabeceras CORS
```
