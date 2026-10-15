const { defineConfig } = require('@playwright/test');
const demo = require('./tests/fixtures/layoutsplat/demo-publication.json');
const baseURL = process.env.LAYOUTSPLAT_URL || 'http://127.0.0.1:4183';
// Functional layout proofs use a known reference document; fresh-start behavior
// is tested separately with an explicitly empty browser state.
const storageState = { cookies: [], origins: [{ origin: new URL(baseURL).origin, localStorage: [{ name: 'layoutsplat.autosave.v1', value: JSON.stringify(demo) }] }] };
module.exports = defineConfig({ testDir: './tests', testMatch: 'layoutsplat*.spec.js', timeout: 45000, use: { baseURL, storageState, launchOptions: process.env.LAYOUTSPLAT_CHROME ? { executablePath: process.env.LAYOUTSPLAT_CHROME } : {} }, webServer: process.env.LAYOUTSPLAT_URL ? undefined : { command: 'python3 -m http.server 4183 --bind 127.0.0.1', url: 'http://127.0.0.1:4183/', reuseExistingServer: true }, workers: 2 });
