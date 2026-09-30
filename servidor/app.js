const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
const { rateLimit } = require('express-rate-limit')
const config = require('./config')
const partidas = require('./partidas')
const { ErrorHttp, rutaNoEncontrada, manejarErrores } = require('./errores')

// Crear partidas es lo único que hace crecer la base de datos, así que se limita por IP.
// El resto de rutas solo leen o juegan una partida cuyo id (aleatorio) hay que conocer.
function limitarCreacion(limite) {
  return rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: limite,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, next) => {
      // La IP sirve para comprobar TRUST_PROXY: si es la del proxy, el límite lo comparten todos
      console.warn(`Límite de partidas nuevas alcanzado para ${req.ip}`)
      next(new ErrorHttp(429, 'Se han creado demasiadas partidas; espera unos minutos', 'demasiadasPartidas'))
    },
  })
}

// limitePartidas: partidas nuevas por IP cada 10 minutos
function crearApp({ limitePartidas = 30 } = {}) {
  const app = express()

  // Detrás de un proxy la IP del cliente llega en X-Forwarded-For (ver TRUST_PROXY)
  app.set('trust proxy', config.trustProxy)
  app.use(cors())
  app.post('/api/partidas', limitarCreacion(limitePartidas))
  app.use(express.json())

  app.use('/api', partidas)
  app.use('/api', rutaNoEncontrada)

  // Si el cliente está compilado (cd cliente && npm run build) se sirve desde aquí,
  // así los móviles de la misma red pueden jugar entrando en http://<ip-del-pc>:3001
  const build = path.join(__dirname, '..', 'cliente', 'build')
  if (fs.existsSync(path.join(build, 'index.html'))) {
    app.locals.clienteBuild = build
    app.use(express.static(build))
    // Fallback de SPA: el resto de GET devuelven index.html y React se encarga de la ruta
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next()
      res.sendFile(path.join(build, 'index.html'))
    })
  }

  app.use(rutaNoEncontrada)
  app.use(manejarErrores)
  return app
}

module.exports = { crearApp }
