/**
 * Kanban state management using Svelte 5 runes
 * Provides reactive state for kanban board, columns, and task management
 */

import type { TaskItem, TaskStatus, KanbanColumn, KanbanBoard } from '$lib/types/kanban.js';

// Type definition for import data structure
type ImportData = {
	version: number;
	exportedAt: string | Date;
	board: {
		tasks: (TaskItem & { createdAt: string; updatedAt: string })[];
		[key: string]: unknown;
	};
	statistics?: {
		totalTasks: number;
		completedTasks: number;
		aiGeneratedTasks: number;
		completionRate: number;
	};
	[key: string]: unknown;
};

class KanbanStore {
	// Core reactive state using Svelte 5 $state rune
	private tasks = $state<TaskItem[]>([]);
	private isLoading = $state(false);
	private error = $state<string | null>(null);
	private selectedTask = $state<TaskItem | null>(null);

	// Four-column structure with status-specific styling configuration
	private columns = $state<KanbanColumn[]>([
		{
			id: 'todo',
			title: 'To Do',
			color: 'neon-blue',
			tasks: []
		},
		{
			id: 'in-progress',
			title: 'In Progress',
			color: 'neon-purple',
			tasks: []
		},
		{
			id: 'testing',
			title: 'Testing',
			color: 'neon-green',
			tasks: []
		},
		{
			id: 'done',
			title: 'Done',
			color: 'neon-cyan',
			tasks: []
		}
	]);

	// Derived state using $derived rune for computed values
	get allTasks() {
		return this.tasks;
	}

	get loading() {
		return this.isLoading;
	}

	get errorMessage() {
		return this.error;
	}

	get currentSelectedTask() {
		return this.selectedTask;
	}

	get boardColumns() {
		return this.columns;
	}

	// Derived computed properties using $derived rune
	todoTasks = $derived(this.tasks.filter((task) => task.status === 'todo'));
	inProgressTasks = $derived(this.tasks.filter((task) => task.status === 'in-progress'));
	testingTasks = $derived(this.tasks.filter((task) => task.status === 'testing'));
	doneTasks = $derived(this.tasks.filter((task) => task.status === 'done'));

	// Board statistics
	totalTasks = $derived(this.tasks.length);
	completedTasks = $derived(this.doneTasks.length);
	aiGeneratedTasks = $derived(this.tasks.filter((task) => task.aiGenerated).length);
	completionRate = $derived(
		this.totalTasks > 0 ? Math.round((this.completedTasks / this.totalTasks) * 100) : 0
	);

	// Column-specific task counts
	todoCount = $derived(this.todoTasks.length);
	inProgressCount = $derived(this.inProgressTasks.length);
	testingCount = $derived(this.testingTasks.length);
	doneCount = $derived(this.doneTasks.length);

	// Board data structure
	boardData = $derived<KanbanBoard>({
		id: 'main-board',
		title: 'Task Board',
		columns: this.columns.map((column) => ({
			...column,
			tasks: this.tasks.filter((task) => task.status === column.id)
		})),
		tasks: this.tasks
	});

	// Task management methods for future integration
	addTask(task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>) {
		const newTask: TaskItem = {
			...task,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date()
		};

		this.tasks.push(newTask);
		this.saveToStorage();
		return newTask;
	}

	addTasks(tasks: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>[]) {
		const newTasks = tasks.map((task) => ({
			...task,
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date()
		}));

		this.tasks.push(...newTasks);
		this.saveToStorage();
		return newTasks;
	}

	updateTask(taskId: string, updates: Partial<TaskItem>) {
		const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
		if (taskIndex === -1) {
			console.warn(`Task with id '${taskId}' not found`);
			return false;
		}

		this.tasks[taskIndex] = {
			...this.tasks[taskIndex],
			...updates,
			updatedAt: new Date()
		};

		this.saveToStorage();
		return true;
	}

	deleteTask(taskId: string) {
		const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
		if (taskIndex === -1) {
			console.warn(`Task with id '${taskId}' not found`);
			return false;
		}

		// Clear selected task if it's being deleted
		if (this.selectedTask?.id === taskId) {
			this.selectedTask = null;
		}

		this.tasks.splice(taskIndex, 1);
		this.saveToStorage();
		return true;
	}

	moveTask(taskId: string, newStatus: TaskStatus) {
		const task = this.tasks.find((task) => task.id === taskId);
		if (!task) {
			console.warn(`Task with id '${taskId}' not found`);
			return false;
		}

		task.status = newStatus;
		task.updatedAt = new Date();
		this.saveToStorage();
		return true;
	}

	// Task selection for detailed view
	selectTask(task: TaskItem | null) {
		this.selectedTask = task;
	}

	// Loading and error state management
	setLoading(loading: boolean) {
		this.isLoading = loading;
	}

