import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // The message files (locales/), strict: a missing message or argument fails the test.
    setupFiles: ['tests/setup.ts'],
  },
});
