import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 120000
	},
	// Configure test projects for different test suites
	projects: [
		{
			name: 'e2e',
			testDir: 'e2e',
			use: {
				baseURL: 'http://localhost:4173'
			}
		},
		{
			name: 'integration',
			testDir: 'tests/integration',
			use: {
				baseURL: 'http://localhost:4173'
			}
		}
	],
	// Global test configuration
	use: {
		baseURL: 'http://localhost:4173',
		headless: true,
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},
	// Test execution settings
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	// Test output settings
	reporter: [
		['html'],
		['json', { outputFile: 'test-results/results.json' }],
		['junit', { outputFile: 'test-results/results.xml' }]
	],
	outputDir: 'test-results/'
});