	setError(error: string | null) {
		this.error = error;
	}

	clearError() {
		this.error = null;
	}

	// Column configuration methods
	getColumnByStatus(status: TaskStatus): KanbanColumn | undefined {
		return this.columns.find((column) => column.id === status);
	}

	updateColumnConfig(status: TaskStatus, updates: Partial<Omit<KanbanColumn, 'id' | 'tasks'>>) {
		const column = this.columns.find((col) => col.id === status);
		if (!column) {
			console.warn(`Column with status '${status}' not found`);
			return false;
		}

		Object.assign(column, updates);
		return true;
	}

	// Bulk operations
	clearCompletedTasks() {
		const completedCount = this.doneTasks.length;
		this.tasks = this.tasks.filter((task) => task.status !== 'done');
		this.saveToStorage();
		return completedCount;
	}

	clearAllTasks() {
		const taskCount = this.tasks.length;
		this.tasks = [];
		this.selectedTask = null;
		this.saveToStorage();
		return taskCount;
	}

	// Data persistence methods
	private saveToStorage() {
		if (typeof localStorage !== 'undefined') {
			try {
				const dataToSave = {
					tasks: this.tasks,
					version: 1,
					savedAt: new Date().toISOString()
				};
				localStorage.setItem('kanban_board_data', JSON.stringify(dataToSave));
			} catch (error) {
				console.error('Failed to save kanban data to localStorage:', error);
				this.setError('Failed to save data locally');
			}
		}
	}

	loadFromStorage() {
		if (typeof localStorage !== 'undefined') {
			try {
				const stored = localStorage.getItem('kanban_board_data');
				if (stored) {
					const data = JSON.parse(stored);

					// Validate data structure and version
					if (data.version === 1 && Array.isArray(data.tasks)) {
						// Convert date strings back to Date objects
						this.tasks = data.tasks.map((task: TaskItem & { createdAt: string; updatedAt: string }) => ({
							...task,
							createdAt: new Date(task.createdAt),
							updatedAt: new Date(task.updatedAt)
						}));
					}
				}
			} catch (error) {
				console.error('Failed to load kanban data from localStorage:', error);
				this.setError('Failed to load saved data');
			}
		}
	}

	// Export/import functionality
	exportData() {
		return {
			version: 1,
			exportedAt: new Date(),
			board: this.boardData,
			statistics: {
				totalTasks: this.totalTasks,
				completedTasks: this.completedTasks,
				aiGeneratedTasks: this.aiGeneratedTasks,
				completionRate: this.completionRate
			}
		};
	}

	importData(data: ImportData) {
		try {
			if (data.version === 1 && data.board?.tasks) {
				// Clear existing data
				this.tasks = [];
				this.selectedTask = null;
				this.clearError();

				// Import tasks with proper date conversion
				const importedTasks = data.board.tasks.map((task: TaskItem & { createdAt: string; updatedAt: string }) => ({
					...task,
					createdAt: new Date(task.createdAt),
					updatedAt: new Date(task.updatedAt)
				}));

				this.tasks = importedTasks;
				this.saveToStorage();
				return true;
			} else {
				throw new Error('Invalid data format or version');
			}
		} catch (error) {
			console.error('Failed to import kanban data:', error);
			this.setError('Failed to import data');
			return false;
		}
	}

	// State reset and initialization
	reset() {
		this.tasks = [];
		this.isLoading = false;
		this.error = null;
		this.selectedTask = null;
		this.saveToStorage();
	}

	// Debug and development helpers
	getState() {
		return {
			tasks: [...this.tasks],
			isLoading: this.isLoading,
			error: this.error,
			selectedTask: this.selectedTask,
			columns: [...this.columns],
			statistics: {
				totalTasks: this.totalTasks,
				completedTasks: this.completedTasks,
				aiGeneratedTasks: this.aiGeneratedTasks,
				completionRate: this.completionRate
			}
		};
	}

	// Task filtering and search methods for future features
	getTasksByStatus(status: TaskStatus): TaskItem[] {
		return this.tasks.filter((task) => task.status === status);
	}

	getTasksByPriority(priority: 'low' | 'medium' | 'high'): TaskItem[] {
		return this.tasks.filter((task) => task.priority === priority);
	}

	getAIGeneratedTasks(): TaskItem[] {
		return this.tasks.filter((task) => task.aiGenerated === true);
	}

	searchTasks(query: string): TaskItem[] {
		const lowercaseQuery = query.toLowerCase();
		return this.tasks.filter(
			(task) =>
				task.title.toLowerCase().includes(lowercaseQuery) ||
				task.description.toLowerCase().includes(lowercaseQuery) ||
				task.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
		);
	}
}

// Create and export the singleton store instance
export const kanbanStore = new KanbanStore();
