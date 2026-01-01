<script lang="ts">
	import type { BasesQueryResult, BasesViewConfig } from 'obsidian';
	import { format, parseISO, eachDayOfInterval, subDays, isToday as isTodayFn } from 'date-fns';
	
	export let basesData: BasesQueryResult;
	export let basesConfig: BasesViewConfig;
	export let globalSettings: any;
	
	let dates: string[] = [];
	let habitEntries: any[] = [];
	
	// Get configuration from Bases view config
	const daysToShow = Number(basesConfig.get('daysToShow')) || globalSettings.daysToShow || 21;
	const showStreaks = basesConfig.get('showStreaks') ?? globalSettings.showStreaks ?? true;
	const reverseOrder = basesConfig.get('reverseOrder') ?? globalSettings.reverseOrder ?? false;
	
	// Calculate date range
	const lastDate = new Date();
	const firstDate = subDays(lastDate, daysToShow - 1);
	dates = eachDayOfInterval({ start: firstDate, end: lastDate }).map(d => format(d, 'yyyy-MM-dd'));
	
	if (reverseOrder) {
		dates = dates.reverse();
	}
	
	// Process Bases data - this reactive block runs whenever basesData changes
	$: {
		habitEntries = [];
		
		console.log('[HabitTracker] Processing Bases data:', basesData);
		console.log('[HabitTracker] All properties:', basesData.allProperties);
		console.log('[HabitTracker] Grouped data length:', basesData.groupedData?.length);
		
		// Each entry in basesData represents a file with properties
		if (basesData.groupedData) {
			for (const group of basesData.groupedData) {
				console.log('[HabitTracker] Group entries:', group.entries?.length);
				
				for (const entry of group.entries) {
					// Extract habit name from file name
					const habitName = entry.file.basename;
					
					// Extract habit completion data from properties
					// Look for date properties (YYYY-MM-DD format)
					const completionData: Record<string, any> = {};
					
					for (const date of dates) {
						try {
							const value = entry.getValue(date);
							if (value && !value.isEmpty()) {
								completionData[date] = value.toString();
							}
						} catch (e) {
							// Property doesn't exist, that's okay
						}
					}
					
					console.log('[HabitTracker] Habit:', habitName, 'Data:', completionData);
					
					habitEntries.push({
						name: habitName,
						data: completionData,
						file: entry.file,
					});
				}
			}
		}
		
		console.log('[HabitTracker] Total habit entries:', habitEntries.length);
	}
</script>

<div class="habit-tracker-bases">
	<div class="habit-tracker-header">
		<h3>Habit Tracker</h3>
		<p>{habitEntries.length} {habitEntries.length === 1 ? 'habit' : 'habits'} · {dates.length} days</p>
	</div>
	
	{#if habitEntries.length === 0}
		<div class="no-habits">
			<p><strong>No habits found in this Base.</strong></p>
			<p class="hint">To track habits with this view:</p>
			<ol class="instructions">
				<li>Add files to your Base (each file = one habit)</li>
				<li>Add date properties to files using YYYY-MM-DD format (e.g., "2026-01-01")</li>
				<li>Set property values to "true", "x", or any value to mark completion</li>
			</ol>
			<p class="example">Example: Add a property "2026-01-01" with value "true" to mark Jan 1 complete.</p>
		</div>
	{:else}
		<div class="habits-container">
			<div class="dates-header">
				<div class="habit-name-spacer"></div>
				{#each dates as date}
					<div class="date-cell" class:is-today={format(new Date(), 'yyyy-MM-dd') === date}>
						<span class="date-number">{format(parseISO(date), 'd')}</span>
						<span class="date-day">{format(parseISO(date), 'EEE')}</span>
					</div>
				{/each}
			</div>
			
			{#each habitEntries as habit}
				<div class="habit-row">
					<div class="habit-name" title={habit.name}>{habit.name}</div>
					<div class="habit-cells">
						{#each dates as date}
							<div class="habit-cell" class:completed={habit.data[date]} title={date}>
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
		padding: 2rem;
		color: var(--text-muted);
		background: var(--background-secondary);
		border-radius: 8px;
	}
	
	.no-habits strong {
		color: var(--text-normal);
	}
	
	.no-habits .hint {
		font-size: 0.875rem;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}
	
	.no-habits .instructions {
		font-size: 0.875rem;
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}
	
	.no-habits .instructions li {
		margin: 0.25rem 0;
	}
	
	.no-habits .example {
		font-size: 0.8125rem;
		margin-top: 1rem;
		padding: 0.75rem;
		background: var(--background-primary);
		border-left: 3px solid var(--interactive-accent);
		border-radius: 4px;
	}
	
	.habits-container {
		overflow-x: auto;
	}
	
	.dates-header {
		display: flex;
		gap: 4px;
		margin-bottom: 0.5rem;
		position: sticky;
		top: 0;
		background: var(--background-primary);
		z-index: 1;
		padding: 0.5rem 0;
	}
	
	.habit-name-spacer {
		width: 150px;
		flex-shrink: 0;
	}
	
	.date-cell {
		width: 32px;
		text-align: center;
		font-size: 0.75rem;
		flex-shrink: 0;
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
		gap: 4px;
	}
	
	.habit-name {
		width: 150px;
		flex-shrink: 0;
		font-size: 0.875rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 500;
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
		flex-shrink: 0;
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
