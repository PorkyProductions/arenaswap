import { defineConfig } from 'cypress';
import { existsSync } from 'node:fs';
import path from 'path';
import { startStaticServer } from './cypress/staticServer';

// The real `astro build` output, served at the base path it was built for, so a spec measures the
// pages GitHub Pages will actually serve rather than a dev-server rendering of them.
const siteDir = path.resolve(__dirname, '../../docs');
const basePath = '/arenaswap/';
const e2ePort = 5198;

export default defineConfig({
	// Cypress 16 deprecates its bundled Electron and will drop it in a later major. The site is
	// a static build, so any installed browser would serve — Chrome matches what the extension's
	// suite runs on, which keeps one browser to install rather than two.
	defaultBrowser: 'chrome',
	e2e: {
		baseUrl: `http://127.0.0.1:${e2ePort}${basePath}`,
		specPattern: 'cypress/e2e/**/*.cy.ts',
		supportFile: false,
		screenshotOnRunFailure: false,
		video: false,
		// 1280 is where the desktop navigation is at its roomiest; the specs that care about the
		// tight end set 992 themselves, which is the breakpoint the links appear at.
		viewportWidth: 1280,
		viewportHeight: 900,
		async setupNodeEvents(on, config) {
			if (!existsSync(path.join(siteDir, 'index.html'))) {
				throw new Error(`No built site at ${siteDir}. Run \`npm run test:e2e\` from the repo root, which builds first, or \`npm run build\` here.`);
			}
			const server = await startStaticServer(siteDir, basePath, e2ePort);
			on('after:run', () => new Promise<void>(resolve => { server.close(() => resolve()); }));
			return config;
		},
	},
});
