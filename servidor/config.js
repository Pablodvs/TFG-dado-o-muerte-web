const path = require('path')

// Las variables ya definidas en el entorno tienen prioridad sobre las del .env
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true })

module.exports = {
  port: Number(process.env.PORT) || 3001,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME || 'dado-o-muerte',
  },
}
