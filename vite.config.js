import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  server: {
    port: 5178,
    strictPort: true,
  },
  preview: {
    port: 5178,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        introduccion: resolve(__dirname, 'introduccion.html'),
        habitacion: resolve(__dirname, 'habitacion.html'),
        carta: resolve(__dirname, 'carta.html'),
        libro: resolve(__dirname, 'libro.html'),
        ventana: resolve(__dirname, 'ventana.html'),
        puerta: resolve(__dirname, 'puerta.html'),
        final: resolve(__dirname, 'final.html'),
        foto: resolve(__dirname, 'foto.html'),
        palabras: resolve(__dirname, 'palabras.html'),
        'para-ti': resolve(__dirname, 'para-ti.html'),
      },
    },
  },
});
