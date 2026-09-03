import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Vitest, not Jest — one runner across the estate.
 *
 * The SWC plugin is not optional for a NestJS codebase. Vitest transforms with
 * esbuild by default, and esbuild does not implement `emitDecoratorMetadata`;
 * without it Nest's dependency injection has no type information to work from
 * and any test that builds a testing module fails to resolve its providers.
 * SWC does implement it.
 */
export default defineConfig({
  test: {
    // `describe`/`it`/`expect` without an import in every file, matching how
    // the Jest suites were written.
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: '../coverage',
      include: ['src/**/*.ts'],
    },
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
