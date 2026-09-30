// Pruebas de integración de la API contra un MySQL real (el configurado en .env / DB_*).
// Si la base de datos no está disponible se omiten. Para ejecutarlas: npm run db:init && npm test
const { test, after, mock } = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const app = require('../app')
const { pool } = require('../db')

let servidor
const partidasCreadas = []

after(async () => {
  if (partidasCreadas.length > 0) {
    await pool.query('DELETE FROM partida WHERE id IN (?)', [partidasCreadas]).catch(() => {})
  }
  servidor?.close()
  await pool.end()
})

function peticion(metodo, ruta, cuerpo) {
  const datos = cuerpo === undefined ? undefined : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo)
  return new Promise((resolve, reject) => {
    const req = http.request({
      port: servidor.address().port,
      path: ruta,
      method: metodo,
      headers: datos === undefined ? {} : { 'Content-Type': 'application/json' },
    }, (res) => {
      let texto = ''
      res.setEncoding('utf8')
      res.on('data', (trozo) => { texto += trozo })
      res.on('end', () => resolve({ status: res.statusCode, body: texto ? JSON.parse(texto) : null }))
    })
    req.on('error', reject)
    req.end(datos)
  })
}

// Crea una partida fijando Math.random para saber quién empieza (0 → el primero de la lista)
async function nuevaPartida(nombres, aleatorio = 0) {
  const random = mock.method(Math, 'random', () => aleatorio)
  let res
  try {
    res = await peticion('POST', '/api/partidas', { jugadores: nombres })
  } finally {
    random.mock.restore()
  }
  assert.equal(res.status, 201, JSON.stringify(res.body))
  partidasCreadas.push(res.body.partida.id)
  return res.body.partida
}

// Planta al jugador al que le toca con los dados indicados
async function plantar(partida, dados, tiradas = 1) {
  const res = await peticion('POST', `/api/partidas/${partida.id}/plantarse`, {
    jugadorId: partida.jugadorActual.id, ronda: partida.ronda, dados, tiradas,
  })
  assert.equal(res.status, 200, JSON.stringify(res.body))
  return res.body
}

function assertError(res, status) {
  assert.equal(res.status, status, JSON.stringify(res.body))
  assert.equal(typeof res.body.error, 'string')
}

