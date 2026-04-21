import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: [
      "tests/unit/services/contribution.service.test.ts",
      "tests/unit/services/payment.service.test.ts",
      "tests/unit/services/payout.service.test.ts",
      "tests/unit/services/projection.service.test.ts",
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
      "tests/unit/validators/contribution.validator.test.ts",
      "tests/unit/validators/group.validator.test.ts",
      "tests/integration/**",
      "tests/e2e/**",
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/types/**", "src/app/**/*.tsx", "src/components/**/*.tsx"],
    },
  },
});
