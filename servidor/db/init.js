// Crea la base de datos (si no existe) y aplica db/schema.sql, o el fichero .sql que se indique:
//   npm run db:init
//   npm run db:init -- db/migracion-v1.sql
// Con --esperar reintenta la conexión durante un minuto mientras MySQL arranca (lo usa el Dockerfile):
//   node db/init.js --esperar
const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')
const { db } = require('../config')

// "MySQL todavía no escucha": se reintenta. El resto (contraseña incorrecta, host
// inalcanzable...) es un fallo de configuración y se informa a la primera.
const ERRORES_ARRANQUE = new Set([
  'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'PROTOCOL_CONNECTION_LOST',
])

const pausa = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Devuelve lo que devuelva crear(). Si falla porque MySQL aún no está listo, lo reintenta
// hasta completar `intentos`, esperando `espera` ms entre uno y otro; alReintentar(err)
// se llama solo en el primer fallo. Agotados los intentos, lanza el último error.
async function conectar(crear, { intentos = 1, espera = 2000, alReintentar = () => {} } = {}) {
  for (let intento = 1; ; intento++) {
    try {
      return await crear()
    } catch (err) {
      if (intento >= intentos || !ERRORES_ARRANQUE.has(err.code)) throw err
      if (intento === 1) alReintentar(err)
      await pausa(espera)
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const esperar = args.includes('--esperar')
  const archivo = path.resolve(args.find((arg) => !arg.startsWith('--')) || path.join(__dirname, 'schema.sql'))
  const nombreDb = mysql.escapeId(db.database)
  // Los .sql usan `dado-o-muerte`; se sustituye por la base de datos configurada en DB_NAME
  const sql = fs.readFileSync(archivo, 'utf8').replaceAll('`dado-o-muerte`', nombreDb)

  const { database, ...acceso } = db
  const conexion = await conectar(() => mysql.createConnection({ ...acceso, multipleStatements: true }), {
    intentos: esperar ? 30 : 1,
    alReintentar: (err) => {
      console.warn(`MySQL aún no responde en ${db.host}:${db.port} (${err.code}); reintentando durante un minuto…`)
    },
  })
  try {
    await conexion.query(
      `CREATE DATABASE IF NOT EXISTS ${nombreDb} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
    await conexion.query(`USE ${nombreDb}`)
    await conexion.query(sql)
    console.log(`Aplicado ${path.basename(archivo)} en "${database}" (${db.host}:${db.port})`)
  } finally {
    await conexion.end()
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Error al preparar la base de datos: ${err.message}`)
    process.exitCode = 1
  })
}

module.exports = { conectar }
