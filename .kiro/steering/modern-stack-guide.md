# Modern Stack Guide: AI-Native Kanban

## Complete Technology Stack (2025)

This is a comprehensive guide for building the AI-Native Kanban using the latest versions of all technologies:

- **Frontend**: Svelte 5 with runes
- **Framework**: SvelteKit 2 with modern patterns
- **Styling**: TailwindCSS 4.1 with CSS-first configuration
- **Build**: Vite 7 with optional Rolldown bundler
- **Testing**: Vitest 3.2+ with projects configuration
- **E2E**: Playwright with modern browser testing
- **AI**: OpenAI SDK with proper error handling
- **Node.js**: 20.19+ or 22.12+ (18 EOL)

## Project Setup from Scratch

### 1. Initialize Project
```bash
# Create SvelteKit project
npx sv create ai-native-kanban
cd ai-native-kanban

# Install modern dependencies
npm install tailwindcss@latest @tailwindcss/vite@latest
npm install openai
npm install -D vitest@latest @vitest/browser playwright
```

### 2. Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    tailwindcss(), // First-party Vite plugin
    {
      name: 'performance-monitor',
      buildStart() { console.time('Build'); },
      buildEnd() { console.timeEnd('Build'); }
    }
  ],

  // Vite 7 optimizations
  build: {
    target: 'baseline-widely-available', // Chrome 107+, Edge 107+, Firefox 104+, Safari 16.0+
    rollupOptions: {
      output: {
        manualChunks: {
          'ai-vendor': ['openai'],
          'ui-vendor': ['tailwindcss'],
          'framework': ['svelte', '@sveltejs/kit']
        }
      }
    }
  },

  // Dependency optimization
  optimizeDeps: {
    entries: ['src/**/*.{js,ts,svelte}', '!src/**/*.test.{js,ts}'],
    include: ['openai'],
    exclude: ['svelte', '@sveltejs/kit']
  }
});
```

### 3. TailwindCSS 4 Setup
```css
/* src/app.css */
@import "tailwindcss";

