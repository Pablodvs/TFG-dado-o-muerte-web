# Imagen de producción: el servidor Express sirve la API y el cliente compilado.
#   docker build -t dado-o-muerte .
#   docker run -p 3001:3001 -e DB_HOST=... -e DB_USER=... -e DB_PASSWORD=... dado-o-muerte

# 1) Compila el cliente
FROM node:22-alpine AS cliente
WORKDIR /app/cliente
COPY cliente/package*.json ./
RUN npm ci
COPY cliente/ ./
RUN npm run build

# 2) Servidor, con el build del cliente en ../cliente/build (donde lo busca app.js)
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app/servidor
COPY servidor/package*.json ./
RUN npm ci --omit=dev
COPY servidor/ ./
COPY --from=cliente /app/cliente/build /app/cliente/build
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3001}/api/health" || exit 1
# Crea las tablas si faltan (esperando a que MySQL arranque) y después arranca el servidor.
# Con exec, node pasa a ser el PID 1 y recibe el SIGTERM de docker stop.
CMD ["sh", "-c", "node db/init.js --esperar && exec node index.js"]
