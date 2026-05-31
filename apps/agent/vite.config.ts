import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@n2base/schemas': path.resolve(__dirname, '../../packages/schemas/src/index.ts'),
    },
  },
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
