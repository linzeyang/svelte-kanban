/**
 * Layout and application state type definitions
 */

export type ThemeMode = 'dark' | 'light';

export interface AppState {
	/** Currently active navigation item */
	activeNavItem: string;
	/** Whether the sidebar is collapsed */
	sidebarCollapsed: boolean;
	/** Current theme mode */
	theme: ThemeMode;
	/** Whether the app is in mobile view */
	isMobile: boolean;
	/** Current viewport dimensions */
	viewport: {
		width: number;
		height: number;
	};
}

export interface LayoutConfig {
	/** Sidebar width in pixels when expanded */
	sidebarWidth: number;
	/** Sidebar width in pixels when collapsed */
	sidebarCollapsedWidth: number;
	/** Breakpoint for mobile layout in pixels */
	mobileBreakpoint: number;
	/** Whether to show animations */
	enableAnimations: boolean;
}

export interface ResponsiveBreakpoints {
	/** Mobile breakpoint */
	mobile: number;
	/** Tablet breakpoint */
	tablet: number;
	/** Desktop breakpoint */
	desktop: number;
	/** Large desktop breakpoint */
	large: number;
}

export interface AnimationConfig {
	/** Duration for sidebar transitions */
	sidebarTransition: number;
	/** Duration for navigation transitions */
	navigationTransition: number;
	/** Duration for column animations */
	columnAnimation: number;
	/** Duration for task card animations */
	taskAnimation: number;
	/** Easing function for fluid animations */
	fluidEasing: string;
	/** Easing function for snappy animations */
	snappyEasing: string;
}

export type LayoutAction =
	| { type: 'SET_ACTIVE_NAV_ITEM'; payload: string }
	| { type: 'TOGGLE_SIDEBAR' }
	| { type: 'SET_THEME'; payload: ThemeMode }
	| { type: 'SET_MOBILE_VIEW'; payload: boolean }
	| { type: 'UPDATE_VIEWPORT'; payload: { width: number; height: number } };
