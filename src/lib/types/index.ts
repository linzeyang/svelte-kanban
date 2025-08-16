/**
 * Central type exports for the AI-Native Kanban application
 * This file provides a single entry point for all type definitions
 */

// Navigation types
export type { NavigationItem, NavigationState, NavigationAction } from './navigation.js';

// Kanban and task types
export type {
	TaskStatus,
	TaskPriority,
	TaskItem,
	KanbanColumn,
	KanbanBoard,
	KanbanState,
	KanbanAction
} from './kanban.js';

// Layout and application types
export type {
	ThemeMode,
	AppState,
	LayoutConfig,
	ResponsiveBreakpoints,
	AnimationConfig,
	LayoutAction
} from './layout.js';

// AI service types
export type {
	AIRequirementBreakdown,
	AIOptimizationResult,
	AIServiceConfig,
	AIRequestOptions,
	AIOperationStatus,
	AIOperationState
} from './ai.js';

// Component types
export type {
	AppShellProps,
	NavigationSidebarProps,
	NavigationItemProps,
	KanbanBoardProps,
	KanbanColumnProps,
	TaskCardProps,
	DragEventHandler,
	TaskEventHandler,
	TaskUpdateHandler,
	NavigationHandler,
	DragState,
	ModalState,
	AnimationState,
	TransitionDirection,
	AnimationTiming,
	EasingFunction
} from './components.js';

// Utility types for common patterns
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ID = string;
export type Timestamp = Date;

// Generic event handler types
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// API response types
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// Error types
export interface AppError {
	code: string;
	message: string;
	details?: Record<string, unknown>;
	timestamp: Date;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Storage types
export interface StorageItem<T = unknown> {
	key: string;
	value: T;
	timestamp: Date;
	version: number;
}

// Configuration types
export interface AppConfig {
	api: {
		baseUrl: string;
		timeout: number;
	};
	ui: {
		theme: 'dark' | 'light';
		animations: boolean;
		reducedMotion: boolean;
	};
	features: {
		aiIntegration: boolean;
		dragAndDrop: boolean;
		notifications: boolean;
	};
}

// Performance monitoring types
export interface PerformanceMetric {
	name: string;
	value: number;
	unit: 'ms' | 'fps' | 'bytes' | 'count';
	timestamp: Date;
	threshold?: number;
}

export interface PerformanceReport {
	metrics: PerformanceMetric[];
	summary: {
		averageResponseTime: number;
		slowestOperation: string;
		memoryUsage: number;
	};
	generatedAt: Date;
}
