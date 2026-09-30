// Crea la base de datos (si no existe) y aplica db/schema.sql, o el fichero .sql que se indique:
//   npm run db:init
//   npm run db:init -- db/migracion-v1.sql
const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')
const { db } = require('../config')

async function main() {
  const archivo = path.resolve(process.argv[2] || path.join(__dirname, 'schema.sql'))
  const nombreDb = mysql.escapeId(db.database)
  // Los .sql usan `dado-o-muerte`; se sustituye por la base de datos configurada en DB_NAME
  const sql = fs.readFileSync(archivo, 'utf8').replaceAll('`dado-o-muerte`', nombreDb)

  const { database, ...acceso } = db
  const conexion = await mysql.createConnection({ ...acceso, multipleStatements: true })
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

main().catch((err) => {
  console.error(`Error al preparar la base de datos: ${err.message}`)
  process.exitCode = 1
})
