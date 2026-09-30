const express = require('express')
const { pool, enTransaccion } = require('./db')
const { ErrorHttp } = require('./errores')
const { puntuar, peorMano } = require('./puntuacion')

const VIDAS_INICIALES = 3
const MAX_TIRADAS = 3

// ---------------------------------------------------------------------------
// Validación de entrada
// ---------------------------------------------------------------------------

function esIdValido(valor) {
  return Number.isSafeInteger(valor) && valor > 0
}

function validarIdPartida(texto) {
  const id = /^\d+$/.test(texto) ? Number(texto) : NaN
  if (!esIdValido(id)) throw new ErrorHttp(400, 'Identificador de partida no válido', 'idPartidaNoValido')
  return id
}

function validarNombres(jugadores) {
  if (!Array.isArray(jugadores) || jugadores.length < 2 || jugadores.length > 8) {
    throw new ErrorHttp(400, 'Debe haber entre 2 y 8 jugadores', 'numeroJugadores')
  }
  const nombres = jugadores.map((nombre) => (typeof nombre === 'string' ? nombre.trim() : ''))
  if (nombres.some((nombre) => nombre.length < 1 || nombre.length > 20)) {
    throw new ErrorHttp(400, 'Cada nombre debe tener entre 1 y 20 caracteres', 'longitudNombre')
  }
  if (new Set(nombres.map((nombre) => nombre.toLowerCase())).size !== nombres.length) {
    throw new ErrorHttp(400, 'Los nombres de los jugadores no se pueden repetir', 'nombresRepetidos')
  }
  return nombres
}

function validarJugada(cuerpo) {
  const { jugadorId, ronda, dados, tiradas } = cuerpo ?? {}
  if (!esIdValido(jugadorId)) {
    throw new ErrorHttp(400, 'Identificador de jugador no válido', 'idJugadorNoValido')
  }
  if (!Number.isSafeInteger(ronda) || ronda < 1) {
    throw new ErrorHttp(400, 'Número de ronda no válido', 'rondaNoValida')
  }
  if (!Array.isArray(dados) || dados.length !== 5 ||
      !dados.every((dado) => Number.isInteger(dado) && dado >= 1 && dado <= 6)) {
    throw new ErrorHttp(400, 'Los dados deben ser 5 números enteros del 1 al 6', 'dadosNoValidos')
  }
  if (!Number.isInteger(tiradas) || tiradas < 1 || tiradas > MAX_TIRADAS) {
    throw new ErrorHttp(400, `El número de tiradas debe estar entre 1 y ${MAX_TIRADAS}`, 'tiradasNoValidas')
  }
  return { jugadorId, ronda, dados, tiradas }
}

// ---------------------------------------------------------------------------
// Acceso a datos y lógica de juego
// ---------------------------------------------------------------------------

// Lee la partida y sus jugadores (ordenados por turno) en una sola consulta.
// Con bloquear = true las filas quedan bloqueadas hasta el fin de la transacción.
async function leerPartida(conexion, id, { bloquear = false } = {}) {
  const [filas] = await conexion.query(
    `SELECT p.turno, p.tirada_max, p.ronda, p.finalizada,
            j.id AS jugador_id, j.nombre, j.vidas, j.orden, j.puntuacion, j.dados_guardados
       FROM partida p
       LEFT JOIN jugadores j ON j.partida_id = p.id
      WHERE p.id = ?
      ORDER BY j.orden
      ${bloquear ? 'FOR UPDATE' : ''}`,
    [id],
  )
  if (filas.length === 0) return null

  const [{ turno, tirada_max: tiradaMax, ronda, finalizada }] = filas
  return {
    id,
    turno,
    tiradaMax,
    ronda,
    finalizada: Boolean(finalizada),
    jugadores: filas
      .filter((fila) => fila.jugador_id !== null)
      .map((fila) => ({
        id: fila.jugador_id,
        nombre: fila.nombre,
        vidas: fila.vidas,
        orden: fila.orden,
        puntuacion: fila.puntuacion,
        dados: fila.dados_guardados ? fila.dados_guardados.split(',').map(Number) : null,
      })),
  }
}

// Construye el EstadoPartida que devuelve la API
function estadoPartida(partida) {
  const jugadores = partida.jugadores.map((jugador, indice) => {
    const haJugado = indice < partida.turno
    return {
      id: jugador.id,
      nombre: jugador.nombre,
      vidas: jugador.vidas,
      orden: jugador.orden,
      haJugado,
      puntuacion: haJugado ? jugador.puntuacion : null,
      dados: haJugado ? jugador.dados : null,
    }
  })
  const actual = partida.finalizada ? null : jugadores[partida.turno]
  const perdedor = partida.finalizada ? jugadores.find((jugador) => jugador.vidas <= 0) : null
  const peor = peorMano(jugadores.filter((jugador) => jugador.haJugado))

  return {
    id: partida.id,
    ronda: partida.ronda,
    turno: partida.turno,
    tiradaMax: partida.tiradaMax,
    finalizada: partida.finalizada,
    perdedor: perdedor ? { id: perdedor.id, nombre: perdedor.nombre } : null,
    jugadores,
    jugadorActual: actual ? { id: actual.id, nombre: actual.nombre, vidas: actual.vidas } : null,
    peorTirada: peor
      ? { jugadorId: peor.id, nombre: peor.nombre, puntuacion: peor.puntuacion, dados: peor.dados }
      : null,
  }
}

