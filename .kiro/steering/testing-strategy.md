# Testing Strategy and Guidelines

## Testing Philosophy

- Maintain comprehensive test coverage across all features
- Follow test-driven development (TDD) practices when possible
- Focus on user behavior and business logic testing
- Ensure tests are maintainable and reliable
- Prioritize integration tests for AI workflows
- Test performance requirements (drag < 300ms, AI < 60s)

## Unit Testing Guidelines

### Component Testing with Svelte 5 Built-in Functions

```typescript
import { flushSync, mount, unmount } from 'svelte';
import { expect, test, describe } from 'vitest';
import TaskCard from '$lib/components/kanban/TaskCard.svelte';

describe('TaskCard', () => {
	test('renders task information correctly', () => {
		const task = {
			id: '1',
			title: 'Test Task',
			description: 'Test Description',
			status: 'todo'
		};

		const component = mount(TaskCard, {
			target: document.body,
			props: { task }
		});

		expect(document.body.innerHTML).toContain('Test Task');
		expect(document.body.innerHTML).toContain('Test Description');

		unmount(component);
	});

	test('handles drag events properly', () => {
		const task = { id: '1', title: 'Test', status: 'todo' };
		const onDragStart = vi.fn();

		const component = mount(TaskCard, {
			target: document.body,
			props: { task, onDragStart }
		});

		const card = document.body.querySelector('[role="article"]');
		card?.dispatchEvent(new DragEvent('dragstart'));
		flushSync();

		expect(onDragStart).toHaveBeenCalledWith(task);

		unmount(component);
	});
});
```

### Alternative: Using Testing Library (Optional)

```typescript
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, describe } from 'vitest';
import TaskCard from '$lib/components/kanban/TaskCard.svelte';

describe('TaskCard with Testing Library', () => {
	test('renders and handles interactions', async () => {
		const user = userEvent.setup();
		const task = { id: '1', title: 'Test Task', status: 'todo' };
		const onDragStart = vi.fn();

		render(TaskCard, { props: { task, onDragStart } });

		expect(screen.getByText('Test Task')).toBeInTheDocument();

		const card = screen.getByRole('article');
		await user.pointer({ keys: '[MouseLeft>]', target: card });

		expect(onDragStart).toHaveBeenCalled();
	});
});
```

### Service Testing

```typescript
import { describe, test, expect, vi } from 'vitest';
import { AIService } from '$lib/services/ai-service';

describe('AIService', () => {
	test('breaks down requirements successfully', async () => {
		const mockResponse = {
			tasks: [{ id: '1', title: 'Task 1', status: 'todo' }],
			summary: 'Created 1 task'
		};

		// Mock fetch response
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockResponse)
		});

		const result = await AIService.breakdownRequirement('Create user login');

		expect(result.tasks).toHaveLength(1);
		expect(result.tasks[0].title).toBe('Task 1');
	});
});
```

### Testing Runes and Effects

```typescript
import { flushSync } from 'svelte';
import { expect, test, describe } from 'vitest';

describe('Reactive Logic', () => {
	test('state updates correctly', () => {
		const cleanup = $effect.root(() => {
			let count = $state(0);
			let doubled = $derived(count * 2);

			expect(doubled).toBe(0);

			count = 5;
			flushSync();

			expect(doubled).toBe(10);
		});

		cleanup();
	});

	test('effects run properly', () => {
		const cleanup = $effect.root(() => {
			let count = $state(0);
			let effectRuns = 0;

			$effect(() => {
				count; // read count to create dependency
				effectRuns++;
			});

			flushSync();
			expect(effectRuns).toBe(1);

			count = 1;
			flushSync();

			expect(effectRuns).toBe(2);
		});

		cleanup();
	});
});
```

## E2E Testing Guidelines

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Kanban Board', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('should allow adding new requirements', async ({ page }) => {
		// Click add requirement button
		await page.click('[data-testid="add-requirement-btn"]');

		// Fill in requirement
		await page.fill('[data-testid="requirement-input"]', 'Create user authentication');

		// Submit form
		await page.click('[data-testid="submit-requirement"]');

		// Wait for AI processing to complete
		await page.waitForSelector('[data-testid="task-card"]', { timeout: 60000 });

		// Verify tasks are created
		await expect(page.locator('[data-testid="task-card"]')).toHaveCount(1);
	});

	test('should support drag and drop between columns', async ({ page }) => {
		// Create a task first
		await page.click('[data-testid="add-requirement-btn"]');
		await page.fill('[data-testid="requirement-input"]', 'Test task');
		await page.click('[data-testid="submit-requirement"]');

		// Wait for task creation
		await page.waitForSelector('[data-testid="task-card"]');

		// Drag task from todo to in-progress
		const task = page.locator('[data-testid="task-card"]').first();
		const inProgressColumn = page.locator('[data-testid="column-in-progress"]');

		await task.dragTo(inProgressColumn);

		// Verify task moved (should happen within 300ms as per performance requirements)
		await expect(inProgressColumn.locator('[data-testid="task-card"]')).toHaveCount(1);
	});

	test('should optimize stories with AI', async ({ page }) => {
		// Create a task first
		await page.click('[data-testid="add-requirement-btn"]');
		await page.fill('[data-testid="requirement-input"]', 'User login feature');
		await page.click('[data-testid="submit-requirement"]');

		// Wait for task creation
		await page.waitForSelector('[data-testid="task-card"]');

		// Click on task to optimize
		await page.click('[data-testid="task-card"]');

		// Wait for optimization modal
		await page.waitForSelector('[data-testid="optimize-story-modal"]');

		// Click optimize button
		await page.click('[data-testid="optimize-story-btn"]');

		// Wait for AI optimization (up to 60 seconds)
		await page.waitForSelector('[data-testid="optimization-result"]', { timeout: 60000 });

		// Verify optimization results are displayed
		await expect(page.locator('[data-testid="optimization-result"]')).toBeVisible();
	});
});
```

## AI-Specific Testing Priorities

- Test AI requirement breakdown workflows end-to-end
- Verify AI processing timeouts and error handling
- Test drag and drop performance requirements (< 300ms)
- Validate AI-generated task data structures
- Test story optimization acceptance/rejection flows

## Test Data Management

- Use factories for creating test data
- Mock external API calls consistently
- Clean up test data after each test
- Use realistic test data that matches production scenarios

## Performance Testing

- Test drag operation response times (< 300ms)
- Verify AI operation timeouts (60 seconds)
- Monitor animation performance
- Test with large datasets

## Accessibility Testing

- Include accessibility checks in E2E tests
- Test keyboard navigation
- Verify screen reader compatibility
- Check color contrast ratios

## CI/CD Integration

- Run tests on every pull request
- Require passing tests before merge
- Generate and publish coverage reports
- Run E2E tests against deployed previews

> **Note**: For complete testing implementation, Vitest 3.2+ configuration, custom matchers, and testing patterns, see `modern-stack-guide.md`
