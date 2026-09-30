// Manejador de errores: sin base de datos se responde 503 con un mensaje claro (no hace falta MySQL)
const { test, mock } = require('node:test')
const assert = require('node:assert/strict')
const mysql = require('mysql2/promise')
const { ErrorHttp, manejarErrores } = require('../errores')

// Pasa err por el manejador y devuelve { status, body, log }
function manejar(err) {
  const res = {
    headersSent: false,
    status(codigo) { this.statusCode = codigo; return this },
    json(cuerpo) { this.body = cuerpo; return this },
  }
  const log = mock.method(console, 'error', () => {})
  try {
    manejarErrores(err, {}, res, () => {})
  } finally {
    log.mock.restore()
  }
  return { status: res.statusCode, body: res.body, log: log.mock.calls.map((c) => c.arguments.join(' ')).join('\n') }
}

const errorMysql = (code) => Object.assign(new Error(`fallo ${code}`), { code })

test('los fallos de conexión con MySQL son 503 "No hay conexión con la base de datos"', () => {
  for (const code of ['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT', 'ENOTFOUND', 'ER_ACCESS_DENIED_ERROR']) {
    const { status, body, log } = manejar(errorMysql(code))
    assert.equal(status, 503, code)
    assert.deepEqual(body, { error: 'No hay conexión con la base de datos', codigo: 'sinBaseDeDatos' })
    assert.match(log, new RegExp(code))
    assert.doesNotMatch(log, /db:init/)
  }
})

test('sin base de datos o sin tablas, el log sugiere "npm run db:init"', () => {
  for (const code of ['ER_BAD_DB_ERROR', 'ER_NO_SUCH_TABLE']) {
    const { status, body, log } = manejar(errorMysql(code))
    assert.equal(status, 503, code)
    assert.deepEqual(body, { error: 'No hay conexión con la base de datos', codigo: 'sinBaseDeDatos' })
    assert.match(log, /npm run db:init/)
  }
})

test('el resto de errores no cambian', () => {
  assert.deepEqual(
    manejar(new ErrorHttp(409, 'No es tu turno', 'noEsSuTurno')).body,
    { error: 'No es tu turno', codigo: 'noEsSuTurno' },
  )
  const otro = manejar(errorMysql('ER_DUP_ENTRY'))
  assert.equal(otro.status, 500)
  assert.deepEqual(otro.body, { error: 'Error interno del servidor', codigo: 'errorInterno' })
})

test('un MySQL apagado de verdad acaba en 503', async () => {
  // Puerto 1: nadie escucha, así que mysql2 falla con su código real
  const err = await mysql.createConnection({ host: '127.0.0.1', port: 1, connectTimeout: 2000 })
    .then((conexion) => conexion.end(), (e) => e)
  assert.equal(manejar(err).status, 503, `código ${err?.code}`)
})
