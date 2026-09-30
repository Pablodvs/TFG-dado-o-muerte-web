# Dado o muerte

Un juego de dados para 2 a 8 jugadores que se juega pasándose un único móvil: tira, guarda dados, tira de farol y procura no quedarte con la peor jugada.

English version: [README.md](README.md)

## Características

- Pantalla de "pasa el móvil" entre turnos, para que nadie vea los dados del siguiente.
- Toca un dado para guardarlo o soltarlo.
- Vista previa de la jugada mientras tiras ("Llevas: Trío de 5").
- La jugada a superar (la peor de la ronda hasta el momento) siempre a la vista.
- Resumen de ronda que indica quién pierde una vida y por qué.
- La partida sobrevive a recargar la página (el estado se guarda en el servidor y en el navegador).
- Revancha con los mismos jugadores.
- En castellano e inglés: se elige según el idioma del navegador y se puede cambiar en cualquier momento desde la cabecera.

## Cómo se juega

- Cada jugador empieza con **3 vidas**. El primer jugador de la ronda 1 se elige al azar.
- En tu turno tiras **5 dados**. Tras cada tirada puedes **guardar** los dados que quieras (no se vuelven a tirar) y repetir con el resto. Los dados guardados se pueden soltar de nuevo. No se puede guardar antes de la primera tirada.
- El **primer jugador de cada ronda** puede tirar hasta 3 veces y puede plantarse cuando quiera. Las tiradas que haya usado pasan a ser el **límite de tiradas** para todos los demás en esa ronda.
- Tu jugada final son **los 5 dados**, guardados o no, en el momento en que te plantas.
- **Los 1 son comodines**: valen lo que más te convenga para tu grupo. La excepción es la escalera, que no admite comodines.
- Las jugadas se ordenan primero por el tamaño del grupo de dados iguales (cuantos más, mejor) y después por su valor (cuanto más alto, mejor). La **escalera (2-3-4-5-6)** gana a todo.
- Cuando todos han jugado, **la jugada más baja pierde una vida**. En caso de empate, **pierde quien jugó después**.
- El perdedor de la ronda empieza la siguiente y los turnos siguen en orden a partir de él.
- La partida termina cuando alguien llega a 0 vidas; ese jugador es el perdedor.

### Ejemplo 1

| Jugador | Tirada | Jugada final |
|:--|:--|:--|
| 1 | 1, 2, 2, 5, 6 | trío de 2 (32) |
| 2 | 1, 1, 1, 4, 5 | póker de 5 (45) |
| 3 | 2, 2, 2, 4, 4 | trío de 2 (32) |
| 4 | 1, 1, 3, 4, 4 | póker de 4 (44) |

Los jugadores 1 y 3 empatan con la jugada más baja, así que **pierde el jugador 3** por haber jugado después. La mejor jugada es la del jugador 2: agrupa cuatro dados y con un valor superior al del jugador 4.

### Ejemplo 2

| Jugador | Tirada | Jugada final |
|:--|:--|:--|
| 1 | 1, 2, 2, 2, 6 | póker de 2 (42) |
| 2 | 2, 2, 3, 6, 6 | pareja de 6 (26) |
| 3 | 2, 2, 2, 6, 6 | trío de 2 (32) |
| 4 | 2, 3, 4, 5, 6 | escalera (60) |

**Pierde el jugador 2**, que solo consiguió agrupar 2 dados. La mejor jugada es la escalera del jugador 4.

### Tabla de jugadas (de menor a mayor)

| Pareja | Trío | Póker | Repóker |
|:--:|:--:|:--:|:--:|
| 2 2 | 2 2 2 | 2 2 2 2 | 2 2 2 2 2 |
| 3 3 | 3 3 3 | 3 3 3 3 | 3 3 3 3 3 |
| 4 4 | 4 4 4 | 4 4 4 4 | 4 4 4 4 4 |
| 5 5 | 5 5 5 | 5 5 5 5 | 5 5 5 5 5 |
| 6 6 | 6 6 6 | 6 6 6 6 | 6 6 6 6 6 |

**La más alta: Escalera (2 3 4 5 6).** Internamente un grupo puntúa `tamaño * 10 + valor` (por ejemplo, un trío de 2 = 32) y la escalera puntúa 60.

## Tecnologías

- **Cliente** (`cliente/`): React 18 + Redux Toolkit (Create React App), con i18next para las traducciones (`cliente/src/idiomas/`).
- **Servidor** (`servidor/`): Express 5 + MySQL (`mysql2`). El servidor es quien manda en la puntuación y en los turnos.

## Puesta en marcha

Requisitos: Node 18+ y MySQL 8 o MariaDB (por ejemplo con XAMPP).

**¿No tienes MySQL?** Arranca uno con Docker antes de nada. Espera a que esté listo (20-30 segundos la primera vez; `docker logs dado-mysql` muestra "ready for connections"); si no, `db:init` falla con "Connection lost":

```bash
docker run -d --name dado-mysql -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -p 3307:3306 mysql:8
```

Después, tras copiar el fichero `.env` en el paso siguiente, pon `DB_PORT=3307` en `servidor/.env`.

