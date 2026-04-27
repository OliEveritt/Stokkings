import { defineConfig } from 'vitest/config';
<<<<<<< HEAD
import react from '@vitejs/plugin-react';
=======
>>>>>>> 10-us-26-view-and-manage-payout-schedule
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
<<<<<<< HEAD
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
=======
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
>>>>>>> 10-us-26-view-and-manage-payout-schedule
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});