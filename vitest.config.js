import { defineConfig } from 'vitest/config';

// Entorno node por defecto: el motor (tests/engine) no depende del DOM y corre sin jsdom.
// Solo tests/ui/escenarios.test.js pide jsdom, con su propia cabecera @vitest-environment.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
