<!--
@component
KanbanColumn component for displaying a single column in the kanban board.
Features status-specific neon borders, theming, and responsive design.

Usage:
```html
<KanbanColumn column={columnData} />
```
-->
<script lang="ts">
	import type { KanbanColumn } from '$lib/types/kanban.js';

	interface Props {
		column: KanbanColumn;
	}

	let { column }: Props = $props();

	// Derived values for styling based on column status
	let statusClass = $derived(
		{
			todo: 'column-todo',
			'in-progress': 'column-in-progress',
			testing: 'column-testing',
			done: 'column-done'
		}[column.id]
	);

	let headerColorClass = $derived(
		{
			todo: 'text-neon',
			'in-progress': 'text-neon-purple',
			testing: 'text-neon-green',
			done: 'text-neon-cyan'
		}[column.id]
	);

	let taskCount = $derived(column.tasks.length);
	let hasWipLimit = $derived(column.wipLimit && column.wipLimit > 0);
	let isOverWipLimit = $derived(hasWipLimit && taskCount > column.wipLimit!);
</script>

<div
	class="kanban-column {statusClass} column-hover"
	role="region"
	aria-label="{column.title} column with {taskCount} tasks"
	data-testid="column-{column.id}"
	data-column-status={column.id}
>
	<!-- Column Header -->
	<header class="column-header">
		<div class="flex items-center justify-between">
			<h2 class="heading-secondary {headerColorClass}">
				{column.title}
			</h2>

			<!-- Task Count Badge -->
			<div class="flex items-center space-x-2" aria-label="{taskCount} tasks in {column.title}">
				<span
					class="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-semibold
					       {isOverWipLimit
						? 'border border-red-500/30 bg-red-500/20 text-red-400'
						: 'border border-gray-500/30 bg-gray-500/20 text-gray-300'}"
					data-testid="task-count-badge"
				>
					{taskCount}
					{#if hasWipLimit}
						<span class="ml-1 text-gray-400">/{column.wipLimit}</span>
					{/if}
				</span>

				{#if isOverWipLimit}
					<span
						class="text-xs text-red-400"
						title="Work in Progress limit exceeded"
						aria-label="WIP limit exceeded"
					>
						⚠️
					</span>
				{/if}
			</div>
		</div>

		{#if hasWipLimit && isOverWipLimit}
			<div class="mt-2 text-xs text-red-400 opacity-80">
				WIP limit exceeded ({taskCount}/{column.wipLimit})
			</div>
		{/if}
	</header>

	<!-- Tasks Container -->
	<div
		class="min-h-[200px] flex-1 space-y-3"
		role="list"
		aria-label="Tasks in {column.title}"
		data-testid="tasks-container"
	>
		{#if column.tasks.length === 0}
			<!-- Empty State -->
			<div
				class="flex h-32 flex-col items-center justify-center text-center opacity-60"
				role="status"
				aria-label="No tasks in {column.title}"
			>
				<div class="mb-2 text-2xl opacity-50">
					{#if column.id === 'todo'}
						📝
					{:else if column.id === 'in-progress'}
						⚡
					{:else if column.id === 'testing'}
						🧪
					{:else if column.id === 'done'}
						✅
					{/if}
				</div>
				<p class="text-sm text-gray-400">
					{#if column.id === 'todo'}
						No tasks to do
					{:else if column.id === 'in-progress'}
						No tasks in progress
					{:else if column.id === 'testing'}
						No tasks being tested
					{:else if column.id === 'done'}
						No completed tasks
					{/if}
				</p>
			</div>
		{:else}
			<!-- Task Cards Placeholder -->
			{#each column.tasks as task, index (task.id)}
				<div
					class="task-card interactive-hover hover-glow-smooth hover-lift-smooth"
					style="animation-delay: {index * 50}ms"
					role="listitem"
					aria-label="Task: {task.title}"
					data-testid="task-card"
					data-task-id={task.id}
				>
					<!-- Task Header -->
					<div class="mb-3 flex items-start justify-between">
						<h3 class="text-sm leading-tight font-semibold text-text-primary">
							{task.title}
						</h3>

						<div class="ml-2 flex flex-shrink-0 items-center space-x-1">
							{#if task.priority}
								<span
									class="text-xs"
									title="Priority: {task.priority}"
									aria-label="Priority {task.priority}"
								>
									{#if task.priority === 'high'}
										🔴
									{:else if task.priority === 'medium'}
										🟡
									{:else}
										🟢
									{/if}
								</span>
							{/if}

							{#if task.aiGenerated}
								<div
									class="h-2 w-2 ai-pulse rounded-full bg-neon-purple"
									title="AI Generated Task"
									aria-label="AI generated"
								></div>
							{/if}
						</div>
					</div>

					<!-- Task Description -->
					{#if task.description}
						<p class="mb-3 line-clamp-3 text-xs text-text-secondary">
							{task.description}
						</p>
					{/if}

					<!-- Task Footer -->
					<div class="flex items-center justify-between text-xs text-text-muted">
						<time
							datetime={task.createdAt.toISOString()}
							title="Created {task.createdAt.toLocaleDateString()}"
						>
							{task.createdAt.toLocaleDateString()}
						</time>

						{#if task.tags && task.tags.length > 0}
							<div class="flex items-center space-x-1">
								{#each task.tags.slice(0, 2) as tag}
									<span class="rounded bg-gray-500/20 px-1.5 py-0.5 text-xs">
										{tag}
									</span>
								{/each}
								{#if task.tags.length > 2}
									<span class="text-gray-400">+{task.tags.length - 2}</span>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Drop Zone Indicator (for future drag & drop) -->
	<div
		class="mt-4 rounded-lg border-2 border-dashed border-gray-500/30 p-2 opacity-0 transition-opacity duration-200"
		data-testid="drop-zone"
		role="region"
		aria-label="Drop zone for {column.title}"
	>
		<p class="text-center text-xs text-gray-400">Drop tasks here</p>
	</div>
</div>

<style>
	/* Line clamp utility for task descriptions */
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Enhanced hover effects for task cards */
	.task-card:hover .drop-zone {
		opacity: 0.5;
	}

	/* Responsive text sizing */
	@container (max-width: 300px) {
		.heading-secondary {
			font-size: 1.125rem;
		}

		.task-card h3 {
			font-size: 0.875rem;
		}

		.task-card p {
			font-size: 0.75rem;
		}
	}
</style>
