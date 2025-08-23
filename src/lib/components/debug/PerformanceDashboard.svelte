<!--
  Performance Dashboard Component
  Real-time performance monitoring and metrics display
  Only shown in development mode
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { performanceMonitor } from '$lib/utils/performance-monitor.js';
	import { responsiveMonitor } from '$lib/utils/responsive-monitor.js';
	import { bundleAnalyzer } from '$lib/utils/bundle-analyzer.js';
	import { memoryMonitor } from '$lib/utils/memory-monitor.js';
	import type { PerformanceStats } from '$lib/utils/performance-monitor.js';
	import type { MemoryMetrics } from '$lib/utils/memory-monitor.js';

	// Component state
	let isVisible = $state(false);
	let activeTab = $state<'performance' | 'memory' | 'bundle' | 'responsive'>('performance');
	let performanceStats = $state<Record<string, PerformanceStats>>({});
	let memoryMetrics = $state<MemoryMetrics | null>(null);
	let bundleMetrics = $state<any>(null);
	let violations = $state<any[]>([]);

	// Update intervals
	let updateInterval: number;
	let violationListener: (event: CustomEvent) => void;
	let memoryListener: (event: CustomEvent) => void;

	onMount(() => {
		// Only show in development
		if (!import.meta.env.DEV) return;

		// Start all monitoring systems
		performanceMonitor.startMonitoring();
		responsiveMonitor.startMonitoring();
		bundleAnalyzer.startAnalysis();
		memoryMonitor.startMonitoring();

		// Setup update interval
		updateInterval = window.setInterval(updateMetrics, 1000);

		// Setup event listeners
		violationListener = (event: CustomEvent) => {
			violations = [event.detail, ...violations.slice(0, 9)]; // Keep last 10
		};

		memoryListener = (event: CustomEvent) => {
			memoryMetrics = event.detail;
		};

		window.addEventListener('performance-violation', violationListener as EventListener);
		window.addEventListener('memory-update', memoryListener as EventListener);

		// Initial update
		updateMetrics();

		// Keyboard shortcut to toggle dashboard (Ctrl+Shift+P)
		const keyHandler = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.shiftKey && event.key === 'P') {
				event.preventDefault();
				isVisible = !isVisible;
			}
		};

		window.addEventListener('keydown', keyHandler);

		return () => {
			window.removeEventListener('keydown', keyHandler);
		};
	});

	onDestroy(() => {
		if (updateInterval) {
			clearInterval(updateInterval);
		}

		if (violationListener) {
			window.removeEventListener('performance-violation', violationListener as EventListener);
		}

		if (memoryListener) {
			window.removeEventListener('memory-update', memoryListener as EventListener);
		}

		// Stop monitoring
		performanceMonitor.stopMonitoring();
		responsiveMonitor.stopMonitoring();
		bundleAnalyzer.stopAnalysis();
		memoryMonitor.stopMonitoring();
	});

	function updateMetrics() {
		performanceStats = performanceMonitor.getAllStats();
		memoryMetrics = memoryMonitor.getMemoryMetrics();
		bundleMetrics = bundleAnalyzer.getBundleMetrics();
	}

	function clearViolations() {
		violations = [];
	}

	function exportData() {
		const data = {
			performance: performanceMonitor.exportData(),
			memory: memoryMonitor.exportData(),
			bundle: bundleAnalyzer.exportData(),
			responsive: responsiveMonitor.exportData()
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `performance-report-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function formatTime(ms: number): string {
		return ms.toFixed(2) + 'ms';
	}

	function getStatusColor(value: number, threshold: number): string {
		if (value > threshold * 1.5) return 'text-red-400';
		if (value > threshold) return 'text-yellow-400';
		return 'text-green-400';
	}
</script>

{#if import.meta.env.DEV}
	<!-- Toggle Button -->
	<button
		onclick={() => (isVisible = !isVisible)}
		class="fixed bottom-4 right-4 z-50 rounded-full bg-neon-purple/20 p-3
		       text-neon-purple backdrop-blur-sm border border-neon-purple/30
		       hover:bg-neon-purple/30 transition-all duration-200"
		title="Performance Dashboard (Ctrl+Shift+P)"
	>
		📊
	</button>

	{#if isVisible}
		<!-- Dashboard Modal -->
		<div
			class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-label="Performance Dashboard"
			tabindex="-1"
			onclick={(e) => e.target === e.currentTarget && (isVisible = false)}
			onkeydown={(e) => e.key === 'Escape' && (isVisible = false)}
		>
			<div
				class="glass-effect w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg
				       border border-neon-blue/30 shadow-2xl"
			>
				<!-- Header -->
				<div class="flex items-center justify-between border-b border-neon-blue/20 p-4">
					<h2 class="text-xl font-semibold text-text-primary">Performance Dashboard</h2>
					<div class="flex items-center space-x-2">
						<button
							onclick={exportData}
							class="rounded bg-neon-blue/20 px-3 py-1 text-sm text-neon-blue
							       hover:bg-neon-blue/30 transition-colors"
						>
							Export Data
						</button>
						<button
							onclick={() => (isVisible = false)}
							class="text-text-muted hover:text-text-primary transition-colors"
						>
							✕
						</button>
					</div>
				</div>

				<!-- Tabs -->
				<div class="flex border-b border-neon-blue/20">
					{#each ['performance', 'memory', 'bundle', 'responsive'] as tab}
						<button
							onclick={() => (activeTab = tab as typeof activeTab)}
							class="px-4 py-2 text-sm font-medium transition-colors
							       {activeTab === tab
								? 'border-b-2 border-neon-blue text-neon-blue'
								: 'text-text-muted hover:text-text-primary'}"
						>
							{tab.charAt(0).toUpperCase() + tab.slice(1)}
						</button>
					{/each}
				</div>

				<!-- Content -->
				<div class="max-h-[60vh] overflow-y-auto p-4">
					{#if activeTab === 'performance'}
						<div class="space-y-4">
							<!-- Performance Violations -->
							{#if violations.length > 0}
								<div class="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
									<div class="flex items-center justify-between mb-2">
										<h3 class="font-medium text-red-400">Performance Violations</h3>
										<button
											onclick={clearViolations}
											class="text-xs text-red-400 hover:text-red-300"
										>
											Clear
										</button>
									</div>
									<div class="space-y-2 max-h-32 overflow-y-auto">
										{#each violations as violation}
											<div class="text-sm text-red-300">
												<span class="font-mono">{violation.name}</span>:
												{formatTime(violation.value)} (threshold: {formatTime(violation.threshold)})
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Performance Metrics -->
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{#each Object.entries(performanceStats) as [name, stats]}
									<div class="rounded-lg bg-bg-card border border-neon-blue/20 p-4">
										<h4 class="font-medium text-text-primary mb-2">{name}</h4>
										<div class="space-y-1 text-sm">
											<div class="flex justify-between">
												<span class="text-text-muted">Average:</span>
												<span class={getStatusColor(stats.avg, 16.67)}>
													{formatTime(stats.avg)}
												</span>
											</div>
											<div class="flex justify-between">
												<span class="text-text-muted">P95:</span>
												<span class={getStatusColor(stats.p95, 16.67)}>
													{formatTime(stats.p95)}
												</span>
											</div>
											<div class="flex justify-between">
												<span class="text-text-muted">Max:</span>
												<span class={getStatusColor(stats.max, 16.67)}>
													{formatTime(stats.max)}
												</span>
											</div>
											<div class="flex justify-between">
												<span class="text-text-muted">Count:</span>
												<span class="text-text-primary">{stats.count}</span>
											</div>
											{#if stats.violations > 0}
												<div class="flex justify-between">
													<span class="text-text-muted">Violations:</span>
													<span class="text-red-400">{stats.violations}</span>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else if activeTab === 'memory'}
						<div class="space-y-4">
							{#if memoryMetrics}
								<!-- Memory Overview -->
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div class="rounded-lg bg-bg-card border border-neon-blue/20 p-4">
										<h4 class="font-medium text-text-primary mb-2">Memory Usage</h4>
										<div class="space-y-2">
											<div class="flex justify-between text-sm">
												<span class="text-text-muted">Used:</span>
												<span class="text-text-primary">{formatBytes(memoryMetrics.used)}</span>
											</div>
											<div class="flex justify-between text-sm">
												<span class="text-text-muted">Total:</span>
												<span class="text-text-primary">{formatBytes(memoryMetrics.total)}</span>
											</div>
											<div class="flex justify-between text-sm">
												<span class="text-text-muted">Limit:</span>
												<span class="text-text-primary">{formatBytes(memoryMetrics.limit)}</span>
											</div>
											<div class="flex justify-between text-sm">
												<span class="text-text-muted">Usage:</span>
												<span
													class={memoryMetrics.percentage > 0.9
														? 'text-red-400'
														: memoryMetrics.percentage > 0.7
															? 'text-yellow-400'
															: 'text-green-400'}
												>
													{(memoryMetrics.percentage * 100).toFixed(1)}%
												</span>
											</div>
											<div class="flex justify-between text-sm">
												<span class="text-text-muted">Trend:</span>
												<span
													class={memoryMetrics.trend === 'increasing'
														? 'text-red-400'
														: memoryMetrics.trend === 'decreasing'
															? 'text-green-400'
															: 'text-text-primary'}
												>
													{memoryMetrics.trend}
												</span>
											</div>
										</div>

										<!-- Memory Usage Bar -->
										<div class="mt-4">
											<div class="h-2 bg-bg-secondary rounded-full overflow-hidden">
												<div
													class="h-full transition-all duration-300 {memoryMetrics.percentage >
													0.9
														? 'bg-red-500'
														: memoryMetrics.percentage > 0.7
															? 'bg-yellow-500'
															: 'bg-green-500'}"
													style="width: {memoryMetrics.percentage * 100}%"
												></div>
											</div>
										</div>
									</div>

									<!-- Memory Leaks -->
									<div class="rounded-lg bg-bg-card border border-neon-blue/20 p-4">
										<h4 class="font-medium text-text-primary mb-2">Memory Leaks</h4>
										{#await memoryMonitor.detectMemoryLeaks()}
											<div class="text-sm text-text-muted">Checking...</div>
										{:then leaks}
											{#if leaks.length === 0}
												<div class="text-sm text-green-400">No leaks detected</div>
											{:else}
												<div class="space-y-2 max-h-32 overflow-y-auto">
													{#each leaks as leak}
														<div
															class="text-sm p-2 rounded border {leak.severity === 'high'
																? 'border-red-500/20 bg-red-500/10 text-red-300'
																: leak.severity === 'medium'
																	? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300'
																	: 'border-blue-500/20 bg-blue-500/10 text-blue-300'}"
														>
															<div class="font-medium">{leak.type}</div>
															<div class="text-xs opacity-80">{leak.description}</div>
														</div>
													{/each}
												</div>
											{/if}
										{/await}
									</div>
								</div>
							{:else}
								<div class="text-center text-text-muted py-8">
									Memory monitoring not supported in this browser
								</div>
							{/if}
						</div>
					{:else if activeTab === 'bundle'}
						<div class="space-y-4">
							{#if bundleMetrics}
								<!-- Bundle Overview -->
								<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div class="rounded-lg bg-bg-card border border-neon-blue/20 p-4">
										<h4 class="font-medium text-text-primary mb-2">Bundle Size</h4>
										<div class="space-y-1 text-sm">
											<div class="flex justify-between">
												<span class="text-text-muted">Total:</span>
												<span class="text-text-primary">
													{formatBytes(bundleMetrics.totalSize)}
												</span>
											</div>
											<div class="flex justify-between">
												<span class="text-text-muted">Gzipped:</span>
												<span class="text-text-primary">
													{formatBytes(bundleMetrics.gzippedSize)}
												</span>
											</div>
										</div>
									</div>

									<div class="rounded-lg bg-bg-card border border-neon-blue/20 p-4">
										<h4 class="font-medium text-text-primary mb-2">Components</h4>
										<div class="text-2xl font-bold text-neon-blue">
											{bundleMetrics.components.length}
										</div>
										<div class="text-sm text-text-muted">Total components</div>
									</div>

									<div class="rounded-lg bg-bg-card border border-neon-blue/20 p-4">
										<h4 class="font-medium text-text-primary mb-2">Dependencies</h4>
										<div class="text-2xl font-bold text-neon-purple">
											{bundleMetrics.dependencies.length}
										</div>
										<div class="text-sm text-text-muted">External dependencies</div>
									</div>
								</div>

								<!-- Optimization Recommendations -->
								{#if bundleMetrics.recommendations.length > 0}
									<div class="rounded-lg bg-bg-card border border-neon-blue/20 p-4">
										<h4 class="font-medium text-text-primary mb-2">Optimization Recommendations</h4>
										<div class="space-y-2 max-h-48 overflow-y-auto">
											{#each bundleMetrics.recommendations as rec}
												<div
													class="p-3 rounded border {rec.impact === 'high'
														? 'border-red-500/20 bg-red-500/10'
														: rec.impact === 'medium'
															? 'border-yellow-500/20 bg-yellow-500/10'
															: 'border-blue-500/20 bg-blue-500/10'}"
												>
													<div class="flex items-center justify-between mb-1">
														<span class="font-medium text-sm">{rec.type}</span>
														<span class="text-xs px-2 py-1 rounded bg-black/20">
															{rec.impact} impact
														</span>
													</div>
													<div class="text-sm opacity-80 mb-1">{rec.description}</div>
													<div class="text-xs text-text-muted">
														Estimated savings: {formatBytes(rec.estimatedSavings)}
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							{:else}
								<div class="text-center text-text-muted py-8">Loading bundle metrics...</div>
							{/if}
						</div>
					{:else if activeTab === 'responsive'}
						<div class="space-y-4">
							<!-- Viewport Info -->
							{#await responsiveMonitor.getViewportInfo()}
								<div class="text-center text-text-muted py-8">Loading viewport info...</div>
							{:then viewport}
								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
									<div class="rounded-lg bg-bg-card border border-neon-blue/20 p-4">
										<h4 class="font-medium text-text-primary mb-2">Viewport</h4>
										<div class="text-lg font-bold text-neon-blue">
											{viewport.width} × {viewport.height}
										</div>
										<div class="text-sm text-text-muted">{viewport.orientation}</div>
									</div>

									<div class="rounded-lg bg-bg-card border border-neon-blue/20 p-4">
										<h4 class="font-medium text-text-primary mb-2">Breakpoint</h4>
										<div class="text-lg font-bold text-neon-purple">{viewport.breakpoint}</div>
										<div class="text-sm text-text-muted">Current breakpoint</div>
									</div>

									<div class="rounded-lg bg-bg-card border border-neon-blue/20 p-4">
										<h4 class="font-medium text-text-primary mb-2">Device Pixel Ratio</h4>
										<div class="text-lg font-bold text-neon-green">{viewport.devicePixelRatio}</div>
										<div class="text-sm text-text-muted">Screen density</div>
									</div>

									<div class="rounded-lg bg-bg-card border border-neon-blue/20 p-4">
										<h4 class="font-medium text-text-primary mb-2">Layout Performance</h4>
										{#if performanceStats['responsive-layout']}
											<div class="text-lg font-bold text-neon-cyan">
												{formatTime(performanceStats['responsive-layout'].avg)}
											</div>
											<div class="text-sm text-text-muted">Avg adaptation time</div>
										{:else}
											<div class="text-sm text-text-muted">No data yet</div>
										{/if}
									</div>
								</div>
							{/await}

							<!-- Responsive Performance Metrics -->
							<div class="rounded-lg bg-bg-card border border-neon-blue/20 p-4">
								<h4 class="font-medium text-text-primary mb-2">Responsive Performance</h4>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									{#each Object.entries(performanceStats).filter(([name]) => name.includes('layout') || name.includes('responsive') || name.includes('container')) as [name, stats]}
										<div class="space-y-1">
											<div class="text-sm font-medium text-text-primary">{name}</div>
											<div class="text-xs text-text-muted">
												Avg: {formatTime(stats.avg)} | Max: {formatTime(stats.max)} | Count: {stats.count}
											</div>
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
{/if}
