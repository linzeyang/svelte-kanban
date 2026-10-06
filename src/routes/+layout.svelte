<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import AppShell from '#lib/components/layout/AppShell.svelte';
	import PerformanceDashboard from '#lib/components/debug/PerformanceDashboard.svelte';
	import favicon from '#lib/assets/favicon.svg';
	import { initializeErrorRecovery } from '#lib/utils/error-recovery.js';
	import { performanceMonitor } from '#lib/utils/performance-monitor.js';
	import { memoryMonitor, useMemoryCleanup } from '#lib/utils/memory-monitor.js';

	let { children } = $props();

	// Initialize error recovery system and performance monitoring on mount
	onMount(() => {
		try {
			initializeErrorRecovery();

			// Initialize performance monitoring in development
			if (import.meta.env.DEV) {
				performanceMonitor.startMonitoring();
				memoryMonitor.startMonitoring();

				// Register cleanup for layout
				useMemoryCleanup(() => {
					performanceMonitor.stopMonitoring();
					memoryMonitor.stopMonitoring();
				});

				console.log('🚀 Performance monitoring initialized');
			}
		} catch (error) {
			console.error('Failed to initialize systems:', error);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>AI-Native Kanban</title>
	<meta name="description" content="AI-powered Kanban board for modern project management" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<AppShell>
	{@render children?.()}
</AppShell>

<!-- Performance Dashboard (Development Only) -->
<PerformanceDashboard />
