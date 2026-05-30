import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node20',
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      external: [/^node:/, /^@livekit\//, /^livekit-server-sdk/, /^node_modules/],
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});
