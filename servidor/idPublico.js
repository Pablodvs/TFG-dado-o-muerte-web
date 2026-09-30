const crypto = require('crypto')

// Id de partida que se ve en la API y en las URLs: 16 bytes aleatorios en base64url
// (22 caracteres), para que no se puedan recorrer las partidas probando 1, 2, 3...
// El id numérico sigue siendo la clave interna de la tabla.
const FORMATO = /^[A-Za-z0-9_-]{22}$/

function nuevoIdPublico() {
  return crypto.randomBytes(16).toString('base64url')
}

function esIdPublico(texto) {
  return typeof texto === 'string' && FORMATO.test(texto)
}

module.exports = { nuevoIdPublico, esIdPublico }
