// db:init --esperar: reintenta mientras MySQL arranca, pero no ante fallos de configuración (no hace falta MySQL)
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { conectar } = require('../db/init')

const errorMysql = (code) => Object.assign(new Error(`fallo ${code}`), { code })

// crear() que falla con los errores indicados, en orden, y después devuelve 'conexion'
function crearQueFalla(...errores) {
  const crear = async () => {
    crear.llamadas++
    const err = errores.shift()
    if (err) throw err
    return 'conexion'
  }
  crear.llamadas = 0
  return crear
}

test('reintenta mientras MySQL no escucha y devuelve la conexión', async () => {
  const crear = crearQueFalla(errorMysql('ECONNREFUSED'), errorMysql('PROTOCOL_CONNECTION_LOST'))
  const avisos = []
  const conexion = await conectar(crear, { intentos: 5, espera: 0, alReintentar: (err) => avisos.push(err.code) })
  assert.equal(conexion, 'conexion')
  assert.equal(crear.llamadas, 3)
  assert.deepEqual(avisos, ['ECONNREFUSED'], 'avisa una sola vez, en el primer fallo')
})

test('un fallo de configuración se lanza sin reintentar', async () => {
  const crear = crearQueFalla(errorMysql('ER_ACCESS_DENIED_ERROR'))
  await assert.rejects(conectar(crear, { intentos: 5, espera: 0 }), { code: 'ER_ACCESS_DENIED_ERROR' })
  assert.equal(crear.llamadas, 1)
})

test('agotados los intentos se lanza el último error', async () => {
  const crear = crearQueFalla(...Array.from({ length: 10 }, () => errorMysql('ECONNREFUSED')))
  await assert.rejects(conectar(crear, { intentos: 3, espera: 0 }), { code: 'ECONNREFUSED' })
  assert.equal(crear.llamadas, 3)
})

test('sin --esperar (un intento) falla a la primera', async () => {
  const crear = crearQueFalla(errorMysql('ECONNREFUSED'))
  await assert.rejects(conectar(crear), { code: 'ECONNREFUSED' })
  assert.equal(crear.llamadas, 1)
})
