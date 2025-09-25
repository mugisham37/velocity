import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@kiro/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@kiro/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
