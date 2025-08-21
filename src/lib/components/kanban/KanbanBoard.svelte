<!--
@component
KanbanBoard component that displays a four-column grid layout with responsive design.
Manages the overall board layout and coordinates column rendering.

Usage:
```html
<KanbanBoard />
```
-->
<script lang="ts">
	import { kanbanStore } from '$lib/stores/kanban.svelte.js';
	import KanbanColumn from './KanbanColumn.svelte';
	import type { KanbanColumn as KanbanColumnType } from '$lib/types/kanban.js';

	// Get reactive board data from the store
	let boardData = $derived(kanbanStore.boardData);
	let isLoading = $derived(kanbanStore.loading);
	let errorMessage = $derived(kanbanStore.errorMessage);

	// Prepare columns with their respective tasks
	let columnsWithTasks = $derived<KanbanColumnType[]>(
		kanbanStore.boardColumns.map((column) => ({
			...column,
			tasks: kanbanStore.allTasks.filter((task) => task.status === column.id)
		}))
	);

	// Board statistics for accessibility and debugging
	let totalTasks = $derived(kanbanStore.totalTasks);
	let completionRate = $derived(kanbanStore.completionRate);

	// Load data from storage on component initialization
	$effect(() => {
		kanbanStore.loadFromStorage();
	});
</script>

<!-- Board Container -->
<div
	class="responsive-kanban h-full w-full"
	role="main"
	aria-label="Kanban board with {totalTasks} tasks, {completionRate}% complete"
	data-testid="kanban-board"
