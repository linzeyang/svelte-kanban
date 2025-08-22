/**
 * Basic integration test to verify the application loads and components are integrated
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Application Integration', () => {
	test('should load the application with all components integrated', async ({ page }) => {
		// Navigate to the application
		await page.goto('/');

		// Wait for the application to load
		await page.waitForLoadState('networkidle');

		// Verify the page title
		await expect(page).toHaveTitle(/AI-Native Kanban/);

		// Verify main application elements are present
		const appShell = page.locator('[data-testid="app-shell"]');
		await expect(appShell).toBeVisible();

		// Verify navigation sidebar is integrated
		const sidebar = page.locator('[data-testid="navigation-sidebar"]');
		await expect(sidebar).toBeVisible();

		// Verify main content area is integrated
		const mainContent = page.locator('[data-testid="main-content"]');
		await expect(mainContent).toBeVisible();

		// Verify kanban board is integrated
		const kanbanBoard = page.locator('[data-testid="kanban-board"]');
		await expect(kanbanBoard).toBeVisible();

		// Verify application header is displayed
		const appTitle = page.locator('h1').first();
		await expect(appTitle).toContainText('AI-Native Kanban');

		// Verify system status is shown
		const systemStatus = page.locator('text=System Online');
		await expect(systemStatus).toBeVisible();

		// Verify completion footer is displayed
		const completionFooter = page.locator('text=AI-Native Kanban Foundation Complete');
		await expect(completionFooter).toBeVisible();

		// Verify all integration checkmarks are present
		const integrationFeatures = [
			'AppShell Integration',
			'Component Mounting',
			'State Management',
			'Error Recovery'
		];

		for (const feature of integrationFeatures) {
			const featureCheck = page.locator(`text=✓ ${feature}`);
			await expect(featureCheck).toBeVisible();
		}
	});

	test('should handle navigation state integration', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Verify kanban tab is active by default
		const kanbanTab = page.locator('[data-testid="nav-item-kanban"]');
		await expect(kanbanTab).toHaveAttribute('aria-selected', 'true');

		// Verify active view is displayed in status
		const activeView = page.locator('text=View:').locator('..').locator('text=kanban');
		await expect(activeView).toBeVisible();
	});

	test('should handle responsive layout integration', async ({ page }) => {
		// Test desktop layout
		await page.setViewportSize({ width: 1200, height: 800 });
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const appShell = page.locator('[data-testid="app-shell"]');
		await expect(appShell).toBeVisible();

		// Test mobile layout
		await page.setViewportSize({ width: 600, height: 800 });
		await page.waitForTimeout(500);

		// Application should still be functional
		await expect(appShell).toBeVisible();
		const kanbanBoard = page.locator('[data-testid="kanban-board"]');
		await expect(kanbanBoard).toBeVisible();
	});
});
