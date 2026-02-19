import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // required for Capacitor: assets load correctly in native shell
  build: {
    outDir: 'dist',
  },
});
