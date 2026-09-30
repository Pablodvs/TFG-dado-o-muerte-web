const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
const partidas = require('./partidas')
const { rutaNoEncontrada, manejarErrores } = require('./errores')

const app = express()

app.use(cors())
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

module.exports = app
