/**
 * Performance monitoring and tracking utility for AI-Native Kanban
 * Tracks animations, layout changes, memory usage, and bundle performance
 */

export interface PerformanceMetric {
	name: string;
	value: number;
	timestamp: number;
	category: 'animation' | 'layout' | 'memory' | 'bundle' | 'interaction';
	threshold?: number;
}

export interface PerformanceStats {
	avg: number;
	min: number;
	max: number;
	count: number;
	p95: number;
	violations: number;
}

class PerformanceMonitor {
	private metrics = new Map<string, number[]>();
	private observers = new Map<string, PerformanceObserver>();
	private memoryCheckInterval?: number;
	private isMonitoring = false;

	// Performance thresholds based on requirements
	private readonly thresholds = {
		'drag-operation': 300, // Requirement 5.4: < 300ms
		'animation-frame': 16.67, // 60fps requirement
		'layout-shift': 0.1, // CLS threshold
		'memory-usage': 50 * 1024 * 1024, // 50MB threshold
		'bundle-size': 500 * 1024, // 500KB threshold
		'responsive-layout': 100, // Layout adaptation time
		'ai-processing': 60000 // AI timeout requirement
	};

	constructor() {
		this.initializeObservers();
	}

	/**
	 * Start performance monitoring
	 */
	startMonitoring(): void {
		if (this.isMonitoring) return;

		this.isMonitoring = true;
		this.startMemoryMonitoring();
		this.observeLayoutShifts();
		this.observeAnimationPerformance();
		this.observeBundlePerformance();

		console.log('🚀 Performance monitoring started');
	}

	/**
	 * Stop performance monitoring and cleanup
	 */
	stopMonitoring(): void {
		if (!this.isMonitoring) return;

		this.isMonitoring = false;

		// Clear intervals
		if (this.memoryCheckInterval) {
			clearInterval(this.memoryCheckInterval);
		}

		// Disconnect observers
		this.observers.forEach(observer => observer.disconnect());
		this.observers.clear();

		console.log('⏹️ Performance monitoring stopped');
	}

	/**
	 * Measure performance of a specific operation
	 */
	measure<T>(name: string, operation: () => T, category: PerformanceMetric['category'] = 'interaction'): T {
		const start = performance.now();

		try {
			const result = operation();

			// Handle async operations
			if (result instanceof Promise) {
				return result.then(asyncResult => {
					this.recordMetric(name, performance.now() - start, category);
					return asyncResult;
				}) as T;
			}

			this.recordMetric(name, performance.now() - start, category);
			return result;
		} catch (error) {
			this.recordMetric(name, performance.now() - start, category);
			throw error;
		}
	}

	/**
	 * Measure async operation performance
	 */
	async measureAsync<T>(
		name: string,
		operation: () => Promise<T>,
		category: PerformanceMetric['category'] = 'interaction'
	): Promise<T> {
		const start = performance.now();

		try {
			const result = await operation();
			this.recordMetric(name, performance.now() - start, category);
			return result;
		} catch (error) {
			this.recordMetric(name, performance.now() - start, category);
			throw error;
		}
	}

