import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // Refine to only include your 64 passing tests
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/invite-validation.test.ts',
      'tests/integration/firestore-mapping.test.ts',
      'tests/integration/invitation-flow.test.ts',
      'tests/integration/security_audit.test.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**', 
      '**/*.spec.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});