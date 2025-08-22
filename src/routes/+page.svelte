<script lang="ts">
	import { onMount } from 'svelte';
	import { navigationStore } from '$lib/stores/navigation.svelte';
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import KanbanBoard from '$lib/components/kanban/KanbanBoard.svelte';
	import { LayoutErrorRecovery, useErrorRecovery } from '$lib/utils/error-recovery';

	// Error recovery for this component
	const { handleError } = useErrorRecovery('MainPage');

	// Reactive state from stores
	let activeItem = $derived(navigationStore.currentActiveItem);
	let isCollapsed = $derived(navigationStore.isCollapsed);
	let totalTasks = $derived(kanbanStore.totalTasks);
	let completionRate = $derived(kanbanStore.completionRate);
	let isLoading = $derived(kanbanStore.loading);
	let errorMessage = $derived(kanbanStore.errorMessage);

	// Local state for component initialization
	let isInitialized = $state(false);
	let initializationError = $state<string | null>(null);

	// Initialize stores and load data
	async function initializeApplication() {
		try {
			// Clear any existing errors first
			kanbanStore.clearError();

			// Ensure navigation is set to kanban
			if (!navigationStore.setActiveItem('kanban')) {
				console.warn('Failed to set active navigation item, resetting navigation');
				navigationStore.reset();
				navigationStore.setActiveItem('kanban');
			}

			// Load kanban data from storage
			kanbanStore.loadFromStorage();

			// Wait a tick for reactive updates to settle
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Mark as initialized
			isInitialized = true;
			initializationError = null;
		} catch (error) {
			console.error('Failed to initialize application:', error);
			initializationError = error instanceof Error ? error.message : 'Unknown initialization error';

			// Attempt recovery
			handleError(error instanceof Error ? error : new Error(String(error)), 'initialization');

			// Mark as initialized even with errors to prevent infinite loading
			isInitialized = true;
		}
	}

	// Handle component mounting and state initialization
	onMount(() => {
		try {
			initializeApplication();
		} catch (error) {
			console.error('Mount error:', error);
			handleError(error instanceof Error ? error : new Error(String(error)), 'mount');
		}
	});

	// Error recovery actions
	function retryInitialization() {
		isInitialized = false;
		initializationError = null;
		initializeApplication();
	}

	function resetApplication() {
		try {
			LayoutErrorRecovery.performFullReset();
			isInitialized = false;
			initializationError = null;
			setTimeout(() => {
				initializeApplication();
			}, 100);
		} catch (error) {
			console.error('Failed to reset application:', error);
			// Force page reload as ultimate fallback
			window.location.reload();
		}
	}
</script>

