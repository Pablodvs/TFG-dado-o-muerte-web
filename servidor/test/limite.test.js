// Límite de partidas nuevas por IP y lectura de TRUST_PROXY (no hace falta MySQL: los
// cuerpos no son válidos, así que ninguna petición llega a la base de datos)
const { test, mock } = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const { crearApp } = require('../app')
const { leerTrustProxy } = require('../config')

async function conServidor(app, fn) {
  const servidor = app.listen(0)
  try {
    return await fn(servidor.address().port)
  } finally {
    servidor.close()
  }
}

function crearPartida(port, cabeceras = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      port, path: '/api/partidas', method: 'POST', headers: { 'Content-Type': 'application/json', ...cabeceras },
    }, (res) => {
      let texto = ''
      res.setEncoding('utf8')
      res.on('data', (trozo) => { texto += trozo })
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(texto) }))
    })
    req.on('error', reject)
    req.end(JSON.stringify({ jugadores: [] }))
  })
}

test('pasado el límite de partidas nuevas responde 429 con su código', async () => {
  const aviso = mock.method(console, 'warn', () => {})
  try {
    await conServidor(crearApp({ limitePartidas: 2 }), async (port) => {
      assert.equal((await crearPartida(port)).status, 400)
      assert.equal((await crearPartida(port)).status, 400)
      const res = await crearPartida(port)
      assert.equal(res.status, 429)
      assert.equal(res.body.codigo, 'demasiadasPartidas')
      assert.ok(res.headers.ratelimit, 'manda la cabecera RateLimit')
    })
  } finally {
    aviso.mock.restore()
  }
  assert.match(aviso.mock.calls[0].arguments[0], /Límite de partidas nuevas alcanzado para /)
})

test('detrás de un proxy de confianza, el límite es por IP del cliente', async () => {
  const aviso = mock.method(console, 'warn', () => {})
  try {
    const app = crearApp({ limitePartidas: 1 })
    app.set('trust proxy', 1)
    await conServidor(app, async (port) => {
      const desde = (ip) => crearPartida(port, { 'X-Forwarded-For': ip })
      assert.equal((await desde('203.0.113.1')).status, 400)
      assert.equal((await desde('203.0.113.1')).status, 429)
      assert.equal((await desde('203.0.113.2')).status, 400, 'otra IP tiene su propio límite')
    })
  } finally {
    aviso.mock.restore()
  }
})

test('TRUST_PROXY acepta vacío, true/false, un número de proxies o una lista de redes', () => {
  assert.equal(leerTrustProxy(undefined), false)
  assert.equal(leerTrustProxy(''), false)
  assert.equal(leerTrustProxy('false'), false)
  assert.equal(leerTrustProxy('true'), true)
  assert.equal(leerTrustProxy('2'), 2)
  assert.equal(leerTrustProxy('loopback, 10.0.0.0/8'), 'loopback, 10.0.0.0/8')
})
