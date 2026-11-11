import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.browser },
    rules: {
      // Heredado del HTML original; el código se movió sin reescribir
      'no-unused-vars': 'warn',
      'no-useless-assignment': 'warn',
    },
  },
  {
    // El motor de cálculo es puro: no puede tocar el DOM
    files: ['src/engine/**/*.js'],
    languageOptions: { globals: {} },
    rules: { 'no-restricted-globals': ['error', 'document', 'window'] },
  },
];
