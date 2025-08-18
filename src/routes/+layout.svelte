<script lang="ts">
	import '../app.css';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
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
