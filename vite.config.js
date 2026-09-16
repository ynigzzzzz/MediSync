import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: '0.0.0.0',        // ← Allow network access
        port: 5173,
        strictPort: true,
        cors: true,              // ← Allow cross-origin requests
        hmr: {
            host: '192.168.1.39', // ← YOUR laptop's IP
            port: 5173,
        },
    },
});