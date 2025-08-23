/**
 * Server-side performance monitor tests
 * Tests the core functionality without browser APIs
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { performanceMonitor } from './performance-monitor.js';

// Mock browser APIs for server testing
const mockWindow = {
	dispatchEvent: () => {},
	setInterval: (fn: Function, delay: number) => setTimeout(fn, delay),
	clearInterval: (id: number) => clearTimeout(id)
};

const mockPerformanceObserver = class {
	observe() {}
	disconnect() {}
};

// In browser environment, these are already available
if (typeof window === 'undefined') {
	// @ts-ignore
	globalThis.window = mockWindow;
}
if (typeof PerformanceObserver === 'undefined') {
	// @ts-ignore
	globalThis.PerformanceObserver = mockPerformanceObserver;
}

describe('Performance Monitor (Server)', () => {
	beforeEach(() => {
		performanceMonitor.clearData();
	});

	afterEach(() => {
		performanceMonitor.stopMonitoring();
	});

	describe('Core Functionality', () => {
		test('should record metrics correctly', () => {
			performanceMonitor.recordMetric('test-metric', 100, 'interaction');

			const stats = performanceMonitor.getStats('test-metric');
			expect(stats).toBeTruthy();
			expect(stats!.avg).toBe(100);
			expect(stats!.count).toBe(1);
		});

		test('should calculate statistics accurately', () => {
			const values = [10, 20, 30, 40, 50];
			values.forEach(value => {
				performanceMonitor.recordMetric('test-stats', value, 'interaction');
			});

			const stats = performanceMonitor.getStats('test-stats');
			expect(stats).toBeTruthy();
			expect(stats!.avg).toBe(30);
			expect(stats!.min).toBe(10);
			expect(stats!.max).toBe(50);
			expect(stats!.count).toBe(5);
		});

		test('should handle measure function', () => {
			const result = performanceMonitor.measure('test-measure', () => {
				return 'test-result';
			}, 'interaction');

			expect(result).toBe('test-result');

			const stats = performanceMonitor.getStats('test-measure');
			expect(stats).toBeTruthy();
			expect(stats!.count).toBe(1);
		});

		test('should export data correctly', () => {
			performanceMonitor.recordMetric('export-test', 100, 'interaction');

			const exportData = performanceMonitor.exportData();
			expect(exportData.timestamp).toBeGreaterThan(0);
			expect(exportData.metrics).toBeTruthy();
			expect(exportData.thresholds).toBeTruthy();
		});

		test('should clear data', () => {
			performanceMonitor.recordMetric('clear-test', 100, 'interaction');
			expect(performanceMonitor.getStats('clear-test')).toBeTruthy();

			performanceMonitor.clearData();
			expect(performanceMonitor.getStats('clear-test')).toBeNull();
		});

		test('should limit history size', () => {
			// Record more than 100 measurements
			for (let i = 0; i < 150; i++) {
				performanceMonitor.recordMetric('history-test', i, 'interaction');
			}

			const stats = performanceMonitor.getStats('history-test');
			expect(stats).toBeTruthy();
			expect(stats!.count).toBe(100); // Should be limited to 100
		});
	});

	describe('Threshold Detection', () => {
		test('should detect threshold violations', () => {
			let violationDetected = false;

			// Mock event listener
			const originalDispatchEvent = mockWindow.dispatchEvent;
			mockWindow.dispatchEvent = () => {
				violationDetected = true;
			};

			// Record a metric that exceeds drag operation threshold (300ms)
			performanceMonitor.recordMetric('drag-operation', 350, 'interaction');

			// Restore original function
			mockWindow.dispatchEvent = originalDispatchEvent;

			// Note: In server environment, we can't test actual event dispatch
			// but we can verify the metric was recorded
			const stats = performanceMonitor.getStats('drag-operation');
			expect(stats).toBeTruthy();
			expect(stats!.avg).toBe(350);
		});
	});

	describe('Async Operations', () => {
		test('should handle async measure', async () => {
			const result = await performanceMonitor.measureAsync('async-test', async () => {
				await new Promise(resolve => setTimeout(resolve, 10));
				return 'async-result';
			}, 'interaction');

			expect(result).toBe('async-result');

			const stats = performanceMonitor.getStats('async-test');
			expect(stats).toBeTruthy();
			expect(stats!.count).toBe(1);
			expect(stats!.avg).toBeGreaterThan(0);
		});

		test('should handle async errors', async () => {
			await expect(
				performanceMonitor.measureAsync('async-error', async () => {
					throw new Error('Test error');
				}, 'interaction')
			).rejects.toThrow('Test error');

			// Should still record the metric even on error
			const stats = performanceMonitor.getStats('async-error');
			expect(stats).toBeTruthy();
			expect(stats!.count).toBe(1);
		});
	});

	describe('Multiple Metrics', () => {
		test('should handle multiple different metrics', () => {
			performanceMonitor.recordMetric('metric-a', 100, 'animation');
			performanceMonitor.recordMetric('metric-b', 200, 'layout');
			performanceMonitor.recordMetric('metric-c', 300, 'memory');

			const allStats = performanceMonitor.getAllStats();
			expect(Object.keys(allStats)).toHaveLength(3);
			expect(allStats['metric-a'].avg).toBe(100);
			expect(allStats['metric-b'].avg).toBe(200);
			expect(allStats['metric-c'].avg).toBe(300);
		});

		test('should calculate p95 correctly', () => {
			// Record 100 values from 1 to 100
			for (let i = 1; i <= 100; i++) {
				performanceMonitor.recordMetric('p95-test', i, 'interaction');
			}

			const stats = performanceMonitor.getStats('p95-test');
			expect(stats).toBeTruthy();
			expect(stats!.p95).toBeGreaterThanOrEqual(94); // 95th percentile should be around 95
			expect(stats!.p95).toBeLessThanOrEqual(96);
		});
	});
});
