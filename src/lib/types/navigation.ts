/**
 * Navigation-related type definitions for the AI-Native Kanban application
 */

export interface NavigationItem {
	/** Unique identifier for the navigation item */
	id: string;
	/** Display label for the navigation item */
	label: string;
	/** Optional icon identifier or emoji */
	icon?: string;
	/** Optional href for navigation routing */
	href?: string;
	/** Whether this item is currently active */
	active: boolean;
	/** Whether this item is disabled */
	disabled?: boolean;
}

export interface NavigationState {
	/** Currently active navigation item ID */
	activeItem: string;
	/** Whether the sidebar is collapsed */
	sidebarCollapsed: boolean;
	/** Available navigation items */
	items: NavigationItem[];
}

export type NavigationAction =
	| { type: 'SET_ACTIVE_ITEM'; payload: string }
	| { type: 'TOGGLE_SIDEBAR' }
	| { type: 'ADD_NAVIGATION_ITEM'; payload: NavigationItem }
	| { type: 'REMOVE_NAVIGATION_ITEM'; payload: string };
