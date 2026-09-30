# Dice or Die: cliente

Cliente web (React 18, Redux Toolkit y React Router, con Vite) de "Dice or Die". La explicación del juego, la instalación y la configuración están en el [README principal](../README.md) ([en español](../README_ES.md)).

Necesita Node 22.12 o superior.

```bash
npm install
npm run dev        # http://localhost:3000, redirige /api a http://localhost:3001
npm test           # Vitest + React Testing Library (modo watch; npm test -- --run para una pasada)
npm run lint       # ESLint
npm run build      # genera cliente/build, que el servidor Express sirve automáticamente
```

Variable opcional: `VITE_API_URL` (por defecto, el mismo origen).