function crearPartida(nombres) {
  return enTransaccion(async (conexion) => {
    const [{ insertId: id }] = await conexion.query('INSERT INTO partida (turno) VALUES (0)')
    // Un jugador al azar empieza (orden 1) y el resto le sigue en el orden en que se introdujeron
    const primero = Math.floor(Math.random() * nombres.length)
    const filas = nombres.map((_, i) => [
      nombres[(primero + i) % nombres.length], VIDAS_INICIALES, i + 1, id,
    ])
    await conexion.query('INSERT INTO jugadores (nombre, vidas, orden, partida_id) VALUES ?', [filas])
    return estadoPartida(await leerPartida(conexion, id))
  })
}

// El último jugador de la ronda se ha plantado: el peor pierde una vida y abre la siguiente ronda
async function terminarRonda(conexion, partida) {
  const { jugadores } = partida
  const perdedor = peorMano(jugadores)
  const vidas = Math.max(perdedor.vidas - 1, 0)
  const finPartida = vidas === 0

  await conexion.query('UPDATE jugadores SET vidas = ? WHERE id = ?', [vidas, perdedor.id])

  const inicio = jugadores.indexOf(perdedor)
  const nuevoOrden = [...jugadores.slice(inicio), ...jugadores.slice(0, inicio)]
  for (const [i, jugador] of nuevoOrden.entries()) {
    await conexion.query(
      'UPDATE jugadores SET orden = ?, puntuacion = NULL, dados_guardados = NULL WHERE id = ?',
      [i + 1, jugador.id],
    )
  }

  await conexion.query(
    'UPDATE partida SET turno = 0, tirada_max = NULL, ronda = ?, finalizada = ? WHERE id = ?',
    [finPartida ? partida.ronda : partida.ronda + 1, finPartida ? 1 : 0, partida.id],
  )

  return {
    ronda: partida.ronda,
    perdedor: { id: perdedor.id, nombre: perdedor.nombre, vidas },
    puntuacion: perdedor.puntuacion,
    dados: perdedor.dados,
    finPartida,
  }
}

function plantarse(partidaId, { jugadorId, ronda, dados, tiradas }) {
  return enTransaccion(async (conexion) => {
    // FOR UPDATE: dos peticiones simultáneas se procesan una detrás de otra
    const partida = await leerPartida(conexion, partidaId, { bloquear: true })
    if (!partida) throw new ErrorHttp(404, 'La partida no existe', 'partidaNoExiste')
    if (partida.finalizada) throw new ErrorHttp(409, 'La partida ya ha terminado', 'partidaTerminada')
    // Una petición repetida del último jugador de la ronda llegaría cuando ya empezó la
    // siguiente; si además perdió, volvería a ser su turno. La ronda la delata.
    if (ronda !== partida.ronda) throw new ErrorHttp(409, 'La ronda ya ha terminado', 'rondaTerminada')

    const actual = partida.jugadores[partida.turno]
    if (!actual || actual.id !== jugadorId) {
      throw new ErrorHttp(409, 'No es el turno de este jugador', 'noEsSuTurno')
    }
    const tiradaMax = partida.tiradaMax ?? MAX_TIRADAS
    if (tiradas > tiradaMax) {
      throw new ErrorHttp(
        400,
        `En esta ronda solo se puede tirar ${tiradaMax} ${tiradaMax === 1 ? 'vez' : 'veces'}`,
        'demasiadasTiradas',
      )
    }

    // La mano es la de los 5 dados; se guardan tal cual (con los comodines)
    const { puntuacion } = puntuar(dados)
    await conexion.query(
      'UPDATE jugadores SET puntuacion = ?, dados_guardados = ? WHERE id = ?',
      [puntuacion, dados.join(','), actual.id],
    )
    actual.puntuacion = puntuacion
    actual.dados = dados

    let rondaTerminada = null
    if (partida.turno < partida.jugadores.length - 1) {
      // El primer jugador de la ronda fija cuántas tiradas tienen los demás
      const nuevaTiradaMax = partida.turno === 0 ? tiradas : partida.tiradaMax
      await conexion.query(
        'UPDATE partida SET turno = turno + 1, tirada_max = ? WHERE id = ?',
        [nuevaTiradaMax, partidaId],
      )
    } else {
      rondaTerminada = await terminarRonda(conexion, partida)
    }

    return { partida: estadoPartida(await leerPartida(conexion, partidaId)), rondaTerminada }
  })
}

// ---------------------------------------------------------------------------
// Rutas (Express 5 pasa al manejador de errores los errores de las funciones async)
// ---------------------------------------------------------------------------

const router = express.Router()

router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
  } catch (err) {
    console.error('Health check:', err.message)
    throw new ErrorHttp(500, 'No hay conexión con la base de datos', 'sinBaseDeDatos')
  }
  res.json({ ok: true })
})

router.post('/partidas', async (req, res) => {
  const nombres = validarNombres(req.body?.jugadores)
  res.status(201).json({ partida: await crearPartida(nombres) })
})

router.get('/partidas/:id', async (req, res) => {
  const partida = await leerPartida(pool, validarIdPartida(req.params.id))
  if (!partida) throw new ErrorHttp(404, 'La partida no existe', 'partidaNoExiste')
  res.json(estadoPartida(partida))
})

router.post('/partidas/:id/plantarse', async (req, res) => {
  const id = validarIdPartida(req.params.id)
  res.json(await plantarse(id, validarJugada(req.body)))
})

module.exports = router
