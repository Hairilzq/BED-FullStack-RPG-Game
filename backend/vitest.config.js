import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['_extras/tests/**/*.test.js'],
    globals: true,
  },
});
