/**
 * Memory usage monitoring and cleanup utilities
 * Tracks memory consumption and provides cleanup mechanisms
 */

import { performanceMonitor } from './performance-monitor.js';

export interface MemoryMetrics {
	used: number;
	total: number;
	limit: number;
	percentage: number;
	trend: 'increasing' | 'decreasing' | 'stable';
}

export interface MemoryLeak {
	type: 'event-listener' | 'timer' | 'observer' | 'reference';
	description: string;
	severity: 'high' | 'medium' | 'low';
	element?: HTMLElement;
	cleanup?: () => void;
}

class MemoryMonitor {
	private memoryHistory: number[] = [];
	private cleanupTasks = new Set<() => void>();
	private observers = new Map<string, any>();
	private timers = new Set<number>();
	private eventListeners = new Map<EventTarget, Map<string, EventListener>>();
	private isMonitoring = false;
	private monitorInterval?: number;

	// Memory thresholds
	private readonly thresholds = {
		warning: 0.7, // 70% of available memory
		critical: 0.9, // 90% of available memory
		leakDetection: 10 * 1024 * 1024, // 10MB increase
		historySize: 50 // Keep last 50 measurements
	};

	/**
	 * Start memory monitoring
	 */
	startMonitoring(): void {
		if (this.isMonitoring) return;
		if (typeof window === 'undefined') return;

		this.isMonitoring = true;
		this.setupMemoryTracking();
		this.setupLeakDetection();
		this.setupCleanupHooks();

		console.log('🧠 Memory monitoring started');
	}

	/**
	 * Stop memory monitoring and cleanup
	 */
	stopMonitoring(): void {
		if (!this.isMonitoring) return;

		this.isMonitoring = false;
		this.cleanup();

		console.log('🧠 Memory monitoring stopped');
	}

	/**
	 * Get current memory metrics
	 */
	getMemoryMetrics(): MemoryMetrics | null {
		if (!('memory' in performance)) {
			console.warn('Memory API not supported');
			return null;
		}

		const memory = (performance as any).memory;
		const used = memory.usedJSHeapSize;
		const total = memory.totalJSHeapSize;
		const limit = memory.jsHeapSizeLimit;
		const percentage = used / limit;

		// Calculate trend
		let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
		if (this.memoryHistory.length >= 3) {
			const recent = this.memoryHistory.slice(-3);
			const avgRecent = recent.reduce((sum, val) => sum + val, 0) / recent.length;
			const older = this.memoryHistory.slice(-6, -3);
			const avgOlder = older.reduce((sum, val) => sum + val, 0) / older.length;

			if (avgRecent > avgOlder * 1.1) trend = 'increasing';
			else if (avgRecent < avgOlder * 0.9) trend = 'decreasing';
		}

		return { used, total, limit, percentage, trend };
	}

	/**
	 * Register a cleanup task
	 */
	registerCleanup(cleanup: () => void): void {
		this.cleanupTasks.add(cleanup);
	}

	/**
	 * Unregister a cleanup task
	 */
	unregisterCleanup(cleanup: () => void): void {
		this.cleanupTasks.delete(cleanup);
	}

	/**
	 * Track event listener for cleanup
	 */
	trackEventListener(target: EventTarget, type: string, listener: EventListener): void {
		if (!this.eventListeners.has(target)) {
			this.eventListeners.set(target, new Map());
		}

		this.eventListeners.get(target)!.set(type, listener);

		// Register cleanup
		this.registerCleanup(() => {
			target.removeEventListener(type, listener);
		});
	}

	/**
	 * Track timer for cleanup
	 */
	trackTimer(timerId: number): void {
		this.timers.add(timerId);

		// Register cleanup
		this.registerCleanup(() => {
			clearTimeout(timerId);
			clearInterval(timerId);
			this.timers.delete(timerId);
		});
	}

