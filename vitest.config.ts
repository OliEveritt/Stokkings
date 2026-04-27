import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ["tests/**/*.test.ts"],
    exclude: [
      '**/node_modules/**',
      "tests/unit/services/contribution.service.test.ts",
      "tests/unit/services/payment.service.test.ts",
      "tests/unit/services/payout.service.test.ts",
      "tests/unit/services/analytics.service.test.ts",
      "tests/unit/services/export.service.test.ts",
      "tests/unit/repositories/analytics.repository.test.ts",
      "tests/unit/repositories/contribution.repository.test.ts",
      "tests/unit/repositories/group.repository.test.ts",
      "tests/unit/repositories/member.repository.test.ts",
      "tests/unit/repositories/meeting.repository.test.ts",
      "tests/unit/repositories/notification.repository.test.ts",
      "tests/unit/repositories/payout.repository.test.ts",
      "tests/unit/components/**",
      "tests/unit/validators/**",
      "tests/integration/**",
      "tests/e2e/**",
      "**/*.spec.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ['text', 'json', 'html'],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/types/**"],
    },
  },
});
