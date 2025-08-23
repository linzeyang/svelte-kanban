import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		globals: true,
		setupFiles: ['./vitest-setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
		exclude: ['tests/e2e/**', 'tests/integration/**'],

		// Use browser environment for Svelte component tests
		browser: {
			enabled: true,
			name: 'chromium',
			provider: 'playwright',
			headless: true
		}
	}
});
