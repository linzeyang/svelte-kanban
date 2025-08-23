/**
 * Vite plugin for performance optimization and bundle analysis
 * Provides build-time optimizations and performance monitoring
 */

import type { Plugin } from 'vite';
import { gzipSync } from 'zlib';

interface ChunkInfo {
	fileName: string;
	size: number;
	gzippedSize: number;
	modules?: string[];
	isEntry?: boolean;
	isDynamicEntry?: boolean;
}

interface PerformanceOptimizerOptions {
	bundleSizeLimit?: number;
	chunkSizeLimit?: number;
	enableAnalysis?: boolean;
	enableOptimizations?: boolean;
}

export function performanceOptimizer(options: PerformanceOptimizerOptions = {}): Plugin {
	const {
		bundleSizeLimit = 500 * 1024, // 500KB
		chunkSizeLimit = 100 * 1024, // 100KB
		enableAnalysis = true,
		enableOptimizations = true
	} = options;

	let buildStartTime: number;
	let bundleStats: Record<string, any> = {};

	return {
		name: 'performance-optimizer',

		buildStart() {
			buildStartTime = Date.now();
			console.log('🚀 Performance optimizer started');
		},

		generateBundle(outputOptions, bundle) {
			if (!enableAnalysis) return;

			const chunks: any[] = [];
			const assets: any[] = [];
			let totalSize = 0;

			// Analyze bundle contents
			for (const [fileName, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'chunk') {
					const size = Buffer.byteLength(chunk.code, 'utf8');
					const gzippedSize = gzipSync(chunk.code).length;

					chunks.push({
						fileName,
						size,
						gzippedSize,
						modules: Object.keys(chunk.modules || {}),
						isEntry: chunk.isEntry,
						isDynamicEntry: chunk.isDynamicEntry
					});

					totalSize += size;

					// Check chunk size limits
					if (size > chunkSizeLimit) {
						console.warn(`⚠️ Large chunk detected: ${fileName} (${(size / 1024).toFixed(2)}KB)`);
					}
				} else if (chunk.type === 'asset') {
					const size = chunk.source ? Buffer.byteLength(chunk.source) : 0;
					assets.push({
						fileName,
						size
					});
					totalSize += size;
				}
			}

			// Check total bundle size
			if (totalSize > bundleSizeLimit) {
				console.warn(`⚠️ Bundle size exceeds limit: ${(totalSize / 1024).toFixed(2)}KB (limit: ${(bundleSizeLimit / 1024).toFixed(2)}KB)`);
			}

			// Store bundle statistics
			bundleStats = {
				totalSize,
				totalGzippedSize: chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0),
				chunks,
				assets,
				chunkCount: chunks.length,
				assetCount: assets.length
			};

			// Generate optimization recommendations
			const recommendations = generateOptimizationRecommendations(chunks);
			if (recommendations.length > 0) {
				console.log('\n📦 Bundle Optimization Recommendations:');
				recommendations.forEach(rec => {
					console.log(`  ${rec.type}: ${rec.description}`);
				});
			}
		},

		writeBundle() {
			const buildTime = Date.now() - buildStartTime;

			console.log('\n📊 Bundle Analysis:');
			console.log(`  Total Size: ${(bundleStats.totalSize / 1024).toFixed(2)}KB`);
			console.log(`  Gzipped Size: ${(bundleStats.totalGzippedSize / 1024).toFixed(2)}KB`);
			console.log(`  Chunks: ${bundleStats.chunkCount}`);
			console.log(`  Assets: ${bundleStats.assetCount}`);
			console.log(`  Build Time: ${buildTime}ms`);

			// Write bundle analysis to file
			if (enableAnalysis) {
				const analysisData = {
					timestamp: Date.now(),
					buildTime,
					...bundleStats,
					recommendations: generateOptimizationRecommendations(bundleStats.chunks || [])
				};

				this.emitFile({
					type: 'asset',
					fileName: 'bundle-analysis.json',
					source: JSON.stringify(analysisData, null, 2)
				});
			}
		},

		configResolved(config) {
			if (!enableOptimizations) return;

			// Apply performance optimizations (read-only config, so we modify the existing objects)
			if (!config.build) {
				console.warn('Build config not available for optimization');
				return;
			}

			// Ensure rollupOptions exists
			if (!config.build.rollupOptions) {
				config.build.rollupOptions = {};
			}

			// Ensure output exists and is an object (not array)
			if (!config.build.rollupOptions.output) {
				config.build.rollupOptions.output = {};
			}

			const output = config.build.rollupOptions.output;

			// Only modify if output is a single object, not an array
			if (!Array.isArray(output)) {
				// Optimize chunk splitting
				if (!output.manualChunks) {
					output.manualChunks = (id: string) => {
						// Vendor chunks
						if (id.includes('node_modules')) {
							if (id.includes('svelte')) return 'svelte-vendor';
							if (id.includes('openai')) return 'ai-vendor';
							if (id.includes('tailwindcss')) return 'ui-vendor';
							return 'vendor';
						}

						// Component chunks
						if (id.includes('src/lib/components')) {
							if (id.includes('kanban')) return 'kanban-components';
							if (id.includes('layout')) return 'layout-components';
							if (id.includes('debug')) return 'debug-components';
							return 'components';
						}

						// Utility chunks
						if (id.includes('src/lib/utils')) {
							return 'utils';
						}

						// Store chunks
						if (id.includes('src/lib/stores')) {
							return 'stores';
						}
					};
				}
			}

			// Enable tree shaking
			if (!config.build.rollupOptions.treeshake) {
				config.build.rollupOptions.treeshake = {
					moduleSideEffects: false,
					propertyReadSideEffects: false,
					unknownGlobalSideEffects: false
				};
			}
		}
	};
}

