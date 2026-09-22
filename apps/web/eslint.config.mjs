import { fixupConfigRules } from '@eslint/compat';
import * as espree from 'espree';
import { defineConfig } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  {
    extends: fixupConfigRules(nextCoreWebVitals),
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { parser: espree },
  },
]);
