<!-- NavigationSidebar.svelte - Main navigation sidebar with responsive design -->
<script lang="ts">
	import { navigationStore } from '$lib/stores/navigation.svelte';
	import NavigationItem from './NavigationItem.svelte';
	import { animationManager } from '$lib/utils/animation-manager';

	interface Props {
		/** Override collapsed state (for external control) */
		forceCollapsed?: boolean;
		/** Additional CSS classes */
		class?: string;
	}

	let { forceCollapsed, class: additionalClasses = '' }: Props = $props();

	// Reactive state from navigation store
	let navigationItems = $derived(navigationStore.navigationItems);
	let isCollapsed = $derived(forceCollapsed ?? navigationStore.isCollapsed);
	let activeItem = $derived(navigationStore.currentActiveItem);

	// Local state for animations and interactions
	let sidebarElement: HTMLElement | undefined = $state();
	let isAnimating = $state(false);
	let isMobileMenuOpen = $state(false);

	// Media query for mobile detection
	let isMobile = $state(false);

	// Derived classes for sidebar styling
	let sidebarClasses = $derived(() => {
		let classes =
			'navigation-sidebar flex flex-col h-full bg-gray-900 border-r border-blue-400/20 backdrop-blur-xl transition-all duration-300 relative z-40';

		// Width classes based on collapsed state
		if (isCollapsed) {
			classes += ' w-16';
		} else {
			classes += ' w-60';
		}

		// Mobile-specific classes
		if (isMobile) {
			classes +=
				' fixed left-0 top-0 h-screen transform transition-transform duration-300 shadow-2xl shadow-blue-400/20';

			if (isMobileMenuOpen) {
				classes += ' translate-x-0';
			} else {
				classes += ' -translate-x-full';
			}
		}

		if (additionalClasses) {
			classes += ' ' + additionalClasses;
		}

		return classes;
	});

	// Handle navigation item activation with smooth animation
	function handleItemActivate(itemId: string) {
		const previousActiveElement = sidebarElement?.querySelector('.nav-item-active') as HTMLElement;
		const success = navigationStore.setActiveItem(itemId);

		if (success) {
			const newActiveElement = sidebarElement?.querySelector(
				`[data-testid="nav-item-${itemId}"]`
			) as HTMLElement;

			if (newActiveElement && previousActiveElement !== newActiveElement) {
				animationManager.triggerTabSwitchAnimation(newActiveElement, previousActiveElement);
			}

			if (isMobile) {
				// Close mobile menu after navigation
				isMobileMenuOpen = false;
			}
		}
	}

	// Handle sidebar toggle
	function handleToggle() {
		if (isMobile) {
			isMobileMenuOpen = !isMobileMenuOpen;
		} else {
			navigationStore.toggleSidebar();
		}
	}

	// Keyboard navigation handler
	function handleKeydown(event: KeyboardEvent) {
		// Handle arrow key navigation
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			navigationStore.navigateNext();
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			navigationStore.navigatePrevious();
		} else if (event.key === 'Escape' && isMobile && isMobileMenuOpen) {
			event.preventDefault();
			isMobileMenuOpen = false;
		}
	}

	// Focus management for accessibility
	function focusActiveItem() {
		if (!sidebarElement) return;

		const activeButton = sidebarElement.querySelector('[aria-selected="true"]') as HTMLElement;
		if (activeButton) {
			activeButton.focus();
		}
	}

	// Mobile detection effect
	$effect(() => {
		const mediaQuery = window.matchMedia('(max-width: 768px)');

		function handleMediaChange(e: MediaQueryListEvent) {
			isMobile = e.matches;
			if (!e.matches) {
				// Reset mobile menu when switching to desktop
				isMobileMenuOpen = false;
			}
		}

		isMobile = mediaQuery.matches;
		mediaQuery.addEventListener('change', handleMediaChange);

		return () => {
			mediaQuery.removeEventListener('change', handleMediaChange);
		};
	});

	// Handle clicks outside sidebar on mobile
	$effect(() => {
		if (!isMobile || !isMobileMenuOpen) return;

		function handleClickOutside(event: MouseEvent) {
			if (sidebarElement && !sidebarElement.contains(event.target as Node)) {
				isMobileMenuOpen = false;
			}
		}

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});

	// Animation state management
	$effect(() => {
		if (isAnimating) {
			const timer = setTimeout(() => {
				isAnimating = false;
			}, 300);
			return () => clearTimeout(timer);
		}
	});

	// Export functions for external control
	export function openMobileMenu() {
		if (isMobile) {
			isMobileMenuOpen = true;
		}
	}

	export function closeMobileMenu() {
		if (isMobile) {
			isMobileMenuOpen = false;
		}
	}

	export function toggleMobileMenu() {
		if (isMobile) {
			isMobileMenuOpen = !isMobileMenuOpen;
		}
	}
</script>

