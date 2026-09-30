# Dado o muerte (Dice or Die)

A pass-and-play dice game for 2 to 8 players: roll, hold, bluff your way to a good hand, and avoid having the worst one. Everyone shares a single phone (or screen) and passes it around.

Versión en español: [README_ES.md](README_ES.md)

## Features

- "Pass the phone" screen between turns, so nobody sees the next player's dice.
- Tap a die to hold or release it.
- Live hand preview while you roll ("Llevas: Trío de 5").
- The current hand to beat (the worst so far this round) is always visible.
- Round summary showing who lost a life and why.
- The game survives page reloads (state is kept on the server and in the browser).
- Rematch with the same players.
- Spanish and English: picked from the browser language, and switchable at any time from the header.

## How to play

- Each player starts with **3 lives**. The first player of round 1 is chosen at random.
- On your turn you roll **5 dice**. After a roll you may **hold** any dice (they will not be rerolled) and roll the rest again. Held dice can be released later. You cannot hold before your first roll.
- The **first player of each round** may roll up to 3 times and can stand ("Plantarse") at any moment. The number of rolls they used becomes the **roll limit** for everyone else in that round.
- Your final hand is **all 5 dice**, held or not, at the moment you stand.
- **1s are wildcards**: they count as whatever value helps your group most. The exception is a straight, which cannot use wildcards.
- Hands are ranked by the size of the group of equal dice (more dice is better) and then by its value (higher is better). A **straight (2-3-4-5-6)** beats everything.
- When everyone has played, the **lowest hand loses a life**. On a tie, **whoever played later loses**.
- The loser starts the next round, and turns continue in order from them.
- The game ends when someone reaches 0 lives; that player is the loser.

### Example 1

| Player | Roll | Final hand |
|:--|:--|:--|
| 1 | 1, 2, 2, 5, 6 | three 2s (32) |
| 2 | 1, 1, 1, 4, 5 | four 5s (45) |
| 3 | 2, 2, 2, 4, 4 | three 2s (32) |
| 4 | 1, 1, 3, 4, 4 | four 4s (44) |

Players 1 and 3 tie with the lowest hand, so **Player 3 loses** because they played later. The best hand is Player 2's: four dice grouped, with a higher value than Player 4's.

### Example 2

| Player | Roll | Final hand |
|:--|:--|:--|
| 1 | 1, 2, 2, 2, 6 | four 2s (42) |
| 2 | 2, 2, 3, 6, 6 | pair of 6s (26) |
| 3 | 2, 2, 2, 6, 6 | three 2s (32) |
| 4 | 2, 3, 4, 5, 6 | straight (60) |

**Player 2 loses**: they only managed a pair. The best hand is Player 4's straight.

### Hand ranking (lowest to highest)

| Pair | Three of a kind | Four of a kind | Five of a kind |
|:--:|:--:|:--:|:--:|
| 2 2 | 2 2 2 | 2 2 2 2 | 2 2 2 2 2 |
| 3 3 | 3 3 3 | 3 3 3 3 | 3 3 3 3 3 |
| 4 4 | 4 4 4 | 4 4 4 4 | 4 4 4 4 4 |
| 5 5 | 5 5 5 | 5 5 5 5 | 5 5 5 5 5 |
| 6 6 | 6 6 6 | 6 6 6 6 | 6 6 6 6 6 |

**Highest: Straight (2 3 4 5 6).** In Spanish the app names them Pareja, Trío, Póker, Repóker and Escalera. Internally a group scores `size * 10 + value` (e.g. three 2s = 32) and a straight scores 60.

## Stack

- **Client** (`cliente/`): React 18 + Redux Toolkit (Create React App), with i18next for translations (`cliente/src/idiomas/`).
- **Server** (`servidor/`): Express 5 + MySQL (`mysql2`). The server is the authority on scoring and turn order.

## Getting started

Prerequisites: Node 18+ and MySQL 8 or MariaDB (for example through XAMPP).

**No MySQL installed?** Start one with Docker first. Wait until it is ready (20-30 seconds on the first start; `docker logs dado-mysql` shows "ready for connections"), otherwise `db:init` fails with "Connection lost":

```bash
docker run -d --name dado-mysql -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -p 3307:3306 mysql:8
```

Then, after copying the `.env` file in the next step, set `DB_PORT=3307` in `servidor/.env`.

```bash
cp servidor/.env.example servidor/.env      # with Docker: set DB_PORT=3307 in it before db:init
cd servidor && npm install
npm run db:init                             # creates the database and tables
cd ../cliente && npm install
```

Then run both sides in two terminals:

```bash
cd servidor && npm run dev      # API on http://localhost:3001
cd cliente && npm start         # app on http://localhost:3000
```

The client dev server proxies `/api` to port 3001 (the `proxy` field in `cliente/package.json`).

**Upgrading from v1?** Run the migration once against your existing database. Existing games and players are kept:

```bash
cd servidor && npm run db:init -- db/migracion-v1.sql
```

