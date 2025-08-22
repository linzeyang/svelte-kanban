import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration specifically for integration tests
 * These tests focus on component integration and end-to-end workflows
 */
export default defineConfig({
	webServer: {
		command: 'npm run dev',
		port: 5173,
		reuseExistingServer: true,
		timeout: 120000
	},
	testDir: 'tests/integration',
	use: {
		baseURL: 'http://localhost:5173',
		headless: true,
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		trace: 'on-first-retry'
	},
	// Integration tests may need more time for complex workflows
	timeout: 30000,
	expect: {
		timeout: 10000
	},
	// Test execution settings
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	// Test output settings
	reporter: [
		['html', { outputFolder: 'test-results/integration-report' }],
		['json', { outputFile: 'test-results/integration-results.json' }],
		['junit', { outputFile: 'test-results/integration-results.xml' }]
	],
	outputDir: 'test-results/integration-artifacts'
});
