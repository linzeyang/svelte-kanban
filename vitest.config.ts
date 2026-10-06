import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
	plugins: [
		// `#lib` resolves natively via the `imports` field in package.json (SvelteKit 3).
		sveltekit()
	],
	test: {
		globals: true,
		setupFiles: ['./vitest-setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
		exclude: ['tests/e2e/**', 'tests/integration/**'],

		// Vitest 5 browser mode: `provider` is now a function from
		// @vitest/browser-playwright, and `name` is replaced by `instances`.
		browser: {
			enabled: true,
			provider: playwright(),
			headless: true,
			instances: [{ browser: 'chromium' }]
		}
	}
});
