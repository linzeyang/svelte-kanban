/**
 * Performance benchmarks and monitoring tests
 * Tests all performance requirements and thresholds
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { performanceMonitor } from '../../src/lib/utils/performance-monitor.js';
import { responsiveMonitor } from '../../src/lib/utils/responsive-monitor.js';
import { bundleAnalyzer } from '../../src/lib/utils/bundle-analyzer.js';
import { memoryMonitor } from '../../src/lib/utils/memory-monitor.js';

describe('Performance Monitoring System', () => {
	beforeEach(() => {
		// Reset all monitors
		performanceMonitor.clearData();
		performanceMonitor.startMonitoring();
	});

	afterEach(() => {
		performanceMonitor.stopMonitoring();
		responsiveMonitor.stopMonitoring();
		bundleAnalyzer.stopAnalysis();
		memoryMonitor.stopMonitoring();
	});

	describe('Animation Performance', () => {
		test('should track animation frame timing', async () => {
			// Simulate animation frame measurement
			performanceMonitor.measure('test-animation', () => {
				// Simulate animation work
				const start = performance.now();
				while (performance.now() - start < 10) {
					// Busy wait for 10ms
				}
			}, 'animation');

			const stats = performanceMonitor.getStats('test-animation');
			expect(stats).toBeTruthy();
			expect(stats!.avg).toBeGreaterThan(0);
			expect(stats!.avg).toBeLessThan(50); // Should be reasonable
		});

		test('should detect animation performance violations', () => {
			const violations: any[] = [];

			// Listen for performance violations
			window.addEventListener('performance-violation', (event: any) => {
				violations.push(event.detail);
			});

			// Simulate slow animation (over 16.67ms threshold)
			performanceMonitor.measure('slow-animation', () => {
				const start = performance.now();
				while (performance.now() - start < 20) {
					// Busy wait for 20ms (over 60fps threshold)
				}
			}, 'animation');

			// Check if violation was detected
			expect(violations.length).toBeGreaterThan(0);
			expect(violations[0].name).toBe('slow-animation');
			expect(violations[0].value).toBeGreaterThan(16.67);
		});

		test('should maintain 60fps performance target', () => {
			const frameCount = 10;
			const frameTimes: number[] = [];

			// Simulate multiple animation frames
			for (let i = 0; i < frameCount; i++) {
				performanceMonitor.measure(`frame-${i}`, () => {
					// Simulate frame work
					const start = performance.now();
					while (performance.now() - start < 8) {
						// Busy wait for 8ms (well under 16.67ms)
					}
				}, 'animation');

				const stats = performanceMonitor.getStats(`frame-${i}`);
				if (stats) {
					frameTimes.push(stats.avg);
				}
			}

			// All frames should be under 16.67ms for 60fps
			frameTimes.forEach(time => {
				expect(time).toBeLessThan(16.67);
			});

			const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameCount;
			expect(avgFrameTime).toBeLessThan(16.67);
		});
	});

	describe('Drag Operation Performance', () => {
		test('should complete drag operations under 300ms', () => {
			// Simulate drag operation
			performanceMonitor.measure('drag-operation', () => {
				// Simulate drag work
				const start = performance.now();
				while (performance.now() - start < 150) {
					// Busy wait for 150ms (under 300ms threshold)
				}
			}, 'interaction');

			const stats = performanceMonitor.getStats('drag-operation');
			expect(stats).toBeTruthy();
			expect(stats!.avg).toBeLessThan(300);
		});

		test('should detect slow drag operations', () => {
			const violations: any[] = [];

			window.addEventListener('performance-violation', (event: any) => {
				violations.push(event.detail);
			});

			// Simulate slow drag operation (over 300ms threshold)
			performanceMonitor.measure('drag-operation', () => {
				const start = performance.now();
				while (performance.now() - start < 350) {
					// Busy wait for 350ms (over threshold)
				}
			}, 'interaction');

			expect(violations.length).toBeGreaterThan(0);
			expect(violations[0].name).toBe('drag-operation');
			expect(violations[0].value).toBeGreaterThan(300);
		});
	});

	describe('Layout Performance', () => {
		test('should track layout shift metrics', () => {
			// Mock layout shift entry
			const mockEntry = {
				entryType: 'layout-shift',
				value: 0.05,
				hadRecentInput: false
			};

			// Simulate layout shift recording
			performanceMonitor.recordMetric('layout-shift', mockEntry.value, 'layout');

			const stats = performanceMonitor.getStats('layout-shift');
			expect(stats).toBeTruthy();
			expect(stats!.avg).toBe(0.05);
		});

		test('should monitor responsive layout adaptation', () => {
			responsiveMonitor.startMonitoring();

			// Simulate layout adaptation
			responsiveMonitor.measureLayoutAdaptation(() => {
				// Simulate layout work
				document.body.offsetHeight; // Force reflow
			});

			const stats = performanceMonitor.getStats('responsive-layout');
			expect(stats).toBeTruthy();
		});
	});

	describe('Memory Performance', () => {
		test('should track memory usage', () => {
			memoryMonitor.startMonitoring();

			// Mock memory API
			const mockMemory = {
				usedJSHeapSize: 10 * 1024 * 1024, // 10MB
				totalJSHeapSize: 20 * 1024 * 1024, // 20MB
				jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
			};

			// Mock performance.memory
			Object.defineProperty(performance, 'memory', {
				value: mockMemory,
				configurable: true
			});

			const metrics = memoryMonitor.getMemoryMetrics();
			expect(metrics).toBeTruthy();
			expect(metrics!.used).toBe(mockMemory.usedJSHeapSize);
			expect(metrics!.percentage).toBe(0.1); // 10MB / 100MB = 0.1
		});

		test('should detect memory leaks', () => {
			memoryMonitor.startMonitoring();

			// Simulate excessive event listeners
			const mockTarget = document.createElement('div');
			for (let i = 0; i < 150; i++) {
				memoryMonitor.trackEventListener(mockTarget, 'click', () => {});
			}

			const leaks = memoryMonitor.detectMemoryLeaks();
			expect(leaks.length).toBeGreaterThan(0);
			expect(leaks.some(leak => leak.type === 'event-listener')).toBe(true);
		});

		test('should cleanup tracked resources', () => {
			memoryMonitor.startMonitoring();

			let cleanupCalled = false;
			memoryMonitor.registerCleanup(() => {
				cleanupCalled = true;
			});

			memoryMonitor.cleanup();
			expect(cleanupCalled).toBe(true);
		});
	});

	describe('Bundle Performance', () => {
		test('should analyze component sizes', () => {
			bundleAnalyzer.startAnalysis();

			// Create mock component element
			const mockElement = document.createElement('div');
			mockElement.setAttribute('data-svelte-component', 'TestComponent');
			mockElement.innerHTML = '<div><span>Test content</span></div>';
			document.body.appendChild(mockElement);

			bundleAnalyzer.registerComponent('TestComponent', mockElement);

			const metrics = bundleAnalyzer.getBundleMetrics();
			expect(metrics.components.length).toBeGreaterThan(0);
			expect(metrics.components[0].name).toBe('TestComponent');
			expect(metrics.components[0].size).toBeGreaterThan(0);

			document.body.removeChild(mockElement);
		});

		test('should generate optimization recommendations', () => {
			bundleAnalyzer.startAnalysis();

			// Create large mock component
			const mockElement = document.createElement('div');
			mockElement.setAttribute('data-svelte-component', 'LargeComponent');

			// Make it appear large
			const largeContent = 'x'.repeat(10000);
			mockElement.innerHTML = `<div>${largeContent}</div>`;
			document.body.appendChild(mockElement);

			bundleAnalyzer.registerComponent('LargeComponent', mockElement);

			const recommendations = bundleAnalyzer.generateRecommendations();
			expect(recommendations.length).toBeGreaterThan(0);
			expect(recommendations.some(rec => rec.type === 'lazy-load')).toBe(true);

			document.body.removeChild(mockElement);
		});
	});

	describe('Performance Statistics', () => {
		test('should calculate accurate statistics', () => {
			// Record multiple measurements
			const measurements = [10, 20, 30, 40, 50];
			measurements.forEach(value => {
				performanceMonitor.recordMetric('test-metric', value, 'interaction');
			});

			const stats = performanceMonitor.getStats('test-metric');
			expect(stats).toBeTruthy();
			expect(stats!.avg).toBe(30); // Average of 10,20,30,40,50
			expect(stats!.min).toBe(10);
			expect(stats!.max).toBe(50);
			expect(stats!.count).toBe(5);
		});

		test('should export performance data', () => {
			performanceMonitor.recordMetric('export-test', 100, 'interaction');

			const exportData = performanceMonitor.exportData();
			expect(exportData.timestamp).toBeGreaterThan(0);
			expect(exportData.metrics).toBeTruthy();
			expect(exportData.thresholds).toBeTruthy();
		});
	});

	describe('Performance Integration', () => {
		test('should coordinate multiple monitoring systems', () => {
			// Start all monitors
			performanceMonitor.startMonitoring();
			responsiveMonitor.startMonitoring();
			bundleAnalyzer.startAnalysis();
			memoryMonitor.startMonitoring();

			// Simulate complex operation that affects multiple systems
			const complexOperation = () => {
				// Simulate DOM manipulation (affects layout)
				const element = document.createElement('div');
				element.innerHTML = 'Complex content';
				document.body.appendChild(element);

				// Simulate memory allocation
				const largeArray = new Array(1000).fill('data');

				// Simulate animation
				element.style.transform = 'translateX(100px)';

				// Cleanup
				document.body.removeChild(element);
				return largeArray.length;
			};

			const result = performanceMonitor.measure('complex-operation', complexOperation, 'interaction');
			expect(result).toBe(1000);

			// Verify metrics were recorded
			const stats = performanceMonitor.getStats('complex-operation');
			expect(stats).toBeTruthy();
		});

		test('should handle performance pressure scenarios', () => {
			memoryMonitor.startMonitoring();

			// Mock high memory usage
			const mockMemory = {
				usedJSHeapSize: 95 * 1024 * 1024, // 95MB
				totalJSHeapSize: 100 * 1024 * 1024, // 100MB
				jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB (95% usage)
			};

			Object.defineProperty(performance, 'memory', {
				value: mockMemory,
				configurable: true
			});

			const metrics = memoryMonitor.getMemoryMetrics();
			expect(metrics!.percentage).toBe(0.95); // 95% usage

			// Should trigger memory pressure handling
			const leaks = memoryMonitor.detectMemoryLeaks();
			expect(leaks.some(leak => leak.severity === 'high')).toBe(true);
		});
	});
});

describe('Performance Benchmarks', () => {
	test('should benchmark animation performance', async () => {
		const iterations = 100;
		const animationTimes: number[] = [];

		for (let i = 0; i < iterations; i++) {
			performanceMonitor.measure(`benchmark-animation-${i}`, () => {
				// Simulate typical animation frame work
				const element = document.createElement('div');
				element.style.transform = `translateX(${i}px)`;
				element.style.opacity = `${i / iterations}`;
				document.body.appendChild(element);
				document.body.removeChild(element);
			}, 'animation');

			const stats = performanceMonitor.getStats(`benchmark-animation-${i}`);
			if (stats) {
				animationTimes.push(stats.avg);
			}
		}

		const avgTime = animationTimes.reduce((sum, time) => sum + time, 0) / iterations;
		const maxTime = Math.max(...animationTimes);
		const p95Time = animationTimes.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];

		console.log(`Animation Benchmark Results:
			Average: ${avgTime.toFixed(2)}ms
			Maximum: ${maxTime.toFixed(2)}ms
			95th Percentile: ${p95Time.toFixed(2)}ms
		`);

		// Performance assertions
		expect(avgTime).toBeLessThan(16.67); // 60fps average
		expect(p95Time).toBeLessThan(16.67); // 95% under 60fps
		expect(maxTime).toBeLessThan(33.33); // No frame over 30fps
	});

	test('should benchmark drag operation performance', () => {
		const iterations = 50;
		const dragTimes: number[] = [];

		for (let i = 0; i < iterations; i++) {
			performanceMonitor.measure(`benchmark-drag-${i}`, () => {
				// Simulate drag operation
				const element = document.createElement('div');
				element.style.position = 'absolute';
				element.style.left = '0px';
				element.style.top = '0px';
				document.body.appendChild(element);

				// Simulate drag movement
				for (let j = 0; j < 10; j++) {
					element.style.left = `${j * 10}px`;
					element.style.top = `${j * 5}px`;
				}

				document.body.removeChild(element);
			}, 'interaction');

			const stats = performanceMonitor.getStats(`benchmark-drag-${i}`);
			if (stats) {
				dragTimes.push(stats.avg);
			}
		}

		const avgTime = dragTimes.reduce((sum, time) => sum + time, 0) / iterations;
		const maxTime = Math.max(...dragTimes);

		console.log(`Drag Operation Benchmark Results:
			Average: ${avgTime.toFixed(2)}ms
			Maximum: ${maxTime.toFixed(2)}ms
		`);

		// Performance assertions (Requirement 5.4: < 300ms)
		expect(avgTime).toBeLessThan(300);
		expect(maxTime).toBeLessThan(300);
	});

	test('should benchmark responsive layout performance', async () => {
		responsiveMonitor.startMonitoring();

		const testSizes = [
			{ width: 375, height: 667 },
			{ width: 768, height: 1024 },
			{ width: 1024, height: 768 },
			{ width: 1440, height: 900 }
		];

		const adaptationTimes: number[] = [];

		for (const size of testSizes) {
			performanceMonitor.measure(`layout-adaptation-${size.width}`, () => {
				// Simulate viewport change effects
				const container = document.createElement('div');
				container.style.width = `${size.width}px`;
				container.style.height = `${size.height}px`;
				container.style.display = 'grid';
				container.style.gridTemplateColumns = size.width > 768 ? '240px 1fr' : '1fr';

				document.body.appendChild(container);

				// Force layout calculation
				container.offsetHeight;

				document.body.removeChild(container);
			}, 'layout');

			const stats = performanceMonitor.getStats(`layout-adaptation-${size.width}`);
			if (stats) {
				adaptationTimes.push(stats.avg);
			}
		}

		const avgTime = adaptationTimes.reduce((sum, time) => sum + time, 0) / testSizes.length;
		const maxTime = Math.max(...adaptationTimes);

		console.log(`Responsive Layout Benchmark Results:
			Average: ${avgTime.toFixed(2)}ms
			Maximum: ${maxTime.toFixed(2)}ms
		`);

		// Performance assertions (Requirement 4.4: smooth adaptation)
		expect(avgTime).toBeLessThan(100);
		expect(maxTime).toBeLessThan(200);
	});
});
