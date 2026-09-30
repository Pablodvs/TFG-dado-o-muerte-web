// Ids públicos de partida y su incorporación a bases de datos anteriores.
// La prueba de la migración necesita MySQL (usa una base de datos propia y la borra al acabar).
const { test } = require('node:test')
const assert = require('node:assert/strict')
const mysql = require('mysql2/promise')
const { db } = require('../config')
const { anadirIdPublico } = require('../db/init')
const { esIdPublico, nuevoIdPublico } = require('../idPublico')

test('los ids nuevos tienen 22 caracteres base64url y no se repiten', () => {
  const ids = Array.from({ length: 1000 }, nuevoIdPublico)
  assert.ok(ids.every(esIdPublico))
  assert.equal(new Set(ids).size, ids.length)
})

test('esIdPublico rechaza cualquier otra cosa', () => {
  for (const valor of ['12', '', 'k3Vq9mTz2LpR8wNa1bC0d!', 'k3Vq9mTz2LpR8wNa1bC0dQx', 12, null, undefined]) {
    assert.equal(esIdPublico(valor), false, String(valor))
  }
})

test('db:init da un id público a las partidas de una base de datos anterior', async (t) => {
  const { database, ...acceso } = db
  let conexion
  try {
    conexion = await mysql.createConnection(acceso)
  } catch (err) {
    t.skip(`base de datos no disponible (${err.code || err.message})`)
    return
  }
  const prueba = mysql.escapeId(`${database}-prueba-id-publico`)
  try {
    await conexion.query(`DROP DATABASE IF EXISTS ${prueba}`)
    await conexion.query(`CREATE DATABASE ${prueba}`)
    await conexion.query(`USE ${prueba}`)
    // La tabla partida tal como era antes de id_publico
    await conexion.query(`CREATE TABLE partida (
      id INT NOT NULL AUTO_INCREMENT, create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      turno INT NOT NULL DEFAULT 0, PRIMARY KEY (id)) ENGINE=InnoDB`)
    await conexion.query('INSERT INTO partida (turno) VALUES (0), (1), (2)')

    assert.equal(await anadirIdPublico(conexion), 3)
    const [filas] = await conexion.query('SELECT id_publico FROM partida')
    assert.ok(filas.every((f) => esIdPublico(f.id_publico)))
    assert.equal(new Set(filas.map((f) => f.id_publico)).size, 3)
    // Una partida nueva sin id público ya no se puede guardar
    await assert.rejects(conexion.query('INSERT INTO partida (turno) VALUES (0)'))

    assert.equal(await anadirIdPublico(conexion), 0, 'la segunda vez no hace nada')
  } finally {
    await conexion.query(`DROP DATABASE IF EXISTS ${prueba}`)
    await conexion.end()
  }
})
