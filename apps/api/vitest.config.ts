import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@kiro/database': resolve(__dirname, '../../packages/database/src'),
      '@kiro/config': resolve(__dirname, '../../packages/config/src'),
    },
  },
});
