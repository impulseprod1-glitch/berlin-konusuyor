import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: './index.html',
        admin: './admin.html',
        profile: './profile.html',
      },
    },
  },
  server: {
    port: 3000,
  }
});
