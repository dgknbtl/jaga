import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: {
        index:    resolve(__dirname, 'src/index.ts'),
        sanitize: resolve(__dirname, 'src/sanitize.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      output: [
        { format: 'es',  entryFileNames: '[name].js'  },
        { format: 'cjs', entryFileNames: '[name].cjs' },
      ],
    },
    minify: 'esbuild',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    '__VERSION__': JSON.stringify(version),
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'happy-dom',
  },
}));
