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

	// Derived classes for styling
	let itemClasses = $derived(() => {
		let classes =
			'nav-item group relative flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2';

		// Active state styling
		if (item.active) {
			classes += ' nav-item-active bg-blue-500/20 border-l-4 border-blue-400 shadow-lg';
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
	/* Custom utilities for navigation items */
	.nav-item {
		position: relative;
		overflow: hidden;
	}

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
			color-mix(in oklch, var(--color-neon-blue) 10%, transparent),
			transparent
		);
		transition: left 0.5s ease-fluid;
	}

	.nav-item:hover::before {
		left: 100%;
	}

	.nav-item-active {
		box-shadow:
			0 0 20px color-mix(in oklch, var(--color-neon-blue) 30%, transparent),
			inset 0 1px 0 color-mix(in oklch, var(--color-neon-blue) 20%, transparent);
	}

	/* Focus ring enhancement */
	.nav-item:focus-visible {
		outline: 2px solid var(--color-neon-blue);
		outline-offset: 2px;
	}

	/* Smooth transitions for all interactive states */
	.nav-item * {
		transition: all 200ms var(--ease-fluid);
	}
</style>
