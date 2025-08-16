import { flushSync, mount, unmount } from 'svelte';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import NavigationItem from './NavigationItem.svelte';
import type { NavigationItem as NavigationItemType } from '$lib/types/navigation.ts';

describe('NavigationItem', () => {
	let mockItem: NavigationItemType;
	let mockOnActivate: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Clean up DOM
		document.body.innerHTML = '';

		mockItem = {
			id: 'test-item',
			label: 'Test Item',
			icon: '🧪',
			active: false,
			disabled: false
		};
		mockOnActivate = vi.fn();
	});

	test('renders navigation item with correct content', () => {
		const component = mount(NavigationItem, {
			target: document.body,
			props: { item: mockItem, onActivate: mockOnActivate }
		});

		// Check if item content is rendered
		expect(document.body.innerHTML).toContain('Test Item');
		expect(document.body.innerHTML).toContain('🧪');

		// Check ARIA attributes
		const button = document.body.querySelector('button');
		expect(button).toBeTruthy();
		expect(button?.getAttribute('role')).toBe('tab');
		expect(button?.getAttribute('aria-selected')).toBe('false');
		expect(button?.getAttribute('aria-label')).toBe('Navigate to Test Item');

		unmount(component);
	});

	test('handles active state correctly', () => {
		const activeItem = { ...mockItem, active: true };
		const component = mount(NavigationItem, {
			target: document.body,
			props: { item: activeItem, onActivate: mockOnActivate }
		});

		const button = document.body.querySelector('button');
		expect(button?.getAttribute('aria-selected')).toBe('true');
		expect(button?.getAttribute('tabindex')).toBe('0');
		expect(button?.classList.contains('nav-item-active')).toBe(true);

		unmount(component);
	});

	test('handles disabled state correctly', () => {
		const disabledItem = { ...mockItem, disabled: true };
		const component = mount(NavigationItem, {
			target: document.body,
			props: { item: disabledItem, onActivate: mockOnActivate }
		});

		const button = document.body.querySelector('button');
		expect(button?.disabled).toBe(true);
		expect(button?.classList.contains('opacity-50')).toBe(true);
		expect(button?.classList.contains('cursor-not-allowed')).toBe(true);

		unmount(component);
	});

	test('handles click activation', () => {
		const component = mount(NavigationItem, {
			target: document.body,
			props: { item: mockItem, onActivate: mockOnActivate }
		});

		const button = document.body.querySelector('button');
		button?.click();
		flushSync();

		expect(mockOnActivate).toHaveBeenCalledWith('test-item');

		unmount(component);
	});

	test('handles keyboard activation', () => {
		const component = mount(NavigationItem, {
			target: document.body,
			props: { item: mockItem, onActivate: mockOnActivate }
		});

		const button = document.body.querySelector('button');

		// Test Enter key
		const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
		button?.dispatchEvent(enterEvent);
		flushSync();
		expect(mockOnActivate).toHaveBeenCalledWith('test-item');

		// Test Space key
		mockOnActivate.mockClear();
		const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
		button?.dispatchEvent(spaceEvent);
		flushSync();
		expect(mockOnActivate).toHaveBeenCalledWith('test-item');

		unmount(component);
	});

	test('does not activate when disabled', () => {
		const disabledItem = { ...mockItem, disabled: true };
		const component = mount(NavigationItem, {
			target: document.body,
			props: { item: disabledItem, onActivate: mockOnActivate }
		});

		const button = document.body.querySelector('button');
		button?.click();
		flushSync();

		expect(mockOnActivate).not.toHaveBeenCalled();

		unmount(component);
	});

	test('renders collapsed state correctly', () => {
		const component = mount(NavigationItem, {
			target: document.body,
			props: { item: mockItem, collapsed: true, onActivate: mockOnActivate }
		});

		// Button should have justify-center class when collapsed
		const button = document.body.querySelector('button');
		expect(button?.classList.contains('justify-center')).toBe(true);

		// Icon should still be visible
		expect(document.body.innerHTML).toContain('🧪');

		// Tooltip should be present
		expect(document.body.innerHTML).toContain('tooltip');

		unmount(component);
	});

	test('handles mouse events for hover effects', () => {
		const component = mount(NavigationItem, {
			target: document.body,
			props: { item: mockItem, onActivate: mockOnActivate }
		});

		const button = document.body.querySelector('button');

		// Test mouse enter
		button?.dispatchEvent(new MouseEvent('mouseenter'));
		flushSync();

		// Test mouse leave
		button?.dispatchEvent(new MouseEvent('mouseleave'));
		flushSync();

		// No errors should occur
		expect(true).toBe(true);

		unmount(component);
	});

	test('handles focus events correctly', () => {
		const component = mount(NavigationItem, {
			target: document.body,
			props: { item: mockItem, onActivate: mockOnActivate }
		});

		const button = document.body.querySelector('button');

		// Test focus
		button?.dispatchEvent(new FocusEvent('focus'));
		flushSync();

		// Test blur
		button?.dispatchEvent(new FocusEvent('blur'));
		flushSync();

		// No errors should occur
		expect(true).toBe(true);

		unmount(component);
	});

	test('renders without icon when not provided', () => {
		// Clean up any previous content
		document.body.innerHTML = '';

		const itemWithoutIcon = { ...mockItem, icon: undefined };
		const component = mount(NavigationItem, {
			target: document.body,
			props: { item: itemWithoutIcon, onActivate: mockOnActivate }
		});

		// Should still render the label
		expect(document.body.innerHTML).toContain('Test Item');

		// Should not contain the test icon
		expect(document.body.innerHTML).not.toContain('🧪');

		unmount(component);
	});

	test('applies correct tabindex based on active state', () => {
		// Test inactive item
		const inactiveItem = { ...mockItem, active: false };
		const component1 = mount(NavigationItem, {
			target: document.body,
			props: { item: inactiveItem, onActivate: mockOnActivate }
		});

		let button = document.body.querySelector('button');
		expect(button?.getAttribute('tabindex')).toBe('-1');

		unmount(component1);
		document.body.innerHTML = ''; // Clean up

		// Test active item
		const activeItem = { ...mockItem, active: true };
		const component2 = mount(NavigationItem, {
			target: document.body,
			props: { item: activeItem, onActivate: mockOnActivate }
		});

		button = document.body.querySelector('button');
		expect(button?.getAttribute('tabindex')).toBe('0');

		unmount(component2);
	});
});
