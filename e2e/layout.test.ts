/**
 * CSS Layout Integration Tests
 *
 * Tests specifically focused on verifying the kanban board layout requirements,
 * including the 4-column grid layout that was fixed to prevent 2x2 grid display.
 */

import { test, expect } from '@playwright/test';

test.describe('Kanban Board Layout Tests', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the application
		await page.goto('/');

		// Wait for application to initialize
		await page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });
	});

	test('should display exactly 4 columns in horizontal layout', async ({ page }) => {
		// Set desktop viewport
		await page.setViewportSize({ width: 1200, height: 800 });

		// Get all column wrappers
		const columnWrappers = page.locator('[data-testid^="column-wrapper-"]');
		const columnCount = await columnWrappers.count();

		// Verify exactly 4 columns exist
		expect(columnCount).toBe(4);

		// Verify specific columns are present
		const expectedColumns = ['todo', 'in-progress', 'testing', 'done'];
		for (const columnId of expectedColumns) {
			const column = page.locator(`[data-testid="column-wrapper-${columnId}"]`);
			await expect(column).toBeVisible();
		}
	});

	test('should use CSS Grid with 4-column template', async ({ page }) => {
		// Set desktop viewport
		await page.setViewportSize({ width: 1200, height: 800 });

		const columnsContainer = page.locator('[data-testid="kanban-columns"]');

		// Verify CSS Grid is being used
		const displayValue = await columnsContainer.evaluate((el) => {
			return window.getComputedStyle(el).display;
		});
		expect(displayValue).toBe('grid');

		// Get and examine the actual grid template
		const gridTemplateColumns = await columnsContainer.evaluate((el) => {
			return window.getComputedStyle(el).gridTemplateColumns;
		});

		// Debug: Log the actual value to understand the format
		console.log('Grid template columns:', gridTemplateColumns);

		// Grid template should indicate 4 columns in some form
		// It might be pixel values like "264px 264px 264px 264px" instead of fr units
		const columnValues = gridTemplateColumns.split(' ').filter((val) => val && val !== 'none');
		expect(columnValues.length).toBe(4);

		// Verify it's not a 2-column grid
		expect(columnValues.length).not.toBe(2);
	});

	test('should arrange columns horizontally, not in 2x2 grid', async ({ page }) => {
		// Set desktop viewport
		await page.setViewportSize({ width: 1200, height: 800 });

		const columnWrappers = page.locator('[data-testid^="column-wrapper-"]');

		// Get bounding boxes for all columns
		const columnBoxes: { x: number; y: number; width: number; height: number }[] = [];
		const columnCount = await columnWrappers.count();

		for (let i = 0; i < columnCount; i++) {
			const box = await columnWrappers.nth(i).boundingBox();
			if (box) {
				columnBoxes.push(box);
			}
		}

		// Ensure we have all expected columns
		expect(columnBoxes.length).toBe(columnCount);

		// Verify all columns are on approximately the same horizontal line
		const firstColumnY = columnBoxes[0].y;
		for (let i = 1; i < columnBoxes.length; i++) {
			const yDifference = Math.abs(columnBoxes[i].y - firstColumnY);
			// Allow small tolerance for potential slight variations
			expect(yDifference).toBeLessThan(50);
		}

		// Verify columns are arranged left to right (increasing x positions)
		for (let i = 1; i < columnBoxes.length; i++) {
			expect(columnBoxes[i].x).toBeGreaterThan(columnBoxes[i - 1].x);
		}

		// Verify no column wrapping to second row
		// (which would happen in a 2x2 grid layout)
		const maxY = Math.max(...columnBoxes.map((box) => box.y));
		const minY = Math.min(...columnBoxes.map((box) => box.y));
		const yRange = maxY - minY;

		// Should not have significant Y position differences indicating row wrapping
		expect(yRange).toBeLessThan(100);
	});

	test('should maintain horizontal layout at various desktop widths', async ({ page }) => {
		const testWidths = [1024, 1200, 1400, 1600, 1920];

		for (const width of testWidths) {
			await page.setViewportSize({ width, height: 800 });
			await page.waitForTimeout(300); // Allow layout to settle

			// Verify 4 columns are still visible and horizontal
			const columnWrappers = page.locator('[data-testid^="column-wrapper-"]');
			const columnCount = await columnWrappers.count();
			expect(columnCount).toBe(4);

			// Get Y positions to ensure they're still on same row
			const yPositions: number[] = [];
			for (let i = 0; i < columnCount; i++) {
				const box = await columnWrappers.nth(i).boundingBox();
				if (box) {
					yPositions.push(box.y);
				}
			}

			// All columns should be at approximately same Y position
			const maxY = Math.max(...yPositions);
			const minY = Math.min(...yPositions);
			expect(maxY - minY).toBeLessThan(50);
		}
	});

	test('should apply kanban-board CSS class correctly', async ({ page }) => {
		// Set desktop viewport
		await page.setViewportSize({ width: 1200, height: 800 });

		const columnsContainer = page.locator('[data-testid="kanban-columns"]');

		// Verify the kanban-board class is applied
		const hasKanbanBoardClass = await columnsContainer.evaluate((el) => {
			return el.classList.contains('kanban-board');
		});
		expect(hasKanbanBoardClass).toBe(true);

		// Verify CSS properties set by the kanban-board class
		const cssProperties = await columnsContainer.evaluate((el) => {
			const style = window.getComputedStyle(el);
			return {
				display: style.display,
				gap: style.gap,
				padding: style.padding,
				containerType: style.containerType
			};
		});

		expect(cssProperties.display).toBe('grid');
		expect(cssProperties.gap).toBeTruthy(); // Should have gap for spacing
		expect(cssProperties.padding).toBeTruthy(); // Should have padding
	});

	test('should verify column minimum width constraint is respected', async ({ page }) => {
		// Set desktop viewport
		await page.setViewportSize({ width: 1200, height: 800 });

		const columnWrappers = page.locator('[data-testid^="column-wrapper-"]');
		const columnCount = await columnWrappers.count();

		// Check each column meets minimum width requirements
		for (let i = 0; i < columnCount; i++) {
			const box = await columnWrappers.nth(i).boundingBox();
			// With our CSS fix, columns should be at least close to 220px minimum
			// (actual width may be larger due to fractional distribution)
			expect(box).not.toBeNull();
			expect(box!.width).toBeGreaterThan(200);
		}

		// Verify total container can accommodate 4 columns
		const columnsContainer = page.locator('[data-testid="kanban-columns"]');
		const containerBox = await columnsContainer.boundingBox();

		// Container should be wide enough for 4 columns
		// Rough calculation: 4 * 220px + gaps should fit
		expect(containerBox).not.toBeNull();
		expect(containerBox!.width).toBeGreaterThan(900);
	});

	test('should not fall back to 2-column grid on standard desktop widths', async ({ page }) => {
		// Test the specific issue that was fixed: preventing 2x2 grid layout
		await page.setViewportSize({ width: 1024, height: 800 });

		const columnsContainer = page.locator('[data-testid="kanban-columns"]');

		// Wait for layout to settle
		await page.waitForTimeout(500);

		// Check computed grid template
		const gridTemplate = await columnsContainer.evaluate((el) => {
			return window.getComputedStyle(el).gridTemplateColumns;
		});

		// Should have 4 columns (either fr units or pixel values)
		const columnValues = gridTemplate.split(' ').filter((val) => val && val !== 'none');
		expect(columnValues.length).toBe(4);

		// Specifically verify it's not showing the 2-column fallback that was problematic
		expect(columnValues.length).not.toBe(2);

		// Verify all 4 columns are actually visible
		const visibleColumns = page.locator('[data-testid^="column-wrapper-"]:visible');
		const visibleCount = await visibleColumns.count();
		expect(visibleCount).toBe(4);
	});

	test('should properly handle container query and media query breakpoints', async ({ page }) => {
		// Test desktop breakpoint behavior
		await page.setViewportSize({ width: 1200, height: 800 });

		const columnsContainer = page.locator('[data-testid="kanban-columns"]');

		// At desktop width, should use 4-column layout
		let gridTemplate = await columnsContainer.evaluate((el) => {
			return window.getComputedStyle(el).gridTemplateColumns;
		});

		let columnValues = gridTemplate.split(' ').filter((val) => val && val !== 'none');
		expect(columnValues.length).toBe(4);

		// Test tablet breakpoint (should still show 4 columns due to our fix)
		await page.setViewportSize({ width: 800, height: 800 });
		await page.waitForTimeout(300);

		gridTemplate = await columnsContainer.evaluate((el) => {
			return window.getComputedStyle(el).gridTemplateColumns;
		});

		// Even at 800px, should maintain multiple columns due to our layout fixes
		columnValues = gridTemplate.split(' ').filter((val) => val && val !== 'none');
		expect(columnValues.length).toBeGreaterThanOrEqual(2); // At minimum 2, ideally still 4

		// Test mobile breakpoint
		await page.setViewportSize({ width: 600, height: 800 });
		await page.waitForTimeout(300);

		// At mobile width, layout may change, but board should still be functional
		const visibleColumns = page.locator('[data-testid^="column-wrapper-"]:visible');
		const visibleCount = await visibleColumns.count();
		expect(visibleCount).toBeGreaterThan(0); // At least some columns visible
	});
});
