import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Path corrected to match the location in image_2ff997.png
    setupFiles: ['./tests/setup.ts'], 
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});