import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path'; // Required for directory mapping

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    coverage: {
      provider: 'v8', // Ensures you use the v8 engine for the coverage report
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      // This maps the '@' symbol to your 'src' folder shown in image_56fc27.png
      '@': path.resolve(__dirname, './src'),
    },
  },
});