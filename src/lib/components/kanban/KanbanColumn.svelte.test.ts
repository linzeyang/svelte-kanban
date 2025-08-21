// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import KanbanColumn from './KanbanColumn.svelte';
import type { KanbanColumn as KanbanColumnType, TaskItem, TaskStatus } from '$lib/types/kanban.js';

describe('KanbanColumn', () => {
	let mockColumn: KanbanColumnType;
	let mockTasks: TaskItem[];

	beforeEach(() => {
		// Clean up DOM
		document.body.innerHTML = '';

		// Create mock tasks for testing
		mockTasks = [
			{
				id: 'task-1',
				title: 'Test Task 1',
				description: 'This is a test task description',
				status: 'todo',
				priority: 'high',
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-01'),
				aiGenerated: true,
				tags: ['frontend', 'urgent']
			},
			{
				id: 'task-2',
				title: 'Test Task 2',
				description: 'Another test task',
				status: 'todo',
				priority: 'medium',
				createdAt: new Date('2024-01-02'),
				updatedAt: new Date('2024-01-02'),
				aiGenerated: false,
				tags: ['backend']
			}
		];

		// Create mock column
		mockColumn = {
			id: 'todo',
			title: 'To Do',
			color: 'neon-blue',
			tasks: mockTasks,
			wipLimit: 5
		};
	});

	test('renders column with correct title and styling', () => {
		const component = mount(KanbanColumn, {
			target: document.body,
			props: { column: mockColumn }
		});

		// Flush reactive updates
		flushSync();

		// Check if column title is rendered
		expect(document.body.innerHTML).toContain('To Do');

		// Check if correct CSS classes are applied
		const columnElement = document.body.querySelector('[data-testid="column-todo"]');
		expect(columnElement).toBeTruthy();
		expect(columnElement?.classList.contains('column-todo')).toBe(true);
		expect(columnElement?.classList.contains('kanban-column')).toBe(true);

		// Check header styling
		const header = document.body.querySelector('.column-header');
		expect(header).toBeTruthy();

		const titleElement = document.body.querySelector('.text-neon');
		expect(titleElement).toBeTruthy();

		unmount(component);
	});

	test('displays correct task count badge', () => {
		const component = mount(KanbanColumn, {
			target: document.body,
			props: { column: mockColumn }
		});

		const taskCountBadge = document.body.querySelector('[data-testid="task-count-badge"]');
		expect(taskCountBadge).toBeTruthy();
		expect(taskCountBadge?.textContent?.trim()).toContain('2');
		expect(taskCountBadge?.textContent?.trim()).toContain('/5'); // WIP limit

		unmount(component);
	});

	test('shows WIP limit warning when exceeded', () => {
		// Create column with exceeded WIP limit
		const overLimitColumn = {
			...mockColumn,
			wipLimit: 1, // Set limit lower than task count
			tasks: mockTasks
		};

		const component = mount(KanbanColumn, {
			target: document.body,
			props: { column: overLimitColumn }
		});

		// Check for warning indicator
		const warningIcon = document.body.querySelector(
			'span[title="Work in Progress limit exceeded"]'
		);
		expect(warningIcon).toBeTruthy();
		expect(warningIcon?.textContent).toContain('⚠️');

		// Check for warning message
		expect(document.body.innerHTML).toContain('WIP limit exceeded');

		// Check badge styling for over limit
		const taskCountBadge = document.body.querySelector('[data-testid="task-count-badge"]');
		expect(taskCountBadge?.classList.contains('bg-red-500/20')).toBe(true);

		unmount(component);
	});

	test('renders task cards with correct information', () => {
		const component = mount(KanbanColumn, {
			target: document.body,
			props: { column: mockColumn }
		});

		// Check if both tasks are rendered
		const taskCards = document.body.querySelectorAll('[data-testid="task-card"]');
		expect(taskCards).toHaveLength(2);

		// Check first task details
		const firstTask = taskCards[0];
		expect(firstTask.innerHTML).toContain('Test Task 1');
		expect(firstTask.innerHTML).toContain('This is a test task description');
		expect(firstTask.getAttribute('data-task-id')).toBe('task-1');

		// Check priority indicator
		expect(firstTask.innerHTML).toContain('🔴'); // High priority

		// Check AI generated indicator
		const aiIndicator = firstTask.querySelector('.ai-pulse');
		expect(aiIndicator).toBeTruthy();

		// Check tags
		expect(firstTask.innerHTML).toContain('frontend');
		expect(firstTask.innerHTML).toContain('urgent');

		unmount(component);
	});

	test('displays empty state when no tasks', () => {
		const emptyColumn = {
			...mockColumn,
			tasks: []
		};

		const component = mount(KanbanColumn, {
			target: document.body,
			props: { column: emptyColumn }
		});

		// Check for empty state message
		expect(document.body.innerHTML).toContain('No tasks to do');
		expect(document.body.innerHTML).toContain('📝'); // Todo icon

		// Check task count is 0
		const taskCountBadge = document.body.querySelector('[data-testid="task-count-badge"]');
		expect(taskCountBadge?.textContent?.trim()).toContain('0');

		unmount(component);
	});

	test('applies correct status-specific styling for different columns', () => {
		const testCases = [
			{ id: 'todo', title: 'To Do', expectedClass: 'column-todo', expectedTextClass: 'text-neon' },
			{
				id: 'in-progress',
				title: 'In Progress',
				expectedClass: 'column-in-progress',
				expectedTextClass: 'text-neon-purple'
			},
			{
				id: 'testing',
				title: 'Testing',
				expectedClass: 'column-testing',
				expectedTextClass: 'text-neon-green'
			},
			{
				id: 'done',
				title: 'Done',
				expectedClass: 'column-done',
				expectedTextClass: 'text-neon-cyan'
			}
		] as const;

		testCases.forEach(({ id, title, expectedClass, expectedTextClass }) => {
			const testColumn = {
				id,
				title,
				color: 'neon-blue',
				tasks: []
			} as KanbanColumnType;

			const component = mount(KanbanColumn, {
				target: document.body,
				props: { column: testColumn }
			});

			// Flush reactive updates
			flushSync();

			// Check column styling
			const columnElement = document.body.querySelector(`[data-testid="column-${id}"]`);
			expect(columnElement?.classList.contains(expectedClass)).toBe(true);

			// Check header text color
			const headerElement = document.body.querySelector(`.${expectedTextClass}`);
			expect(headerElement).toBeTruthy();

			unmount(component);
		});
	});

	test('handles tasks without optional properties', () => {
		const minimalTask: TaskItem = {
			id: 'minimal-task',
			title: 'Minimal Task',
			description: '',
			status: 'todo' as TaskStatus,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const columnWithMinimalTask = {
			...mockColumn,
			tasks: [minimalTask]
		};

		const component = mount(KanbanColumn, {
			target: document.body,
			props: { column: columnWithMinimalTask }
		});

		// Should render without errors
		const taskCard = document.body.querySelector('[data-testid="task-card"]');
		expect(taskCard).toBeTruthy();
		expect(taskCard?.innerHTML).toContain('Minimal Task');

		// Should not show priority or AI indicators
		expect(taskCard?.innerHTML).not.toContain('🔴');
		expect(taskCard?.innerHTML).not.toContain('🟡');
		expect(taskCard?.innerHTML).not.toContain('🟢');
		expect(taskCard?.querySelector('.ai-pulse')).toBeFalsy();

		unmount(component);
	});

	test('has proper accessibility attributes', () => {
		const component = mount(KanbanColumn, {
			target: document.body,
			props: { column: mockColumn }
		});

		// Check main column accessibility
		const columnElement = document.body.querySelector('[data-testid="column-todo"]');
		expect(columnElement?.getAttribute('role')).toBe('region');
		expect(columnElement?.getAttribute('aria-label')).toContain('To Do column with 2 tasks');

		// Check tasks container accessibility
		const tasksContainer = document.body.querySelector('[data-testid="tasks-container"]');
		expect(tasksContainer?.getAttribute('role')).toBe('list');
		expect(tasksContainer?.getAttribute('aria-label')).toContain('Tasks in To Do');

		// Check individual task accessibility
		const taskCards = document.body.querySelectorAll('[data-testid="task-card"]');
		taskCards.forEach((card) => {
			expect(card.getAttribute('role')).toBe('listitem');
			expect(card.getAttribute('aria-label')).toContain('Task:');
		});

		// Check drop zone accessibility
		const dropZone = document.body.querySelector('[data-testid="drop-zone"]');
		expect(dropZone?.getAttribute('role')).toBe('region');
		expect(dropZone?.getAttribute('aria-label')).toContain('Drop zone for To Do');

		unmount(component);
	});

	test('truncates long task descriptions', () => {
		const longDescriptionTask: TaskItem = {
			id: 'long-task',
			title: 'Task with Long Description',
			description:
				'This is a very long description that should be truncated when displayed in the task card. It contains multiple sentences and should demonstrate the line-clamp functionality working correctly.',
			status: 'todo' as TaskStatus,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const columnWithLongTask = {
			...mockColumn,
			tasks: [longDescriptionTask]
		};

		const component = mount(KanbanColumn, {
			target: document.body,
			props: { column: columnWithLongTask }
		});

		// Check if description is present and has line-clamp class
		const descriptionElement = document.body.querySelector('.line-clamp-3');
		expect(descriptionElement).toBeTruthy();
		expect(descriptionElement?.textContent).toContain('This is a very long description');

		unmount(component);
	});

	test('displays correct empty state icons for different column types', () => {
		const testCases = [
			{ id: 'todo', expectedIcon: '📝', expectedText: 'No tasks to do' },
			{ id: 'in-progress', expectedIcon: '⚡', expectedText: 'No tasks in progress' },
			{ id: 'testing', expectedIcon: '🧪', expectedText: 'No tasks being tested' },
			{ id: 'done', expectedIcon: '✅', expectedText: 'No completed tasks' }
		] as const;

		testCases.forEach(({ id, expectedIcon, expectedText }) => {
			const emptyColumn = {
				id,
				title: id.charAt(0).toUpperCase() + id.slice(1),
				color: 'neon-blue',
				tasks: []
			} as KanbanColumnType;

			const component = mount(KanbanColumn, {
				target: document.body,
				props: { column: emptyColumn }
			});

			expect(document.body.innerHTML).toContain(expectedIcon);
			expect(document.body.innerHTML).toContain(expectedText);

			unmount(component);
		});
	});

	test('handles reactive updates to column data', () => {
		// Create a reactive column object
		const columnData = {
			...mockColumn,
			tasks: [...mockTasks]
		};

		const component = mount(KanbanColumn, {
			target: document.body,
			props: { column: columnData }
		});

		// Initial state
		expect(document.body.querySelectorAll('[data-testid="task-card"]')).toHaveLength(2);

		// Update column with new tasks by creating a new component instance
		unmount(component);

		const updatedColumn = {
			...columnData,
			tasks: [
				...mockTasks,
				{
					id: 'task-3',
					title: 'New Task',
					description: 'Newly added task',
					status: 'todo' as TaskStatus,
					createdAt: new Date(),
					updatedAt: new Date()
				}
			]
		};

		const updatedComponent = mount(KanbanColumn, {
			target: document.body,
			props: { column: updatedColumn }
		});

		flushSync();

		// Should show updated task count
		expect(document.body.querySelectorAll('[data-testid="task-card"]')).toHaveLength(3);
		expect(document.body.innerHTML).toContain('New Task');

		unmount(updatedComponent);
	});
});
