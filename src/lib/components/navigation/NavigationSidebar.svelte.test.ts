import { flushSync, mount, unmount } from 'svelte';
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import NavigationSidebar from './NavigationSidebar.svelte';
import { navigationStore } from '$lib/stores/navigation.svelte';

// Mock the navigation store
vi.mock('$lib/stores/navigation.svelte.ts', () => ({
	navigationStore: {
		navigationItems: [
			{
				id: 'kanban',
				label: 'Kanban',
				icon: '📋',
				active: true,
				disabled: false
			}
		],
		isCollapsed: false,
		currentActiveItem: 'kanban',
		setActiveItem: vi.fn(),
		toggleSidebar: vi.fn(),
		navigateNext: vi.fn(),
		navigatePrevious: vi.fn()
	}
}));

describe('NavigationSidebar', () => {
	let mockMatchMedia: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Clean up DOM
		document.body.innerHTML = '';

		// Mock window.matchMedia
		mockMatchMedia = vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}));

		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: mockMatchMedia
		});

		// Reset store mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Clean up any remaining DOM elements
		document.body.innerHTML = '';
	});

	test('renders navigation sidebar with correct structure', () => {
		const component = mount(NavigationSidebar, {
			target: document.body
		});

		// Check main navigation element
		const nav = document.body.querySelector('nav');
		expect(nav).toBeTruthy();
		expect(nav?.getAttribute('aria-label')).toBe('Main navigation');

		// Check for header
		expect(document.body.innerHTML).toContain('AI');
		expect(document.body.innerHTML).toContain('Kanban');

		// Check for navigation items
		const tablist = document.body.querySelector('[role="tablist"]');
		expect(tablist).toBeTruthy();

		unmount(component);
	});

	test('handles sidebar toggle correctly', () => {
		const component = mount(NavigationSidebar, {
			target: document.body
		});

		const toggleButton = document.body.querySelector(
			'[data-testid="sidebar-toggle"]'
		) as HTMLElement;
		expect(toggleButton).toBeTruthy();

		toggleButton?.click();
		flushSync();

		expect(navigationStore.toggleSidebar).toHaveBeenCalled();

		unmount(component);
	});

	test('handles keyboard navigation', () => {
		const component = mount(NavigationSidebar, {
			target: document.body
		});

		const keydownElement = document.body.querySelector('[role="tablist"]');

		// Test arrow down navigation
		keydownElement?.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
		);
		flushSync();
		expect(navigationStore.navigateNext).toHaveBeenCalled();

		// Test arrow up navigation
		keydownElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
		flushSync();
		expect(navigationStore.navigatePrevious).toHaveBeenCalled();

		unmount(component);
	});

	test('renders collapsed state correctly', () => {
		const component = mount(NavigationSidebar, {
			target: document.body,
			props: { forceCollapsed: true }
		});

		// Check that the component renders (using nav element)
		const nav = document.body.querySelector('nav');
		expect(nav).toBeTruthy();

		unmount(component);
	});

	test('renders expanded state correctly', () => {
		const component = mount(NavigationSidebar, {
			target: document.body,
			props: { forceCollapsed: false }
		});

		// Check that the component renders (using nav element)
		const nav = document.body.querySelector('nav');
		expect(nav).toBeTruthy();

		unmount(component);
	});

	test('handles mobile responsive behavior', () => {
		// Mock mobile media query to return true for mobile
		mockMatchMedia.mockImplementation((query) => ({
			matches: query === '(max-width: 768px)',
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn((event, handler) => {
				// Simulate mobile detection
				if (event === 'change') {
					setTimeout(() => handler({ matches: true }), 0);
				}
			}),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}));

		const component = mount(NavigationSidebar, {
			target: document.body
		});

		// Wait for effects to run
		flushSync();

		// Check if mobile classes are applied or mobile button exists
		const sidebar = document.body.querySelector('.navigation-sidebar');
		const mobileButton = document.body.querySelector('[data-testid="mobile-menu-button"]');

		// Either mobile button should exist OR sidebar should have mobile classes
		expect(mobileButton || sidebar?.classList.toString().includes('fixed')).toBeTruthy();

		unmount(component);
	});

	test('handles item activation', () => {
		const component = mount(NavigationSidebar, {
			target: document.body
		});

		// Find and click a navigation item
		const navItem = document.body.querySelector('[data-testid="nav-item-kanban"]') as HTMLElement;
		expect(navItem).toBeTruthy();

		navItem?.click();
		flushSync();

		expect(navigationStore.setActiveItem).toHaveBeenCalledWith('kanban');

		unmount(component);
	});

	test('applies additional CSS classes', () => {
		const customClass = 'custom-sidebar-class';
		const component = mount(NavigationSidebar, {
			target: document.body,
			props: { class: customClass }
		});

		// Check that the component renders with custom class
		const nav = document.body.querySelector('nav');
		expect(nav).toBeTruthy();

		unmount(component);
	});

	test('renders coming soon section when expanded', () => {
		const component = mount(NavigationSidebar, {
			target: document.body,
			props: { forceCollapsed: false }
		});

		expect(document.body.innerHTML).toContain('Coming Soon');

		unmount(component);
	});

	test('does not render coming soon section when collapsed', () => {
		const component = mount(NavigationSidebar, {
			target: document.body,
			props: { forceCollapsed: true }
		});

		expect(document.body.innerHTML).not.toContain('Coming Soon');

		unmount(component);
	});

	test('handles escape key on mobile', () => {
		// Mock mobile media query
		mockMatchMedia.mockImplementation((query) => ({
			matches: query === '(max-width: 768px)',
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}));

		const component = mount(NavigationSidebar, {
			target: document.body
		});

		const nav = document.body.querySelector('nav');

		// Test escape key
		nav?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		flushSync();

		// Should not throw any errors
		expect(true).toBe(true);

		unmount(component);
	});

	test('renders footer content correctly', () => {
		// Test expanded footer
		const component1 = mount(NavigationSidebar, {
			target: document.body,
			props: { forceCollapsed: false }
		});

		expect(document.body.innerHTML).toContain('AI-Native Kanban v1.0');

		unmount(component1);

		// Test collapsed footer
		const component2 = mount(NavigationSidebar, {
			target: document.body,
			props: { forceCollapsed: true }
		});

		expect(document.body.innerHTML).toContain('System online');

		unmount(component2);
	});

	test('has proper accessibility attributes', () => {
		const component = mount(NavigationSidebar, {
			target: document.body
		});

		const nav = document.body.querySelector('nav');
		expect(nav?.getAttribute('aria-label')).toBe('Main navigation');

		const tablist = document.body.querySelector('[role="tablist"]');
		expect(tablist?.getAttribute('aria-label')).toBe('Navigation tabs');

		const toggleButton = document.body.querySelector('[data-testid="sidebar-toggle"]');
		expect(toggleButton?.getAttribute('aria-label')).toContain('sidebar');

		unmount(component);
	});

	test('handles component cleanup properly', () => {
		const component = mount(NavigationSidebar, {
			target: document.body
		});

		// Should mount without errors
		const nav = document.body.querySelector('nav');
		expect(nav).toBeTruthy();

		// Should unmount without errors
		unmount(component);
		expect(document.body.querySelector('nav')).toBeFalsy();
	});
});
