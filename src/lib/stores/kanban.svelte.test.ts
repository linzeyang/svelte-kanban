/**
 * Unit tests for KanbanStore using Svelte 5 runes
 * Tests all state management operations and derived values
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { kanbanStore } from './kanban.svelte.js';
import type { TaskStatus } from '$lib/types/kanban.js';

// Mock localStorage for testing
const mockLocalStorage = {
	store: new Map<string, string>(),
	getItem: vi.fn((key: string) => mockLocalStorage.store.get(key) || null),
	setItem: vi.fn((key: string, value: string) => {
		mockLocalStorage.store.set(key, value);
	}),
	removeItem: vi.fn((key: string) => {
		mockLocalStorage.store.delete(key);
	}),
	clear: vi.fn(() => {
		mockLocalStorage.store.clear();
	})
};

// Mock crypto.randomUUID for consistent testing
const mockUUID = vi.fn(() => 'test-uuid-123');

// Setup global mocks for browser environment
if (typeof globalThis !== 'undefined') {
	Object.defineProperty(globalThis, 'crypto', {
		value: { randomUUID: mockUUID },
		writable: true
	});

	Object.defineProperty(globalThis, 'localStorage', {
		value: mockLocalStorage,
		writable: true
	});
}

describe('KanbanStore', () => {
	beforeEach(() => {
		// Reset store state before each test
		kanbanStore.reset();
		mockLocalStorage.store.clear();
		vi.clearAllMocks();
		mockUUID.mockReturnValue('test-uuid-123');
	});

	describe('Initial State', () => {
		test('should have correct initial state', () => {
			expect(kanbanStore.allTasks).toEqual([]);
			expect(kanbanStore.loading).toBe(false);
			expect(kanbanStore.errorMessage).toBe(null);
			expect(kanbanStore.currentSelectedTask).toBe(null);
		});

		test('should have four columns with correct configuration', () => {
			const columns = kanbanStore.boardColumns;

			expect(columns).toHaveLength(4);
			expect(columns[0]).toEqual({
				id: 'todo',
				title: 'To Do',
				color: 'neon-blue',
				tasks: []
			});
			expect(columns[1]).toEqual({
				id: 'in-progress',
				title: 'In Progress',
				color: 'neon-purple',
				tasks: []
			});
			expect(columns[2]).toEqual({
				id: 'testing',
				title: 'Testing',
				color: 'neon-green',
				tasks: []
			});
			expect(columns[3]).toEqual({
				id: 'done',
				title: 'Done',
				color: 'neon-cyan',
				tasks: []
			});
		});

		test('should have correct initial derived values', () => {
			expect(kanbanStore.totalTasks).toBe(0);
			expect(kanbanStore.completedTasks).toBe(0);
			expect(kanbanStore.aiGeneratedTasks).toBe(0);
			expect(kanbanStore.completionRate).toBe(0);
			expect(kanbanStore.todoCount).toBe(0);
			expect(kanbanStore.inProgressCount).toBe(0);
			expect(kanbanStore.testingCount).toBe(0);
			expect(kanbanStore.doneCount).toBe(0);
		});
	});

	describe('Task Management', () => {
		test('should add a new task correctly', () => {
			const taskData = {
				title: 'Test Task',
				description: 'Test Description',
				status: 'todo' as TaskStatus
			};

			const addedTask = kanbanStore.addTask(taskData);

			expect(addedTask).toMatchObject({
				id: 'test-uuid-123',
				title: 'Test Task',
				description: 'Test Description',
				status: 'todo'
			});
			expect(addedTask.createdAt).toBeInstanceOf(Date);
			expect(addedTask.updatedAt).toBeInstanceOf(Date);
			expect(kanbanStore.totalTasks).toBe(1);
			expect(kanbanStore.todoCount).toBe(1);
		});

		test('should add multiple tasks correctly', () => {
			const tasksData = [
				{
					title: 'Task 1',
					description: 'Description 1',
					status: 'todo' as TaskStatus
				},
				{
					title: 'Task 2',
					description: 'Description 2',
					status: 'in-progress' as TaskStatus
				}
			];

			mockUUID
				.mockReturnValueOnce('uuid-1')
				.mockReturnValueOnce('uuid-2');

			const addedTasks = kanbanStore.addTasks(tasksData);

			expect(addedTasks).toHaveLength(2);
			expect(addedTasks[0].id).toBe('uuid-1');
			expect(addedTasks[1].id).toBe('uuid-2');
			expect(kanbanStore.totalTasks).toBe(2);
			expect(kanbanStore.todoCount).toBe(1);
			expect(kanbanStore.inProgressCount).toBe(1);
		});

		test('should update a task correctly', () => {
			// Add a task first
			const task = kanbanStore.addTask({
				title: 'Original Title',
				description: 'Original Description',
				status: 'todo'
			});

			const originalUpdatedAt = task.updatedAt;

			// Wait a bit to ensure different timestamp
			vi.useFakeTimers();
			vi.advanceTimersByTime(100);

			// Update the task
			const success = kanbanStore.updateTask(task.id, {
				title: 'Updated Title',
				priority: 'high'
			});

			expect(success).toBe(true);
			const updatedTask = kanbanStore.allTasks.find(t => t.id === task.id);
			expect(updatedTask?.title).toBe('Updated Title');
			expect(updatedTask?.priority).toBe('high');
			expect(updatedTask?.description).toBe('Original Description'); // Should remain unchanged
			expect(updatedTask?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

			vi.useRealTimers();
		});

		test('should handle updating non-existent task', () => {
			const success = kanbanStore.updateTask('non-existent-id', {
				title: 'Updated Title'
			});

			expect(success).toBe(false);
		});

		test('should delete a task correctly', () => {
			// Add a task first
			const task = kanbanStore.addTask({
				title: 'Task to Delete',
				description: 'Will be deleted',
				status: 'todo'
			});

			expect(kanbanStore.totalTasks).toBe(1);

			// Delete the task
			const success = kanbanStore.deleteTask(task.id);

			expect(success).toBe(true);
			expect(kanbanStore.totalTasks).toBe(0);
			expect(kanbanStore.allTasks).toEqual([]);
		});

		test('should handle deleting non-existent task', () => {
			const success = kanbanStore.deleteTask('non-existent-id');
			expect(success).toBe(false);
		});

		test('should clear selected task when deleting it', () => {
			// Add and select a task
			const task = kanbanStore.addTask({
				title: 'Selected Task',
				description: 'Will be selected and deleted',
				status: 'todo'
			});

			kanbanStore.selectTask(task);
			expect(kanbanStore.currentSelectedTask).toStrictEqual(task);

			// Delete the selected task
			kanbanStore.deleteTask(task.id);
			expect(kanbanStore.currentSelectedTask).toBe(null);
		});

		test('should move task between columns', () => {
			// Add a task in todo
			const task = kanbanStore.addTask({
				title: 'Task to Move',
				description: 'Will be moved',
				status: 'todo'
			});

			const originalUpdatedAt = task.updatedAt;
			expect(kanbanStore.todoCount).toBe(1);
			expect(kanbanStore.inProgressCount).toBe(0);

			// Wait a bit to ensure different timestamp
			vi.useFakeTimers();
			vi.advanceTimersByTime(100);

			// Move to in-progress
			const success = kanbanStore.moveTask(task.id, 'in-progress');

			expect(success).toBe(true);
			expect(kanbanStore.todoCount).toBe(0);
			expect(kanbanStore.inProgressCount).toBe(1);

			const movedTask = kanbanStore.allTasks.find(t => t.id === task.id);
			expect(movedTask?.status).toBe('in-progress');
			expect(movedTask?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

			vi.useRealTimers();
		});

		test('should handle moving non-existent task', () => {
			const success = kanbanStore.moveTask('non-existent-id', 'done');
			expect(success).toBe(false);
		});
	});

	describe('Derived State Calculations', () => {
		beforeEach(() => {
			// Add test tasks across different columns
			kanbanStore.addTasks([
				{
					title: 'Todo Task 1',
					description: 'Description',
					status: 'todo',
					aiGenerated: true
				},
				{
					title: 'Todo Task 2',
					description: 'Description',
					status: 'todo'
				},
				{
					title: 'In Progress Task',
					description: 'Description',
					status: 'in-progress',
					aiGenerated: true
				},
				{
					title: 'Testing Task',
					description: 'Description',
					status: 'testing'
				},
				{
					title: 'Done Task 1',
					description: 'Description',
					status: 'done'
				},
				{
					title: 'Done Task 2',
					description: 'Description',
					status: 'done',
					aiGenerated: true
				}
			]);
		});

		test('should calculate task counts correctly', () => {
			expect(kanbanStore.totalTasks).toBe(6);
			expect(kanbanStore.todoCount).toBe(2);
			expect(kanbanStore.inProgressCount).toBe(1);
			expect(kanbanStore.testingCount).toBe(1);
			expect(kanbanStore.doneCount).toBe(2);
			expect(kanbanStore.completedTasks).toBe(2);
			expect(kanbanStore.aiGeneratedTasks).toBe(3);
		});

		test('should calculate completion rate correctly', () => {
			expect(kanbanStore.completionRate).toBe(33); // 2/6 * 100 = 33.33, rounded to 33
		});

		test('should filter tasks by status correctly', () => {
			expect(kanbanStore.todoTasks).toHaveLength(2);
			expect(kanbanStore.inProgressTasks).toHaveLength(1);
			expect(kanbanStore.testingTasks).toHaveLength(1);
			expect(kanbanStore.doneTasks).toHaveLength(2);

			expect(kanbanStore.todoTasks.every(task => task.status === 'todo')).toBe(true);
			expect(kanbanStore.inProgressTasks.every(task => task.status === 'in-progress')).toBe(true);
			expect(kanbanStore.testingTasks.every(task => task.status === 'testing')).toBe(true);
			expect(kanbanStore.doneTasks.every(task => task.status === 'done')).toBe(true);
		});

		test('should update derived values when tasks change', () => {
			// Move a task from todo to done
			const todoTask = kanbanStore.todoTasks[0];
			kanbanStore.moveTask(todoTask.id, 'done');

			expect(kanbanStore.todoCount).toBe(1);
			expect(kanbanStore.doneCount).toBe(3);
			expect(kanbanStore.completedTasks).toBe(3);
			expect(kanbanStore.completionRate).toBe(50); // 3/6 * 100 = 50
		});
	});

	describe('Board Data Structure', () => {
		test('should generate correct board data structure', () => {
			// Add some test tasks
			kanbanStore.addTasks([
				{
					title: 'Todo Task',
					description: 'Description',
					status: 'todo'
				},
				{
					title: 'Done Task',
					description: 'Description',
					status: 'done'
				}
			]);

			const boardData = kanbanStore.boardData;

			expect(boardData.id).toBe('main-board');
			expect(boardData.title).toBe('AI-Native Kanban Board');
			expect(boardData.columns).toHaveLength(4);
			expect(boardData.tasks).toHaveLength(2);

			// Check that columns have correct tasks
			const todoColumn = boardData.columns.find(col => col.id === 'todo');
			const doneColumn = boardData.columns.find(col => col.id === 'done');

			expect(todoColumn?.tasks).toHaveLength(1);
			expect(doneColumn?.tasks).toHaveLength(1);
			expect(todoColumn?.tasks[0].title).toBe('Todo Task');
			expect(doneColumn?.tasks[0].title).toBe('Done Task');
		});
	});

	describe('Column Configuration', () => {
		test('should get column by status', () => {
			const todoColumn = kanbanStore.getColumnByStatus('todo');
			expect(todoColumn).toEqual({
				id: 'todo',
				title: 'To Do',
				color: 'neon-blue',
				tasks: []
			});
		});

		test('should update column configuration', () => {
			const success = kanbanStore.updateColumnConfig('todo', {
				title: 'Updated Todo',
				color: 'custom-blue'
			});

			expect(success).toBe(true);
			const updatedColumn = kanbanStore.getColumnByStatus('todo');
			expect(updatedColumn?.title).toBe('Updated Todo');
			expect(updatedColumn?.color).toBe('custom-blue');
			expect(updatedColumn?.id).toBe('todo'); // Should remain unchanged
		});

		test('should handle updating non-existent column', () => {
			const success = kanbanStore.updateColumnConfig('invalid' as TaskStatus, {
				title: 'Invalid'
			});

			expect(success).toBe(false);
		});
	});

	describe('Bulk Operations', () => {
		beforeEach(() => {
			kanbanStore.addTasks([
				{
					title: 'Todo Task',
					description: 'Description',
					status: 'todo'
				},
				{
					title: 'Done Task 1',
					description: 'Description',
					status: 'done'
				},
				{
					title: 'Done Task 2',
					description: 'Description',
					status: 'done'
				}
			]);
		});

		test('should clear completed tasks', () => {
			expect(kanbanStore.totalTasks).toBe(3);
			expect(kanbanStore.doneCount).toBe(2);

			const clearedCount = kanbanStore.clearCompletedTasks();

			expect(clearedCount).toBe(2);
			expect(kanbanStore.totalTasks).toBe(1);
			expect(kanbanStore.doneCount).toBe(0);
			expect(kanbanStore.todoCount).toBe(1);
		});

		test('should clear all tasks', () => {
			expect(kanbanStore.totalTasks).toBe(3);

			const clearedCount = kanbanStore.clearAllTasks();

			expect(clearedCount).toBe(3);
			expect(kanbanStore.totalTasks).toBe(0);
			expect(kanbanStore.currentSelectedTask).toBe(null);
		});
	});

	describe('Task Selection', () => {
		test('should select and deselect tasks', () => {
			const task = kanbanStore.addTask({
				title: 'Selectable Task',
				description: 'Description',
				status: 'todo'
			});

			// Select task
			kanbanStore.selectTask(task);
			expect(kanbanStore.currentSelectedTask).toStrictEqual(task);

			// Deselect task
			kanbanStore.selectTask(null);
			expect(kanbanStore.currentSelectedTask).toBe(null);
		});
	});

	describe('Loading and Error State', () => {
		test('should manage loading state', () => {
			expect(kanbanStore.loading).toBe(false);

			kanbanStore.setLoading(true);
			expect(kanbanStore.loading).toBe(true);

			kanbanStore.setLoading(false);
			expect(kanbanStore.loading).toBe(false);
		});

		test('should manage error state', () => {
			expect(kanbanStore.errorMessage).toBe(null);

			kanbanStore.setError('Test error');
			expect(kanbanStore.errorMessage).toBe('Test error');

			kanbanStore.clearError();
			expect(kanbanStore.errorMessage).toBe(null);
		});
	});

	describe('Data Persistence', () => {
		test('should save data to localStorage', () => {
			kanbanStore.addTask({
				title: 'Persistent Task',
				description: 'Should be saved',
				status: 'todo'
			});

			expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
				'kanban_board_data',
				expect.stringContaining('Persistent Task')
			);
		});

		test('should load data from localStorage', () => {
			// Prepare test data in localStorage
			const testData = {
				version: 1,
				savedAt: new Date().toISOString(),
				tasks: [
					{
						id: 'loaded-task-1',
						title: 'Loaded Task',
						description: 'From storage',
						status: 'todo',
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString()
					}
				]
			};

			mockLocalStorage.store.set('kanban_board_data', JSON.stringify(testData));

			// Load data
			kanbanStore.loadFromStorage();

			expect(kanbanStore.totalTasks).toBe(1);
			expect(kanbanStore.allTasks[0].title).toBe('Loaded Task');
			expect(kanbanStore.allTasks[0].createdAt).toBeInstanceOf(Date);
		});

		test('should handle localStorage errors gracefully', () => {
			mockLocalStorage.setItem.mockImplementation(() => {
				throw new Error('Storage quota exceeded');
			});

			kanbanStore.addTask({
				title: 'Task causing error',
				description: 'Should handle error',
				status: 'todo'
			});

			expect(kanbanStore.errorMessage).toBe('Failed to save data locally');
		});
	});

	describe('Search and Filtering', () => {
		beforeEach(() => {
			kanbanStore.addTasks([
				{
					title: 'Frontend Task',
					description: 'Build React component',
					status: 'todo',
					priority: 'high',
					tags: ['frontend', 'react']
				},
				{
					title: 'Backend Task',
					description: 'Create API endpoint',
					status: 'in-progress',
					priority: 'medium',
					aiGenerated: true
				},
				{
					title: 'Testing Task',
					description: 'Write unit tests',
					status: 'testing',
					priority: 'low'
				}
			]);
		});

		test('should filter tasks by status', () => {
			const todoTasks = kanbanStore.getTasksByStatus('todo');
			expect(todoTasks).toHaveLength(1);
			expect(todoTasks[0].title).toBe('Frontend Task');
		});

		test('should filter tasks by priority', () => {
			const highPriorityTasks = kanbanStore.getTasksByPriority('high');
			expect(highPriorityTasks).toHaveLength(1);
			expect(highPriorityTasks[0].title).toBe('Frontend Task');
		});

		test('should filter AI generated tasks', () => {
			const aiTasks = kanbanStore.getAIGeneratedTasks();
			expect(aiTasks).toHaveLength(1);
			expect(aiTasks[0].title).toBe('Backend Task');
		});

		test('should search tasks by title and description', () => {
			const searchResults = kanbanStore.searchTasks('react');
			expect(searchResults).toHaveLength(1);
			expect(searchResults[0].title).toBe('Frontend Task');

			const apiResults = kanbanStore.searchTasks('API');
			expect(apiResults).toHaveLength(1);
			expect(apiResults[0].title).toBe('Backend Task');
		});

		test('should search tasks by tags', () => {
			const tagResults = kanbanStore.searchTasks('frontend');
			expect(tagResults).toHaveLength(1);
			expect(tagResults[0].title).toBe('Frontend Task');
		});
	});

	describe('Export and Import', () => {
		test('should export data correctly', () => {
			kanbanStore.addTask({
				title: 'Export Task',
				description: 'For export test',
				status: 'todo'
			});

			const exportedData = kanbanStore.exportData();

			expect(exportedData.version).toBe(1);
			expect(exportedData.exportedAt).toBeInstanceOf(Date);
			expect(exportedData.board.tasks).toHaveLength(1);
			expect(exportedData.statistics.totalTasks).toBe(1);
		});

		test('should import data correctly', () => {
			const importData = {
				version: 1,
				board: {
					tasks: [
						{
							id: 'imported-task',
							title: 'Imported Task',
							description: 'From import',
							status: 'todo',
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString()
						}
					]
				}
			};

			const success = kanbanStore.importData(importData);

			expect(success).toBe(true);
			expect(kanbanStore.totalTasks).toBe(1);
			expect(kanbanStore.allTasks[0].title).toBe('Imported Task');
		});

		test('should handle invalid import data', () => {
			const invalidData = { version: 2, invalid: true };

			const success = kanbanStore.importData(invalidData);

			expect(success).toBe(false);
			expect(kanbanStore.errorMessage).toBe('Failed to import data');
		});
	});

	describe('State Reset', () => {
		test('should reset all state correctly', () => {
			// Temporarily disable localStorage errors for this test
			mockLocalStorage.setItem.mockImplementation((key, value) => {
				mockLocalStorage.store.set(key, value);
			});

			// Add some data first
			kanbanStore.addTask({
				title: 'Task to Reset',
				description: 'Will be cleared',
				status: 'todo'
			});
			kanbanStore.setLoading(true);
			kanbanStore.setError('Test error');
			kanbanStore.selectTask(kanbanStore.allTasks[0]);

			// Reset
			kanbanStore.reset();

			expect(kanbanStore.totalTasks).toBe(0);
			expect(kanbanStore.loading).toBe(false);
			expect(kanbanStore.errorMessage).toBe(null);
			expect(kanbanStore.currentSelectedTask).toBe(null);
		});
	});
});
