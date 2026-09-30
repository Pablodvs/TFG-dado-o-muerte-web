# Deploying Dice or Die

En español: [DESPLIEGUE.md](DESPLIEGUE.md) · Back to the [README](../README.md)

The `Dockerfile` at the root builds the client and runs the server, which serves both the API and the app on port 3001. On startup it creates the tables if they are missing and brings older databases up to date (it is safe to run again), waiting up to a minute for MySQL to be ready. The image has a health check on `/api/health`. `docker-compose.yaml` runs it together with its own MySQL.

## Docker Compose (app and MySQL together)

Put `DB_PASSWORD=<password>` in a `.env` file next to `docker-compose.yaml`. `DB_USER` and `DB_NAME` default to `dado` and `dado-o-muerte`, and the data is kept in the `mysql-datos` volume. The compose file publishes no ports (in Coolify the proxy reaches the app), so to open it locally at `http://localhost:3001` create a `docker-compose.override.yaml` next to it, which Compose picks up automatically:

```yaml
services:
  app:
    ports:
      - "3001:3001"
```

```bash
docker compose up -d --build
```

## Just the image, with your own MySQL

```bash
docker build -t dice-or-die .
docker run -p 3001:3001 -e DB_HOST=<mysql-host> -e DB_USER=<user> -e DB_PASSWORD=<password> -e DB_NAME=<database> dice-or-die
```

## Coolify

Either way works:

- **Docker Compose build pack** (app and MySQL in one resource): create an application from this repository with the **Docker Compose** build pack, set `DB_PASSWORD` and `TRUST_PROXY` (see below) under Environment Variables (neither is needed to build, so they can be runtime-only) and give the `app` service a domain that includes its internal port, for example `https://dado.example.com:3001`. Coolify's scheduled backups are meant for standalone database resources: check whether it offers them for this MySQL, or back up the `mysql-datos` volume yourself.
- **Dockerfile build pack** with a separate database:
  1. Create a **MySQL 8** resource (it does not need public access) and note its internal host, user, password and database.
  2. Create an application from this repository with the **Dockerfile** build pack and **Ports Exposes** set to `3001`.
  3. Add the variables `DB_HOST` (the database's internal host), `DB_PORT` (`3306`), `DB_USER`, `DB_PASSWORD`, `DB_NAME` and `TRUST_PROXY`.
  4. Set the domain, for example `https://dado.example.com`.

## Cloudflare Tunnel

With either Coolify setup:

1. Add a public hostname for that domain to the tunnel with service `http://localhost:80` (Coolify's proxy). If `cloudflared` runs in a container, `localhost` is the container itself: connect it to the `coolify` network and use `http://coolify-proxy:80`.
2. Turn off the HTTP → HTTPS redirect for the application in Coolify. Cloudflare already serves HTTPS and the tunnel talks plain HTTP to Coolify, so leaving it on causes `TOO_MANY_REDIRECTS`.

## Client IPs behind proxies (`TRUST_PROXY`)

Creating games is limited to 30 per IP every 10 minutes. Behind a reverse proxy the server only sees the proxy's address, so `TRUST_PROXY` tells it how many proxies sit in front of the app; Express then takes the client's IP from `X-Forwarded-For`.

- Run locally, or with the port published straight from the container: leave it empty.
- Coolify: its proxy is one hop, so `1`.
- Coolify behind Cloudflare Tunnel: `cloudflared` adds another hop, so usually `2`.

If the value is too low, every visitor shares a single limit; if it is too high, a client can fake its IP by sending its own `X-Forwarded-For`. When the limit triggers, the server logs `Límite de partidas nuevas alcanzado para <ip>`. If that IP is a private address (10.x, 172.16-31.x, 192.168.x) instead of a visitor's, raise the value. With `TRUST_PROXY` empty and requests arriving through a proxy, the log also shows an `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` warning from express-rate-limit.

`TRUST_PROXY` also accepts `true`, `false` or a comma-separated list of trusted IPs or networks, like Express's [`trust proxy`](https://expressjs.com/en/guide/behind-proxies.html) setting.

## Upgrading an existing deployment

- **From the 2026 release with numeric game IDs:** nothing to run by hand. On startup the container adds the `id_publico` column and gives every existing game a random ID. Games in progress on players' phones are lost, because their saved numeric IDs are no longer accepted.
- **From v1 (2023):** run the migration once against the old database, then start the new version as usual. Existing games and players are kept:

  ```bash
  cd servidor && npm run db:init -- db/migracion-v1.sql
  ```

## Environment variables

Set in `servidor/.env` (see `servidor/.env.example`) or as real environment variables, which take priority over the file.

| Variable | Default | Description |
|:--|:--|:--|
| `PORT` | `3001` | Port the server listens on (all interfaces) |
| `TRUST_PROXY` | *(empty)* | Proxies in front of the server, to read the client IP (see above) |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `3306` | Database port |
| `DB_USER` | `root` | Database user |
| `DB_PASSWORD` | *(empty)* | Database password |
| `DB_NAME` | `dado-o-muerte` | Database name |

The client accepts an optional `VITE_API_URL` at build time (default: same origin) to point at an API on another host.
