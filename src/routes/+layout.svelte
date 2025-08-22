<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { initializeErrorRecovery } from '$lib/utils/error-recovery';

	let { children } = $props();

	// Initialize error recovery system on mount
	onMount(() => {
		try {
			initializeErrorRecovery();
		} catch (error) {
			console.error('Failed to initialize error recovery:', error);
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
