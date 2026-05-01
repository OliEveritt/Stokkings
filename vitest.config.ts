import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // Add this exclude block to stop Vitest from running Playwright tests
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**', 
      '**/*.spec.ts',
      '**/node_modules/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});