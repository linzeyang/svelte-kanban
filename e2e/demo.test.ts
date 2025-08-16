import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'AI-Native Kanban' })).toBeVisible();
});

test('navigation sidebar is visible and functional', async ({ page }) => {
	await page.goto('/');

	// Check that navigation sidebar is visible
	const sidebar = page.getByTestId('navigation-sidebar');
	await expect(sidebar).toBeVisible();

	// Check that the navigation title is visible within the sidebar
	await expect(sidebar.getByRole('heading', { name: 'Kanban' })).toBeVisible();

	// Check that navigation items are present (currently only Kanban item exists)
	await expect(page.getByRole('tab', { name: 'Navigate to Kanban' })).toBeVisible();

	// Check that the navigation item has the correct icon
	await expect(page.getByText('📋')).toBeVisible();

	// Check that the sidebar toggle button is present
	await expect(page.getByTestId('sidebar-toggle')).toBeVisible();
});

test('page layout and content structure', async ({ page }) => {
	await page.goto('/');

	// Check main content area
	await expect(page.locator('main')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'AI-Native Kanban' })).toBeVisible();

	// Check that features list is present
	await expect(page.getByRole('heading', { name: 'Features Implemented:' })).toBeVisible();
	await expect(page.getByText('Responsive navigation sidebar')).toBeVisible();
	await expect(page.getByText('Modern neon-themed styling')).toBeVisible();
});

test('sidebar toggle functionality', async ({ page }) => {
	await page.goto('/');

	// Check that sidebar starts expanded (default state)
	const sidebar = page.getByTestId('navigation-sidebar');
	await expect(sidebar).toBeVisible();

	// Check that the navigation item label is visible (expanded state)
	const navItem = page.getByTestId('nav-item-kanban');
	await expect(navItem).toBeVisible();
	await expect(navItem.getByText('Kanban')).toBeVisible();

	// Click the toggle button to collapse
	await page.getByTestId('sidebar-toggle').click();

	// Wait a moment for the animation
	await page.waitForTimeout(350);

	// The sidebar should still be visible but collapsed
	await expect(sidebar).toBeVisible();

	// Click toggle again to expand
	await page.getByTestId('sidebar-toggle').click();

	// Wait for animation
	await page.waitForTimeout(350);

	// The navigation item should be visible again with its label
	await expect(navItem).toBeVisible();
	await expect(navItem.getByText('Kanban')).toBeVisible();
});
