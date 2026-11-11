import { defineConfig } from 'vitest/config';

// Las pruebas corren en node puro: el motor no depende del DOM (sin jsdom).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
