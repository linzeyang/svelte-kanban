/**
 * End-to-end integration tests for complete user workflow
 * Tests the full application integration including AppShell, navigation, and kanban board
 */

import { test, expect } from '@playwright/test';

test.describe('AI-Native Kanban Application Integration', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the application
		await page.goto('/');

		// Wait for application to initialize
		await page.waitForSelector('[data-testid="app-shell"]', { timeout: 10000 });
	});

	test('should load and display the complete application layout', async ({ page }) => {
		// Verify AppShell is rendered
		const appShell = page.locator('[data-testid="app-shell"]');
		await expect(appShell).toBeVisible();

		// Verify navigation sidebar is present
		const sidebar = page.locator('[data-testid="navigation-sidebar"]');
		await expect(sidebar).toBeVisible();

		// Verify main content area is present
		const mainContent = page.locator('[data-testid="main-content"]');
		await expect(mainContent).toBeVisible();

		// Verify kanban board is rendered
		const kanbanBoard = page.locator('[data-testid="kanban-board"]');
		await expect(kanbanBoard).toBeVisible();
	});

	test('should display proper application header and status', async ({ page }) => {
		// Wait for main app content to load
		await page.waitForSelector('[data-testid="main-app-content"]');

		// Verify application title
		const title = page.locator('h1').first();
		await expect(title).toContainText('AI-Native Kanban');

		// Verify system status indicators
		const systemStatus = page.locator('text=System Online');
		await expect(systemStatus).toBeVisible();

		// Verify active view indicator
		const activeView = page.locator('text=View:');
		await expect(activeView).toBeVisible();

		// Verify layout status
		const layoutStatus = page.locator('text=Layout:');
		await expect(layoutStatus).toBeVisible();
	});

	test('should render all four kanban columns', async ({ page }) => {
		// Wait for kanban board to load
		await page.waitForSelector('[data-testid="kanban-board"]');

		// Verify all four columns are present
		const columns = [
			'column-wrapper-todo',
			'column-wrapper-in-progress',
			'column-wrapper-testing',
			'column-wrapper-done'
		];

		for (const columnId of columns) {
			const column = page.locator(`[data-testid="${columnId}"]`);
			await expect(column).toBeVisible();
		}

		// Verify column headers
		const columnTitles = ['To Do', 'In Progress', 'Testing', 'Done'];
		for (const title of columnTitles) {
			const columnHeader = page.locator(`text=${title}`).first();
			await expect(columnHeader).toBeVisible();
		}
	});

	test('should display columns in 4-column grid layout', async ({ page }) => {
		// Set desktop viewport to ensure proper layout
		await page.setViewportSize({ width: 1200, height: 800 });
		await page.waitForSelector('[data-testid="kanban-board"]');

		// Get the kanban columns container
		const columnsContainer = page.locator('[data-testid="kanban-columns"]');
		await expect(columnsContainer).toBeVisible();

		// Verify CSS grid properties
		const gridDisplay = await columnsContainer.evaluate((el) => {
			return window.getComputedStyle(el).display;
		});
		expect(gridDisplay).toBe('grid');

		// Verify 4-column grid template
		const gridTemplate = await columnsContainer.evaluate((el) => {
			return window.getComputedStyle(el).gridTemplateColumns;
		});

		// Should have 4 columns (either fr units or pixel values)
		const columnValues = gridTemplate.split(' ').filter((val) => val && val !== 'none');
		expect(columnValues.length).toBe(4);

		// Verify columns are arranged horizontally in a single row
		const columnElements = page.locator('[data-testid^="column-wrapper-"]');
		const count = await columnElements.count();
		expect(count).toBe(4);

		// Check that columns are positioned side by side (not stacked)
		const columnPositions = [];
		for (let i = 0; i < count; i++) {
			const boundingBox = await columnElements.nth(i).boundingBox();
			columnPositions.push(boundingBox);
		}

		// Verify columns are horizontally arranged (increasing x positions)
		for (let i = 1; i < columnPositions.length; i++) {
			expect(columnPositions[i]!.x).toBeGreaterThan(columnPositions[i - 1]!.x);
		}

		// Verify columns are roughly on the same horizontal line (similar y positions)
		const firstColumnY = columnPositions[0]!.y;
		for (let i = 1; i < columnPositions.length; i++) {
			expect(Math.abs(columnPositions[i]!.y - firstColumnY)).toBeLessThan(20);
		}
	});

	test('should maintain 4-column layout with sufficient container width', async ({ page }) => {
		// Test various desktop widths to ensure 4-column layout is maintained
		const testWidths = [1024, 1200, 1400, 1600];

		for (const width of testWidths) {
			await page.setViewportSize({ width, height: 800 });
			await page.waitForTimeout(300); // Allow layout to settle

			// Verify 4 columns are still visible
			const columnElements = page.locator('[data-testid^="column-wrapper-"]');
			const count = await columnElements.count();
			expect(count).toBe(4);

			// Verify all columns are visible
			for (let i = 0; i < count; i++) {
				await expect(columnElements.nth(i)).toBeVisible();
			}

			// Verify CSS grid still shows 4 columns
			const columnsContainer = page.locator('[data-testid="kanban-columns"]');
			const gridTemplate = await columnsContainer.evaluate((el) => {
				return window.getComputedStyle(el).gridTemplateColumns;
			});

			const columnValues = gridTemplate.split(' ').filter((val) => val && val !== 'none');
			expect(columnValues.length).toBe(4);
		}
	});

	test('should handle navigation state correctly', async ({ page }) => {
		// Verify kanban tab is active by default
		const kanbanTab = page.locator('[data-testid="nav-item-kanban"]');
		await expect(kanbanTab).toHaveAttribute('aria-selected', 'true');

		// Verify navigation store integration
		const activeView = page.locator('text=kanban').first();
		await expect(activeView).toBeVisible();
	});

	test('should support sidebar toggle functionality', async ({ page }) => {
		// Find and click sidebar toggle button
		const toggleButton = page.locator('button:has-text("Sidebar")');
		await expect(toggleButton).toBeVisible();

		// Get initial layout state
		const appShell = page.locator('[data-testid="app-shell"]');
		const initialCollapsed = await appShell.getAttribute('data-collapsed');

		// Toggle sidebar
		await toggleButton.click();

		// Wait for animation to complete
		await page.waitForTimeout(500);

		// Verify state changed
		const newCollapsed = await appShell.getAttribute('data-collapsed');
		expect(newCollapsed).not.toBe(initialCollapsed);

		// Toggle back
		await toggleButton.click();
		await page.waitForTimeout(500);

		// Verify state returned to original
		const finalCollapsed = await appShell.getAttribute('data-collapsed');
		expect(finalCollapsed).toBe(initialCollapsed);
	});

	test('should display empty board state when no tasks exist', async ({ page }) => {
		// Wait for board to load
		await page.waitForSelector('[data-testid="kanban-board"]');

		// Verify empty state message is displayed
		const emptyMessage = page.locator('text=Your board is empty');
		await expect(emptyMessage).toBeVisible();

		// Verify empty state icon
		const emptyIcon = page.locator('text=📋').first();
		await expect(emptyIcon).toBeVisible();
	});

	test('should handle responsive layout changes', async ({ page }) => {
		// Test desktop layout
		await page.setViewportSize({ width: 1200, height: 800 });
		await page.waitForTimeout(300);

		const appShell = page.locator('[data-testid="app-shell"]');
		const isMobile = await appShell.getAttribute('data-mobile');
		expect(isMobile).toBe('false');

		// Test mobile layout
		await page.setViewportSize({ width: 600, height: 800 });
		await page.waitForTimeout(500);

		const newIsMobile = await appShell.getAttribute('data-mobile');
		expect(newIsMobile).toBe('true');

		// Verify mobile layout adjustments
		const sidebar = page.locator('[data-testid="navigation-sidebar"]');
		await expect(sidebar).toBeVisible();
	});

	test('should display board statistics correctly', async ({ page }) => {
		// Wait for board to load
		await page.waitForSelector('[data-testid="kanban-board"]');

		// Verify statistics footer is present
		const statsFooter = page.locator('footer').last();
		await expect(statsFooter).toBeVisible();

		// Verify column statistics
		const todoCount = page.locator('text=To Do').last();
		await expect(todoCount).toBeVisible();

		const inProgressCount = page.locator('text=In Progress').last();
		await expect(inProgressCount).toBeVisible();

		const testingCount = page.locator('text=Testing').last();
		await expect(testingCount).toBeVisible();

		const doneCount = page.locator('text=Done').last();
		await expect(doneCount).toBeVisible();
	});

	test('should handle keyboard navigation', async ({ page }) => {
		// Focus on the application
		await page.locator('[data-testid="app-shell"]').focus();

		// Test Ctrl+B for sidebar toggle
		const appShell = page.locator('[data-testid="app-shell"]');
		const initialCollapsed = await appShell.getAttribute('data-collapsed');

		await page.keyboard.press('Control+b');
		await page.waitForTimeout(300);

		const newCollapsed = await appShell.getAttribute('data-collapsed');
		expect(newCollapsed).not.toBe(initialCollapsed);
	});

	test('should handle error states gracefully', async ({ page }) => {
		// Simulate storage error by corrupting localStorage
		await page.evaluate(() => {
			localStorage.setItem('kanban_board_data', 'invalid-json');
		});

		// Reload page to trigger error
		await page.reload();

		// Wait for application to load
		await page.waitForSelector('[data-testid="app-shell"]', { timeout: 10000 });

		// Application should still load despite storage error
		const kanbanBoard = page.locator('[data-testid="kanban-board"]');
		await expect(kanbanBoard).toBeVisible();

		// Error should be cleared and board should show empty state
		const emptyMessage = page.locator('text=Your board is empty');
		await expect(emptyMessage).toBeVisible();
	});

	test('should maintain proper ARIA labels and accessibility', async ({ page }) => {
		// Verify main application has proper ARIA label
		const appShell = page.locator('[data-testid="app-shell"]');
		await expect(appShell).toHaveAttribute('role', 'application');
		await expect(appShell).toHaveAttribute('aria-label', 'AI-Native Kanban Application');

		// Verify main content has proper role
		const mainContent = page.locator('[data-testid="main-content"]');
		await expect(mainContent).toHaveAttribute('role', 'main');

		// Verify kanban board has proper ARIA label
		const kanbanBoard = page.locator('[data-testid="kanban-board"]');
		await expect(kanbanBoard).toHaveAttribute('role', 'main');

		// Verify navigation has proper role
		const navigation = page.locator('[data-testid="navigation-sidebar"]');
		await expect(navigation).toHaveAttribute('role', 'navigation');
	});

	test('should display completion status in footer', async ({ page }) => {
		// Wait for application to load
		await page.waitForSelector('[data-testid="main-app-content"]');

		// Verify completion status message
		const completionMessage = page.locator('text=AI-Native Kanban Foundation Complete');
		await expect(completionMessage).toBeVisible();

		// Verify feature checkmarks
		const features = [
			'AppShell Integration',
			'Component Mounting',
			'State Management',
			'Error Recovery'
		];

		for (const feature of features) {
			const featureCheck = page.locator(`text=✓ ${feature}`);
			await expect(featureCheck).toBeVisible();
		}
	});

	test('should handle animation performance requirements', async ({ page }) => {
		// Measure page load animation timing
		const startTime = Date.now();

		await page.goto('/');
		await page.waitForSelector('[data-testid="kanban-board"]');

		// Wait for animations to complete
		await page.waitForTimeout(1000);

		const endTime = Date.now();
		const totalTime = endTime - startTime;

		// Verify total load time is reasonable (under 3 seconds)
		expect(totalTime).toBeLessThan(3000);

		// Verify no animation performance warnings in console
		const logs: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'warning' && msg.text().includes('animation took')) {
				logs.push(msg.text());
			}
		});

		// Trigger sidebar toggle to test animation performance
		const toggleButton = page.locator('button:has-text("Sidebar")');
		await toggleButton.click();
		await page.waitForTimeout(500);

		// Should not have performance warnings for normal interactions
		expect(logs.length).toBe(0);
	});

	test('should support development mode features', async ({ page }) => {
		// In development mode, should show debug info
		const debugInfo = page.locator('text=Development Mode');

		// This will only be visible in dev mode
		if (await debugInfo.isVisible()) {
			await expect(debugInfo).toContainText('Error Recovery Active');

			// Should also show viewport debug info
			const viewportInfo = page.locator('text=Viewport:');
			await expect(viewportInfo).toBeVisible();
		}
	});
});

