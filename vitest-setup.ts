import { vi } from 'vitest';

// Browser testing setup for Svelte 5 components
// Most browser APIs are available natively in the browser environment

// Mock localStorage for tests that need it
if (typeof window !== 'undefined' && !window.localStorage) {
	Object.defineProperty(window, 'localStorage', {
		value: {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn()
		}
	});
}

// Mock console methods to reduce noise in tests
if (typeof console !== 'undefined') {
	console.log = vi.fn();
	console.warn = vi.fn();
	console.error = vi.fn();
}