>
	{#if errorMessage}
		<!-- Error State -->
		<div
			class="flex h-64 items-center justify-center rounded-lg border border-red-500/30 glass-effect"
			role="alert"
			aria-live="polite"
		>
			<div class="text-center">
				<div class="mb-4 text-4xl">⚠️</div>
				<h2 class="mb-2 heading-secondary text-red-400">Error Loading Board</h2>
				<p class="mb-4 body-text text-red-300">{errorMessage}</p>
				<button
					class="btn-secondary"
					onclick={() => {
						kanbanStore.clearError();
						kanbanStore.loadFromStorage();
					}}
				>
					Try Again
				</button>
			</div>
		</div>
	{:else if isLoading}
		<!-- Loading State -->
		<div
			class="flex h-64 items-center justify-center"
			role="status"
			aria-live="polite"
			aria-label="Loading kanban board"
		>
			<div class="text-center">
				<div
					class="mx-auto mb-4 h-8 w-8 loading-spinner rounded-full border-2 border-neon-blue border-t-transparent"
				></div>
				<p class="body-text">Loading your board...</p>
			</div>
		</div>
	{:else}
		<!-- Board Header -->
		<header class="mb-6 slide-in-down">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="mb-2 heading-primary">
						{boardData.title}
					</h1>
					<div class="flex items-center space-x-4 text-sm text-text-secondary">
						<span aria-label="{totalTasks} total tasks">
							📋 {totalTasks} tasks
						</span>
						<span aria-label="{completionRate}% completion rate">
							📊 {completionRate}% complete
						</span>
						{#if kanbanStore.aiGeneratedTasks > 0}
							<span
								class="flex items-center space-x-1"
								aria-label="{kanbanStore.aiGeneratedTasks} AI generated tasks"
							>
								<div class="h-2 w-2 ai-pulse rounded-full bg-neon-purple"></div>
								<span>🤖 {kanbanStore.aiGeneratedTasks} AI tasks</span>
							</span>
						{/if}
					</div>
				</div>

				<!-- Board Actions (for future features) -->
				<div class="flex items-center space-x-2">
					<button
						class="btn-secondary text-xs"
						title="Export board data"
						aria-label="Export board"
						onclick={() => {
							const data = kanbanStore.exportData();
							console.log('Board data:', data);
						}}
					>
						📤 Export
					</button>

					<button
						class="btn-secondary text-xs"
						title="Clear completed tasks"
						aria-label="Clear completed tasks"
						disabled={kanbanStore.doneCount === 0}
						onclick={() => {
							const cleared = kanbanStore.clearCompletedTasks();
							console.log(`Cleared ${cleared} completed tasks`);
						}}
					>
						🗑️ Clear Done ({kanbanStore.doneCount})
					</button>
				</div>
			</div>
		</header>

		<!-- Kanban Columns Grid -->
		<div
			class="kanban-board slide-in-up"
			role="region"
			aria-label="Kanban columns"
			data-testid="kanban-columns"
		>
			{#each columnsWithTasks as column, index (column.id)}
				<div class="stagger-in stagger-delay-{index + 1}" data-testid="column-wrapper-{column.id}">
					<KanbanColumn {column} />
				</div>
			{/each}
		</div>

		<!-- Board Footer with Statistics -->
		<footer class="mt-8 slide-in-up" aria-label="Board statistics">
			<div class="rounded-lg p-4 glass-effect">
				<div class="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
					<div class="space-y-1">
						<div class="text-lg font-semibold text-neon">{kanbanStore.todoCount}</div>
						<div class="text-xs text-text-muted">To Do</div>
					</div>
					<div class="space-y-1">
						<div class="text-lg font-semibold text-neon-purple">{kanbanStore.inProgressCount}</div>
						<div class="text-xs text-text-muted">In Progress</div>
					</div>
					<div class="space-y-1">
						<div class="text-lg font-semibold text-neon-green">{kanbanStore.testingCount}</div>
						<div class="text-xs text-text-muted">Testing</div>
					</div>
					<div class="space-y-1">
						<div class="text-lg font-semibold text-neon-cyan">{kanbanStore.doneCount}</div>
						<div class="text-xs text-text-muted">Done</div>
					</div>
				</div>

				{#if totalTasks > 0}
					<!-- Progress Bar -->
					<div class="mt-4">
						<div class="mb-1 flex items-center justify-between text-xs text-text-muted">
							<span>Overall Progress</span>
							<span>{completionRate}%</span>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-gray-700">
							<div
								class="h-full bg-gradient-to-r from-neon-blue to-neon-cyan transition-all duration-500 ease-out"
								style="width: {completionRate}%"
								role="progressbar"
								aria-valuenow={completionRate}
								aria-valuemin="0"
								aria-valuemax="100"
								aria-label="Board completion progress"
							></div>
						</div>
					</div>
				{/if}
			</div>
		</footer>

		<!-- Empty Board State -->
		{#if totalTasks === 0}
			<div
				class="pointer-events-none absolute inset-0 flex items-center justify-center"
				role="status"
				aria-label="Empty board"
			>
				<div class="text-center opacity-40">
					<div class="mb-4 text-6xl">📋</div>
					<h2 class="mb-2 heading-secondary">Your board is empty</h2>
					<p class="body-text">
						Add some requirements to get started with AI-powered task breakdown
					</p>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	/* Enhanced responsive grid behavior */
	@container (max-width: 1200px) {
		.kanban-board {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem;
		}
	}

	@container (max-width: 768px) {
		.kanban-board {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}
	}

	/* Mobile-first horizontal scroll for very small screens */
	@container (max-width: 480px) {
		.kanban-board {
			display: flex;
			overflow-x: auto;
			scroll-snap-type: x mandatory;
			gap: 1rem;
			padding-bottom: 1rem;
		}

		.kanban-board > div {
			flex: 0 0 280px;
			scroll-snap-align: start;
		}
	}

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

	/* Progress bar smooth animation */
	.progress-bar {
		transition: width 0.5s ease-out;
	}

	/* Stagger animation delays for columns */
	.stagger-delay-1 {
		animation-delay: 0ms;
	}
	.stagger-delay-2 {
		animation-delay: 100ms;
	}
	.stagger-delay-3 {
		animation-delay: 200ms;
	}
	.stagger-delay-4 {
		animation-delay: 300ms;
	}

	/* Enhanced accessibility for reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.slide-in-up,
		.slide-in-down,
		.stagger-in {
			animation: none;
		}

		.progress-bar {
			transition: none;
		}
	}

	/* High contrast mode adjustments */
	@media (prefers-contrast: high) {
		.glass-effect {
			background: var(--color-bg-secondary);
			border: 2px solid var(--color-neon-blue);
		}
	}

	/* Print styles */
	@media print {
		.btn-secondary {
			display: none;
		}

		.kanban-board {
			grid-template-columns: repeat(2, 1fr) !important;
			gap: 1rem;
		}

		footer {
			break-inside: avoid;
		}
	}
</style>
