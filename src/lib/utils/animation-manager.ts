/**
 * Animation Manager for AI-Native Kanban
 * Handles entrance animations, performance monitoring, and smooth transitions
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

// Extend Navigator interface to include deviceMemory property
interface NavigatorWithMemory extends Navigator {
	deviceMemory?: number;
}

// Performance statistics interface
interface PerformanceStats {
	count: number;
	avgDuration: number;
	minDuration: number;
	maxDuration: number;
	avgFps: number;
	minFps: number;
	maxFps: number;
}

export interface AnimationConfig {
	enableAnimations: boolean;
	respectReducedMotion: boolean;
	performanceMode: 'high' | 'balanced' | 'low';
	debugMode: boolean;
}

export interface AnimationMetrics {
	name: string;
	duration: number;
	fps: number;
	timestamp: number;
}

class AnimationManager {
	private config: AnimationConfig = {
		enableAnimations: true,
		respectReducedMotion: true,
		performanceMode: 'balanced',
		debugMode: false
	};

	private metrics: AnimationMetrics[] = [];
	private activeAnimations = new Set<string>();
	private reducedMotionQuery?: MediaQueryList;

	constructor() {
		this.initializeReducedMotionDetection();
		this.detectPerformanceCapabilities();
	}

	/**
	 * Initialize reduced motion detection
	 */
	private initializeReducedMotionDetection() {
		if (typeof window !== 'undefined') {
			this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
			this.reducedMotionQuery.addEventListener('change', this.handleReducedMotionChange.bind(this));
			this.handleReducedMotionChange({
				matches: this.reducedMotionQuery.matches
			} as MediaQueryListEvent);
		}
	}

	/**
	 * Handle reduced motion preference changes
	 */
	private handleReducedMotionChange(event: MediaQueryListEvent) {
		if (this.config.respectReducedMotion && event.matches) {
			this.config.enableAnimations = false;
			this.disableAllAnimations();
		} else {
			this.config.enableAnimations = true;
		}
	}

	/**
	 * Detect device performance capabilities
	 */
	private detectPerformanceCapabilities() {
		if (typeof navigator !== 'undefined') {
			const cores = navigator.hardwareConcurrency || 4;
			const memory = (navigator as NavigatorWithMemory).deviceMemory || 4;

			if (cores <= 2 || memory <= 2) {
				this.config.performanceMode = 'low';
			} else if (cores <= 4 || memory <= 4) {
				this.config.performanceMode = 'balanced';
			} else {
				this.config.performanceMode = 'high';
			}
		}
	}

	/**
	 * Disable all animations for performance or accessibility
	 */
	private disableAllAnimations() {
		const style = document.createElement('style');
		style.id = 'animation-manager-disable';
		style.textContent = `
			*, *::before, *::after {
				animation-duration: 0.01ms !important;
				animation-iteration-count: 1 !important;
				transition-duration: 0.01ms !important;
			}
		`;
		document.head.appendChild(style);
	}

	/**
	 * Trigger staggered entrance animations for sidebar and columns
	 */
	triggerEntranceAnimations(container: HTMLElement): Promise<void> {
		if (!this.config.enableAnimations) {
			return Promise.resolve();
		}

		return new Promise((resolve) => {
			const animationStart = performance.now();
			this.activeAnimations.add('entrance');

			// Sidebar animation
			const sidebar = container.querySelector('[data-testid="navigation-sidebar"]');
			if (sidebar) {
				this.animateElement(sidebar as HTMLElement, 'sidebar-entrance', 0);
			}

			// Main content animation
			const mainContent = container.querySelector('.main-content-area');
			if (mainContent) {
				this.animateElement(mainContent as HTMLElement, 'slide-in-right', 100);
			}

			// Column animations
			const columns = container.querySelectorAll('[data-testid^="column-wrapper-"]');
			columns.forEach((column, index) => {
				this.animateElement(column as HTMLElement, 'column-entrance', 250 + index * 100);
			});

			// Navigation items animation
			const navItems = container.querySelectorAll('[data-testid^="nav-item-"]');
			navItems.forEach((item, index) => {
				this.animateElement(item as HTMLElement, 'fade-in', 300 + index * 50);
			});

			// Complete animation sequence
			setTimeout(() => {
				const animationEnd = performance.now();
				const duration = animationEnd - animationStart;

				this.recordMetric('entrance-sequence', duration);
				this.activeAnimations.delete('entrance');
				this.cleanupAnimationProperties(container);

				resolve();
			}, 800); // Total animation sequence duration
		});
	}

	/**
	 * Animate individual element with performance monitoring
	 */
	private animateElement(element: HTMLElement, animationClass: string, delay: number) {
		const startTime = performance.now();

		setTimeout(() => {
			element.classList.add(animationClass);

			// Monitor animation performance
			const observer = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					if (entry.duration > 16.67) {
						// 60fps threshold
						console.warn(`Animation ${animationClass} took ${entry.duration}ms (target: <16.67ms)`);
					}
				});
			});

			observer.observe({ entryTypes: ['measure'] });

			// Clean up after animation
			element.addEventListener(
				'animationend',
				() => {
					const endTime = performance.now();
					const duration = endTime - startTime;

					this.recordMetric(animationClass, duration);
					observer.disconnect();

					// Remove will-change for performance
					element.style.willChange = 'auto';
				},
				{ once: true }
			);
		}, delay);
	}

	/**
	 * Handle navigation tab switching with smooth animation
	 */
	triggerTabSwitchAnimation(activeTab: HTMLElement, previousTab?: HTMLElement): Promise<void> {
		if (!this.config.enableAnimations) {
			return Promise.resolve();
		}

		return new Promise((resolve) => {
			const animationStart = performance.now();

			// Animate out previous tab
			if (previousTab) {
				previousTab.classList.remove('nav-item-active');
				previousTab.style.transform = 'scale(0.95)';
				previousTab.style.opacity = '0.7';
			}

			// Animate in new active tab
			activeTab.classList.add('nav-tab-switch');

			setTimeout(() => {
				activeTab.classList.add('nav-item-active');

				if (previousTab) {
					previousTab.style.transform = '';
					previousTab.style.opacity = '';
				}

				const animationEnd = performance.now();
				const duration = animationEnd - animationStart;

				this.recordMetric('tab-switch', duration);
				resolve();
			}, 250);
		});
	}

	/**
	 * Apply hover effects with performance optimization
	 */
	applyHoverEffects(element: HTMLElement, effectType: 'lift' | 'glow' | 'scale' = 'lift') {
		if (!this.config.enableAnimations) return;

		const effects = {
			lift: 'hover-lift-smooth',
			glow: 'hover-glow-smooth',
			scale: 'hover-scale-smooth'
		};

		element.classList.add(effects[effectType]);

		// Optimize for performance mode
		if (this.config.performanceMode === 'low') {
			element.style.transition = 'transform 100ms ease-out';
		} else if (this.config.performanceMode === 'balanced') {
			element.style.transition = 'transform 150ms ease-out, box-shadow 150ms ease-out';
		}
		// High performance mode uses default CSS transitions
	}

	/**
	 * Record animation performance metrics
	 */
	private recordMetric(name: string, duration: number) {
		const fps = duration > 0 ? 1000 / (duration / 60) : 60;

		this.metrics.push({
			name,
			duration,
			fps,
			timestamp: Date.now()
		});

		// Keep only last 100 metrics
		if (this.metrics.length > 100) {
			this.metrics.shift();
		}

		// Debug logging
		if (this.config.debugMode) {
			console.log(`Animation ${name}: ${duration}ms (${fps.toFixed(1)} fps)`);
		}
	}

	/**
	 * Clean up animation properties for performance
	 */
	private cleanupAnimationProperties(container: HTMLElement) {
		const animatedElements = container.querySelectorAll('[style*="will-change"]');
		animatedElements.forEach((element) => {
			(element as HTMLElement).style.willChange = 'auto';
		});
	}

	/**
	 * Get animation performance statistics
	 */
	getPerformanceStats() {
		const stats: Record<string, PerformanceStats> = {};

		const animationNames = [...new Set(this.metrics.map((m) => m.name))];

		animationNames.forEach((name) => {
			const nameMetrics = this.metrics.filter((m) => m.name === name);
			if (nameMetrics.length > 0) {
				const durations = nameMetrics.map((m) => m.duration);
				const fps = nameMetrics.map((m) => m.fps);

				stats[name] = {
					count: nameMetrics.length,
					avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
					minDuration: Math.min(...durations),
					maxDuration: Math.max(...durations),
					avgFps: fps.reduce((sum, f) => sum + f, 0) / fps.length,
					minFps: Math.min(...fps),
					maxFps: Math.max(...fps)
				};
			}
		});

		return stats;
	}

	/**
	 * Update animation configuration
	 */
	updateConfig(newConfig: Partial<AnimationConfig>) {
		this.config = { ...this.config, ...newConfig };

		if (!this.config.enableAnimations) {
			this.disableAllAnimations();
		}
	}

	/**
	 * Get current configuration
	 */
	getConfig(): AnimationConfig {
		return { ...this.config };
	}

	/**
	 * Check if animations are currently active
	 */
	hasActiveAnimations(): boolean {
		return this.activeAnimations.size > 0;
	}

	/**
	 * Force stop all animations
	 */
	stopAllAnimations() {
		this.activeAnimations.clear();
		this.disableAllAnimations();
	}
}

// Export singleton instance
export const animationManager = new AnimationManager();

// Export utility functions
export function withPerformanceMonitoring<T extends (...args: unknown[]) => unknown>(
	fn: T,
	name: string
): T {
	return ((...args: unknown[]) => {
		const start = performance.now();
		const result = fn(...args);
		const end = performance.now();

		if (end - start > 16.67) {
			console.warn(`Function ${name} took ${end - start}ms (target: <16.67ms for 60fps)`);
		}

		return result;
	}) as T;
}

export function optimizeForPerformance(element: HTMLElement) {
	element.style.transform = 'translateZ(0)';
	element.style.backfaceVisibility = 'hidden';
	element.style.perspective = '1000px';
}
