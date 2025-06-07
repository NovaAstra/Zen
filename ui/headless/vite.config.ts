import { defineConfig } from 'vite';
import { resolve } from 'path';
import packageJson from './package.json';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: packageJson.name,
      fileName: packageJson.name,
      formats: ['es', 'umd', 'cjs'],
    },
    rollupOptions: {
      external: ['fs', 'fs/promises', 'path'],
      output: [
        {
          format: 'es',
          dir: resolve(__dirname, 'dist/es'),
          entryFileNames: '[name].js',
          sourcemap: true,
        },
        {
          format: 'umd',
          dir: resolve(__dirname, 'dist/umd'),
          entryFileNames: '[name].js',
          sourcemap: true,
          name: packageJson.name,
        },
        {
          format: 'cjs',
          dir: resolve(__dirname, 'dist/cjs'),
          entryFileNames: '[name].js',
          sourcemap: true,
          name: packageJson.name,
        },
      ],
    },
    sourcemap: true,
  },
});