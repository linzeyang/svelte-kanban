// @vitest-environment jsdom
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import KanbanBoard from './KanbanBoard.svelte';
import { kanbanStore } from '$lib/stores/kanban.svelte.js';
import type { TaskItem } from '$lib/types/kanban.js';

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('KanbanBoard', () => {
	let mockTasks: TaskItem[];

	beforeEach(() => {
		// Clean up DOM
		document.body.innerHTML = '';

		// Reset the store before each test
		kanbanStore.reset();
		vi.clearAllMocks();

		// Create mock tasks for testing
		mockTasks = [
			{
				id: 'task-1',
				title: 'Todo Task',
				description: 'A task in todo',
				status: 'todo',
				priority: 'high',
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-01'),
				aiGenerated: true
			},
			{
				id: 'task-2',
				title: 'In Progress Task',
				description: 'A task in progress',
				status: 'in-progress',
				priority: 'medium',
				createdAt: new Date('2024-01-02'),
				updatedAt: new Date('2024-01-02'),
				aiGenerated: false
			},
			{
				id: 'task-3',
				title: 'Testing Task',
				description: 'A task being tested',
				status: 'testing',
				priority: 'low',
				createdAt: new Date('2024-01-03'),
				updatedAt: new Date('2024-01-03'),
				aiGenerated: true
			},
			{
				id: 'task-4',
				title: 'Done Task',
				description: 'A completed task',
				status: 'done',
				priority: 'medium',
				createdAt: new Date('2024-01-04'),
				updatedAt: new Date('2024-01-04'),
				aiGenerated: false
			}
		];
	});

	test('renders board with correct title and structure', () => {
		const component = mount(KanbanBoard, {
			target: document.body
		});

		// Check if main board element is rendered
		const boardElement = document.body.querySelector('[data-testid="kanban-board"]');
		expect(boardElement).toBeTruthy();
		expect(boardElement?.getAttribute('role')).toBe('main');

		// Check if board title is rendered
		expect(document.body.innerHTML).toContain('AI-Native Kanban Board');

		// Check if columns container is rendered
		const columnsContainer = document.body.querySelector('[data-testid="kanban-columns"]');
		expect(columnsContainer).toBeTruthy();
		expect(columnsContainer?.getAttribute('role')).toBe('region');

		unmount(component);
	});

	test('renders all four columns', () => {
		const component = mount(KanbanBoard, {
			target: document.body
		});

		// Check if all four columns are rendered
		const columnWrappers = document.body.querySelectorAll('[data-testid^="column-wrapper-"]');
		expect(columnWrappers).toHaveLength(4);

		// Check specific columns
		expect(document.body.querySelector('[data-testid="column-wrapper-todo"]')).toBeTruthy();
		expect(document.body.querySelector('[data-testid="column-wrapper-in-progress"]')).toBeTruthy();
		expect(document.body.querySelector('[data-testid="column-wrapper-testing"]')).toBeTruthy();
		expect(document.body.querySelector('[data-testid="column-wrapper-done"]')).toBeTruthy();

		unmount(component);
	});

	test('displays correct statistics with no tasks', () => {
		const component = mount(KanbanBoard, {
			target: document.body
		});

		// Check initial statistics
		expect(document.body.innerHTML).toContain('📋 0 tasks');
		expect(document.body.innerHTML).toContain('📊 0% complete');

		// Check footer statistics
		const footerStats = document.body.querySelectorAll('footer .text-lg');
		expect(footerStats[0]?.textContent).toBe('0'); // Todo count
		expect(footerStats[1]?.textContent).toBe('0'); // In Progress count
		expect(footerStats[2]?.textContent).toBe('0'); // Testing count
		expect(footerStats[3]?.textContent).toBe('0'); // Done count

		unmount(component);
	});

	test('displays empty board state when no tasks', () => {
		const component = mount(KanbanBoard, {
			target: document.body
		});

		// Check for empty state
		expect(document.body.innerHTML).toContain('Your board is empty');
		expect(document.body.innerHTML).toContain('📋'); // Empty board icon
		expect(document.body.innerHTML).toContain('Add some requirements to get started');

		unmount(component);
	});

	test('displays correct statistics with tasks', () => {
		// Add tasks to the store
		mockTasks.forEach((task) => {
			kanbanStore.addTask(task);
		});

		const component = mount(KanbanBoard, {
			target: document.body
		});

		flushSync();

		// Check header statistics
		expect(document.body.innerHTML).toContain('📋 4 tasks');
		expect(document.body.innerHTML).toContain('📊 25% complete'); // 1 done out of 4 total
		expect(document.body.innerHTML).toContain('🤖 2 AI tasks'); // 2 AI generated tasks

		// Check footer statistics
		const footerStats = document.body.querySelectorAll('footer .text-lg');
		expect(footerStats[0]?.textContent).toBe('1'); // Todo count
		expect(footerStats[1]?.textContent).toBe('1'); // In Progress count
		expect(footerStats[2]?.textContent).toBe('1'); // Testing count
		expect(footerStats[3]?.textContent).toBe('1'); // Done count

		unmount(component);
	});

	test('displays progress bar with correct completion percentage', () => {
		// Add tasks to the store
		mockTasks.forEach((task) => {
			kanbanStore.addTask(task);
		});

		const component = mount(KanbanBoard, {
			target: document.body
		});

		flushSync();

		// Check progress bar
		const progressBar = document.body.querySelector('[role="progressbar"]');
		expect(progressBar).toBeTruthy();
		expect(progressBar?.getAttribute('aria-valuenow')).toBe('25');
		expect(progressBar?.getAttribute('aria-valuemin')).toBe('0');
		expect(progressBar?.getAttribute('aria-valuemax')).toBe('100');

		// Check progress bar width
		const progressBarStyle = progressBar?.getAttribute('style');
		expect(progressBarStyle).toContain('width: 25%');

		unmount(component);
	});

	test('handles loading state', () => {
		// Set loading state
		kanbanStore.setLoading(true);

		const component = mount(KanbanBoard, {
			target: document.body
		});

		// Check loading state
		expect(document.body.innerHTML).toContain('Loading your board...');
		expect(document.body.querySelector('.loading-spinner')).toBeTruthy();

		// Check accessibility
		const loadingElement = document.body.querySelector('[role="status"]');
		expect(loadingElement).toBeTruthy();
		expect(loadingElement?.getAttribute('aria-live')).toBe('polite');

		unmount(component);
	});

	test('handles error state', () => {
		// Set error state
		kanbanStore.setError('Failed to load board data');

		const component = mount(KanbanBoard, {
			target: document.body
		});

		// Check error state
		expect(document.body.innerHTML).toContain('Error Loading Board');
		expect(document.body.innerHTML).toContain('Failed to load board data');
		expect(document.body.innerHTML).toContain('⚠️');

		// Check error alert accessibility
		const errorElement = document.body.querySelector('[role="alert"]');
		expect(errorElement).toBeTruthy();
		expect(errorElement?.getAttribute('aria-live')).toBe('polite');

		// Check try again button
		const tryAgainButton = document.body.querySelector('button');
		expect(tryAgainButton?.textContent).toContain('Try Again');

		unmount(component);
	});

	test('try again button clears error and reloads', () => {
		// Set error state
		kanbanStore.setError('Test error');

		const component = mount(KanbanBoard, {
			target: document.body
		});

		// Mock loadFromStorage method
		const loadFromStorageSpy = vi.spyOn(kanbanStore, 'loadFromStorage');

		// Click try again button
		const tryAgainButton = document.body.querySelector('button');
		(tryAgainButton as HTMLButtonElement)?.click();

		flushSync();

		// Check that error is cleared and loadFromStorage is called
		expect(kanbanStore.errorMessage).toBeNull();
		expect(loadFromStorageSpy).toHaveBeenCalled();

		unmount(component);
	});

	test('export button triggers data export', () => {
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		const component = mount(KanbanBoard, {
			target: document.body
		});

		// Find and click export button
		const exportButton = document.body.querySelector('button[title="Export board data"]');
		expect(exportButton).toBeTruthy();

		(exportButton as HTMLButtonElement)?.click();

		// Check that export was called
		expect(consoleSpy).toHaveBeenCalledWith('Board data:', expect.any(Object));

		consoleSpy.mockRestore();
		unmount(component);
	});

	test('clear completed button works correctly', () => {
		// Add tasks including completed ones
		mockTasks.forEach((task) => {
			kanbanStore.addTask(task);
		});

		const component = mount(KanbanBoard, {
			target: document.body
		});

		flushSync();

		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		// Find and click clear completed button
		const clearButton = document.body.querySelector('button[title="Clear completed tasks"]');
		expect(clearButton).toBeTruthy();
		expect(clearButton?.textContent).toContain('Clear Done (1)');

		(clearButton as HTMLButtonElement)?.click();

		flushSync();

		// Check that completed tasks were cleared
		expect(consoleSpy).toHaveBeenCalledWith('Cleared 1 completed tasks');
		expect(kanbanStore.doneCount).toBe(0);

		consoleSpy.mockRestore();
		unmount(component);
	});

	test('clear completed button is disabled when no completed tasks', () => {
		// Add only non-completed tasks
		const incompleteTasks = mockTasks.filter((task) => task.status !== 'done');
		incompleteTasks.forEach((task) => {
			kanbanStore.addTask(task);
		});

		const component = mount(KanbanBoard, {
			target: document.body
		});

		flushSync();

		// Find clear completed button
		const clearButton = document.body.querySelector('button[title="Clear completed tasks"]');
		expect(clearButton).toBeTruthy();
		expect(clearButton?.hasAttribute('disabled')).toBe(true);
		expect(clearButton?.textContent).toContain('Clear Done (0)');

		unmount(component);
	});

	test('loads data from storage on initialization', () => {
		const loadFromStorageSpy = vi.spyOn(kanbanStore, 'loadFromStorage');

		const component = mount(KanbanBoard, {
			target: document.body
		});

		// Flush all effects to ensure they run synchronously
		flushSync();

		// Check that loadFromStorage was called during initialization
		expect(loadFromStorageSpy).toHaveBeenCalled();

		unmount(component);
	});

	test('has proper accessibility attributes', () => {
		const component = mount(KanbanBoard, {
			target: document.body
		});

		// Check main board accessibility
		const boardElement = document.body.querySelector('[data-testid="kanban-board"]');
		expect(boardElement?.getAttribute('role')).toBe('main');
		expect(boardElement?.getAttribute('aria-label')).toContain(
			'Kanban board with 0 tasks, 0% complete'
		);

		// Check columns region accessibility
		const columnsRegion = document.body.querySelector('[data-testid="kanban-columns"]');
		expect(columnsRegion?.getAttribute('role')).toBe('region');
		expect(columnsRegion?.getAttribute('aria-label')).toBe('Kanban columns');

		// Check footer accessibility
		const footer = document.body.querySelector('footer');
		expect(footer?.getAttribute('aria-label')).toBe('Board statistics');

		unmount(component);
	});

	test('applies staggered animation delays to columns', () => {
		const component = mount(KanbanBoard, {
			target: document.body
		});

		// Check that each column wrapper has the correct stagger delay via CSS custom property
		const columnWrappers = document.body.querySelectorAll('[data-testid^="column-wrapper-"]');

		expect((columnWrappers[0] as HTMLElement)?.style.getPropertyValue('--animation-delay')).toBe(
			'0ms'
		);
		expect((columnWrappers[1] as HTMLElement)?.style.getPropertyValue('--animation-delay')).toBe(
			'100ms'
		);
		expect((columnWrappers[2] as HTMLElement)?.style.getPropertyValue('--animation-delay')).toBe(
			'200ms'
		);
		expect((columnWrappers[3] as HTMLElement)?.style.getPropertyValue('--animation-delay')).toBe(
			'300ms'
		);

		unmount(component);
	});

	test('updates reactively when store data changes', () => {
		const component = mount(KanbanBoard, {
			target: document.body
		});

		// Initial state - empty board
		expect(document.body.innerHTML).toContain('📋 0 tasks');

		// Add a task
		kanbanStore.addTask({
			title: 'New Task',
			description: 'A new task',
			status: 'todo'
		});

		flushSync();

		// Should update to show the new task
		expect(document.body.innerHTML).toContain('📋 1 tasks');
		expect(document.body.innerHTML).not.toContain('Your board is empty');

		// Add a completed task
		kanbanStore.addTask({
			title: 'Completed Task',
			description: 'A completed task',
			status: 'done'
		});

		flushSync();

		// Should update statistics
		expect(document.body.innerHTML).toContain('📋 2 tasks');
		expect(document.body.innerHTML).toContain('📊 50% complete');

		unmount(component);
	});

	test('handles columns with different task distributions', () => {
		// Add tasks with uneven distribution
		const unevenTasks = [
			...Array(3)
				.fill(null)
				.map((_, i) => ({
					id: `todo-${i}`,
					title: `Todo Task ${i}`,
					description: 'Todo task',
					status: 'todo' as const,
					createdAt: new Date(),
					updatedAt: new Date()
				})),
			{
				id: 'done-1',
				title: 'Done Task',
				description: 'Completed task',
				status: 'done' as const,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];

		unevenTasks.forEach((task) => {
			kanbanStore.addTask(task);
		});

		const component = mount(KanbanBoard, {
			target: document.body
		});

		flushSync();

		// Check footer statistics reflect uneven distribution
		const footerStats = document.body.querySelectorAll('footer .text-lg');
		expect(footerStats[0]?.textContent).toBe('3'); // Todo count
		expect(footerStats[1]?.textContent).toBe('0'); // In Progress count
		expect(footerStats[2]?.textContent).toBe('0'); // Testing count
		expect(footerStats[3]?.textContent).toBe('1'); // Done count

		// Check completion rate
		expect(document.body.innerHTML).toContain('📊 25% complete'); // 1 done out of 4 total

		unmount(component);
	});
});
