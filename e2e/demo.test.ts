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

	// Check that the navigation item has the correct icon within the sidebar
	await expect(sidebar.getByText('📋')).toBeVisible();

	// Check that the sidebar toggle button is present
	await expect(page.getByTestId('sidebar-toggle')).toBeVisible();
});

test('page layout and content structure', async ({ page }) => {
	await page.goto('/');

	// Check main content area
	await expect(page.locator('main')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'AI-Native Kanban' })).toBeVisible();

	// Check that app description is present
	await expect(
		page.getByText('Modern project management with AI-powered task breakdown and optimization.')
	).toBeVisible();

	// Check that system status is present
	await expect(page.getByText('System Online')).toBeVisible();
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

test('desktop layout has sidebar and main content side-by-side', async ({ page }) => {
	await page.setViewportSize({ width: 1200, height: 800 });
	await page.goto('/');

	// Get the app shell and main content elements
	const appShell = page.locator('[data-testid="app-shell"]');
	const sidebar = page.getByTestId('navigation-sidebar');
	const mainContent = page.locator('.main-content-area');

	// Check that all elements are visible
	await expect(appShell).toBeVisible();
	await expect(sidebar).toBeVisible();
	await expect(mainContent).toBeVisible();

	// Get bounding boxes to verify layout positioning
	const appBox = await appShell.boundingBox();
	const sidebarBox = await sidebar.boundingBox();
	const mainBox = await mainContent.boundingBox();

	// Verify sidebar and main content are positioned side-by-side
	// The key insight: main content should be to the right of sidebar
	const sidebarRightEdge = sidebarBox!.x + sidebarBox!.width;
	const mainStartsAfterSidebar = mainBox!.x >= sidebarRightEdge - 10;
	const combinedWidth = sidebarBox!.width + mainBox!.width;

	expect(mainStartsAfterSidebar).toBe(true);
	expect(combinedWidth).toBeCloseTo(appBox!.width, 50); // Allow some tolerance

	// Verify they are roughly at the same vertical position (same row)
	expect(Math.abs(sidebarBox!.y - mainBox!.y)).toBeLessThan(100);
});

test('mobile layout has sidebar hidden and main content full width', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 800 });
	await page.goto('/');

	const appShell = page.locator('[data-testid="app-shell"]');
	const sidebar = page.getByTestId('navigation-sidebar');
	const mainContent = page.locator('.main-content-area');

	// Check that main content is visible
	await expect(mainContent).toBeVisible();

	// Get bounding boxes to verify mobile layout
	const appBox = await appShell.boundingBox();
	const mainBox = await mainContent.boundingBox();

	// Main content should be full width on mobile
	expect(mainBox?.width).toBeCloseTo(appBox!.width, 20);
	expect(mainBox?.x).toBeCloseTo(0, 20);

	// Sidebar should be positioned off-screen initially (mobile overlay behavior)
	const sidebarBox = await sidebar.boundingBox();
	expect(sidebarBox?.x).toBeLessThan(0); // Off-screen to the left
});

test('mobile responsive behavior works correctly', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 800 });
	await page.goto('/');

	const appShell = page.locator('[data-testid="app-shell"]');
	const sidebar = page.getByTestId('navigation-sidebar');
	const mainContent = page.locator('.main-content-area');

	// Check that elements are visible
	await expect(appShell).toBeVisible();
	await expect(mainContent).toBeVisible();

	// Verify mobile responsive behavior
	const appBox = await appShell.boundingBox();
	const mainBox = await mainContent.boundingBox();
	const sidebarBox = await sidebar.boundingBox();

	// Main content should occupy full width
	expect(mainBox?.width).toBeCloseTo(appBox!.width, 20);

	// Sidebar should be positioned off-screen for mobile overlay
	expect(sidebarBox?.x).toBeLessThan(0);

	// The key test: verify the layout is responsive by checking
	// that the app-shell has the correct mobile data attribute
	const isMobile = await appShell.getAttribute('data-mobile');
	expect(isMobile).toBe('true');
});

test('visual regression - desktop layout', async ({ page }) => {
	await page.setViewportSize({ width: 1200, height: 800 });
	await page.goto('/');

	// Wait for layout to stabilize
	await page.waitForLoadState('networkidle');

	// Wait for layout ready signal
	await page.waitForFunction(
		() => {
			const appShell = document.querySelector('[data-testid="app-shell"]');
			return appShell?.getAttribute('data-layout-ready') === 'true';
		},
		{ timeout: 5000 }
	);

	await page.waitForTimeout(300); // Additional stabilization time

	// Take screenshot of the entire page for visual regression
	await expect(page).toHaveScreenshot('desktop-layout.png', {
		maxDiffPixels: 50000, // Allow larger differences for content changes and system variations
		animations: 'disabled', // Ensure consistent state
		threshold: 0.3 // Allow 30% pixel difference to account for content updates
	});
});

test('visual regression - mobile layout', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 800 });
	await page.goto('/');

	// Wait for layout to stabilize
	await page.waitForLoadState('networkidle');

	// Wait for layout ready signal
	await page.waitForFunction(
		() => {
			const appShell = document.querySelector('[data-testid="app-shell"]');
			return appShell?.getAttribute('data-layout-ready') === 'true';
		},
		{ timeout: 5000 }
	);

	await page.waitForTimeout(300); // Additional stabilization time

	// Take screenshot of the entire page for visual regression
	await expect(page).toHaveScreenshot('mobile-layout.png', {
		maxDiffPixels: 50000, // Allow larger differences for content changes and system variations
		animations: 'disabled', // Ensure consistent state
		threshold: 0.3 // Allow 30% pixel difference to account for content updates
	});
});
