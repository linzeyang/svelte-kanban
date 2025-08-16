/**
 * Navigation state management using Svelte 5 runes
 * Provides reactive state for sidebar navigation and active item management
 */

import type { NavigationItem } from '$lib/types/navigation.ts';

class NavigationStore {
	// Core reactive state using Svelte 5 $state rune
	private activeItem = $state('kanban');
	private sidebarCollapsed = $state(false);

	// Navigation items configuration with extensible structure
	private items = $state<NavigationItem[]>([
		{
			id: 'kanban',
			label: 'Kanban',
			icon: '📋',
			active: true,
			disabled: false
		}
		// Future navigation items will be added here
	]);

	// Derived state using $derived rune for computed values
	get currentActiveItem() {
		return this.activeItem;
	}

	get isCollapsed() {
		return this.sidebarCollapsed;
	}

	get navigationItems() {
		return this.items;
	}

	// Derived computed properties using $derived rune
	activeNavigationItem = $derived(this.items.find((item) => item.id === this.activeItem));
	enabledItems = $derived(this.items.filter((item) => !item.disabled));
	totalItems = $derived(this.items.length);

	// Active item management methods
	setActiveItem(itemId: string) {
		// Validate that the item exists and is not disabled
		const targetItem = this.items.find((item) => item.id === itemId);
		if (!targetItem || targetItem.disabled) {
			console.warn(`Cannot set active item: ${itemId} (not found or disabled)`);
			return false;
		}

		// Update active states
		this.items.forEach((item) => {
			item.active = item.id === itemId;
		});

		this.activeItem = itemId;
		return true;
	}

	// Sidebar toggle functionality
	toggleSidebar() {
		this.sidebarCollapsed = !this.sidebarCollapsed;
	}

	setSidebarCollapsed(collapsed: boolean) {
		this.sidebarCollapsed = collapsed;
	}

	// Extensible navigation item management
	addNavigationItem(item: Omit<NavigationItem, 'active'>) {
		// Ensure unique ID
		if (this.items.some((existing) => existing.id === item.id)) {
			console.warn(`Navigation item with id '${item.id}' already exists`);
			return false;
		}

		const newItem: NavigationItem = {
			...item,
			active: false
		};

		this.items.push(newItem);
		return true;
	}

	removeNavigationItem(itemId: string) {
		// Prevent removal of the kanban item (core functionality)
		if (itemId === 'kanban') {
			console.warn('Cannot remove core kanban navigation item');
			return false;
		}

		const index = this.items.findIndex((item) => item.id === itemId);
		if (index === -1) {
			console.warn(`Navigation item with id '${itemId}' not found`);
			return false;
		}

		// If removing the active item, switch to kanban
		if (this.activeItem === itemId) {
			this.setActiveItem('kanban');
		}

		this.items.splice(index, 1);
		return true;
	}

	updateNavigationItem(itemId: string, updates: Partial<Omit<NavigationItem, 'id'>>) {
		const item = this.items.find((item) => item.id === itemId);
		if (!item) {
			console.warn(`Navigation item with id '${itemId}' not found`);
			return false;
		}

		// Apply updates while preserving the id
		Object.assign(item, updates);

		// If the item was set to active, update the active item
		if (updates.active === true) {
			this.setActiveItem(itemId);
		}

		return true;
	}

	// Navigation helpers
	getNextItem(): NavigationItem | null {
		const enabledItems = this.enabledItems;
		const currentIndex = enabledItems.findIndex((item) => item.id === this.activeItem);

		if (currentIndex === -1 || currentIndex === enabledItems.length - 1) {
			return enabledItems[0] || null;
		}

		return enabledItems[currentIndex + 1];
	}

	getPreviousItem(): NavigationItem | null {
		const enabledItems = this.enabledItems;
		const currentIndex = enabledItems.findIndex((item) => item.id === this.activeItem);

		if (currentIndex === -1 || currentIndex === 0) {
			return enabledItems[enabledItems.length - 1] || null;
		}

		return enabledItems[currentIndex - 1];
	}

	navigateNext() {
		const nextItem = this.getNextItem();
		if (nextItem) {
			this.setActiveItem(nextItem.id);
		}
	}

	navigatePrevious() {
		const previousItem = this.getPreviousItem();
		if (previousItem) {
			this.setActiveItem(previousItem.id);
		}
	}

	// State reset and initialization
	reset() {
		this.activeItem = 'kanban';
		this.sidebarCollapsed = false;
		this.items = [
			{
				id: 'kanban',
				label: 'Kanban',
				icon: '📋',
				active: true,
				disabled: false
			}
		];
	}

	// Export current state for debugging or persistence
	getState() {
		return {
			activeItem: this.activeItem,
			sidebarCollapsed: this.sidebarCollapsed,
			items: [...this.items]
		};
	}
}

// Create and export the singleton store instance
export const navigationStore = new NavigationStore();
