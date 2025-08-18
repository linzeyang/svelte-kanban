<!-- AppShell.svelte - Main application layout with sidebar and content areas -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { navigationStore } from '$lib/stores/navigation.svelte';
	import NavigationSidebar from '../navigation/NavigationSidebar.svelte';
	import type { AppState, LayoutConfig } from '$lib/types/layout';

	interface Props {
		/** Override for active navigation item */
		activeNavItem?: string;
		/** Override for sidebar collapsed state */
		sidebarCollapsed?: boolean;
		/** Additional CSS classes */
		class?: string;
		/** Layout configuration overrides */
		config?: Partial<LayoutConfig>;
		/** Component children/slot content */
		children?: import('svelte').Snippet;
	}

	let {
		activeNavItem,
		sidebarCollapsed,
		class: additionalClasses = '',
		config = {},
		children
	}: Props = $props();

	// Default layout configuration
	const defaultConfig: LayoutConfig = {
		sidebarWidth: 240,
		sidebarCollapsedWidth: 60,
		mobileBreakpoint: 768,
		enableAnimations: true
	};

	const layoutConfig = { ...defaultConfig, ...config };

	// Reactive state from navigation store
	let isCollapsed = $derived(sidebarCollapsed ?? navigationStore.isCollapsed);
	let currentActiveItem = $derived(activeNavItem ?? navigationStore.currentActiveItem);

	// Local state for layout management
	let appShellElement: HTMLElement | undefined = $state();
	let isMobile = $state(false);
	let isAnimating = $state(false);
	let layoutError = $state<string | null>(null);
	let viewport = $state({ width: 0, height: 0 });

	// App state derived from reactive values
	let appState = $derived<AppState>({
		activeNavItem: currentActiveItem,
		sidebarCollapsed: isCollapsed,
		theme: 'dark', // Fixed to dark theme for now
		isMobile,
		viewport
	});

	// CSS Grid classes based on sidebar state
	let gridClasses = $derived(() => {
		let classes = 'app-shell min-h-screen transition-all duration-300 ease-fluid';

		if (isMobile) {
			classes += ' grid-cols-1';
		} else if (isCollapsed) {
			classes += ' app-grid-collapsed';
		} else {
			classes += ' app-grid';
		}

		if (additionalClasses) {
			classes += ' ' + additionalClasses;
		}

		return classes;
	});

	// Main content classes with responsive behavior
	let mainContentClasses = $derived(() => {
		let classes = 'main-content-area relative overflow-hidden';

		if (isMobile) {
			classes += ' w-full';
		}

		if (layoutConfig.enableAnimations && isAnimating) {
			classes += ' will-change-transform';
		}

		return classes;
	});

	// Error boundary handling
	function handleLayoutError(error: Error, context: string) {
		console.error(`Layout error in ${context}:`, error);
		layoutError = `Layout error: ${error.message}`;

		// Attempt recovery by resetting to safe state
		try {
			navigationStore.reset();
			isAnimating = false;
		} catch (recoveryError) {
			console.error('Failed to recover from layout error:', recoveryError);
		}
	}

	// Viewport size tracking
	function updateViewport() {
		if (typeof window !== 'undefined') {
			viewport = {
				width: window.innerWidth,
				height: window.innerHeight
			};

			// Update mobile state based on viewport
			const wasMobile = isMobile;
			isMobile = viewport.width < layoutConfig.mobileBreakpoint;

			// Trigger animation if mobile state changed
			if (wasMobile !== isMobile && layoutConfig.enableAnimations) {
				isAnimating = true;
				setTimeout(() => {
					isAnimating = false;
				}, 300);
			}
		}
	}

	// Keyboard navigation handler
	function handleKeydown(event: KeyboardEvent) {
		try {
			// Global keyboard shortcuts
			if (event.ctrlKey || event.metaKey) {
				switch (event.key) {
					case 'b':
						event.preventDefault();
						navigationStore.toggleSidebar();
						break;
					case '[':
						event.preventDefault();
						navigationStore.navigatePrevious();
						break;
					case ']':
						event.preventDefault();
						navigationStore.navigateNext();
						break;
				}
			}

			// Escape key handling
			if (event.key === 'Escape') {
				// Close mobile sidebar if open
				if (isMobile && !isCollapsed) {
					navigationStore.setSidebarCollapsed(true);
				}
			}
		} catch (error) {
			handleLayoutError(error as Error, 'keyboard navigation');
		}
	}

	// Layout animation coordination
	function coordinateLayoutAnimation() {
		if (!layoutConfig.enableAnimations) return;

		try {
			isAnimating = true;

			// Stagger animations for sidebar and content
			if (appShellElement) {
				const sidebar = appShellElement.querySelector('[data-testid="navigation-sidebar"]');
				const mainContent = appShellElement.querySelector('.main-content-area');

				if (sidebar) {
					sidebar.classList.add('slide-in-left');
				}

				if (mainContent) {
					setTimeout(() => {
						(mainContent as HTMLElement).classList.add('slide-in-right', 'stagger-delay-1');
					}, 100);
				}
			}

			// Reset animation state
			setTimeout(() => {
				isAnimating = false;
			}, 400);
		} catch (error) {
			handleLayoutError(error as Error, 'animation coordination');
		}
	}

	// Theme application
	function applyTheme() {
		try {
			if (typeof document !== 'undefined') {
				document.documentElement.setAttribute('data-theme', 'dark');
				document.body.classList.add('bg-bg-primary', 'text-text-primary');
			}
		} catch (error) {
			handleLayoutError(error as Error, 'theme application');
		}
	}

	// Resize observer for responsive behavior
	let resizeObserver: ResizeObserver | undefined;

	// Initialize on mount to avoid reactive effect loops
	onMount(() => {
		updateViewport();
		applyTheme();
	});

	// Set up resize observer effect
	$effect(() => {
		if (typeof window !== 'undefined' && appShellElement) {
			resizeObserver = new ResizeObserver((entries) => {
				try {
					for (const entry of entries) {
						const { width, height } = entry.contentRect;
						const newViewport = { width, height };

						// Only update if viewport actually changed
						if (viewport.width !== newViewport.width || viewport.height !== newViewport.height) {
							viewport = newViewport;

							// Update mobile state
							const newIsMobile = width < layoutConfig.mobileBreakpoint;
							if (isMobile !== newIsMobile) {
								isMobile = newIsMobile;
								if (layoutConfig.enableAnimations) {
									coordinateLayoutAnimation();
								}
							}
						}
					}
				} catch (error) {
					handleLayoutError(error as Error, 'resize observer');
				}
			});

			resizeObserver.observe(appShellElement);

			// Window resize listener as fallback
			const handleResize = () => {
				const newViewport = {
					width: window.innerWidth,
					height: window.innerHeight
				};

				// Only update if viewport actually changed
				if (viewport.width !== newViewport.width || viewport.height !== newViewport.height) {
					viewport = newViewport;
					const newIsMobile = newViewport.width < layoutConfig.mobileBreakpoint;
					if (isMobile !== newIsMobile) {
						isMobile = newIsMobile;
					}
				}
			};

			window.addEventListener('resize', handleResize);

			return () => {
				window.removeEventListener('resize', handleResize);
				resizeObserver?.disconnect();
			};
		}
	});

	// Error recovery effect
	$effect(() => {
		if (layoutError) {
			// Auto-clear error after 5 seconds
			const timer = setTimeout(() => {
				layoutError = null;
			}, 5000);

			return () => clearTimeout(timer);
		}
	});

	// Expose methods for external control
	export function getAppState(): AppState {
		return appState;
	}

	export function getLayoutConfig(): LayoutConfig {
		return layoutConfig;
	}

	export function triggerLayoutAnimation() {
		coordinateLayoutAnimation();
	}

	export function clearLayoutError() {
		layoutError = null;
	}
