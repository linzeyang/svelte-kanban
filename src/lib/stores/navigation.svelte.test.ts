/**
 * Unit tests for NavigationStore using Svelte 5 runes
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { flushSync } from 'svelte';

// Import the actual store for testing
import { navigationStore } from './navigation.svelte';

describe('NavigationStore', () => {
	let cleanup: () => void;

	beforeEach(() => {
		// Reset store to initial state before each test within an effect root
		cleanup = $effect.root(() => {
			navigationStore.reset();
		});
		flushSync();
	});

	afterEach(() => {
		cleanup?.();
	});

	describe('Initial State', () => {
		test('should initialize with correct default values', () => {
			expect(navigationStore.currentActiveItem).toBe('kanban');
			expect(navigationStore.isCollapsed).toBe(false);
			expect(navigationStore.navigationItems).toHaveLength(1);
			expect(navigationStore.navigationItems[0]).toEqual({
				id: 'kanban',
				label: 'Kanban',
				icon: '📋',
				active: true,
				disabled: false
			});
		});

		test('should have correct derived state', () => {
			expect(navigationStore.activeNavigationItem?.id).toBe('kanban');
			expect(navigationStore.enabledItems).toHaveLength(1);
			expect(navigationStore.totalItems).toBe(1);
		});
	});

	describe('Active Item Management', () => {
		test('should set active item successfully', () => {
			// Add a new item first
			const newItem = {
				id: 'projects',
				label: 'Projects',
				icon: '📁',
				disabled: false
			};

			navigationStore.addNavigationItem(newItem);
			flushSync();

			const result = navigationStore.setActiveItem('projects');
			flushSync();

			expect(result).toBe(true);
			expect(navigationStore.currentActiveItem).toBe('projects');
			expect(navigationStore.activeNavigationItem?.id).toBe('projects');

			// Check that previous item is no longer active
			const kanbanItem = navigationStore.navigationItems.find((item) => item.id === 'kanban');
			expect(kanbanItem?.active).toBe(false);
		});

		test('should fail to set non-existent item as active', () => {
			const result = navigationStore.setActiveItem('non-existent');
			flushSync();

			expect(result).toBe(false);
			expect(navigationStore.currentActiveItem).toBe('kanban');
		});

		test('should fail to set disabled item as active', () => {
			// Add a disabled item
			navigationStore.addNavigationItem({
				id: 'disabled-item',
				label: 'Disabled',
				disabled: true
			});
			flushSync();

			const result = navigationStore.setActiveItem('disabled-item');
			flushSync();

			expect(result).toBe(false);
			expect(navigationStore.currentActiveItem).toBe('kanban');
		});
	});

	describe('Sidebar Toggle Functionality', () => {
		test('should toggle sidebar state', () => {
			expect(navigationStore.isCollapsed).toBe(false);

			navigationStore.toggleSidebar();
			flushSync();

			expect(navigationStore.isCollapsed).toBe(true);

			navigationStore.toggleSidebar();
			flushSync();

			expect(navigationStore.isCollapsed).toBe(false);
		});

		test('should set sidebar collapsed state directly', () => {
			navigationStore.setSidebarCollapsed(true);
			flushSync();

			expect(navigationStore.isCollapsed).toBe(true);

			navigationStore.setSidebarCollapsed(false);
			flushSync();

			expect(navigationStore.isCollapsed).toBe(false);
		});
	});

	describe('Navigation Item Management', () => {
		test('should add new navigation item successfully', () => {
			const newItem = {
				id: 'settings',
				label: 'Settings',
				icon: '⚙️',
				disabled: false
			};

			const result = navigationStore.addNavigationItem(newItem);
			flushSync();

			expect(result).toBe(true);
			expect(navigationStore.totalItems).toBe(2);

			const addedItem = navigationStore.navigationItems.find((item) => item.id === 'settings');
			expect(addedItem).toEqual({
				...newItem,
				active: false
			});
		});

		test('should fail to add item with duplicate ID', () => {
			const duplicateItem = {
				id: 'kanban',
				label: 'Duplicate Kanban',
				disabled: false
			};

			const result = navigationStore.addNavigationItem(duplicateItem);
			flushSync();

			expect(result).toBe(false);
			expect(navigationStore.totalItems).toBe(1);
		});

		test('should remove navigation item successfully', () => {
			// Add an item first
			navigationStore.addNavigationItem({
				id: 'temp-item',
				label: 'Temporary',
				disabled: false
			});
			flushSync();

			const result = navigationStore.removeNavigationItem('temp-item');
			flushSync();

			expect(result).toBe(true);
			expect(navigationStore.totalItems).toBe(1);
			expect(
				navigationStore.navigationItems.find((item) => item.id === 'temp-item')
			).toBeUndefined();
		});

		test('should fail to remove core kanban item', () => {
			const result = navigationStore.removeNavigationItem('kanban');
			flushSync();

			expect(result).toBe(false);
			expect(navigationStore.totalItems).toBe(1);
		});

		test('should switch to kanban when removing active item', () => {
			// Add and activate a new item
			navigationStore.addNavigationItem({
				id: 'temp-active',
				label: 'Temporary Active',
				disabled: false
			});
			navigationStore.setActiveItem('temp-active');
			flushSync();

			expect(navigationStore.currentActiveItem).toBe('temp-active');

			// Remove the active item
			navigationStore.removeNavigationItem('temp-active');
			flushSync();

			expect(navigationStore.currentActiveItem).toBe('kanban');
		});

		test('should update navigation item successfully', () => {
			const result = navigationStore.updateNavigationItem('kanban', {
				label: 'Updated Kanban',
				icon: '📊'
			});
			flushSync();

			expect(result).toBe(true);

			const updatedItem = navigationStore.navigationItems.find((item) => item.id === 'kanban');
			expect(updatedItem?.label).toBe('Updated Kanban');
			expect(updatedItem?.icon).toBe('📊');
		});

		test('should fail to update non-existent item', () => {
			const result = navigationStore.updateNavigationItem('non-existent', {
				label: 'Updated'
			});
			flushSync();

			expect(result).toBe(false);
		});
	});

	describe('Navigation Helpers', () => {
		beforeEach(() => {
			// Add multiple items for navigation testing
			navigationStore.addNavigationItem({
				id: 'projects',
				label: 'Projects',
				disabled: false
			});
			navigationStore.addNavigationItem({
				id: 'settings',
				label: 'Settings',
				disabled: false
			});
			navigationStore.addNavigationItem({
				id: 'disabled',
				label: 'Disabled',
				disabled: true
			});
			flushSync();
		});

		test('should get next item correctly', () => {
			// Start with kanban (first item)
			expect(navigationStore.currentActiveItem).toBe('kanban');

			const nextItem = navigationStore.getNextItem();
			expect(nextItem?.id).toBe('projects');
		});

		test('should get previous item correctly', () => {
			// Set to projects (middle item)
			navigationStore.setActiveItem('projects');
			flushSync();

			const previousItem = navigationStore.getPreviousItem();
			expect(previousItem?.id).toBe('kanban');
		});

		test('should wrap around when getting next from last item', () => {
			navigationStore.setActiveItem('settings');
			flushSync();

			const nextItem = navigationStore.getNextItem();
			expect(nextItem?.id).toBe('kanban');
		});

		test('should wrap around when getting previous from first item', () => {
			// kanban is first, should wrap to settings (last enabled)
			const previousItem = navigationStore.getPreviousItem();
			expect(previousItem?.id).toBe('settings');
		});

		test('should navigate to next item', () => {
			navigationStore.navigateNext();
			flushSync();

			expect(navigationStore.currentActiveItem).toBe('projects');
		});

		test('should navigate to previous item', () => {
			navigationStore.navigatePrevious();
			flushSync();

			expect(navigationStore.currentActiveItem).toBe('settings');
		});

		test('should skip disabled items in navigation', () => {
			const enabledItems = navigationStore.enabledItems;
			expect(enabledItems).toHaveLength(3); // kanban, projects, settings
			expect(enabledItems.every((item) => !item.disabled)).toBe(true);
		});
	});

	describe('State Management', () => {
		test('should reset to initial state', () => {
			// Modify state
			navigationStore.addNavigationItem({
				id: 'temp',
				label: 'Temporary',
				disabled: false
			});
			navigationStore.setActiveItem('temp');
			navigationStore.toggleSidebar();
			flushSync();

			// Reset
			navigationStore.reset();
			flushSync();

			// Verify reset
			expect(navigationStore.currentActiveItem).toBe('kanban');
			expect(navigationStore.isCollapsed).toBe(false);
			expect(navigationStore.totalItems).toBe(1);
		});

		test('should export current state correctly', () => {
			navigationStore.addNavigationItem({
				id: 'test',
				label: 'Test',
				disabled: false
			});
			navigationStore.toggleSidebar();
			flushSync();

			const state = navigationStore.getState();

			expect(state).toEqual({
				activeItem: 'kanban',
				sidebarCollapsed: true,
				items: expect.arrayContaining([
					expect.objectContaining({ id: 'kanban' }),
					expect.objectContaining({ id: 'test' })
				])
			});
		});
	});

	describe('Derived State Reactivity', () => {
		test('should update derived state when items change', () => {
			expect(navigationStore.totalItems).toBe(1);

			navigationStore.addNavigationItem({
				id: 'new-item',
				label: 'New Item',
				disabled: false
			});
			flushSync();

			expect(navigationStore.totalItems).toBe(2);
			expect(navigationStore.enabledItems).toHaveLength(2);
		});

		test('should update active navigation item when active item changes', () => {
			navigationStore.addNavigationItem({
				id: 'test-item',
				label: 'Test Item',
				disabled: false
			});
			flushSync();

			expect(navigationStore.activeNavigationItem?.id).toBe('kanban');

			navigationStore.setActiveItem('test-item');
			flushSync();

			expect(navigationStore.activeNavigationItem?.id).toBe('test-item');
		});
	});
});
