import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'jaga',
      fileName: (format) => `jaga.${format === 'es' ? 'js' : format === 'cjs' ? 'cjs' : 'umd.cjs'}`,
      formats: ['es', 'cjs', 'umd']
    },
    minify: 'esbuild'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'happy-dom'
  }
}));
