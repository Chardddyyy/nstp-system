import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignore build output, backend (Node.js CJS), and service worker
  globalIgnores([
    'dist',
    'backend/**',
    'public/service-worker.js',
  ]),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Ignore unused vars that start with _ (catch-block convention) or ALL_CAPS constants
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      // Allow empty catch blocks (they intentionally suppress non-fatal errors)
      'no-empty': ['error', { allowEmptyCatch: true }],
      // React refresh — context/hook files in App.jsx are a known architecture choice
      'react-refresh/only-export-components': 'warn',
    },
  },
])
