/**
 * Responsive layout performance monitoring
 * Tracks layout adaptation performance across different device sizes
 */

import { performanceMonitor } from './performance-monitor.js';

export interface ViewportInfo {
	width: number;
	height: number;
	devicePixelRatio: number;
	orientation: string;
	breakpoint: string;
}

export interface LayoutMetrics {
	adaptationTime: number;
	reflows: number;
	repaints: number;
	viewport: ViewportInfo;
}

class ResponsiveMonitor {
	private resizeObserver?: ResizeObserver;
	private mediaQueries = new Map<string, MediaQueryList>();
	private lastResize = 0;
	private resizeTimeout?: number;
	private isMonitoring = false;

	// Breakpoints matching TailwindCSS defaults
	private readonly breakpoints = {
		sm: '(min-width: 640px)',
		md: '(min-width: 768px)',
		lg: '(min-width: 1024px)',
		xl: '(min-width: 1280px)',
		'2xl': '(min-width: 1536px)'
	};

	constructor() {
		// Only initialize in browser environment
		if (typeof window !== 'undefined') {
			this.initializeMediaQueries();
		}
	}

	/**
	 * Start responsive performance monitoring
	 */
	startMonitoring(): void {
		if (this.isMonitoring) return;
		if (typeof window === 'undefined') return;

		this.isMonitoring = true;
		this.setupResizeObserver();
		this.setupViewportListener();
		this.monitorContainerQueries();

		console.log('📱 Responsive monitoring started');
	}

	/**
	 * Stop responsive monitoring
	 */
	stopMonitoring(): void {
		if (!this.isMonitoring) return;

		this.isMonitoring = false;

		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}

		if (this.resizeTimeout) {
			clearTimeout(this.resizeTimeout);
		}

