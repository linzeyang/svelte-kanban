/**
 * Error recovery utilities for layout and component failures
 * Provides graceful fallback mechanisms and recovery strategies
 */

import { navigationStore } from '$lib/stores/navigation.svelte';
import { kanbanStore } from '$lib/stores/kanban.svelte';

export class LayoutErrorRecovery {
	/**
	 * Handle sidebar-related errors with graceful fallback
	 */
	static handleSidebarError(error: Error) {
		console.warn('Sidebar error, falling back to expanded state:', error);

		try {
			// Reset to safe expanded state
			navigationStore.setSidebarCollapsed(false);

			// Ensure kanban tab is active
			if (!navigationStore.setActiveItem('kanban')) {
				// If setting active item fails, reset the entire navigation store
				navigationStore.reset();
			}
		} catch (recoveryError) {
			console.error('Failed to recover from sidebar error:', recoveryError);
			// Last resort: reset navigation store
			navigationStore.reset();
		}
	}

	/**
	 * Handle navigation state corruption with reset to default
	 */
	static handleNavigationError(error: Error) {
		console.warn('Navigation error, resetting to Kanban:', error);

		try {
			navigationStore.reset();
		} catch (recoveryError) {
			console.error('Failed to recover from navigation error:', recoveryError);
			// Force page reload as last resort
			if (typeof window !== 'undefined') {
				window.location.reload();
			}
		}
	}

	/**
	 * Handle kanban store errors with data preservation
	 */
	static handleKanbanError(error: Error) {
		console.warn('Kanban store error, attempting recovery:', error);

		try {
			// Clear error state
			kanbanStore.clearError();

			// Try to reload from storage
			kanbanStore.loadFromStorage();
		} catch (recoveryError) {
			console.error('Failed to recover kanban data:', recoveryError);

			// Clear corrupted data and reset
			kanbanStore.reset();
		}
	}

	/**
	 * Handle layout animation failures
	 */
	static handleAnimationError(error: Error, element?: HTMLElement) {
		console.warn('Animation error, disabling animations:', error);

		try {
			if (element) {
				// Remove animation classes and reset styles
				element.style.animation = 'none';
				element.style.transition = 'none';
				element.style.willChange = 'auto';

				// Remove animation-related classes
				const animationClasses = [
					'slide-in-left', 'slide-in-right', 'slide-in-up', 'slide-in-down',
					'fade-in', 'column-entrance', 'sidebar-entrance', 'ai-pulse'
				];

				animationClasses.forEach(className => {
					element.classList.remove(className);
				});
			}

			// Disable animations globally for the session
			if (typeof document !== 'undefined') {
				document.documentElement.style.setProperty('--animation-duration', '0ms');
				document.documentElement.style.setProperty('--transition-duration', '0ms');
			}
		} catch (recoveryError) {
			console.error('Failed to recover from animation error:', recoveryError);
		}
	}

	/**
	 * Handle responsive layout failures
	 */
	static handleResponsiveError(error: Error) {
		console.warn('Responsive layout error, falling back to mobile-first:', error);

		try {
			// Force mobile layout as fallback
			if (typeof document !== 'undefined') {
				document.documentElement.classList.add('force-mobile-layout');
			}
		} catch (recoveryError) {
			console.error('Failed to recover from responsive error:', recoveryError);
		}
	}

	/**
	 * Handle storage-related errors
	 */
	static handleStorageError(error: Error) {
		console.warn('Storage error, switching to memory-only mode:', error);

		try {
			// Clear potentially corrupted storage
			if (typeof localStorage !== 'undefined') {
				try {
					localStorage.removeItem('kanban_board_data');
					localStorage.removeItem('navigation_state');
				} catch (storageError) {
					// Storage might be completely unavailable
					console.warn('Cannot clear storage:', storageError);
				}
			}

			// Reset stores to clean state
			kanbanStore.reset();
			navigationStore.reset();

		} catch (recoveryError) {
			console.error('Failed to recover from storage error:', recoveryError);
		}
	}

	/**
	 * Generic error handler with automatic recovery strategy selection
	 */
	static handleGenericError(error: Error, context: string, element?: HTMLElement) {
		console.error(`Error in ${context}:`, error);

		// Determine recovery strategy based on context
		switch (context) {
			case 'sidebar':
			case 'navigation':
				this.handleSidebarError(error);
				break;

			case 'kanban':
			case 'board':
			case 'tasks':
				this.handleKanbanError(error);
				break;

			case 'animation':
			case 'transition':
				this.handleAnimationError(error, element);
				break;

			case 'responsive':
			case 'layout':
				this.handleResponsiveError(error);
				break;

			case 'storage':
			case 'persistence':
				this.handleStorageError(error);
				break;

			default:
				// Generic recovery: reset all stores
				console.warn('Unknown error context, performing full reset');
				this.performFullReset();
		}
	}

	/**
	 * Perform full application reset as last resort
	 */
	static performFullReset() {
		try {
			// Reset all stores
			navigationStore.reset();
			kanbanStore.reset();

			// Clear all storage
			if (typeof localStorage !== 'undefined') {
				try {
					localStorage.clear();
				} catch (storageError) {
					console.warn('Cannot clear storage during full reset:', storageError);
				}
			}

			// Remove any error-related DOM modifications
			if (typeof document !== 'undefined') {
				document.documentElement.classList.remove('force-mobile-layout');
				document.documentElement.style.removeProperty('--animation-duration');
				document.documentElement.style.removeProperty('--transition-duration');
			}

			console.log('Full application reset completed');

		} catch (resetError) {
			console.error('Failed to perform full reset:', resetError);

			// Ultimate fallback: reload the page
			if (typeof window !== 'undefined') {
				console.warn('Reloading page as ultimate fallback');
				window.location.reload();
			}
		}
	}

	/**
	 * Create error boundary wrapper for components
	 */
	static createErrorBoundary(componentName: string) {
		return {
			onError: (error: Error) => {
				console.error(`Error in ${componentName}:`, error);
				this.handleGenericError(error, componentName.toLowerCase());

				// Return recovery instructions
				return {
					recovered: true,
					message: `${componentName} encountered an error and has been reset to a safe state.`
				};
			}
		};
	}

	/**
	 * Monitor for unhandled errors and apply recovery
	 */
	static initializeGlobalErrorHandling() {
		if (typeof window !== 'undefined') {
			// Handle unhandled promise rejections
			window.addEventListener('unhandledrejection', (event) => {
				console.error('Unhandled promise rejection:', event.reason);
				this.handleGenericError(
					event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
					'promise'
				);
			});

			// Handle general errors
			window.addEventListener('error', (event) => {
				console.error('Global error:', event.error);
				this.handleGenericError(
					event.error || new Error(event.message),
					'global'
				);
			});
		}
	}
}

/**
 * Error recovery hook for Svelte components
 */
export function useErrorRecovery(componentName: string) {
	const boundary = LayoutErrorRecovery.createErrorBoundary(componentName);

	return {
		handleError: (error: Error, context?: string) => {
			return LayoutErrorRecovery.handleGenericError(
				error,
				context || componentName.toLowerCase()
			);
		},

		onError: boundary.onError
	};
}

/**
 * Initialize error recovery system
 */
export function initializeErrorRecovery() {
	LayoutErrorRecovery.initializeGlobalErrorHandling();
	console.log('Error recovery system initialized');
}