function generateOptimizationRecommendations(chunks: ChunkInfo[]): Array<{
	type: string;
	description: string;
	impact: 'high' | 'medium' | 'low';
}> {
	const recommendations: Array<{
		type: string;
		description: string;
		impact: 'high' | 'medium' | 'low';
	}> = [];

	// Check for large chunks
	const largeChunks = chunks.filter(chunk => (chunk as ChunkInfo).size > 100 * 1024);
	if (largeChunks.length > 0) {
		recommendations.push({
			type: 'Code Splitting',
			description: `${largeChunks.length} chunks are larger than 100KB. Consider splitting them further.`,
			impact: 'high'
		});
	}

	// Check for duplicate modules
	const allModules = chunks.flatMap(chunk => (chunk as ChunkInfo).modules || []);
	const moduleCount = allModules.reduce((acc, module) => {
		acc[module] = (acc[module] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const duplicateModules = Object.entries(moduleCount).filter(([, count]) => (count as number) > 1);
	if (duplicateModules.length > 0) {
		recommendations.push({
			type: 'Deduplication',
			description: `${duplicateModules.length} modules are duplicated across chunks.`,
			impact: 'medium'
		});
	}

	// Check compression ratio
	chunks.forEach(chunk => {
		const compressionRatio = chunk.gzippedSize / chunk.size;
		if (compressionRatio > 0.8) {
			recommendations.push({
				type: 'Compression',
				description: `Chunk ${chunk.fileName} has poor compression ratio (${(compressionRatio * 100).toFixed(1)}%).`,
				impact: 'low'
			});
		}
	});

	// Check for unused entry points
	const entryChunks = chunks.filter(chunk => chunk.isEntry);
	if (entryChunks.length > 3) {
		recommendations.push({
			type: 'Entry Points',
			description: `${entryChunks.length} entry points detected. Consider reducing entry points.`,
			impact: 'medium'
		});
	}

	return recommendations;
}

export default performanceOptimizer;
