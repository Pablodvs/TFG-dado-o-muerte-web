const os = require('os')
const config = require('./config')
const app = require('./app')
const { pool } = require('./db')

function ipsLocales() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((red) => (red.family === 'IPv4' || red.family === 4) && !red.internal)
    .map((red) => red.address)
}

// Sin host, escucha en todas las interfaces (necesario para jugar desde el móvil)
const servidor = app.listen(config.port, () => {
  console.log(`Servidor escuchando en http://localhost:${config.port}`)
  for (const ip of ipsLocales()) {
    console.log(`  En la red local:     http://${ip}:${config.port}`)
  }
  if (!app.locals.clienteBuild) {
    console.log('No hay build del cliente; para servirlo aquí ejecuta "npm run build" en cliente/')
  }
})

servidor.on('error', (err) => {
  console.error(err.code === 'EADDRINUSE' ? `El puerto ${config.port} ya está en uso` : err)
  process.exit(1)
})

// docker stop (y Coolify al redesplegar) manda SIGTERM: se deja de aceptar conexiones,
// se cierra el pool y se sale, en vez de esperar a que Docker mate el proceso
function parar(senal) {
  console.log(`Recibido ${senal}, cerrando…`)
  servidor.close(() => pool.end().finally(() => process.exit(0)))
  servidor.closeIdleConnections() // Node 18 no cierra solo las conexiones keep-alive
  setTimeout(() => process.exit(1), 5000).unref()
}
process.once('SIGTERM', parar)
process.once('SIGINT', parar)

const { host, port, database } = config.db
pool.query('SELECT 1 FROM partida LIMIT 1').catch((err) => {
  console.warn(`Aviso: no se puede usar la base de datos "${database}" en ${host}:${port} (${err.message}).`)
  console.warn('Comprueba que MySQL está arrancado y ejecuta "npm run db:init" para crear las tablas.')
})