@theme {
  /* AI-Native Kanban Design System */
  --color-neon-blue: oklch(0.7 0.25 240);
  --color-neon-purple: oklch(0.65 0.3 300);
  --color-neon-green: oklch(0.8 0.25 120);
  --color-neon-pink: oklch(0.7 0.3 350);

  --color-bg-primary: oklch(0.05 0.01 240);
  --color-bg-secondary: oklch(0.08 0.02 240);
  --color-bg-tertiary: oklch(0.12 0.03 240);
  --color-bg-card: oklch(0.08 0.02 240);

  --color-text-primary: oklch(0.98 0 0);
  --color-text-secondary: oklch(0.8 0 0);
  --color-text-muted: oklch(0.55 0 0);

  --font-display: "Inter", "system-ui", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
  --ease-snappy: cubic-bezier(0.2, 0, 0, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Custom utilities for AI-Native Kanban */
@utility kanban-glow {
  box-shadow:
    0 0 20px color-mix(in oklch, var(--color-neon-blue) 30%, transparent),
    0 0 40px color-mix(in oklch, var(--color-neon-blue) 20%, transparent);
}

@utility task-card {
  background: linear-gradient(135deg,
    color-mix(in oklch, var(--color-bg-card) 90%, var(--color-neon-blue) 10%),
    color-mix(in oklch, var(--color-bg-card) 95%, var(--color-neon-purple) 5%)
  );
  border: 1px solid color-mix(in oklch, var(--color-neon-blue) 20%, transparent);
  backdrop-filter: blur(10px);
}

@utility glass-effect {
  background: color-mix(in oklch, var(--color-bg-card) 80%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid color-mix(in oklch, var(--color-neon-blue) 15%, transparent);
}

@utility ai-pulse {
  animation: ai-pulse 2s ease-in-out infinite;
}

@keyframes ai-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}
```

### 4. Vitest 3.2+ Configuration
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],

    // Projects configuration (replaces workspace)
    projects: [
      {
        test: {
          name: { label: 'unit', color: 'blue' },
          include: ['src/**/*.test.{js,ts}'],
          sequence: { groupOrder: 0 }
        }
      },
      {
        test: {
          name: { label: 'integration', color: 'green' },
          include: ['tests/integration/**/*.test.{js,ts}'],
          sequence: { groupOrder: 0 }
        }
      },
      {
        test: {
          name: { label: 'browser', color: 'yellow' },
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }]
          },
          include: ['tests/browser/**/*.test.{js,ts}'],
          sequence: { groupOrder: 1 }
        }
      }
    ],

    // Enhanced coverage with AST-aware remapping
    coverage: {
      provider: 'v8',
      experimentalAstAwareRemapping: true,
      reporter: ['text', 'json', 'html']
    },

    // Smart test re-running
    watchTriggerPatterns: [
      {
        pattern: /^src\/lib\/services\/ai-service\.(ts|js)$/,
        testsToRun: () => ['src/**/*ai*.test.{js,ts}']
      }
    ]
  }
});
```

## Modern Component Architecture

### Svelte 5 Component with All Modern Features
```svelte
<!-- src/lib/components/kanban/TaskCard.svelte -->
<script lang="ts">
  import type { TaskItem } from '$lib/types';

  interface Props {
    task: TaskItem;
    onUpdate?: (task: TaskItem) => void;
    onDelete?: (id: string) => void;
  }

  let { task, onUpdate, onDelete }: Props = $props();

  // Svelte 5 runes for state management
  let isDragging = $state(false);
  let isOptimizing = $state(false);

  // Derived values
  let statusColor = $derived(() => {
    const colors = {
      'todo': 'status-todo',
      'in-progress': 'status-progress',
      'testing': 'status-testing',
      'done': 'status-done'
    };
    return colors[task.status];
  });

  let priorityIcon = $derived(() => {
    const icons = {
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    };
    return icons[task.priority || 'medium'];
  });

  // Effects for side effects
  $effect(() => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing';
      return () => {
        document.body.style.cursor = '';
      };
    }
  });

  // Event handlers
  function handleDragStart(event: DragEvent) {
    isDragging = true;
    event.dataTransfer?.setData('text/plain', task.id);
  }

  function handleDragEnd() {
    isDragging = false;
  }

  async function optimizeStory() {
    if (isOptimizing) return;

    isOptimizing = true;
    try {
      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story: task.description })
      });

      if (response.ok) {
        const result = await response.json();
        onUpdate?.({ ...task, description: result.optimizedStory });
      }
    } finally {
      isOptimizing = false;
    }
  }
</script>

<!-- Modern TailwindCSS 4 styling -->
<div
  class="task-card {statusColor} rounded-sm p-4 cursor-grab
         transform-3d perspective-1000
         hover:rotate-x-6 hover:scale-105 hover:kanban-glow
         drag:opacity-75 drag:rotate-2 drag:cursor-grabbing
         transition-all duration-300 ease-fluid
         @container"
  draggable="true"
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  role="article"
  aria-label="Task: {task.title}"
>
  <!-- Task header -->
  <div class="flex items-start justify-between mb-3">
    <h3 class="font-semibold text-text-primary
               text-shadow-xs text-shadow-neon-blue/20
               @sm:text-lg">
      {task.title}
    </h3>

    <div class="flex items-center space-x-2">
      <span class="text-sm" title="Priority: {task.priority}">
        {priorityIcon}
      </span>

      {#if task.aiGenerated}
        <div class="w-2 h-2 rounded-full bg-neon-purple ai-pulse"
             title="AI Generated"></div>
      {/if}
    </div>
  </div>

  <!-- Task description -->
  <p class="text-sm text-text-secondary wrap-anywhere mb-4
            @sm:text-base">
    {task.description}
  </p>

  <!-- Task actions -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-2 text-xs text-text-muted">
      <time datetime={task.createdAt.toISOString()}>
        {task.createdAt.toLocaleDateString()}
      </time>
    </div>

    <div class="flex items-center space-x-2">
      {#if task.aiGenerated}
        <button
          onclick={optimizeStory}
          disabled={isOptimizing}
          class="px-2 py-1 text-xs rounded bg-neon-purple/20 text-neon-purple
                 hover:bg-neon-purple/30 not-disabled:hover:scale-105
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-200"
        >
          {isOptimizing ? 'Optimizing...' : 'Optimize'}
        </button>
      {/if}

      <button
        onclick={() => onDelete?.(task.id)}
        class="p-1 text-text-muted hover:text-red-400
               hover:scale-110 transition-all duration-200"
        aria-label="Delete task"
      >
        ×
      </button>
    </div>
  </div>
</div>
```

### SvelteKit 2 API Route
```typescript
// src/routes/api/ai/breakdown/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { requirement } = await request.json();

    if (!requirement?.trim()) {
      error(400, 'Requirement text is required');
    }

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{
          role: 'system',
          content: 'You are an expert at breaking down requirements into actionable tasks for a Kanban board. Return a JSON array of tasks with id, title, description, and status fields.'
        }, {
          role: 'user',
          content: `Break down this requirement: ${requirement}`
        }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      error(response.status, errorData.error?.message || 'AI service unavailable');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;

    if (!content) {
      error(500, 'Invalid AI response');
    }

    // Parse AI response and create tasks
    const tasks = JSON.parse(content).map((task: any) => ({
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      aiGenerated: true,
      originalRequirement: requirement
    }));

    return json({
      tasks,
      summary: `Created ${tasks.length} tasks from requirement`
    });

  } catch (err) {
    if (err.status) throw err; // Re-throw SvelteKit errors

    console.error('AI breakdown error:', err);
    error(500, 'Failed to process requirement');
  }
};
```

### Modern State Management
```typescript
// src/lib/stores/kanban.svelte.ts
import type { TaskItem, TaskStatus } from '$lib/types';

class KanbanStore {
  private tasks = $state<TaskItem[]>([]);
  private isLoading = $state(false);
  private error = $state<string | null>(null);

  // Derived state for each column
  todoTasks = $derived(this.tasks.filter(t => t.status === 'todo'));
  inProgressTasks = $derived(this.tasks.filter(t => t.status === 'in-progress'));
  testingTasks = $derived(this.tasks.filter(t => t.status === 'testing'));
  doneTasks = $derived(this.tasks.filter(t => t.status === 'done'));

  // Computed statistics
  totalTasks = $derived(this.tasks.length);
  completedTasks = $derived(this.doneTasks.length);
  aiGeneratedTasks = $derived(this.tasks.filter(t => t.aiGenerated).length);
  completionRate = $derived(
    this.totalTasks > 0 ? (this.completedTasks / this.totalTasks) * 100 : 0
  );

  // Getters
  get allTasks() { return this.tasks; }
  get loading() { return this.isLoading; }
  get errorMessage() { return this.error; }

  // Actions
  async addRequirement(requirement: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement })
      });

      if (!response.ok) {
        throw new Error('Failed to process requirement');
      }

      const { tasks } = await response.json();
      this.tasks.push(...tasks);
      this.saveToStorage();

    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      this.isLoading = false;
    }
  }

  moveTask(taskId: string, newStatus: TaskStatus) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = newStatus;
      task.updatedAt = new Date();
      this.saveToStorage();
    }
  }

  updateTask(taskId: string, updates: Partial<TaskItem>) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.tasks[index] = {
        ...this.tasks[index],
        ...updates,
        updatedAt: new Date()
      };
      this.saveToStorage();
    }
  }

  deleteTask(taskId: string) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      this.saveToStorage();
    }
  }

  // Persistence
  loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('kanban_tasks');
      if (stored) {
        try {
          this.tasks = JSON.parse(stored);
        } catch (err) {
          console.error('Failed to load tasks from storage:', err);
          this.error = 'Failed to load saved tasks';
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('kanban_tasks', JSON.stringify(this.tasks));
      } catch (err) {
        console.error('Failed to save tasks to storage:', err);
        this.error = 'Failed to save tasks';
      }
    }
  }

  // Bulk operations
  clearCompleted() {
    this.tasks = this.tasks.filter(t => t.status !== 'done');
    this.saveToStorage();
  }

  exportData() {
    return {
      version: 1,
      exportedAt: new Date(),
      tasks: this.tasks,
      stats: {
        total: this.totalTasks,
        completed: this.completedTasks,
        aiGenerated: this.aiGeneratedTasks
      }
    };
  }
}

export const kanbanStore = new KanbanStore();
```

## Modern Testing Setup

### Test Setup with Custom Matchers
```typescript
// src/test-setup.ts
import { expect } from 'vitest';
import { locators } from '@vitest/browser/context';

// Custom matchers for AI-Native Kanban
interface CustomMatchers<R = unknown> {
  toBeValidTask: () => R;
  toHaveAIGenerated: (expected: boolean) => R;
  toBeInColumn: (column: TaskStatus) => R;
}

declare module 'vitest' {
  interface Matchers<T = any> extends CustomMatchers<T> {}
}

expect.extend({
  toBeValidTask(actual) {
    const isValid = actual &&
      typeof actual.id === 'string' &&
      typeof actual.title === 'string' &&
      ['todo', 'in-progress', 'testing', 'done'].includes(actual.status);

    return {
      pass: isValid,
      message: () => isValid
        ? `Expected ${JSON.stringify(actual)} not to be a valid task`
        : `Expected ${JSON.stringify(actual)} to be a valid task`
    };
  },

  toHaveAIGenerated(actual, expected) {
    return {
      pass: actual.aiGenerated === expected,
      message: () => `Expected task to ${expected ? 'be' : 'not be'} AI generated`
    };
  },

  toBeInColumn(actual, column) {
    return {
      pass: actual.status === column,
      message: () => `Expected task to be in ${column} column, but was in ${actual.status}`
    };
  }
});

// Custom browser locators for Kanban
locators.extend({
  getByTaskStatus(status: TaskStatus) {
    return `[data-testid="column-${status}"] [data-testid="task-card"]`;
  },

  getByAIGenerated() {
    return '[data-ai-generated="true"]';
  },

  async dragToColumn(this: any, targetColumn: string) {
    const target = this.page.locator(`[data-testid="column-${targetColumn}"]`);
    await this.dragTo(target);
  }
});
```

### Modern Component Test
```typescript
// src/lib/components/kanban/TaskCard.test.ts
import { flushSync, mount, unmount } from 'svelte';
import { expect, test, describe, vi } from 'vitest';
import TaskCard from './TaskCard.svelte';

describe('TaskCard', () => {
  test('renders with modern Svelte 5 patterns', ({ signal }) => {
    const task = {
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      status: 'todo' as const,
      aiGenerated: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const component = mount(TaskCard, {
      target: document.body,
      props: { task }
    });

    // Test custom matchers
    expect(task).toBeValidTask();
    expect(task).toHaveAIGenerated(true);
    expect(task).toBeInColumn('todo');

    // Test DOM output
    expect(document.body.innerHTML).toContain('Test Task');
    expect(document.body.innerHTML).toContain('AI Generated');

    // Cleanup on signal abort
    signal.addEventListener('abort', () => unmount(component));
    unmount(component);
  });

  test('handles AI optimization with explicit resource management', async () => {
    using fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ optimizedStory: 'Optimized description' }))
    );

    const task = { id: '1', title: 'Test', description: 'Original', status: 'todo' as const };
    const onUpdate = vi.fn();

    const component = mount(TaskCard, {
      target: document.body,
      props: { task, onUpdate }
    });

    // Click optimize button
    const optimizeBtn = document.body.querySelector('[data-testid="optimize-btn"]');
    optimizeBtn?.click();

    // Wait for async operation
    await vi.waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Optimized description' })
      );
    });

    unmount(component);
    // fetchSpy automatically restored due to 'using'
  });
});
```

### E2E Test with Modern Features
```typescript
// tests/kanban.spec.ts
import { test, expect } from '@playwright/test';

test.describe('AI-Native Kanban', () => {
  test('complete workflow with AI features', async ({ page }) => {
    await page.goto('/');

    // Test annotations for tracking
    test.annotation('feature', 'AI requirement breakdown');
    test.annotation('performance', 'Should complete within 60 seconds');

    // Add requirement
    await page.click('[data-testid="add-requirement-btn"]');
    await page.fill('[data-testid="requirement-input"]',
      'Create user authentication with login and registration');

    const startTime = performance.now();
    await page.click('[data-testid="submit-btn"]');

    // Wait for AI processing
    await page.waitForSelector('[data-testid="task-card"]', { timeout: 60000 });

    const endTime = performance.now();
    const duration = endTime - startTime;
    test.annotation('actual-performance', `AI processing took ${duration}ms`);

    // Verify tasks created
    const tasks = page.getByAIGenerated();
    await expect(tasks).toHaveCount.greaterThan(0);

    // Test drag and drop with performance monitoring
    const todoTasks = page.getByTaskStatus('todo');
    await expect(todoTasks.first()).toBeVisible();

    const dragStart = performance.now();
    await todoTasks.first().dragToColumn('in-progress');
    const dragEnd = performance.now();

    const dragDuration = dragEnd - dragStart;
    test.annotation('drag-performance', `Drag operation took ${dragDuration}ms`);

    // Verify drag completed within performance target
    expect(dragDuration).toBeLessThan(300);

    // Verify task moved
    const inProgressTasks = page.getByTaskStatus('in-progress');
    await expect(inProgressTasks).toHaveCount(1);
  });
});
```

## Environment Configuration

### Environment Variables
```bash
# .env
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4
```

### SvelteKit Environment Usage
```typescript
// src/routes/api/ai/+server.ts
import { OPENAI_API_KEY } from '$env/static/private';
import { PUBLIC_APP_NAME } from '$env/static/public';

// For runtime values (not during prerendering)
import { env } from '$env/dynamic/private';
```

## Performance Monitoring

### Built-in Performance Tracking
```typescript
// src/lib/utils/performance.ts
class PerformanceTracker {
  private metrics = new Map<string, number[]>();

  measure<T>(name: string, operation: () => T): T {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;

    this.recordMetric(name, duration);

    // Log warnings for performance targets
    const thresholds = {
      'drag-operation': 300,
      'ai-request': 60000,
      'animation': 16.67
    };

    if (duration > (thresholds[name] || 1000)) {
      console.warn(`${name} took ${duration}ms (threshold: ${thresholds[name]}ms)`);
    }

    return result;
  }

  private recordMetric(name: string, duration: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const measurements = this.metrics.get(name)!;
    measurements.push(duration);

    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  getStats(name: string) {
    const measurements = this.metrics.get(name) || [];
    if (measurements.length === 0) return null;

    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return { avg, min, max, count: measurements.length };
  }
}

export const performanceTracker = new PerformanceTracker();
```

## Modern Development Workflow

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:browser": "vitest --browser",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage",
    "lint": "eslint .",
    "format": "prettier --write .",
    "check": "svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-check --tsconfig ./tsconfig.json --watch"
  }
}
```

### Development Best Practices

1. **Use Svelte 5 runes** for all reactive state
2. **Implement proper TypeScript** with PageProps/LayoutProps
3. **Use TailwindCSS 4 CSS-first** configuration
4. **Leverage container queries** for responsive design
5. **Use modern CSS features** (OKLCH, @starting-style, 3D transforms)
6. **Implement comprehensive testing** with Vitest 3.2+ projects
7. **Monitor performance** with built-in tracking
8. **Use SvelteKit 2 patterns** for error handling and routing
9. **Optimize for modern browsers** (baseline-widely-available)
10. **Use Vite 7 features** for optimal build performance

This guide provides everything needed to build a modern, high-performance AI-Native Kanban application using the latest versions of all technologies in the stack!
