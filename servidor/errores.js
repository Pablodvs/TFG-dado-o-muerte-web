// Error con código HTTP cuyo mensaje se puede mostrar al usuario.
// codigo identifica el error sin depender del idioma: el cliente lo traduce.
class ErrorHttp extends Error {
  constructor(status, mensaje, codigo) {
    super(mensaje)
    this.status = status
    this.codigo = codigo
  }
}

// Fallos de MySQL que significan "no hay base de datos que usar", no un error del código
const ERRORES_CONEXION_DB = new Set([
  'ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT', 'ENOTFOUND',
  'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_NO_SUCH_TABLE',
])
// Estos dos se arreglan creando la base de datos y las tablas
const ERRORES_SIN_ESQUEMA = new Set(['ER_BAD_DB_ERROR', 'ER_NO_SUCH_TABLE'])

function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada', codigo: 'rutaNoEncontrada' })
}

// Middleware final: cualquier error acaba como { error, codigo } en JSON y nunca tumba el proceso
function manejarErrores(err, req, res, next) {
  if (res.headersSent) return next(err)
  if (err instanceof ErrorHttp) {
    return res.status(err.status).json({ error: err.message, codigo: err.codigo })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido', codigo: 'jsonNoValido' })
  }
  // Otros errores de express.json (cuerpo demasiado grande, charset no soportado...)
  if (err.expose && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: 'Petición no válida', codigo: 'peticionNoValida' })
  }
  if (ERRORES_CONEXION_DB.has(err.code)) {
    console.error(`Base de datos no disponible: ${err.code} (${err.message})`)
    if (ERRORES_SIN_ESQUEMA.has(err.code)) {
      console.error('Ejecuta "npm run db:init" en servidor/ para crear la base de datos y las tablas.')
    }
    return res.status(503).json({ error: 'No hay conexión con la base de datos', codigo: 'sinBaseDeDatos' })
  }
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor', codigo: 'errorInterno' })
}

module.exports = { ErrorHttp, rutaNoEncontrada, manejarErrores }
