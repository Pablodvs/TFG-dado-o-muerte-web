import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    server: {
        // Todas las interfaces, para abrir el servidor de desarrollo desde el móvil
        host: true,
        port: 3000,
        // /api va al servidor Express
        proxy: { '/api': 'http://localhost:3001' },
    },
    build: {
        // El servidor sirve cliente/build (servidor/app.js y el Dockerfile)
        outDir: 'build',
    },
    test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: './src/setupTests.js',
        // Cada test empieza con los mocks limpios
        mockReset: true,
    },
});