	/**
	 * Record a performance metric
	 */
	recordMetric(name: string, value: number, category: PerformanceMetric['category']): void {
		if (!this.metrics.has(name)) {
			this.metrics.set(name, []);
		}

		const measurements = this.metrics.get(name)!;
		measurements.push(value);

		// Keep only last 100 measurements for memory efficiency
		if (measurements.length > 100) {
			measurements.shift();
		}

		// Check threshold violations
		const threshold = this.thresholds[name as keyof typeof this.thresholds];
		if (threshold && value > threshold) {
			console.warn(`⚠️ Performance threshold exceeded: ${name} took ${value.toFixed(2)}ms (threshold: ${threshold}ms)`);

			// Emit custom event for monitoring
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('performance-violation', {
					detail: { name, value, threshold, category }
				}));
			}
		}

		// Emit metric recorded event
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('performance-metric', {
				detail: { name, value, category, timestamp: Date.now() }
			}));
		}
	}

	/**
	 * Get performance statistics for a metric
	 */
	getStats(name: string): PerformanceStats | null {
		const measurements = this.metrics.get(name);
		if (!measurements || measurements.length === 0) return null;

		const sorted = [...measurements].sort((a, b) => a - b);
		const sum = measurements.reduce((acc, val) => acc + val, 0);
		const threshold = this.thresholds[name as keyof typeof this.thresholds];

		return {
			avg: sum / measurements.length,
			min: sorted[0],
			max: sorted[sorted.length - 1],
			count: measurements.length,
			p95: sorted[Math.floor(sorted.length * 0.95)],
			violations: threshold ? measurements.filter(val => val > threshold).length : 0
		};
	}

	/**
	 * Get all performance metrics
	 */
	getAllStats(): Record<string, PerformanceStats> {
		const stats: Record<string, PerformanceStats> = {};

		for (const [name] of this.metrics) {
			const stat = this.getStats(name);
			if (stat) {
				stats[name] = stat;
			}
		}

		return stats;
	}

	/**
	 * Initialize performance observers
	 */
	private initializeObservers(): void {
		// Only initialize if browser supports Performance Observer
		if (typeof PerformanceObserver === 'undefined') {
			console.warn('PerformanceObserver not supported');
			return;
		}
	}

	/**
	 * Start memory usage monitoring
	 */
	private startMemoryMonitoring(): void {
		if (!('memory' in performance)) {
			console.warn('Memory API not supported');
			return;
		}

		this.memoryCheckInterval = window.setInterval(() => {
			const memory = (performance as any).memory;
			if (memory) {
				this.recordMetric('memory-used', memory.usedJSHeapSize, 'memory');
				this.recordMetric('memory-total', memory.totalJSHeapSize, 'memory');
				this.recordMetric('memory-limit', memory.jsHeapSizeLimit, 'memory');
			}
		}, 5000); // Check every 5 seconds
	}

	/**
	 * Observe layout shifts for responsive performance
	 */
	private observeLayoutShifts(): void {
		if (typeof PerformanceObserver === 'undefined') return;

		try {
			const observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
						this.recordMetric('layout-shift', (entry as unknown).value, 'layout');
					}
				}
			});

			observer.observe({ entryTypes: ['layout-shift'] });
			this.observers.set('layout-shift', observer);
		} catch (error) {
			console.warn('Layout shift observation not supported:', error);
		}
	}

	/**
	 * Observe animation performance
	 */
	private observeAnimationPerformance(): void {
		if (typeof PerformanceObserver === 'undefined') return;

		try {
			const observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.entryType === 'measure') {
						this.recordMetric(`animation-${entry.name}`, entry.duration, 'animation');
					}
				}
			});

			observer.observe({ entryTypes: ['measure'] });
			this.observers.set('animation', observer);
		} catch (error) {
			console.warn('Animation performance observation not supported:', error);
		}
	}

	/**
	 * Monitor bundle performance
	 */
	private observeBundlePerformance(): void {
		if (typeof PerformanceObserver === 'undefined') return;

		try {
			const observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.entryType === 'navigation') {
						const navEntry = entry as PerformanceNavigationTiming;
						this.recordMetric('bundle-load-time', navEntry.loadEventEnd - navEntry.fetchStart, 'bundle');
						this.recordMetric('dom-content-loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart, 'bundle');
					}
				}
			});

			observer.observe({ entryTypes: ['navigation'] });
			this.observers.set('navigation', observer);
		} catch (error) {
			console.warn('Bundle performance observation not supported:', error);
		}
	}

	/**
	 * Export performance data for analysis
	 */
	exportData(): {
		timestamp: number;
		metrics: Record<string, PerformanceStats>;
		thresholds: Record<string, number>;
		userAgent: string;
	} {
		return {
			timestamp: Date.now(),
			metrics: this.getAllStats(),
			thresholds: this.thresholds,
			userAgent: navigator.userAgent
		};
	}

	/**
	 * Clear all performance data
	 */
	clearData(): void {
		this.metrics.clear();
		console.log('🧹 Performance data cleared');
	}
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development (browser only)
if (typeof window !== 'undefined') {
	try {
		// @ts-ignore - import.meta may not be available in all environments
		if (import.meta?.env?.DEV) {
			performanceMonitor.startMonitoring();
		}
	} catch (e) {
		// Ignore import.meta errors in non-module environments
	}
}
