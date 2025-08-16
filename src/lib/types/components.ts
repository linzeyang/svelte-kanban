/**
 * Component-specific type definitions and props interfaces
 */

import type { Snippet } from 'svelte';
import type { TaskItem, TaskStatus, KanbanColumn } from './kanban.js';
import type { NavigationItem } from './navigation.js';

// Component Props Interfaces

export interface AppShellProps {
	/** Currently active navigation item */
	activeNavItem: string;
	/** Whether the sidebar is collapsed */
	sidebarCollapsed: boolean;
	/** Child content to render in main area */
	children?: Snippet;
}

export interface NavigationSidebarProps {
	/** Array of navigation items to display */
	navigationItems: NavigationItem[];
	/** Whether the sidebar is collapsed */
	collapsed: boolean;
	/** Callback when navigation item is selected */
	onItemSelect?: (itemId: string) => void;
	/** Callback when sidebar toggle is requested */
	onToggle?: () => void;
}

export interface NavigationItemProps {
	/** Navigation item data */
	item: NavigationItem;
	/** Whether this item is currently active */
	isActive: boolean;
	/** Whether the parent sidebar is collapsed */
	collapsed: boolean;
	/** Click handler for the item */
	onClick?: (itemId: string) => void;
}

export interface KanbanBoardProps {
	/** Array of columns to display */
	columns: KanbanColumn[];
	/** Whether the board is in loading state */
	isLoading?: boolean;
	/** Error message to display */
	error?: string | null;
	/** Callback when task is moved between columns */
	onTaskMove?: (taskId: string, newStatus: TaskStatus) => void;
	/** Callback when task is updated */
	onTaskUpdate?: (taskId: string, updates: Partial<TaskItem>) => void;
	/** Callback when task is deleted */
	onTaskDelete?: (taskId: string) => void;
}

export interface KanbanColumnProps {
	/** Column data including tasks */
	column: KanbanColumn;
	/** Tasks to display in this column */
	tasks: TaskItem[];
	/** Whether drag and drop is enabled */
	dragEnabled?: boolean;
	/** Callback when task is dropped in this column */
	onTaskDrop?: (taskId: string) => void;
	/** Callback when task is updated */
	onTaskUpdate?: (taskId: string, updates: Partial<TaskItem>) => void;
	/** Callback when task is deleted */
	onTaskDelete?: (taskId: string) => void;
}

export interface TaskCardProps {
	/** Task data to display */
	task: TaskItem;
	/** Whether the card is draggable */
	draggable?: boolean;
	/** Whether the card is currently being dragged */
	isDragging?: boolean;
	/** Callback when task is updated */
	onUpdate?: (task: TaskItem) => void;
	/** Callback when task is deleted */
	onDelete?: (id: string) => void;
	/** Callback when drag starts */
	onDragStart?: (task: TaskItem) => void;
	/** Callback when drag ends */
	onDragEnd?: () => void;
}

// Event Handler Types

export type DragEventHandler = (event: DragEvent) => void;
export type TaskEventHandler = (task: TaskItem) => void;
export type TaskUpdateHandler = (taskId: string, updates: Partial<TaskItem>) => void;
export type NavigationHandler = (itemId: string) => void;

// Component State Types

export interface DragState {
	/** Whether a drag operation is in progress */
	isDragging: boolean;
	/** ID of the task being dragged */
	draggedTaskId: string | null;
	/** Original column of the dragged task */
	sourceColumn: TaskStatus | null;
	/** Current hover target column */
	hoverColumn: TaskStatus | null;
}

export interface ModalState {
	/** Whether any modal is open */
	isOpen: boolean;
	/** Type of modal currently open */
	modalType: 'add-requirement' | 'optimize-story' | 'task-details' | null;
	/** Data for the current modal */
	modalData: Record<string, unknown> | null;
}

// Animation and Transition Types

export interface AnimationState {
	/** Whether entrance animations should play */
	playEntranceAnimations: boolean;
	/** Whether hover animations are enabled */
	enableHoverEffects: boolean;
	/** Whether transitions are reduced for accessibility */
	reducedMotion: boolean;
}

export type TransitionDirection = 'left' | 'right' | 'up' | 'down';
export type AnimationTiming = 'fast' | 'normal' | 'slow';
export type EasingFunction =
	| 'linear'
	| 'ease'
	| 'ease-in'
	| 'ease-out'
	| 'ease-in-out'
	| 'fluid'
	| 'snappy'
	| 'bounce';
