/**
 * Bundle size analysis and optimization utilities
 * Monitors component tree size and provides optimization recommendations
 */

import { performanceMonitor } from './performance-monitor.js';

export interface BundleMetrics {
	totalSize: number;
	gzippedSize: number;
	components: ComponentMetrics[];
	dependencies: DependencyMetrics[];
	recommendations: OptimizationRecommendation[];
}

export interface ComponentMetrics {
	name: string;
	size: number;
	renderTime: number;
	memoryUsage: number;
	children: number;
	depth: number;
}

export interface DependencyMetrics {
	name: string;
	size: number;
	version: string;
	treeshakeable: boolean;
	usage: 'critical' | 'important' | 'optional';
}

export interface OptimizationRecommendation {
	type: 'lazy-load' | 'tree-shake' | 'code-split' | 'compress' | 'cache';
	target: string;
	impact: 'high' | 'medium' | 'low';
	description: string;
	estimatedSavings: number;
}

class BundleAnalyzer {
	private componentRegistry = new Map<string, ComponentMetrics>();
	private dependencyRegistry = new Map<string, DependencyMetrics>();
	private isAnalyzing = false;

	// Size thresholds (in bytes)
	private readonly thresholds = {
		totalBundle: 500 * 1024, // 500KB
		singleComponent: 50 * 1024, // 50KB
		dependency: 100 * 1024, // 100KB
		renderTime: 16.67, // 60fps
		memoryPerComponent: 1024 * 1024 // 1MB
	};

	/**
	 * Start bundle analysis
	 */
	startAnalysis(): void {
		if (this.isAnalyzing) return;

		this.isAnalyzing = true;
		this.analyzeComponentTree();
		this.analyzeDependencies();
		this.setupPerformanceTracking();

		console.log('📦 Bundle analysis started');
	}

	/**
	 * Stop bundle analysis
	 */
	stopAnalysis(): void {
		if (!this.isAnalyzing) return;

		this.isAnalyzing = false;
		console.log('📦 Bundle analysis stopped');
	}

	/**
	 * Register a component for analysis
	 */
	registerComponent(name: string, element: HTMLElement): void {
		const start = performance.now();

		// Measure component size (approximate)
		const size = this.estimateComponentSize(element);
		const renderTime = performance.now() - start;
		const memoryUsage = this.estimateMemoryUsage(element);
		const children = element.children.length;
		const depth = this.calculateDepth(element);

		const metrics: ComponentMetrics = {
			name,
			size,
			renderTime,
			memoryUsage,
			children,
			depth
		};

		this.componentRegistry.set(name, metrics);

		// Check thresholds
		if (size > this.thresholds.singleComponent) {
			console.warn(`⚠️ Large component detected: ${name} (${(size / 1024).toFixed(2)}KB)`);
		}

		if (renderTime > this.thresholds.renderTime) {
			console.warn(`⚠️ Slow component render: ${name} (${renderTime.toFixed(2)}ms)`);
		}

		// Record metrics
		performanceMonitor.recordMetric(`component-size-${name}`, size, 'bundle');
		performanceMonitor.recordMetric(`component-render-${name}`, renderTime, 'animation');
	}

	/**
	 * Analyze component tree structure
	 */
	private analyzeComponentTree(): void {
		// Find all Svelte components in the DOM
		const components = document.querySelectorAll('[data-svelte-component]');

		components.forEach((element) => {
			const componentName = element.getAttribute('data-svelte-component') || 'unknown';
			this.registerComponent(componentName, element as HTMLElement);
		});

		// Analyze overall tree structure
		const totalComponents = this.componentRegistry.size;
		const avgDepth = Array.from(this.componentRegistry.values())
			.reduce((sum, comp) => sum + comp.depth, 0) / totalComponents;

		performanceMonitor.recordMetric('component-tree-size', totalComponents, 'bundle');
		performanceMonitor.recordMetric('component-tree-depth', avgDepth, 'bundle');
	}

	/**
	 * Analyze dependencies and their impact
	 */
	private analyzeDependencies(): void {
		// This would typically be done at build time
		// For runtime analysis, we can estimate based on loaded modules

		const knownDependencies = [
			{ name: 'svelte', usage: 'critical' as const, estimatedSize: 50 * 1024 },
			{ name: '@sveltejs/kit', usage: 'critical' as const, estimatedSize: 100 * 1024 },
			{ name: 'tailwindcss', usage: 'critical' as const, estimatedSize: 30 * 1024 },
			{ name: 'openai', usage: 'important' as const, estimatedSize: 200 * 1024 }
		];

		knownDependencies.forEach(dep => {
			const metrics: DependencyMetrics = {
				name: dep.name,
				size: dep.estimatedSize,
				version: 'unknown',
				treeshakeable: true,
				usage: dep.usage
			};

			this.dependencyRegistry.set(dep.name, metrics);

			if (dep.estimatedSize > this.thresholds.dependency) {
				console.warn(`📦 Large dependency: ${dep.name} (${(dep.estimatedSize / 1024).toFixed(2)}KB)`);
			}
		});
	}

