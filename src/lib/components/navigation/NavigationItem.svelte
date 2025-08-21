<!-- NavigationItem.svelte - Individual navigation item with modern styling -->
<script lang="ts">
	import type { NavigationItem } from '$lib/types/navigation.ts';

	interface Props {
		item: NavigationItem;
		collapsed?: boolean;
		onActivate?: (itemId: string) => void;
	}

	let { item, collapsed = false, onActivate }: Props = $props();

	// Reactive state for hover and focus
	let isHovered = $state(false);
	let isFocused = $state(false);

	// Enhanced derived classes for styling with smooth animations
	let itemClasses = $derived(() => {
		let classes =
			'nav-item nav-hover group relative flex items-center w-full px-3 py-2.5 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-neon-blue/50';

		// Active state styling with enhanced effects
		if (item.active) {
			classes +=
				' nav-item-active nav-tab-switch bg-blue-500/20 border-l-4 border-blue-400 shadow-lg';
		} else {
			classes += ' hover:bg-blue-500/10 hover:border-l-2 hover:border-blue-400/50';
		}

		// Disabled state
		if (item.disabled) {
			classes += ' opacity-50 cursor-not-allowed pointer-events-none';
		}

		// Collapsed state adjustments
		if (collapsed) {
			classes += ' justify-center px-2';
		}

		// Performance optimization classes
		classes += ' will-change-transform';

		return classes;
	});

	// Handle click/activation
	function handleActivate() {
		if (item.disabled) return;
		onActivate?.(item.id);
	}

	// Handle keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleActivate();
		}
	}

	// Mouse event handlers
	function handleMouseEnter() {
		isHovered = true;
	}

	function handleMouseLeave() {
		isHovered = false;
	}

	function handleFocus() {
		isFocused = true;
	}

	function handleBlur() {
		isFocused = false;
	}
</script>

<button
	class={itemClasses}
	onclick={handleActivate}
	onkeydown={handleKeydown}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onfocus={handleFocus}
	onblur={handleBlur}
	disabled={item.disabled}
	role="tab"
	aria-selected={item.active}
	aria-controls="{item.id}-panel"
	aria-label="Navigate to {item.label}"
	tabindex={item.active ? 0 : -1}
	data-testid="nav-item-{item.id}"
>
	<!-- Icon -->
	{#if item.icon}
		<div
			class="flex-shrink-0 text-lg transition-transform duration-200 ease-fluid
			       {item.active ? 'scale-110' : 'group-hover:scale-105'}
			       {collapsed ? '' : 'mr-3'}"
			aria-hidden="true"
		>
			{item.icon}
		</div>
	{/if}

	<!-- Label (hidden when collapsed) -->
	{#if !collapsed}
		<span
			class="text-sm font-medium text-text-primary transition-colors duration-200
			       {item.active ? 'text-neon-blue' : 'group-hover:text-neon-blue/80'}
			       truncate"
		>
			{item.label}
		</span>
	{/if}

	<!-- Active indicator glow effect -->
	{#if item.active}
		<div
			class="pointer-events-none absolute inset-0 animate-pulse rounded-lg bg-gradient-to-r
			       from-neon-blue/5 to-neon-purple/5"
			aria-hidden="true"
		></div>
	{/if}

	<!-- Hover glow effect -->
	{#if isHovered && !item.active && !item.disabled}
		<div
			class="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-neon-blue/3
			       to-neon-purple/3 transition-opacity duration-200"
			aria-hidden="true"
		></div>
	{/if}

	<!-- Tooltip for collapsed state -->
	{#if collapsed && item.label}
		<div
			class="pointer-events-none absolute left-full z-50 ml-2 rounded border border-neon-blue/20
			       bg-bg-card px-2 py-1 text-xs whitespace-nowrap
			       text-text-primary opacity-0 transition-opacity duration-200
			       group-hover:opacity-100"
			role="tooltip"
			aria-label={item.label}
		>
			{item.label}
		</div>
	{/if}
</button>

<style>
	/* Enhanced navigation item animations with performance optimization */
	.nav-item {
		position: relative;
		overflow: hidden;
		transform: translateZ(0); /* Force GPU acceleration */
		backface-visibility: hidden;
	}

	/* Shimmer effect on hover */
	.nav-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in oklch, var(--color-neon-blue) 15%, transparent),
			transparent
		);
		transition: left 0.4s var(--ease-fluid);
		will-change: transform;
	}

	.nav-item:hover::before {
		left: 100%;
	}

	/* Enhanced active state with smooth transitions */
	.nav-item-active {
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--color-neon-blue) 20%, transparent),
			color-mix(in oklch, var(--color-neon-purple) 15%, transparent)
		);
		box-shadow:
			0 0 25px color-mix(in oklch, var(--color-neon-blue) 35%, transparent),
			inset 0 1px 0 color-mix(in oklch, var(--color-neon-blue) 25%, transparent),
			0 4px 15px color-mix(in oklch, var(--color-neon-blue) 20%, transparent);
		border-left: 3px solid var(--color-neon-blue);
		transform: translateX(2px) translateZ(0);
	}

	/* Smooth hover state transitions */
	.nav-item:hover:not(.nav-item-active) {
		background: color-mix(in oklch, var(--color-neon-blue) 8%, transparent);
		transform: translateX(3px) translateZ(0);
		box-shadow: 0 0 15px color-mix(in oklch, var(--color-neon-blue) 20%, transparent);
	}

	/* Enhanced focus ring */
	.nav-item:focus-visible {
		outline: 2px solid var(--color-neon-blue);
		outline-offset: 2px;
		box-shadow:
			0 0 0 4px color-mix(in oklch, var(--color-neon-blue) 20%, transparent),
			0 0 20px color-mix(in oklch, var(--color-neon-blue) 30%, transparent);
	}

	/* Performance-optimized transitions */
	.nav-item {
		transition:
			transform 180ms var(--ease-fluid),
			background-color 180ms var(--ease-fluid),
			box-shadow 180ms var(--ease-fluid);
		will-change: transform, background-color, box-shadow;
	}
</style>
