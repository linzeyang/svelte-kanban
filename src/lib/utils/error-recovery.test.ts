/**
 * Unit tests for error recovery utilities
 * Tests error handling and recovery mechanisms
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { LayoutErrorRecovery, useErrorRecovery, initializeErrorRecovery } from './error-recovery';
import { navigationStore } from '$lib/stores/navigation.svelte';
import { kanbanStore } from '$lib/stores/kanban.svelte';

// Extend global interface for Node.js environment
declare global {
	var localStorage: Storage;
	var window: Window & typeof globalThis;
	var document: Document;
}

// Mock the stores
vi.mock('$lib/stores/navigation.svelte', () => ({
	navigationStore: {
		setSidebarCollapsed: vi.fn(),
		setActiveItem: vi.fn(() => true),
		reset: vi.fn()
	}
}));

vi.mock('$lib/stores/kanban.svelte', () => ({
	kanbanStore: {
		clearError: vi.fn(),
		loadFromStorage: vi.fn(),
		reset: vi.fn()
	}
}));

describe('LayoutErrorRecovery', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Mock console methods to avoid noise in tests
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'log').mockImplementation(() => {});

		// Mock browser globals for Node.js environment
		if (typeof window === 'undefined') {
			// @ts-ignore - global assignment for testing
			globalThis.window = {
				addEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
				location: { reload: vi.fn() },
				localStorage: {
					getItem: vi.fn(),
					setItem: vi.fn(),
					removeItem: vi.fn(),
					clear: vi.fn()
				}
			} as any;
		}

		// Set up global localStorage for direct access
		if (typeof localStorage === 'undefined') {
			// @ts-ignore - global assignment for testing
			globalThis.localStorage = {
				getItem: vi.fn(),
				setItem: vi.fn(),
				removeItem: vi.fn(),
				clear: vi.fn()
			} as any;
		}

		if (typeof document === 'undefined') {
			// @ts-ignore - global assignment for testing
			globalThis.document = {
				documentElement: {
					classList: {
						add: vi.fn(),
						remove: vi.fn()
					},
					style: {
						setProperty: vi.fn(),
						removeProperty: vi.fn()
					}
				}
			} as any;
		}
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('handleSidebarError', () => {
		test('should reset sidebar to expanded state', () => {
			const error = new Error('Sidebar test error');

			LayoutErrorRecovery.handleSidebarError(error);

			expect(navigationStore.setSidebarCollapsed).toHaveBeenCalledWith(false);
			expect(navigationStore.setActiveItem).toHaveBeenCalledWith('kanban');
			expect(console.warn).toHaveBeenCalledWith(
				'Sidebar error, falling back to expanded state:',
				error
			);
		});

		test('should reset navigation store if setActiveItem fails', () => {
			const error = new Error('Sidebar test error');
			vi.mocked(navigationStore.setActiveItem).mockReturnValue(false);

			LayoutErrorRecovery.handleSidebarError(error);

			expect(navigationStore.reset).toHaveBeenCalled();
		});

		test('should handle recovery errors gracefully', () => {
			const error = new Error('Sidebar test error');
			vi.mocked(navigationStore.setSidebarCollapsed).mockImplementation(() => {
				throw new Error('Recovery failed');
			});

			expect(() => {
				LayoutErrorRecovery.handleSidebarError(error);
			}).not.toThrow();

			expect(navigationStore.reset).toHaveBeenCalled();
		});
	});

	describe('handleNavigationError', () => {
		test('should reset navigation store', () => {
			const error = new Error('Navigation test error');

			LayoutErrorRecovery.handleNavigationError(error);

			expect(navigationStore.reset).toHaveBeenCalled();
			expect(console.warn).toHaveBeenCalledWith(
				'Navigation error, resetting to Kanban:',
				error
			);
		});

		test('should handle reset failure with page reload', () => {
			const error = new Error('Navigation test error');
			const mockReload = vi.fn();

			// Update the existing mock
			(window.location as any).reload = mockReload;

			vi.mocked(navigationStore.reset).mockImplementation(() => {
				throw new Error('Reset failed');
			});

			LayoutErrorRecovery.handleNavigationError(error);

			expect(mockReload).toHaveBeenCalled();
		});
	});

	describe('handleKanbanError', () => {
		test('should clear error and reload from storage', () => {
			const error = new Error('Kanban test error');

			LayoutErrorRecovery.handleKanbanError(error);

			expect(kanbanStore.clearError).toHaveBeenCalled();
			expect(kanbanStore.loadFromStorage).toHaveBeenCalled();
			expect(console.warn).toHaveBeenCalledWith(
				'Kanban store error, attempting recovery:',
				error
			);
		});

		test('should reset kanban store if recovery fails', () => {
			const error = new Error('Kanban test error');
			vi.mocked(kanbanStore.loadFromStorage).mockImplementation(() => {
				throw new Error('Load failed');
			});

			LayoutErrorRecovery.handleKanbanError(error);

			expect(kanbanStore.reset).toHaveBeenCalled();
		});
	});

	describe('handleAnimationError', () => {
		test('should disable animations on element', () => {
			const error = new Error('Animation test error');
			const mockElement = {
				style: {
					animation: '',
					transition: '',
					willChange: ''
				},
				classList: {
					remove: vi.fn()
				}
			} as any;

			LayoutErrorRecovery.handleAnimationError(error, mockElement);

			expect(mockElement.style.animation).toBe('none');
			expect(mockElement.style.transition).toBe('none');
			expect(mockElement.style.willChange).toBe('auto');
			expect(mockElement.classList.remove).toHaveBeenCalled();
		});

		test('should disable animations globally', () => {
			const error = new Error('Animation test error');
			const mockDocumentElement = document.documentElement as any;

			LayoutErrorRecovery.handleAnimationError(error);

			expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
				'--animation-duration',
				'0ms'
			);
			expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
				'--transition-duration',
				'0ms'
			);
		});
	});

	describe('handleStorageError', () => {
		test('should clear storage and reset stores', () => {
			const error = new Error('Storage test error');

			// Set up localStorage spy on the global object
			const removeItemSpy = vi.spyOn(globalThis.localStorage, 'removeItem');

			LayoutErrorRecovery.handleStorageError(error);

			expect(removeItemSpy).toHaveBeenCalledWith('kanban_board_data');
			expect(removeItemSpy).toHaveBeenCalledWith('navigation_state');
			expect(kanbanStore.reset).toHaveBeenCalled();
			expect(navigationStore.reset).toHaveBeenCalled();
		});

		test('should handle storage unavailability gracefully', () => {
			const error = new Error('Storage test error');

			// Set up localStorage spy that throws
			const removeItemSpy = vi.spyOn(globalThis.localStorage, 'removeItem')
				.mockImplementation(() => {
					throw new Error('Storage unavailable');
				});

			expect(() => {
				LayoutErrorRecovery.handleStorageError(error);
			}).not.toThrow();

			expect(kanbanStore.reset).toHaveBeenCalled();
			expect(navigationStore.reset).toHaveBeenCalled();
		});
	});

	describe('handleGenericError', () => {
		test('should route to appropriate handler based on context', () => {
			const error = new Error('Generic test error');
			const handleSidebarSpy = vi.spyOn(LayoutErrorRecovery, 'handleSidebarError');
			const handleKanbanSpy = vi.spyOn(LayoutErrorRecovery, 'handleKanbanError');

			LayoutErrorRecovery.handleGenericError(error, 'sidebar');
			expect(handleSidebarSpy).toHaveBeenCalledWith(error);

			LayoutErrorRecovery.handleGenericError(error, 'kanban');
			expect(handleKanbanSpy).toHaveBeenCalledWith(error);
		});

		test('should perform full reset for unknown context', () => {
			const error = new Error('Generic test error');
			const performFullResetSpy = vi.spyOn(LayoutErrorRecovery, 'performFullReset');

			LayoutErrorRecovery.handleGenericError(error, 'unknown');

			expect(performFullResetSpy).toHaveBeenCalled();
		});
	});

	describe('performFullReset', () => {
		test('should reset all stores and clear storage', () => {
			// Set up localStorage spy on the global object
			const clearSpy = vi.spyOn(globalThis.localStorage, 'clear');

			LayoutErrorRecovery.performFullReset();

			expect(navigationStore.reset).toHaveBeenCalled();
			expect(kanbanStore.reset).toHaveBeenCalled();
			expect(clearSpy).toHaveBeenCalled();
		});

		test('should reload page if reset fails', () => {
			const mockReload = vi.fn();
			Object.defineProperty(window, 'location', {
				value: { reload: mockReload },
				writable: true
			});

			vi.mocked(navigationStore.reset).mockImplementation(() => {
				throw new Error('Reset failed');
			});

			LayoutErrorRecovery.performFullReset();

			expect(mockReload).toHaveBeenCalled();
		});
	});

	describe('createErrorBoundary', () => {
		test('should create error boundary with component name', () => {
			const boundary = LayoutErrorRecovery.createErrorBoundary('TestComponent');

			expect(boundary).toHaveProperty('onError');
			expect(typeof boundary.onError).toBe('function');
		});

		test('should handle errors in boundary', () => {
			const boundary = LayoutErrorRecovery.createErrorBoundary('TestComponent');
			const error = new Error('Boundary test error');
			const handleGenericSpy = vi.spyOn(LayoutErrorRecovery, 'handleGenericError');

			const result = boundary.onError(error);

			expect(handleGenericSpy).toHaveBeenCalledWith(error, 'testcomponent');
			expect(result).toEqual({
				recovered: true,
				message: 'TestComponent encountered an error and has been reset to a safe state.'
			});
		});
	});
});

describe('useErrorRecovery', () => {
	test('should create error recovery hook', () => {
		const hook = useErrorRecovery('TestComponent');

		expect(hook).toHaveProperty('handleError');
		expect(hook).toHaveProperty('onError');
		expect(typeof hook.handleError).toBe('function');
		expect(typeof hook.onError).toBe('function');
	});

	test('should handle errors through hook', () => {
		const hook = useErrorRecovery('TestComponent');
		const error = new Error('Hook test error');
		const handleGenericSpy = vi.spyOn(LayoutErrorRecovery, 'handleGenericError');

		hook.handleError(error, 'custom-context');

		expect(handleGenericSpy).toHaveBeenCalledWith(error, 'custom-context');
	});
});

describe('initializeErrorRecovery', () => {
	test('should set up global error handlers', () => {
		const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
		const consoleLogSpy = vi.spyOn(console, 'log');

		initializeErrorRecovery();

		expect(addEventListenerSpy).toHaveBeenCalledWith(
			'unhandledrejection',
			expect.any(Function)
		);
		expect(addEventListenerSpy).toHaveBeenCalledWith(
			'error',
			expect.any(Function)
		);
		expect(consoleLogSpy).toHaveBeenCalledWith('Error recovery system initialized');
	});

	test('should handle unhandled promise rejections', () => {
		const handleGenericSpy = vi.spyOn(LayoutErrorRecovery, 'handleGenericError');

		// Capture the event listener function
		let rejectionHandler: (event: any) => void;
		const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
			.mockImplementation((type: string, handler: any) => {
				if (type === 'unhandledrejection') {
					rejectionHandler = handler;
				}
			});

		initializeErrorRecovery();

		// Simulate unhandled promise rejection
		const rejectionEvent = {
			reason: new Error('Unhandled rejection'),
			preventDefault: vi.fn()
		};

		rejectionHandler!(rejectionEvent);

		expect(handleGenericSpy).toHaveBeenCalledWith(
			expect.any(Error),
			'promise'
		);
	});

	test('should handle global errors', () => {
		const handleGenericSpy = vi.spyOn(LayoutErrorRecovery, 'handleGenericError');

		// Capture the event listener function
		let errorHandler: (event: any) => void;
		const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
			.mockImplementation((type: string, handler: any) => {
				if (type === 'error') {
					errorHandler = handler;
				}
			});

		initializeErrorRecovery();

		// Simulate global error
		const errorEvent = {
			error: new Error('Global error'),
			message: 'Global error',
			type: 'error'
		};

		errorHandler!(errorEvent);

		expect(handleGenericSpy).toHaveBeenCalledWith(
			expect.any(Error),
			'global'
		);
	});
});
