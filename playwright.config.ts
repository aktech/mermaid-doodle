import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'test',
  testMatch: '**/*.spec.ts',
  use: { baseURL: 'http://127.0.0.1:4173' },
  // dist must exist: fixtures import the built ESM, which is what consumers get.
  webServer: {
    command: 'npm run build && node test/serve.mjs',
    url: 'http://127.0.0.1:4173/test/fixtures/theme.html',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
