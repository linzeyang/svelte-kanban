import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { performanceOptimizer } from './vite-plugins/performance-optimizer';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		performanceOptimizer({
			bundleSizeLimit: 500 * 1024, // 500KB limit
			chunkSizeLimit: 100 * 1024,  // 100KB per chunk
			enableAnalysis: true,
			enableOptimizations: true
		})
	],

	// Performance optimizations
	build: {
		target: 'esnext',
		minify: 'esbuild',
		cssMinify: true,
		rollupOptions: {
			output: {
				// Optimize chunk naming for caching
				chunkFileNames: 'chunks/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]'
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
		include: ['openai'],
		exclude: ['@sveltejs/kit', 'svelte']
	}
});