	/**
	 * Track observer for cleanup
	 */
	trackObserver(name: string, observer: any): void {
		this.observers.set(name, observer);

		// Register cleanup
		this.registerCleanup(() => {
			if (observer && typeof observer.disconnect === 'function') {
				observer.disconnect();
			}
			this.observers.delete(name);
		});
	}

	/**
	 * Detect potential memory leaks
	 */
	detectMemoryLeaks(): MemoryLeak[] {
		const leaks: MemoryLeak[] = [];
		const metrics = this.getMemoryMetrics();

		if (!metrics) return leaks;

		// Check for memory growth trend
		if (metrics.trend === 'increasing' && metrics.percentage > this.thresholds.warning) {
			leaks.push({
				type: 'reference',
				description: `Memory usage is increasing (${(metrics.percentage * 100).toFixed(1)}%)`,
				severity: metrics.percentage > this.thresholds.critical ? 'high' : 'medium'
			});
		}

		// Check for excessive event listeners
		let totalListeners = 0;
		this.eventListeners.forEach(listeners => {
			totalListeners += listeners.size;
		});

		if (totalListeners > 100) {
			leaks.push({
				type: 'event-listener',
				description: `High number of event listeners detected (${totalListeners})`,
				severity: totalListeners > 500 ? 'high' : 'medium'
			});
		}

		// Check for excessive timers
		if (this.timers.size > 20) {
			leaks.push({
				type: 'timer',
				description: `High number of active timers (${this.timers.size})`,
				severity: this.timers.size > 50 ? 'high' : 'medium'
			});
		}

		// Check for excessive observers
		if (this.observers.size > 10) {
			leaks.push({
				type: 'observer',
				description: `High number of active observers (${this.observers.size})`,
				severity: this.observers.size > 20 ? 'high' : 'medium'
			});
		}

		return leaks;
	}

	/**
	 * Force garbage collection (if available)
	 */
	forceGarbageCollection(): void {
		if ('gc' in window && typeof (window as any).gc === 'function') {
			(window as unknown).gc();
			console.log('🗑️ Forced garbage collection');
		} else {
			console.warn('Garbage collection not available');
		}
	}

	/**
	 * Cleanup all tracked resources
	 */
	cleanup(): void {
		// Run all cleanup tasks
		this.cleanupTasks.forEach(cleanup => {
			try {
				cleanup();
			} catch (error) {
				console.error('Cleanup task failed:', error);
			}
		});

		// Clear monitoring interval
		if (this.monitorInterval) {
			clearInterval(this.monitorInterval);
			this.monitorInterval = undefined;
		}

		// Clear collections
		this.cleanupTasks.clear();
		this.observers.clear();
		this.timers.clear();
		this.eventListeners.clear();

		console.log('🧹 Memory cleanup completed');
	}

	/**
	 * Setup memory tracking
	 */
	private setupMemoryTracking(): void {
		if (!('memory' in performance)) {
			console.warn('Memory API not supported');
			return;
		}

		this.monitorInterval = window.setInterval(() => {
			const metrics = this.getMemoryMetrics();
			if (!metrics) return;

			// Record metrics
			performanceMonitor.recordMetric('memory-used', metrics.used, 'memory');
			performanceMonitor.recordMetric('memory-percentage', metrics.percentage * 100, 'memory');

			// Update history
			this.memoryHistory.push(metrics.used);
			if (this.memoryHistory.length > this.thresholds.historySize) {
				this.memoryHistory.shift();
			}

			// Check thresholds
			if (metrics.percentage > this.thresholds.critical) {
				console.error(`🚨 Critical memory usage: ${(metrics.percentage * 100).toFixed(1)}%`);
				this.handleMemoryPressure();
			} else if (metrics.percentage > this.thresholds.warning) {
				console.warn(`⚠️ High memory usage: ${(metrics.percentage * 100).toFixed(1)}%`);
			}

			// Emit memory event
			window.dispatchEvent(new CustomEvent('memory-update', {
				detail: metrics
			}));
		}, 5000); // Check every 5 seconds

		this.trackTimer(this.monitorInterval);
	}

