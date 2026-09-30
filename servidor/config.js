const path = require('path')

// Las variables ya definidas en el entorno tienen prioridad sobre las del .env
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true })

// TRUST_PROXY: cuántos proxies hay delante del servidor (Coolify, Cloudflare Tunnel...),
// para tomar la IP del cliente de X-Forwarded-For. También vale true/false o una lista
// de IPs o redes, como el "trust proxy" de Express. Sin definir: no hay proxy.
function leerTrustProxy(valor) {
  if (valor === undefined || valor.trim() === '' || valor === 'false') return false
  if (valor === 'true') return true
  return /^\d+$/.test(valor) ? Number(valor) : valor
}

module.exports = {
  port: Number(process.env.PORT) || 3001,
  trustProxy: leerTrustProxy(process.env.TRUST_PROXY),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME || 'dado-o-muerte',
  },
  leerTrustProxy,
}