</script>

<!-- Error boundary display -->
{#if layoutError}
	<div
		class="fixed top-4 right-4 z-50 rounded-lg p-4 text-red-400 shadow-lg glass-modal"
		role="alert"
		aria-live="polite"
	>
		<div class="flex items-center space-x-2">
			<span class="text-lg">⚠️</span>
			<div>
				<div class="font-semibold">Layout Error</div>
				<div class="text-sm text-text-muted">{layoutError}</div>
			</div>
			<button
				onclick={clearLayoutError}
				class="ml-4 rounded p-1 hover:bg-red-400/20 focus:ring-2 focus:ring-red-400/50 focus:outline-none"
				aria-label="Dismiss error"
			>
				×
			</button>
		</div>
	</div>
{/if}

<!-- Main application shell -->
<div
	bind:this={appShellElement}
	class={gridClasses()}
	onkeydown={handleKeydown}
	data-testid="app-shell"
	data-mobile={isMobile}
	data-collapsed={isCollapsed}
	data-animating={isAnimating}
	style="--sidebar-width: {layoutConfig.sidebarWidth}px; --sidebar-collapsed-width: {layoutConfig.sidebarCollapsedWidth}px;"
	role="application"
	aria-label="AI-Native Kanban Application"
>
	<!-- Navigation Sidebar -->
	<div class="sidebar-container relative z-40">
		<NavigationSidebar forceCollapsed={isMobile ? false : isCollapsed} />
	</div>

	<!-- Main Content Area -->
	<main class={mainContentClasses()} data-testid="main-content">
		<!-- Content container with responsive behavior -->
		<div class="responsive-kanban h-full w-full">
			{@render children?.()}
		</div>

		<!-- Layout debugging info (development only) -->
		{#if import.meta.env.DEV}
			<div
				class="fixed bottom-4 left-4 z-30 rounded bg-bg-card/80 p-2 text-xs text-text-muted backdrop-blur-sm"
			>
				<div>Viewport: {viewport.width}×{viewport.height}</div>
				<div>Mobile: {isMobile}</div>
				<div>Collapsed: {isCollapsed}</div>
				<div>Active: {currentActiveItem}</div>
			</div>
		{/if}
	</main>
</div>

<style>
	/* AppShell specific styles */
	.app-shell {
		display: grid;
		grid-template-rows: 1fr;
		min-height: 100vh;
		background: var(--color-bg-primary);
		font-family: var(--font-display);
		color: var(--color-text-primary);
		overflow: hidden;
	}

	/* Grid layout configurations */
	.app-shell.app-grid {
		grid-template-columns: var(--sidebar-width) 1fr;
	}

	.app-shell.app-grid-collapsed {
		grid-template-columns: var(--sidebar-collapsed-width) 1fr;
	}

	.app-shell.grid-cols-1 {
		grid-template-columns: 1fr;
	}

	/* Main content area styling */
	.main-content-area {
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--color-bg-primary) 95%, var(--color-neon-blue) 5%),
			color-mix(in oklch, var(--color-bg-primary) 98%, var(--color-neon-purple) 2%)
		);
		padding: 1.5rem;
		overflow-x: auto;
		overflow-y: auto;
		position: relative;
	}

	/* Responsive container for kanban board */
	.responsive-kanban {
		container-type: inline-size;
		min-height: 100%;
	}

	/* Mobile-specific styles */
	@media (max-width: 768px) {
		.main-content-area {
			padding: 1rem;
		}

		.sidebar-container {
			position: relative;
			z-index: 50;
		}
	}

	/* Animation coordination */
	.app-shell[data-animating='true'] {
		overflow: hidden;
	}

	.app-shell[data-animating='true'] .main-content-area {
		will-change: transform, opacity;
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.app-shell {
			border: 2px solid var(--color-text-primary);
		}

		.main-content-area {
			background: var(--color-bg-primary);
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.app-shell,
		.main-content-area,
		.sidebar-container {
			transition: none !important;
			animation: none !important;
		}
	}

	/* Focus management */
	.app-shell:focus-within {
		outline: none;
	}

	/* Print styles */
	@media print {
		.sidebar-container {
			display: none;
		}

		.app-shell {
			grid-template-columns: 1fr !important;
		}

		.main-content-area {
			padding: 0;
			background: white;
			color: black;
		}
	}

	/* Performance optimizations */
	.app-shell {
		contain: layout style;
	}

	.main-content-area {
		contain: layout;
		transform: translateZ(0); /* Force GPU acceleration */
	}

	/* Container query support for main content */
	@container (max-width: 768px) {
		.main-content-area {
			padding: 0.75rem;
		}
	}

	@container (max-width: 480px) {
		.main-content-area {
			padding: 0.5rem;
		}
	}

	/* Large screen optimizations */
	@container (min-width: 1400px) {
		.main-content-area {
			padding: 2rem;
		}
	}
</style>
