<script lang="ts">
	import { onMount } from 'svelte';
	import type { App, BasesQueryResult, BasesViewConfig } from 'obsidian';
	import { format, parseISO, eachDayOfInterval, subDays } from 'date-fns';
	
	export let app: App;
	export let basesData: BasesQueryResult;
	export let basesConfig: BasesViewConfig;
	export let globalSettings: any;
	export let pluginName: string;
	
	let dates: string[] = [];
	let habitEntries: any[] = [];
	
	// Get configuration from Bases view config
	const daysToShow = Number(basesConfig.get('daysToShow')) || globalSettings.daysToShow || 21;
	const showStreaks = basesConfig.get('showStreaks') ?? globalSettings.showStreaks;
	const reverseOrder = basesConfig.get('reverseOrder') ?? globalSettings.reverseOrder;
	
	// Calculate date range
	const lastDate = new Date();
	const firstDate = subDays(lastDate, daysToShow - 1);
	dates = eachDayOfInterval({ start: firstDate, end: lastDate }).map(d => format(d, 'yyyy-MM-dd'));
	
	if (reverseOrder) {
		dates = dates.reverse();
	}
	
	// Process Bases data
	$: {
		habitEntries = [];
		
		// Each entry in basesData represents a file with properties
		for (const group of basesData.groupedData) {
			for (const entry of group.entries) {
				// Extract habit name from file name or a property
				const habitName = entry.file.basename;
				
				// Extract habit completion data from properties
				// Assuming habit data is stored in properties like "2024-01-01", "2024-01-02", etc.
				const completionData: Record<string, any> = {};
				
				for (const date of dates) {
					const value = entry.getValue(date);
					if (!value.isEmpty()) {
						completionData[date] = value.toString();
					}
				}
				
				habitEntries.push({
					name: habitName,
					data: completionData,
					file: entry.file,
				});
			}
		}
	}
</script>

<div class="habit-tracker-bases">
	<div class="habit-tracker-header">
		<h3>Habit Tracker</h3>
		<p>{habitEntries.length} {habitEntries.length === 1 ? 'habit' : 'habits'}</p>
	</div>
	
	{#if habitEntries.length === 0}
		<div class="no-habits">
			<p>No habits found in this Base.</p>
			<p class="hint">Add files to your Base to track habits. Use date properties (YYYY-MM-DD format) to mark habit completion.</p>
		</div>
	{:else}
		<div class="habits-container">
			<div class="dates-header">
				{#each dates as date}
					<div class="date-cell" class:is-today={format(new Date(), 'yyyy-MM-dd') === date}>
						<span class="date-number">{format(parseISO(date), 'd')}</span>
						<span class="date-day">{format(parseISO(date), 'EEE')}</span>
					</div>
				{/each}
			</div>
			
			{#each habitEntries as habit}
				<div class="habit-row">
					<div class="habit-name">{habit.name}</div>
					<div class="habit-cells">
						{#each dates as date}
							<div class="habit-cell" class:completed={habit.data[date]}>
								{#if habit.data[date]}
									<span class="checkmark">✓</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.habit-tracker-bases {
		padding: 1rem;
		font-family: var(--font-interface);
	}
	
	.habit-tracker-header {
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--background-modifier-border);
		padding-bottom: 0.5rem;
	}
	
	.habit-tracker-header h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1.25rem;
	}
	
	.habit-tracker-header p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-muted);
	}
	
	.no-habits {
		text-align: center;
		padding: 2rem;
		color: var(--text-muted);
	}
	
	.no-habits .hint {
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}
	
	.habits-container {
		overflow-x: auto;
	}
	
	.dates-header {
		display: flex;
		gap: 4px;
		margin-bottom: 0.5rem;
		padding-left: 150px;
	}
	
	.date-cell {
		width: 32px;
		text-align: center;
		font-size: 0.75rem;
	}
	
	.date-cell.is-today {
		color: var(--text-accent);
		font-weight: 600;
	}
	
	.date-number {
		display: block;
		font-weight: 500;
	}
	
	.date-day {
		display: block;
		font-size: 0.6875rem;
		color: var(--text-muted);
		text-transform: uppercase;
	}
	
	.habit-row {
		display: flex;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	
	.habit-name {
		width: 150px;
		flex-shrink: 0;
		padding-right: 1rem;
		font-size: 0.875rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.habit-cells {
		display: flex;
		gap: 4px;
	}
	
	.habit-cell {
		width: 32px;
		height: 32px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--background-secondary);
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.habit-cell.completed {
		background: var(--interactive-accent);
		border-color: var(--interactive-accent);
		color: white;
	}
	
	.habit-cell:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}
	
	.checkmark {
		font-size: 1rem;
		font-weight: bold;
	}
</style>
