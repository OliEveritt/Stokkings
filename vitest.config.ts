import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // 🛡️ Add these exclusions to prevent Vitest from touching Playwright files
    exclude: [
  '**/node_modules/**',
  '**/tests/e2e/**',
  '**/tests/integration/api/**',      // 👈 Ignore empty API tests
  '**/tests/integration/services/**', // 👈 Ignore empty Service tests
  '**/*.spec.ts',
],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Only include your actual source code in the coverage report
      include: ['src/**/*.ts', 'src/**/*.tsx'], 
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});