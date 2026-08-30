/**
 * Dónde Hay - ESLint flat config (ESLint 10.x)
 * Basado en eslint-config-expo/flat (SDK 57). Reglas locales encima.
 */
const { defineConfig } = require('eslint/config');
const globals = require('globals');
const expoFlat = require('eslint-config-expo/flat');

module.exports = defineConfig([
  ...expoFlat,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'web-build/**',
      'coverage/**',
      'android/**',
      'ios/**',
      '!.expo/types/**',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Reglas de React Compiler (React 19): el proyecto no corre el compiler
      // y el codigo pre-existente usa patrones legacy. Se mantienen visibles
      // como warnings (no bloquean) para limpieza futura.
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
]);