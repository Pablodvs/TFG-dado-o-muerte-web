const mysql = require('mysql2/promise')
const config = require('./config')

// mysql2 ya usa utf8mb4 por defecto, así que los nombres pueden llevar tildes o emojis
const pool = mysql.createPool(config.db)

// Ejecuta fn(conexion) dentro de una transacción sobre una única conexión del pool.
// Si fn lanza un error se hace rollback y el error se propaga.
async function enTransaccion(fn) {
  const conexion = await pool.getConnection()
  try {
    await conexion.beginTransaction()
    const resultado = await fn(conexion)
    await conexion.commit()
    return resultado
  } catch (err) {
    await conexion.rollback()
    throw err
  } finally {
    conexion.release()
  }
}

module.exports = { pool, enTransaccion }