<!-- Mobile backdrop -->
{#if isMobile && isMobileMenuOpen}
	<div
		class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
		onclick={() => (isMobileMenuOpen = false)}
		aria-hidden="true"
	></div>
{/if}

<!-- Main sidebar -->
<nav
	bind:this={sidebarElement}
	class={sidebarClasses()}
	aria-label="Main navigation"
	data-testid="navigation-sidebar"
>
	<!-- Sidebar header -->
	<div
		class="flex items-center justify-between border-b border-neon-blue/10 p-4
		       {isCollapsed ? 'px-2' : 'px-4'}"
	>
		{#if !isCollapsed}
			<div class="flex items-center space-x-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple"
				>
					<span class="text-sm font-bold text-white">AI</span>
				</div>
				<h1 class="text-sm font-semibold text-text-primary">Kanban</h1>
			</div>
		{/if}

		<!-- Toggle button -->
		<button
			onclick={handleToggle}
			class="rounded-lg p-2 transition-colors duration-200 hover:bg-neon-blue/10
			       focus:ring-2 focus:ring-neon-blue/50 focus:outline-none
			       {isCollapsed ? 'mx-auto' : ''}"
			aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			data-testid="sidebar-toggle"
		>
			<div class="flex h-4 w-4 flex-col justify-center space-y-1">
				<div
					class="h-0.5 w-full rounded bg-text-secondary transition-transform duration-200
				           {isCollapsed ? 'translate-y-1 rotate-45' : ''}"
				></div>
				<div
					class="h-0.5 w-full rounded bg-text-secondary transition-opacity duration-200
				           {isCollapsed ? 'opacity-0' : ''}"
				></div>
				<div
					class="h-0.5 w-full rounded bg-text-secondary transition-transform duration-200
				           {isCollapsed ? '-translate-y-1 -rotate-45' : ''}"
				></div>
			</div>
		</button>
	</div>

	<!-- Navigation items -->
	<div class="flex-1 overflow-y-auto px-2 py-4">
		<ul role="tablist" aria-label="Navigation tabs" class="space-y-1" onkeydown={handleKeydown}>
			{#each navigationItems as item (item.id)}
				<li role="none">
					<NavigationItem {item} collapsed={isCollapsed} onActivate={handleItemActivate} />
				</li>
			{/each}
		</ul>

		<!-- Future features placeholder -->
		{#if !isCollapsed}
			<div class="mt-8 px-2">
				<div class="mb-2 text-xs tracking-wider text-text-muted uppercase">Coming Soon</div>
				<div class="space-y-1">
					<div class="h-8 animate-pulse rounded-lg bg-bg-card/50"></div>
					<div class="h-8 animate-pulse rounded-lg bg-bg-card/30"></div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Sidebar footer -->
	<div class="border-t border-neon-blue/10 p-4">
		{#if !isCollapsed}
			<div class="text-center text-xs text-text-muted">AI-Native Kanban v1.0</div>
		{:else}
			<div
				class="mx-auto h-2 w-2 animate-pulse rounded-full bg-neon-green"
				title="System online"
			></div>
		{/if}
	</div>

	<!-- Neon glow effect -->
	<div
		class="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-neon-blue/50
		       to-transparent"
		aria-hidden="true"
	></div>
</nav>

<!-- Mobile menu button (when sidebar is hidden) -->
{#if isMobile && !isMobileMenuOpen}
	<button
		onclick={() => (isMobileMenuOpen = true)}
		class="fixed top-4 left-4 z-50 rounded-lg border border-neon-blue/20 bg-bg-sidebar p-3
		       shadow-lg shadow-neon-blue/20 backdrop-blur-xl
		       transition-all duration-200 hover:bg-neon-blue/10
		       focus:ring-2 focus:ring-neon-blue/50 focus:outline-none"
		aria-label="Open navigation menu"
		data-testid="mobile-menu-button"
	>
		<div class="flex h-5 w-5 flex-col justify-center space-y-1">
			<div class="h-0.5 w-full rounded bg-neon-blue"></div>
			<div class="h-0.5 w-full rounded bg-neon-blue"></div>
			<div class="h-0.5 w-full rounded bg-neon-blue"></div>
		</div>
	</button>
{/if}

<style>
	/* Custom scrollbar for navigation */
	.navigation-sidebar {
		scrollbar-width: thin;
		scrollbar-color: color-mix(in oklch, var(--color-neon-blue) 30%, transparent) transparent;
	}

	.navigation-sidebar::-webkit-scrollbar {
		width: 4px;
	}

	.navigation-sidebar::-webkit-scrollbar-track {
		background: transparent;
	}

	.navigation-sidebar::-webkit-scrollbar-thumb {
		background: color-mix(in oklch, var(--color-neon-blue) 30%, transparent);
		border-radius: 2px;
	}

	.navigation-sidebar::-webkit-scrollbar-thumb:hover {
		background: color-mix(in oklch, var(--color-neon-blue) 50%, transparent);
	}

	/* Enhanced entrance animation with performance optimization */
	.navigation-sidebar {
		animation: sidebar-slide-in 400ms var(--ease-fluid) both;
		will-change: transform, opacity;
	}

	/* Remove will-change after animation completes */
	.navigation-sidebar.animation-complete {
		will-change: auto;
	}

	@keyframes sidebar-slide-in {
		from {
			transform: translateX(-100%) translateZ(0);
			opacity: 0;
		}
		to {
			transform: translateX(0) translateZ(0);
			opacity: 1;
		}
	}

	/* Enhanced glow effects */
	.navigation-sidebar::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--color-neon-blue) 5%, transparent),
			color-mix(in oklch, var(--color-neon-purple) 3%, transparent)
		);
		pointer-events: none;
		z-index: -1;
	}

	/* Mobile-specific animations */
	@media (max-width: 768px) {
		.navigation-sidebar {
			animation: slide-in-mobile 300ms var(--ease-fluid);
		}

		@keyframes slide-in-mobile {
			from {
				transform: translateX(-100%);
			}
			to {
				transform: translateX(0);
			}
		}
	}
</style>
