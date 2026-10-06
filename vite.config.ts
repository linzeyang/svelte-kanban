import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-netlify';
import { defineConfig } from 'vite';
import { performanceOptimizer } from './vite-plugins/performance-optimizer.ts';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// SvelteKit 3: project config now lives here instead of svelte.config.js
			adapter: adapter(),
			preprocess: vitePreprocess()
		}),
		performanceOptimizer({
			bundleSizeLimit: 500 * 1024, // 500KB limit
			chunkSizeLimit: 100 * 1024, // 100KB per chunk
			enableAnalysis: true,
			enableOptimizations: true
		})
	],

	// Performance optimizations
	build: {
		target: 'esnext',
		minify: 'oxc',
		cssMinify: true,
		rollupOptions: {
			output: {
				// Optimize chunk naming for caching
				// (assetFileNames omitted: SvelteKit 3 overrides it)
				chunkFileNames: 'chunks/[name]-[hash].js'
			}
		}
	},

	// Development optimizations
	server: {
		fs: {
			// Allow serving files from one level up to the project root
			allow: ['..']
		}
	},

	// Dependency optimization
	optimizeDeps: {
		exclude: ['@sveltejs/kit', 'svelte']
	}
});