```bash
cp servidor/.env.example servidor/.env      # con Docker: pon DB_PORT=3307 antes de db:init
cd servidor && npm install
npm run db:init                             # crea la base de datos y las tablas
cd ../cliente && npm install
```

Después arranca ambas partes en dos terminales:

```bash
cd servidor && npm run dev      # API en http://localhost:3001
cd cliente && npm start         # aplicación en http://localhost:3000
```

El servidor de desarrollo del cliente redirige `/api` al puerto 3001 (campo `proxy` de `cliente/package.json`).

**¿Vienes de la v1?** Ejecuta la migración una sola vez sobre tu base de datos actual. Las partidas y jugadores existentes se conservan:

```bash
cd servidor && npm run db:init -- db/migracion-v1.sql
```

## Jugar desde el móvil

Todo el juego se hace en un solo móvil que se van pasando. Tu ordenador hace de anfitrión y el móvil debe estar en la misma wifi.

**Modo producción** (recomendado):

```bash
cd cliente && npm run build
cd ../servidor && npm start
```

El servidor sirve `cliente/build` automáticamente e imprime todas las direcciones de red que encuentra, incluidas las de Docker o VPN. Usa la de tu wifi/red local (normalmente `192.168.x.x` o `10.x.x.x`), por ejemplo `http://192.168.1.20:3001`, y ábrela en el móvil.

**Modo desarrollo:** con los dos servidores en marcha, abre `http://<ip-de-tu-pc>:3000` en el móvil.

Si no funciona:

- No uses `localhost` en el móvil: apunta al propio móvil. Usa la IP local de tu ordenador.
- El cortafuegos debe permitir conexiones entrantes en el puerto (3001, o 3000 en desarrollo).
- Ambos dispositivos deben estar en la misma red.
- La aplicación incluye un manifiesto web (pantalla completa, vertical), así que se puede instalar como una app: en iOS Safari, Compartir y después Añadir a pantalla de inicio; en Android Chrome, menú y después Instalar aplicación / Añadir a pantalla de inicio.

## Variables de entorno

Se definen en `servidor/.env` (ver `servidor/.env.example`). Las variables de entorno reales tienen prioridad sobre el fichero.

| Variable | Valor por defecto | Descripción |
|:--|:--|:--|
| `PORT` | `3001` | Puerto en el que escucha el servidor (todas las interfaces) |
| `DB_HOST` | `localhost` | Host de la base de datos |
| `DB_PORT` | `3306` | Puerto de la base de datos |
| `DB_USER` | `root` | Usuario de la base de datos |
| `DB_PASSWORD` | *(vacía)* | Contraseña de la base de datos |
| `DB_NAME` | `dado-o-muerte` | Nombre de la base de datos |

El cliente admite además `REACT_APP_API_URL` (opcional, por defecto el mismo origen) para apuntar a una API en otro host.

## Tests

```bash
cd servidor && npm test    # node:test; los tests de integración necesitan base de datos y se omiten si no hay
cd cliente && npm test     # Jest + React Testing Library (modo watch)
```

## Estructura del proyecto

```
servidor/
  index.js           punto de entrada (muestra las URL de red local)
  app.js             aplicación Express, rutas, sirve cliente/build
  partidas.js        lógica de partida y persistencia
  puntuacion.js      función de puntuación
  config.js, db.js   configuración y pool de MySQL
  errores.js         utilidades de errores HTTP
  db/                schema.sql, migracion-v1.sql, init.js
  test/              tests de la API y de la puntuación
cliente/
  src/
    pantallas/       pantallas: inicio, partida y final
    componentes/     componentes de la interfaz (dados, jugada, vidas, turno, resumen de ronda...)
    estilos/         CSS (tokens, base y un fichero por pantalla)
    hooks/           estado del turno, partida guardada, lista de jugadores
    lib/             puntuación, reglas y almacenamiento local
    slices/partida.js  slice de Redux Toolkit con el estado de la partida
    api.js           cliente de la API
    App.jsx          raíz de la aplicación
```

## API

Ruta base `/api`. Todo es JSON; los errores tienen la forma `{ "error": "<mensaje en español>" }`. Todos los endpoints de partida devuelven el estado completo (`EstadoPartida`).

| Método | Ruta | Cuerpo | Éxito | Errores |
|:--|:--|:--|:--|:--|
| GET | `/api/health` | ninguno | 200 `{ ok: true }` (comprueba la BD) | 500 |
| POST | `/api/partidas` | `{ jugadores: string[] }` (2-8 nombres únicos, 1-20 caracteres) | 201 `{ partida }` | 400 |
| GET | `/api/partidas/:id` | ninguno | 200 `EstadoPartida` | 400, 404 |
| POST | `/api/partidas/:id/plantarse` | `{ jugadorId, ronda, dados: number[5], tiradas }` | 200 `{ partida, rondaTerminada }` | 400, 404, 409 |

`ronda` debe coincidir con la ronda actual de la partida; si no, el servidor responde 409 (protege frente a dobles pulsaciones). La revancha es simplemente un nuevo `POST /api/partidas` con los mismos nombres.