test.describe('Application State Management Integration', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('[data-testid="app-shell"]');
	});

	test('should persist and restore navigation state', async ({ page }) => {
		// Verify initial state
		const activeView = page.locator('text=kanban').first();
		await expect(activeView).toBeVisible();

		// Toggle sidebar
		const toggleButton = page.locator('button:has-text("Sidebar")');
		await toggleButton.click();
		await page.waitForTimeout(300);

		// Reload page
		await page.reload();
		await page.waitForSelector('[data-testid="app-shell"]');

		// Navigation should be restored to kanban
		const restoredView = page.locator('text=kanban').first();
		await expect(restoredView).toBeVisible();
	});

	test('should handle store initialization correctly', async ({ page }) => {
		// Verify stores are properly initialized
		await page.waitForSelector('[data-testid="main-app-content"]');

		// Check that navigation store is working
		const kanbanTab = page.locator('[data-testid="nav-item-kanban"]');
		await expect(kanbanTab).toHaveAttribute('aria-selected', 'true');

		// Check that kanban store is working
		const kanbanBoard = page.locator('[data-testid="kanban-board"]');
		await expect(kanbanBoard).toBeVisible();

		// Verify empty state is properly handled
		const emptyMessage = page.locator('text=Your board is empty');
		await expect(emptyMessage).toBeVisible();
	});
});

test.describe('Error Recovery Integration', () => {
	test('should recover from navigation errors', async ({ page }) => {
		// Navigate to app
		await page.goto('/');
		await page.waitForSelector('[data-testid="app-shell"]');

		// Simulate navigation error by corrupting navigation state
		await page.evaluate(() => {
			// Access the navigation store and corrupt it
			window.dispatchEvent(new CustomEvent('navigation-error'));
		});

		// Application should still be functional
		const appShell = page.locator('[data-testid="app-shell"]');
		await expect(appShell).toBeVisible();

		// Navigation should fall back to kanban
		const activeView = page.locator('text=kanban').first();
		await expect(activeView).toBeVisible();
	});

	test('should handle initialization errors gracefully', async ({ page }) => {
		// Simulate initialization error
		await page.route('**/*', (route) => {
			if (route.request().url().includes('favicon')) {
				route.abort();
			} else {
				route.continue();
			}
		});

		await page.goto('/');

		// Application should still load despite favicon error
		await page.waitForSelector('[data-testid="app-shell"]', { timeout: 10000 });

		const kanbanBoard = page.locator('[data-testid="kanban-board"]');
		await expect(kanbanBoard).toBeVisible();
	});
});
