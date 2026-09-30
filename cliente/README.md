# Dice or Die: cliente

Cliente web (React 18 + Redux Toolkit, Create React App) de "Dice or Die". La explicación del juego, la instalación y la configuración están en el [README principal](../README.md) ([en español](../README_ES.md)).

```bash
npm install
npm start          # http://localhost:3000, redirige /api a http://localhost:3001
npm test           # tests con Jest y React Testing Library
npm run build      # genera cliente/build, que el servidor Express sirve automáticamente
```

Variable opcional: `REACT_APP_API_URL` (por defecto, el mismo origen).
