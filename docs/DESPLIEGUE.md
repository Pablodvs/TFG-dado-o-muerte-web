# Despliegue de Dice or Die

In English: [DEPLOYMENT.md](DEPLOYMENT.md) · Volver al [README](../README_ES.md)

El `Dockerfile` de la raíz compila el cliente y arranca el servidor, que sirve la API y la aplicación en el puerto 3001. Al arrancar crea las tablas si no existen y pone al día las bases de datos anteriores (se puede repetir sin problema), esperando hasta un minuto a que MySQL esté listo. La imagen trae un health check sobre `/api/health`. `docker-compose.yaml` la arranca junto con su propio MySQL.

## Docker Compose (la aplicación y MySQL juntos)

Pon `DB_PASSWORD=<contraseña>` en un fichero `.env` junto a `docker-compose.yaml`. `DB_USER` y `DB_NAME` valen por defecto `dado` y `dado-o-muerte`, y los datos se guardan en el volumen `mysql-datos`. El compose no publica ningún puerto (en Coolify llega el proxy), así que para abrirlo en local en `http://localhost:3001` crea a su lado un `docker-compose.override.yaml`, que Compose carga solo:

```yaml
services:
  app:
    ports:
      - "3001:3001"
```

```bash
docker compose up -d --build
```

## Solo la imagen, con tu propio MySQL

```bash
docker build -t dice-or-die .
docker run -p 3001:3001 -e DB_HOST=<host-mysql> -e DB_USER=<usuario> -e DB_PASSWORD=<contraseña> -e DB_NAME=<base-de-datos> dice-or-die
```

## Coolify

De una de estas dos formas:

- **Build pack Docker Compose** (la aplicación y MySQL en un solo recurso): crea una aplicación a partir de este repositorio con el build pack **Docker Compose**, pon `DB_PASSWORD` y `TRUST_PROXY` (ver más abajo) en Environment Variables (ninguna hace falta para compilar, así que pueden ser solo de runtime) y asigna al servicio `app` un dominio con su puerto interno, por ejemplo `https://dado.ejemplo.com:3001`. Las copias de seguridad programadas de Coolify están pensadas para los recursos de base de datos independientes: comprueba si te las ofrece para este MySQL o haz tú las del volumen `mysql-datos`.
- **Build pack Dockerfile** con una base de datos aparte:
  1. Crea un recurso **MySQL 8** (no necesita acceso público) y apunta su host interno, usuario, contraseña y base de datos.
  2. Crea una aplicación a partir de este repositorio con el build pack **Dockerfile** y **Ports Exposes** a `3001`.
  3. Añade las variables `DB_HOST` (el host interno de la base de datos), `DB_PORT` (`3306`), `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `TRUST_PROXY`.
  4. Pon el dominio, por ejemplo `https://dado.ejemplo.com`.

## Cloudflare Tunnel

Con cualquiera de las dos formas de Coolify:

1. Añade al túnel un public hostname con ese dominio y el servicio `http://localhost:80` (el proxy de Coolify). Si `cloudflared` corre en un contenedor, `localhost` es el propio contenedor: conéctalo a la red `coolify` y usa `http://coolify-proxy:80`.
2. Desactiva en Coolify la redirección de HTTP a HTTPS de la aplicación. El HTTPS ya lo pone Cloudflare y el túnel habla HTTP con Coolify, así que si la dejas activa obtendrás `TOO_MANY_REDIRECTS`.

## La IP de los clientes detrás de proxies (`TRUST_PROXY`)

Crear partidas está limitado a 30 por IP cada 10 minutos. Detrás de un proxy inverso el servidor solo ve la dirección del proxy, así que `TRUST_PROXY` le dice cuántos proxies hay delante de la aplicación; Express toma entonces la IP del cliente de `X-Forwarded-For`.

- En local, o con el puerto publicado directamente desde el contenedor: déjala vacía.
- Coolify: su proxy es un salto, así que `1`.
- Coolify detrás de Cloudflare Tunnel: `cloudflared` añade otro salto, así que normalmente `2`.

Si el valor se queda corto, todas las visitas comparten un único límite; si se pasa, un cliente puede falsear su IP mandando su propio `X-Forwarded-For`. Cuando salta el límite, el servidor escribe en el log `Límite de partidas nuevas alcanzado para <ip>`. Si esa IP es privada (10.x, 172.16-31.x, 192.168.x) en vez de la de una visita, sube el valor. Con `TRUST_PROXY` vacía y peticiones que llegan a través de un proxy, en el log aparece además el aviso `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` de express-rate-limit.

`TRUST_PROXY` admite también `true`, `false` o una lista de IPs o redes de confianza separadas por comas, como la opción [`trust proxy`](https://expressjs.com/en/guide/behind-proxies.html) de Express.

## Actualizar un despliegue existente

- **Desde la versión de 2026 con ids de partida numéricos:** no hay que ejecutar nada a mano. Al arrancar, el contenedor añade la columna `id_publico` y da un id aleatorio a cada partida existente. Las partidas a medias en los móviles se pierden, porque sus ids numéricos guardados ya no se aceptan.
- **Desde la v1 (2023):** ejecuta la migración una sola vez sobre la base de datos antigua y después arranca la nueva versión como siempre. Las partidas y jugadores existentes se conservan:

  ```bash
  cd servidor && npm run db:init -- db/migracion-v1.sql
  ```

## Variables de entorno

Se definen en `servidor/.env` (ver `servidor/.env.example`) o como variables de entorno reales, que tienen prioridad sobre el fichero.

| Variable | Valor por defecto | Descripción |
|:--|:--|:--|
| `PORT` | `3001` | Puerto en el que escucha el servidor (todas las interfaces) |
| `TRUST_PROXY` | *(vacía)* | Proxies delante del servidor, para conocer la IP del cliente (ver arriba) |
| `DB_HOST` | `localhost` | Host de la base de datos |
| `DB_PORT` | `3306` | Puerto de la base de datos |
| `DB_USER` | `root` | Usuario de la base de datos |
| `DB_PASSWORD` | *(vacía)* | Contraseña de la base de datos |
| `DB_NAME` | `dado-o-muerte` | Nombre de la base de datos |

El cliente admite además `VITE_API_URL` al compilar (opcional, por defecto el mismo origen) para apuntar a una API en otro host.