	/**
	 * Setup memory leak detection
	 */
	private setupLeakDetection(): void {
		// Check for leaks every 30 seconds
		const leakCheckInterval = window.setInterval(() => {
			const leaks = this.detectMemoryLeaks();

			if (leaks.length > 0) {
				console.warn('🕳️ Potential memory leaks detected:', leaks);

				// Emit leak detection event
				window.dispatchEvent(new CustomEvent('memory-leaks-detected', {
					detail: leaks
				}));
			}
		}, 30000);

		this.trackTimer(leakCheckInterval);
	}

	/**
	 * Setup cleanup hooks for common scenarios
	 */
	private setupCleanupHooks(): void {
		// Cleanup on page unload
		const unloadHandler = () => {
			this.cleanup();
		};

		window.addEventListener('beforeunload', unloadHandler);
		this.trackEventListener(window, 'beforeunload', unloadHandler);

		// Cleanup on visibility change (tab switching)
		const visibilityHandler = () => {
			if (document.hidden) {
				// Perform lightweight cleanup when tab is hidden
				this.forceGarbageCollection();
			}
		};

		document.addEventListener('visibilitychange', visibilityHandler);
		this.trackEventListener(document, 'visibilitychange', visibilityHandler);
	}

	/**
	 * Handle memory pressure situations
	 */
	private handleMemoryPressure(): void {
		console.log('🚨 Handling memory pressure...');

		// Force garbage collection
		this.forceGarbageCollection();

		// Clear performance history to free memory
		performanceMonitor.clearData();

		// Emit memory pressure event for components to react
		window.dispatchEvent(new CustomEvent('memory-pressure', {
			detail: { severity: 'high' }
		}));
	}

	/**
	 * Export memory monitoring data
	 */
	exportData(): {
		timestamp: number;
		currentMetrics: MemoryMetrics | null;
		history: number[];
		leaks: MemoryLeak[];
		trackedResources: {
			cleanupTasks: number;
			observers: number;
			timers: number;
			eventListeners: number;
		};
	} {
		return {
			timestamp: Date.now(),
			currentMetrics: this.getMemoryMetrics(),
			history: [...this.memoryHistory],
			leaks: this.detectMemoryLeaks(),
			trackedResources: {
				cleanupTasks: this.cleanupTasks.size,
				observers: this.observers.size,
				timers: this.timers.size,
				eventListeners: Array.from(this.eventListeners.values())
					.reduce((sum, listeners) => sum + listeners.size, 0)
			}
		};
	}
}

// Singleton instance
export const memoryMonitor = new MemoryMonitor();

// Auto-start in development (browser only)
if (typeof window !== 'undefined') {
	try {
		// @ts-ignore - import.meta may not be available in all environments
		if (import.meta?.env?.DEV) {
			memoryMonitor.startMonitoring();
		}
	} catch (e) {
		// Ignore import.meta errors in non-module environments
	}
}

// Helper function for components to register cleanup
export function useMemoryCleanup(cleanup: () => void): void {
	memoryMonitor.registerCleanup(cleanup);
}

// Helper function for tracking event listeners
export function addTrackedEventListener(
	target: EventTarget,
	type: string,
	listener: EventListener,
	options?: boolean | AddEventListenerOptions
): void {
	target.addEventListener(type, listener, options);
	memoryMonitor.trackEventListener(target, type, listener);
}

// Helper function for tracking timers
export function setTrackedTimeout(callback: () => void, delay: number): number {
	const timerId = window.setTimeout(callback, delay);
	memoryMonitor.trackTimer(timerId);
	return timerId;
}

export function setTrackedInterval(callback: () => void, delay: number): number {
	const timerId = window.setInterval(callback, delay);
	memoryMonitor.trackTimer(timerId);
	return timerId;
}