test('API HTTP con MySQL', async (t) => {
  try {
    await pool.query('SELECT 1 FROM partida, jugadores LIMIT 1')
  } catch (err) {
    t.skip(`base de datos no disponible (${err.code || err.message}); ejecuta "npm run db:init"`)
    return
  }
  servidor = app.listen(0)

  await t.test('GET /api/health', async () => {
    const res = await peticion('GET', '/api/health')
    assert.equal(res.status, 200)
    assert.deepEqual(res.body, { ok: true })
  })

  await t.test('POST /api/partidas rechaza nombres no válidos', async () => {
    const invalidos = [
      undefined, 'Ana', ['Ana'], Array.from({ length: 9 }, (_, i) => `J${i}`),
      ['Ana', ''], ['Ana', '   '], ['Ana', 'x'.repeat(21)], ['Ana', 'ana'], ['Ana', ' Ana '], ['Ana', 5],
    ]
    for (const jugadores of invalidos) {
      assertError(await peticion('POST', '/api/partidas', { jugadores }), 400)
    }
  })

  await t.test('POST /api/partidas crea la partida con un primer jugador al azar', async () => {
    // 0.99 con 3 jugadores → empieza el tercero y los demás le siguen en orden circular
    const partida = await nuevaPartida([' Ana ', 'Luis 🎲', 'María José Fernández'], 0.99)
    const [primero, segundo, tercero] = partida.jugadores
    assert.deepEqual(partida.jugadores.map((j) => j.nombre), ['María José Fernández', 'Ana', 'Luis 🎲'])
    assert.deepEqual(partida.jugadores.map((j) => j.orden), [1, 2, 3])
    for (const jugador of [primero, segundo, tercero]) {
      assert.equal(jugador.vidas, 3)
      assert.equal(jugador.haJugado, false)
      assert.equal(jugador.puntuacion, null)
      assert.equal(jugador.dados, null)
    }
    assert.equal(partida.ronda, 1)
    assert.equal(partida.turno, 0)
    assert.equal(partida.tiradaMax, null)
    assert.equal(partida.finalizada, false)
    assert.equal(partida.perdedor, null)
    assert.equal(partida.peorTirada, null)
    assert.deepEqual(partida.jugadorActual, { id: primero.id, nombre: primero.nombre, vidas: 3 })

    const res = await peticion('GET', `/api/partidas/${partida.id}`)
    assert.equal(res.status, 200)
    assert.deepEqual(res.body, partida)
  })

  await t.test('GET /api/partidas/:id devuelve 400 o 404', async () => {
    for (const id of ['abc', '0', '-1', '1.5', '1e3']) {
      assertError(await peticion('GET', `/api/partidas/${id}`), 400)
    }
    assertError(await peticion('GET', '/api/partidas/999999999'), 404)
  })

  await t.test('plantarse valida la jugada y el turno', async () => {
    const partida = await nuevaPartida(['Ana', 'Luis'])
    const [ana, luis] = partida.jugadores
    const ruta = `/api/partidas/${partida.id}/plantarse`
    const valida = { jugadorId: ana.id, ronda: 1, dados: [1, 2, 3, 4, 5], tiradas: 1 }

    const invalidas = [
      { ...valida, dados: undefined }, { ...valida, dados: [1, 2, 3, 4] }, { ...valida, dados: [1, 2, 3, 4, 5, 6] },
      { ...valida, dados: [1, 2, 3, 4, 7] }, { ...valida, dados: [0, 2, 3, 4, 5] },
      { ...valida, dados: [1.5, 2, 3, 4, 5] }, { ...valida, dados: ['1', 2, 3, 4, 5] },
      { ...valida, tiradas: undefined }, { ...valida, tiradas: 0 }, { ...valida, tiradas: 4 },
      { ...valida, tiradas: 1.5 }, { ...valida, tiradas: '2' },
      { ...valida, jugadorId: undefined }, { ...valida, jugadorId: 0 }, { ...valida, jugadorId: String(ana.id) },
      { ...valida, ronda: undefined }, { ...valida, ronda: 0 }, { ...valida, ronda: 1.5 }, { ...valida, ronda: '1' },
    ]
    for (const cuerpo of invalidas) {
      assertError(await peticion('POST', ruta, cuerpo), 400)
    }
    assertError(await peticion('POST', ruta), 400)
    assertError(await peticion('POST', '/api/partidas/abc/plantarse', valida), 400)
    assertError(await peticion('POST', '/api/partidas/999999999/plantarse', valida), 404)
    assertError(await peticion('POST', ruta, { ...valida, jugadorId: luis.id }), 409)
    assertError(await peticion('POST', ruta, { ...valida, jugadorId: 999999999 }), 409)
    const rondaVieja = await peticion('POST', ruta, { ...valida, ronda: 2 })
    assertError(rondaVieja, 409)
    assert.equal(rondaVieja.body.error, 'La ronda ya ha terminado')

    const res = await peticion('GET', `/api/partidas/${partida.id}`)
    assert.deepEqual(res.body, partida, 'las peticiones rechazadas no cambian la partida')
  })

  await t.test('una ronda completa: tiradaMax, peor tirada, vida perdida y nuevo orden', async () => {
    let partida = await nuevaPartida(['Ana', 'Luis', 'Eva'])
    const [ana, luis, eva] = partida.jugadores

    // Ana abre la ronda con 2 tiradas: fija tiradaMax = 2
    let res = await plantar(partida, [1, 2, 2, 5, 6], 2)
    partida = res.partida
    assert.equal(res.rondaTerminada, null)
    assert.equal(partida.turno, 1)
    assert.equal(partida.tiradaMax, 2)
    assert.deepEqual(partida.jugadores[0], {
      id: ana.id, nombre: 'Ana', vidas: 3, orden: 1, haJugado: true, puntuacion: 32, dados: [1, 2, 2, 5, 6],
    })
    assert.equal(partida.jugadores[1].haJugado, false)
    assert.deepEqual(partida.peorTirada, { jugadorId: ana.id, nombre: 'Ana', puntuacion: 32, dados: [1, 2, 2, 5, 6] })
    assert.deepEqual(partida.jugadorActual, { id: luis.id, nombre: 'Luis', vidas: 3 })

    // Luis no puede tirar más veces que Ana
    assertError(await peticion('POST', `/api/partidas/${partida.id}/plantarse`, {
      jugadorId: luis.id, ronda: 1, dados: [2, 3, 4, 5, 6], tiradas: 3,
    }), 400)

    res = await plantar(partida, [2, 3, 4, 5, 6], 1)
    partida = res.partida
    assert.equal(partida.turno, 2)
    assert.equal(partida.tiradaMax, 2, 'solo el primer jugador fija tiradaMax')
    assert.equal(partida.jugadores[1].puntuacion, 60)
    assert.equal(partida.peorTirada.jugadorId, ana.id)

    // Eva cierra la ronda con la peor mano
    res = await plantar(partida, [2, 2, 3, 3, 4], 2)
    partida = res.partida
    assert.deepEqual(res.rondaTerminada, {
      ronda: 1, perdedor: { id: eva.id, nombre: 'Eva', vidas: 2 }, puntuacion: 23, dados: [2, 2, 3, 3, 4], finPartida: false,
    })
    assert.equal(partida.ronda, 2)
    assert.equal(partida.turno, 0)
    assert.equal(partida.tiradaMax, null)
    assert.equal(partida.finalizada, false)
    assert.equal(partida.peorTirada, null)
    assert.deepEqual(partida.jugadores.map((j) => [j.nombre, j.orden, j.vidas, j.haJugado, j.puntuacion, j.dados]), [
      ['Eva', 1, 2, false, null, null],
      ['Ana', 2, 3, false, null, null],
      ['Luis', 3, 3, false, null, null],
    ])
    assert.deepEqual(partida.jugadorActual, { id: eva.id, nombre: 'Eva', vidas: 2 })

    const [filas] = await pool.query(
      'SELECT puntuacion, dados_guardados FROM jugadores WHERE partida_id = ?', [partida.id],
    )
    assert.ok(filas.every((f) => f.puntuacion === null && f.dados_guardados === null))
  })

  await t.test('en caso de empate pierde quien jugó después', async () => {
    let partida = await nuevaPartida(['A', 'B', 'C', 'D'])
    partida = (await plantar(partida, [3, 3, 2, 2, 4])).partida // 23
    partida = (await plantar(partida, [2, 2, 3, 3, 4])).partida // 23
    assert.equal(partida.peorTirada.nombre, 'B')
    partida = (await plantar(partida, [6, 6, 6, 6, 6])).partida
    const res = await plantar(partida, [5, 5, 5, 1, 2])
    assert.equal(res.rondaTerminada.perdedor.nombre, 'B')
    assert.deepEqual(res.partida.jugadores.map((j) => j.nombre), ['B', 'C', 'D', 'A'])
    assert.deepEqual(res.partida.jugadores.map((j) => j.vidas), [2, 3, 3, 3])
  })

  await t.test('ronda 1: j5 empata a póker de 5 con j4 y pierde la vida por jugar después', async () => {
    let partida = await nuevaPartida(['j4', 'j5', 'j1', 'j2', 'j3'])
    partida = (await plantar(partida, [5, 5, 3, 5, 1], 3)).partida
    assert.equal(partida.tiradaMax, 3)
    assert.deepEqual(partida.peorTirada, { jugadorId: partida.jugadores[0].id, nombre: 'j4', puntuacion: 45, dados: [5, 5, 3, 5, 1] })
    assert.equal(partida.jugadorActual.nombre, 'j5')

    partida = (await plantar(partida, [1, 3, 5, 1, 5], 3)).partida
    assert.deepEqual(partida.peorTirada, { jugadorId: partida.jugadores[1].id, nombre: 'j5', puntuacion: 45, dados: [1, 3, 5, 1, 5] })

    partida = (await plantar(partida, [2, 3, 4, 5, 6], 2)).partida
    partida = (await plantar(partida, [6, 6, 1, 6, 2], 3)).partida
    const res = await plantar(partida, [4, 4, 4, 4, 1], 1)
    assert.deepEqual(res.rondaTerminada, {
      ronda: 1, perdedor: { id: partida.jugadores[1].id, nombre: 'j5', vidas: 2 },
      puntuacion: 45, dados: [1, 3, 5, 1, 5], finPartida: false,
    })
    assert.deepEqual(res.partida.jugadores.map((j) => [j.nombre, j.vidas]), [
      ['j5', 2], ['j1', 3], ['j2', 3], ['j3', 3], ['j4', 3],
    ])
  })

  await t.test('la partida termina cuando alguien se queda sin vidas', async () => {
    let partida = await nuevaPartida(['Ana', 'Luis'])
    const luis = partida.jugadores[1]
    let res
    let rondas = 0
    do {
      rondas++
      // Luis siempre saca la peor mano; Ana siempre repóker
      const dados = (j) => (j.id === luis.id ? [2, 2, 3, 4, 6] : [6, 6, 6, 6, 6])
      res = await plantar(partida, dados(partida.jugadorActual))
      res = await plantar(res.partida, dados(res.partida.jugadorActual))
      partida = res.partida
      assert.equal(res.rondaTerminada.perdedor.id, luis.id)
      assert.equal(res.rondaTerminada.ronda, rondas)
    } while (!res.rondaTerminada.finPartida)

    assert.equal(rondas, 3)
    assert.deepEqual(res.rondaTerminada.perdedor, { id: luis.id, nombre: 'Luis', vidas: 0 })
    assert.equal(partida.finalizada, true)
    assert.equal(partida.ronda, 3, 'la ronda no se incrementa al terminar la partida')
    assert.deepEqual(partida.perdedor, { id: luis.id, nombre: 'Luis' })
    assert.equal(partida.jugadorActual, null)
    assert.equal(partida.peorTirada, null)

    const ruta = `/api/partidas/${partida.id}/plantarse`
    for (const jugador of partida.jugadores) {
      assertError(await peticion('POST', ruta, {
        jugadorId: jugador.id, ronda: partida.ronda, dados: [6, 6, 6, 6, 6], tiradas: 1,
      }), 409)
    }
    const actual = await peticion('GET', `/api/partidas/${partida.id}`)
    assert.deepEqual(actual.body, partida)
  })

  await t.test('una doble pulsación no avanza el turno dos veces', async () => {
    const partida = await nuevaPartida(['Ana', 'Luis'])
    const [ana, luis] = partida.jugadores
    const ruta = `/api/partidas/${partida.id}/plantarse`

    const enviarDosVeces = (cuerpo) => Promise.all([peticion('POST', ruta, cuerpo), peticion('POST', ruta, cuerpo)])

    let respuestas = await enviarDosVeces({ jugadorId: ana.id, ronda: 1, dados: [2, 2, 3, 4, 6], tiradas: 1 })
    assert.deepEqual(respuestas.map((r) => r.status).sort(), [200, 409])

    // Fin de ronda: Luis gana y Ana abre la siguiente; la petición repetida llega con la ronda terminada
    respuestas = await enviarDosVeces({ jugadorId: luis.id, ronda: 1, dados: [6, 6, 6, 6, 6], tiradas: 1 })
    assert.deepEqual(respuestas.map((r) => r.status).sort(), [200, 409])

    const { body } = await peticion('GET', `/api/partidas/${partida.id}`)
    assert.equal(body.ronda, 2)
    assert.deepEqual(body.jugadores.map((j) => [j.nombre, j.vidas]), [['Ana', 2], ['Luis', 3]])
  })

  await t.test('una doble pulsación del último jugador que pierde la ronda no cuenta en la siguiente', async () => {
    const partida = await nuevaPartida(['Ana', 'Luis'])
    const [ana, luis] = partida.jugadores
    const ruta = `/api/partidas/${partida.id}/plantarse`
    await plantar(partida, [6, 6, 6, 6, 6])

    // Luis cierra la ronda 1 y la pierde: pasa a abrir la ronda 2, así que la petición
    // repetida sería de su turno. Solo la ronda permite rechazarla.
    const cuerpo = { jugadorId: luis.id, ronda: 1, dados: [2, 2, 3, 4, 6], tiradas: 1 }
    const respuestas = await Promise.all([peticion('POST', ruta, cuerpo), peticion('POST', ruta, cuerpo)])
    assert.deepEqual(respuestas.map((r) => r.status).sort(), [200, 409])
    assert.equal(respuestas.find((r) => r.status === 409).body.error, 'La ronda ya ha terminado')

    const { body } = await peticion('GET', `/api/partidas/${partida.id}`)
    assert.equal(body.ronda, 2)
    assert.equal(body.turno, 0)
    assert.equal(body.tiradaMax, null)
    assert.deepEqual(body.jugadorActual, { id: luis.id, nombre: 'Luis', vidas: 2 })
    assert.deepEqual(body.jugadores.map((j) => [j.id, j.vidas, j.haJugado]), [[luis.id, 2, false], [ana.id, 3, false]])
  })

  await t.test('errores genéricos en JSON', async () => {
    assertError(await peticion('POST', '/api/partidas', '{"jugadores": ['), 400)
    assertError(await peticion('GET', '/api/no-existe'), 404)
    assertError(await peticion('DELETE', '/api/partidas/1'), 404)
  })
})