{#if initializationError}
	<!-- Initialization Error State -->
	<div class="flex h-full items-center justify-center" role="alert" aria-live="polite">
		<div class="text-center">
			<div class="mb-4 text-6xl">⚠️</div>
			<h1 class="mb-4 heading-primary text-red-400">Application Error</h1>
			<p class="mb-6 max-w-md body-text text-red-300">
				{initializationError}
			</p>
			<div class="flex justify-center space-x-4">
				<button class="btn-primary" onclick={retryInitialization} aria-label="Retry initialization">
					🔄 Retry
				</button>
				<button class="btn-secondary" onclick={resetApplication} aria-label="Reset application">
					🔧 Reset App
				</button>
			</div>
		</div>
	</div>
{:else if !isInitialized}
	<!-- Loading State -->
	<div class="flex h-full items-center justify-center" role="status" aria-live="polite">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-12 w-12 loading-spinner rounded-full border-4 border-neon-blue border-t-transparent"
			></div>
			<h1 class="mb-2 heading-primary">Loading Workspace</h1>
			<p class="body-text text-text-secondary">Setting up your workspace...</p>
		</div>
	</div>
{:else}
	<!-- Main Application Content -->
	<div class="flex h-full flex-col" data-testid="main-app-content">
		<!-- Application Header with Status -->
		<header class="mb-6 slide-in-down">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="mb-2 heading-primary">AI-Native Kanban</h1>
					<p class="body-text text-text-secondary">
						Modern project management with AI-powered task breakdown and optimization.
					</p>
				</div>

				<!-- System Status Indicators -->
				<div class="flex items-center space-x-4 text-sm">
					<div class="flex items-center space-x-2">
						<div class="h-2 w-2 animate-pulse rounded-full bg-neon-green"></div>
						<span class="text-text-muted">System Online</span>
					</div>
					<div class="flex items-center space-x-2">
						<span class="text-text-muted">View:</span>
						<span class="font-semibold text-neon">{activeItem}</span>
					</div>
					<div class="flex items-center space-x-2">
						<span class="text-text-muted">Layout:</span>
						<span class="font-semibold text-neon-purple">
							{isCollapsed ? 'Collapsed' : 'Expanded'}
						</span>
					</div>
				</div>
			</div>
		</header>

		<!-- Quick Stats Bar -->
		{#if totalTasks > 0}
			<div class="mb-6 slide-in-up">
				<div class="rounded-lg p-4 glass-effect">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-6 text-sm">
							<div class="flex items-center space-x-2">
								<span class="text-text-muted">Tasks:</span>
								<span class="font-semibold text-neon">{totalTasks}</span>
							</div>
							<div class="flex items-center space-x-2">
								<span class="text-text-muted">Progress:</span>
								<span class="font-semibold text-neon-green">{completionRate}%</span>
							</div>
							{#if kanbanStore.aiGeneratedTasks > 0}
								<div class="flex items-center space-x-2">
									<div class="h-2 w-2 ai-pulse rounded-full bg-neon-purple"></div>
									<span class="text-text-muted">AI Tasks:</span>
									<span class="font-semibold text-neon-purple">{kanbanStore.aiGeneratedTasks}</span>
								</div>
							{/if}
						</div>

						<!-- Quick Actions -->
						<div class="flex items-center space-x-2">
							<button
								class="btn-secondary text-xs"
								onclick={() => navigationStore.toggleSidebar()}
								aria-label="Toggle sidebar"
							>
								{isCollapsed ? '📖' : '📕'} Sidebar
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Main Kanban Board -->
		<div class="flex-1 slide-in-up" style="animation-delay: 200ms">
			<KanbanBoard />
		</div>

		<!-- Application Footer -->
		<footer
			class="mt-6 slide-in-up border-t border-neon-blue/10 pt-4"
			style="animation-delay: 400ms"
		>
			<div class="text-center text-sm text-text-muted">
				<p class="mb-2">AI-Native Kanban Foundation Complete ✨</p>
				<div class="flex flex-wrap justify-center space-x-4">
					<span class="text-neon-green">✓ AppShell Integration</span>
					<span class="text-neon-green">✓ Component Mounting</span>
					<span class="text-neon-green">✓ State Management</span>
					<span class="text-neon-green">✓ Error Recovery</span>
				</div>
				{#if import.meta.env.DEV}
					<div class="mt-2 text-xs opacity-60">Development Mode - Error Recovery Active</div>
				{/if}
			</div>
		</footer>
	</div>
{/if}

<style>
	/* Loading spinner animation */
	.loading-spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Enhanced entrance animations */
	.slide-in-down {
		opacity: 0;
		transform: translateY(-20px);
		animation: slide-in-down 400ms var(--ease-fluid) both;
	}

	.slide-in-up {
		opacity: 0;
		transform: translateY(20px);
		animation: slide-in-up 400ms var(--ease-fluid) both;
	}

	@keyframes slide-in-down {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slide-in-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Accessibility improvements */
	@media (prefers-reduced-motion: reduce) {
		.slide-in-down,
		.slide-in-up,
		.loading-spinner {
			animation: none !important;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.glass-effect {
			background: var(--color-bg-secondary);
			border: 2px solid var(--color-neon-blue);
		}
	}
</style>