## Playing on your phone

The whole game runs on one phone that gets passed around. Your computer acts as the host, and the phone must be on the same Wi-Fi.

**Production style** (recommended):

```bash
cd cliente && npm run build
cd ../servidor && npm start
```

The server serves `cliente/build` automatically and prints every network address it finds, including Docker or VPN ones. Use your Wi-Fi/LAN address (usually `192.168.x.x` or `10.x.x.x`), for example `http://192.168.1.20:3001`, and open it on the phone.

**Development style:** with both dev servers running, open `http://<your-pc-ip>:3000` on the phone.

Troubleshooting:

- Do not use `localhost` on the phone: it points to the phone itself. Use your PC's local IP.
- Your firewall must allow incoming connections on the port (3001, or 3000 in dev).
- Both devices must be on the same network.
- The app ships a web manifest (standalone, portrait), so you can install it like an app: iOS Safari: Share, then Add to Home Screen; Android Chrome: menu, then Install app / Add to Home screen.

## Deploying with Docker / Coolify

The `Dockerfile` at the root builds the client and runs the server, which serves both the API and the app on port 3001. On startup it creates the tables if they are missing (it is safe to run again), waiting up to a minute for MySQL to be ready.

```bash
docker build -t dado-o-muerte .
docker run -p 3001:3001 -e DB_HOST=<mysql-host> -e DB_USER=<user> -e DB_PASSWORD=<password> -e DB_NAME=<database> dado-o-muerte
```

**Coolify** behind a Cloudflare Tunnel:

1. Create a **MySQL 8** resource (it does not need public access) and note its internal host, user, password and database.
2. Create an application from this repository with the **Dockerfile** build pack and **Ports Exposes** set to `3001`.
3. Add the variables `DB_HOST` (the database's internal host), `DB_PORT` (`3306`), `DB_USER`, `DB_PASSWORD` and `DB_NAME`.
4. Set the domain, for example `https://dado.example.com`. The image already has a health check on `/api/health`.
5. In Cloudflare, add a public hostname for that domain to the tunnel with service `http://localhost:80` (Coolify's proxy). If `cloudflared` runs in a container, `localhost` is the container itself: connect it to the `coolify` network and use `http://coolify-proxy:80`.
6. Turn off the HTTP → HTTPS redirect for the application in Coolify. Cloudflare already serves HTTPS and the tunnel talks plain HTTP to Coolify, so leaving it on causes `TOO_MANY_REDIRECTS`.

## Environment variables

Set in `servidor/.env` (see `servidor/.env.example`). Real environment variables take priority over the file.

| Variable | Default | Description |
|:--|:--|:--|
| `PORT` | `3001` | Port the server listens on (all interfaces) |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `3306` | Database port |
| `DB_USER` | `root` | Database user |
| `DB_PASSWORD` | *(empty)* | Database password |
| `DB_NAME` | `dado-o-muerte` | Database name |

The client also accepts an optional `REACT_APP_API_URL` (default: same origin) to point at an API on another host.

## Tests

```bash
cd servidor && npm test    # node:test; integration tests need a database and are skipped if none is available
cd cliente && npm test     # Jest + React Testing Library (watch mode)
```

## Project structure

```
Dockerfile           production image (builds the client and runs the server)
servidor/
  index.js           entry point (prints LAN URLs)
  app.js             Express app, routes, serves cliente/build
  partidas.js        game logic and persistence
  puntuacion.js      scoring function
  config.js, db.js   configuration and MySQL pool
  errores.js         HTTP error helpers
  db/                schema.sql, migracion-v1.sql, init.js
  test/              api, scoring and db:init tests
cliente/
  src/
    pantallas/       screens: start, game, final
    componentes/     UI components (dice, hand, lives, turn, round summary...)
    estilos/         CSS (tokens, base, and one file per screen)
    hooks/           turn state, saved game, player list
    lib/             scoring, rules and local storage helpers
    slices/partida.js  Redux Toolkit slice for the game state
    api.js           API client
    App.jsx          app root
```

## API

Base path `/api`. Everything is JSON; errors are `{ "error": "<message in Spanish>" }`. Every game endpoint returns the full game state (`EstadoPartida`).

| Method | Path | Body | Success | Errors |
|:--|:--|:--|:--|:--|
| GET | `/api/health` | none | 200 `{ ok: true }` (checks the DB) | 500 |
| POST | `/api/partidas` | `{ jugadores: string[] }` (2-8 unique names, 1-20 chars) | 201 `{ partida }` | 400 |
| GET | `/api/partidas/:id` | none | 200 `EstadoPartida` | 400, 404 |
| POST | `/api/partidas/:id/plantarse` | `{ jugadorId, ronda, dados: number[5], tiradas }` | 200 `{ partida, rondaTerminada }` | 400, 404, 409 |

`ronda` must match the game's current round, otherwise the server answers 409; this protects against double taps. A rematch is simply a new `POST /api/partidas` with the same names.