		console.log('📱 Responsive monitoring stopped');
	}

	/**
	 * Get current viewport information
	 */
	getViewportInfo(): ViewportInfo {
		if (typeof window === 'undefined') {
			// Return default values for SSR
			return {
				width: 1024,
				height: 768,
				devicePixelRatio: 1,
				orientation: 'landscape',
				breakpoint: 'lg'
			};
		}

		const width = window.innerWidth;
		const height = window.innerHeight;
		const devicePixelRatio = window.devicePixelRatio || 1;
		const orientation = width > height ? 'landscape' : 'portrait';

		let breakpoint = 'xs';
		for (const [name, query] of this.mediaQueries) {
			if (query.matches) {
				breakpoint = name;
			}
		}

		return {
			width,
			height,
			devicePixelRatio,
			orientation,
			breakpoint
		};
	}

	/**
	 * Measure layout adaptation performance
	 */
	measureLayoutAdaptation(callback: () => void): void {
		const start = performance.now();

		// Use requestAnimationFrame to measure after layout
		requestAnimationFrame(() => {
			callback();

			requestAnimationFrame(() => {
				const duration = performance.now() - start;
				performanceMonitor.recordMetric('responsive-layout', duration, 'layout');

				// Log viewport info for context
				const viewport = this.getViewportInfo();
				console.log(`📐 Layout adapted in ${duration.toFixed(2)}ms for ${viewport.breakpoint} (${viewport.width}x${viewport.height})`);
			});
		});
	}

	/**
	 * Monitor container query performance
	 */
	private monitorContainerQueries(): void {
		// Monitor elements with container queries
		const containerElements = document.querySelectorAll('[style*="container-type"], .\\@container');

		if (containerElements.length === 0) return;

		containerElements.forEach((element, index) => {
			if (this.resizeObserver) {
				this.resizeObserver.observe(element);
			}
		});
	}

	/**
	 * Setup resize observer for layout monitoring
	 */
	private setupResizeObserver(): void {
		if (typeof ResizeObserver === 'undefined') {
			console.warn('ResizeObserver not supported');
			return;
		}

		this.resizeObserver = new ResizeObserver((entries) => {
			const start = performance.now();

			entries.forEach((entry) => {
				const { width, height } = entry.contentRect;

				// Measure container query adaptation
				requestAnimationFrame(() => {
					const duration = performance.now() - start;
					performanceMonitor.recordMetric('container-query-adaptation', duration, 'layout');
				});
			});
		});

		// Observe main layout containers
		const mainContainers = document.querySelectorAll('main, .app-shell, .kanban-board');
		mainContainers.forEach(container => {
			this.resizeObserver?.observe(container);
		});
	}

	/**
	 * Setup viewport change listener
	 */
	private setupViewportListener(): void {
		const handleResize = () => {
			const now = performance.now();

			// Debounce resize events
			if (this.resizeTimeout) {
				clearTimeout(this.resizeTimeout);
			}

			this.resizeTimeout = window.setTimeout(() => {
				const duration = now - this.lastResize;
				this.lastResize = now;

				// Measure viewport change adaptation
				this.measureLayoutAdaptation(() => {
					// Trigger any layout recalculations
					document.body.offsetHeight;
				});

				// Record viewport change
				const viewport = this.getViewportInfo();
				performanceMonitor.recordMetric('viewport-change', duration, 'layout');

				// Emit viewport change event
				window.dispatchEvent(new CustomEvent('viewport-changed', {
					detail: { viewport, adaptationTime: duration }
				}));
			}, 100);
		};

		window.addEventListener('resize', handleResize);
		window.addEventListener('orientationchange', handleResize);
	}

	/**
	 * Initialize media query listeners
	 */
	private initializeMediaQueries(): void {
		if (typeof window === 'undefined') return;

		Object.entries(this.breakpoints).forEach(([name, query]) => {
			const mq = window.matchMedia(query);
			this.mediaQueries.set(name, mq);

			mq.addEventListener('change', (event) => {
				const start = performance.now();

				requestAnimationFrame(() => {
					const duration = performance.now() - start;
					performanceMonitor.recordMetric(`breakpoint-${name}`, duration, 'layout');

					console.log(`🔄 Breakpoint changed to ${name}: ${event.matches}`);
				});
			});
		});
	}

	/**
	 * Test responsive performance across different viewport sizes
	 */
	async testResponsivePerformance(): Promise<LayoutMetrics[]> {
		const testSizes = [
			{ width: 375, height: 667, name: 'mobile' },
			{ width: 768, height: 1024, name: 'tablet' },
			{ width: 1024, height: 768, name: 'tablet-landscape' },
			{ width: 1440, height: 900, name: 'desktop' },
			{ width: 1920, height: 1080, name: 'large-desktop' }
		];

		const results: LayoutMetrics[] = [];

		for (const size of testSizes) {
			console.log(`🧪 Testing ${size.name} (${size.width}x${size.height})`);

			const start = performance.now();

			// Simulate viewport change (in real testing environment)
			// This would be done through browser automation
			const adaptationTime = performance.now() - start;

			results.push({
				adaptationTime,
				reflows: 0, // Would be measured through performance observer
				repaints: 0, // Would be measured through performance observer
				viewport: {
					width: size.width,
					height: size.height,
					devicePixelRatio: 1,
					orientation: size.width > size.height ? 'landscape' : 'portrait',
					breakpoint: this.getBreakpointForWidth(size.width)
				}
			});
		}

		return results;
	}

	/**
	 * Get breakpoint name for a given width
	 */
	private getBreakpointForWidth(width: number): string {
		if (width >= 1536) return '2xl';
		if (width >= 1280) return 'xl';
		if (width >= 1024) return 'lg';
		if (width >= 768) return 'md';
		if (width >= 640) return 'sm';
		return 'xs';
	}

	/**
	 * Export responsive performance data
	 */
	exportData(): {
		timestamp: number;
		currentViewport: ViewportInfo;
		breakpoints: Record<string, string>;
		metrics: Record<string, unknown>;
	} {
		return {
			timestamp: Date.now(),
			currentViewport: this.getViewportInfo(),
			breakpoints: this.breakpoints,
			metrics: performanceMonitor.getAllStats()
		};
	}
}

// Singleton instance
export const responsiveMonitor = new ResponsiveMonitor();

// Auto-start in development (browser only)
if (typeof window !== 'undefined') {
	try {
		if (import.meta?.env?.DEV) {
			responsiveMonitor.startMonitoring();
		}
	} catch (e) {
		// Ignore import.meta errors in non-module environments
	}
}