	/**
	 * Setup performance tracking for bundle metrics
	 */
	private setupPerformanceTracking(): void {
		// Track script loading performance
		if (typeof PerformanceObserver !== 'undefined') {
			const observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.entryType === 'resource' && entry.name.includes('.js')) {
						const size = (entry as any).transferSize || 0;
						performanceMonitor.recordMetric('script-load-size', size, 'bundle');
						performanceMonitor.recordMetric('script-load-time', entry.duration, 'bundle');
					}
				}
			});

			observer.observe({ entryTypes: ['resource'] });
		}
	}

	/**
	 * Estimate component size (approximate)
	 */
	private estimateComponentSize(element: HTMLElement): number {
		// Rough estimation based on DOM complexity
		const htmlSize = element.outerHTML.length;
		const childrenCount = element.querySelectorAll('*').length;
		const attributesCount = element.attributes.length;

		// Estimate: base HTML + children complexity + attributes
		return htmlSize + (childrenCount * 100) + (attributesCount * 50);
	}

	/**
	 * Estimate memory usage for component
	 */
	private estimateMemoryUsage(element: HTMLElement): number {
		// Rough estimation based on DOM nodes and event listeners
		const nodeCount = element.querySelectorAll('*').length;
		const eventListeners = this.countEventListeners(element);

		// Estimate: nodes * base memory + listeners * listener memory
		return (nodeCount * 1000) + (eventListeners * 500);
	}

	/**
	 * Count event listeners on element (approximate)
	 */
	private countEventListeners(element: HTMLElement): number {
		// This is a rough approximation
		const interactiveElements = element.querySelectorAll('button, input, select, textarea, [onclick], [onchange]');
		return interactiveElements.length;
	}

	/**
	 * Calculate DOM depth
	 */
	private calculateDepth(element: HTMLElement): number {
		let depth = 0;
		let current = element.parentElement;

		while (current) {
			depth++;
			current = current.parentElement;
		}

		return depth;
	}

	/**
	 * Generate optimization recommendations
	 */
	generateRecommendations(): OptimizationRecommendation[] {
		const recommendations: OptimizationRecommendation[] = [];

		// Analyze components for lazy loading opportunities
		this.componentRegistry.forEach((metrics, name) => {
			if (metrics.size > this.thresholds.singleComponent) {
				recommendations.push({
					type: 'lazy-load',
					target: name,
					impact: 'high',
					description: `Component ${name} is large (${(metrics.size / 1024).toFixed(2)}KB) and could benefit from lazy loading`,
					estimatedSavings: metrics.size * 0.7
				});
			}

			if (metrics.renderTime > this.thresholds.renderTime) {
				recommendations.push({
					type: 'code-split',
					target: name,
					impact: 'medium',
					description: `Component ${name} has slow render time (${metrics.renderTime.toFixed(2)}ms) and could be code-split`,
					estimatedSavings: metrics.renderTime * 0.5
				});
			}
		});

		// Analyze dependencies
		this.dependencyRegistry.forEach((metrics, name) => {
			if (metrics.size > this.thresholds.dependency && metrics.usage === 'optional') {
				recommendations.push({
					type: 'tree-shake',
					target: name,
					impact: 'high',
					description: `Dependency ${name} is large and optional - consider tree shaking or removal`,
					estimatedSavings: metrics.size * 0.8
				});
			}
		});

		// Sort by impact and estimated savings
		return recommendations.sort((a, b) => {
			const impactWeight = { high: 3, medium: 2, low: 1 };
			const aScore = impactWeight[a.impact] * a.estimatedSavings;
			const bScore = impactWeight[b.impact] * b.estimatedSavings;
			return bScore - aScore;
		});
	}

	/**
	 * Get bundle metrics summary
	 */
	getBundleMetrics(): BundleMetrics {
		const totalSize = Array.from(this.componentRegistry.values())
			.reduce((sum, comp) => sum + comp.size, 0) +
			Array.from(this.dependencyRegistry.values())
			.reduce((sum, dep) => sum + dep.size, 0);

		return {
			totalSize,
			gzippedSize: totalSize * 0.3, // Rough gzip estimation
			components: Array.from(this.componentRegistry.values()),
			dependencies: Array.from(this.dependencyRegistry.values()),
			recommendations: this.generateRecommendations()
		};
	}

	/**
	 * Export bundle analysis data
	 */
	exportData(): {
		timestamp: number;
		metrics: BundleMetrics;
		thresholds: Record<string, number>;
		performance: Record<string, any>;
	} {
		return {
			timestamp: Date.now(),
			metrics: this.getBundleMetrics(),
			thresholds: this.thresholds,
			performance: performanceMonitor.getAllStats()
		};
	}

	/**
	 * Clear analysis data
	 */
	clearData(): void {
		this.componentRegistry.clear();
		this.dependencyRegistry.clear();
		console.log('🧹 Bundle analysis data cleared');
	}
}

// Singleton instance
export const bundleAnalyzer = new BundleAnalyzer();

// Auto-start in development (browser only)
if (typeof window !== 'undefined') {
	try {
		// @ts-ignore - import.meta may not be available in all environments
		if (import.meta?.env?.DEV) {
			// Start analysis after page load
			if (document.readyState === 'complete') {
				bundleAnalyzer.startAnalysis();
			} else {
				window.addEventListener('load', () => {
					bundleAnalyzer.startAnalysis();
				});
			}
		}
	} catch (e) {
		// Ignore import.meta errors in non-module environments
	}
}
