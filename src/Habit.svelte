<script lang="ts">
	import {debugLog, isValidCSSColor} from './utils'
	import InputModal from './InputModal.svelte'
	import type { HabitType, HabitEntry, EntryEditData } from './types'

	import {parseYaml, TFile, Notice} from 'obsidian'
	import {getDateAsString, getDayOfTheWeek} from './utils'
	import {addDays, parseISO} from 'date-fns'

	export let app
	export let name
	export let path
	export let dates
	export let debug
	export let pluginName
	export let userSettings
	export let globalSettings

	let entries: (string | HabitEntry)[] = []
	let frontmatter: any = {}
	let habitName = name
	let customStyles = ''
	let habitType: HabitType = 'completion'
	let habitUnit: string = ''
	let habitGoal: number | undefined = undefined
	let habitMaxValue: number | undefined = undefined
	
	// Modal state
	let showModal = false
	let editData: EntryEditData | null = null

	// Normalize entries to new format and extract dates
	$: normalizedEntries = entries.map(entry => {
		if (typeof entry === 'string') {
			// Old format: simple date string
			return { date: entry, value: undefined, note: undefined }
		} else {
			// New format: object with date, value, note
			return entry
		}
	})

	$: entryDates = normalizedEntries.map(e => e.date)

	// Reactive color resolution - updates whenever frontmatter, userSettings, or globalSettings change
	$: {
		const resolvedColor = frontmatter.color || userSettings.color || globalSettings.defaultColor
		if (resolvedColor && isValidCSSColor(resolvedColor)) {
			customStyles = `--habit-bg-ticked: ${resolvedColor}`
		} else {
			customStyles = ''
		}
	}
	
	$: entriesInRange = dates.reduce((acc, date) => {
		const entry = normalizedEntries.find(e => e.date === date)
		const ticked = entryDates.includes(date)
		acc[date] = {
			ticked,
			value: entry?.value,
			note: entry?.note,
			streak: findStreak(date),
		}
		return acc
	}, {})

	let savingChanges = false

	$: getClasses = function (date) {
		let classes = [
			'habit-tracker__cell',
			`habit-tracker__cell--${getDayOfTheWeek(date)}`,
			'habit-tick',
		]

		if (entriesInRange[date].ticked) {
			classes.push('habit-tick--ticked')
			
			// Check if value intensity should be shown
			const showIntensity = userSettings.showValueIntensity !== undefined 
				? userSettings.showValueIntensity 
				: globalSettings.showValueIntensity
			
			// Add intensity class for duration/quantity habits with values
			if (showIntensity && habitType !== 'completion' && entriesInRange[date].value && habitGoal) {
				const ratio = entriesInRange[date].value / habitGoal
				if (ratio >= 1) {
					classes.push('habit-tick--complete')
				} else if (ratio >= 0.75) {
					classes.push('habit-tick--high')
				} else if (ratio >= 0.5) {
					classes.push('habit-tick--medium')
				} else {
					classes.push('habit-tick--low')
				}
			}
		}

		// Add note indicator class
		if (entriesInRange[date].note) {
			classes.push('habit-tick--has-note')
		}

		// Only add streak classes if streaks are enabled
		const showStreaksEnabled = userSettings.showStreaks !== undefined ? userSettings.showStreaks : globalSettings.showStreaks
		if (showStreaksEnabled) {
			const streak = entriesInRange[date].streak
			if (streak) {
				classes.push('habit-tick--streak')
			}
			if (streak == 1) {
				classes.push('habit-tick--streak-start')
			}

			let isNextDayTicked = false
			const nextDate = getDateAsString(addDays(parseISO(date), 1))
			if (date === dates.at(-1)) {
				// last in the dates in range
				isNextDayTicked = entryDates.includes(nextDate)
			} else {
				isNextDayTicked = entriesInRange[nextDate].ticked
			}

			if (entriesInRange[date].ticked && !isNextDayTicked) {
				classes.push('habit-tick--streak-end')
				
				// Add class to show value with streak if setting is enabled
				const showValueWithStreak = userSettings.showValueWithStreak !== undefined 
					? userSettings.showValueWithStreak 
					: globalSettings.showValueWithStreak
				if (showValueWithStreak) {
					classes.push('show-value-with-streak')
				}
			}
		}

		return classes.join(' ')
	}

	const findStreak = function (date) {
		let currentDate = parseISO(date)
		let streak = 0

		while (entryDates.includes(getDateAsString(currentDate))) {
			streak++
			currentDate.setDate(currentDate.getDate() - 1)
		}

		return streak
	}

	function getDisplayValue(date: string): string {
		const entry = entriesInRange[date]
		if (!entry.ticked || habitType === 'completion') {
			return ''
		}
		
		if (entry.value !== undefined && entry.value !== null) {
			const value = entry.value
			// Get unit abbreviation
			let unit = habitUnit
			if (!unit) {
				unit = habitType === 'duration' ? 'm' : ''
			} else {
				// Abbreviate common units
				if (unit === 'minutes') unit = 'm'
				else if (unit === 'hours') unit = 'h'
				else if (unit === 'cups') unit = 'c'
				else if (unit === 'pages') unit = 'p'
				else if (unit.length > 3) unit = unit.substring(0, 2)
			}
			return `${value}${unit}`
		}
		
		return ''
	}

	function getCellTitle(date: string): string {
		const entry = entriesInRange[date]
		let parts = []
		
		if (entry.ticked) {
			parts.push(`✓ ${date}`)
			if (entry.value !== undefined) {
				const fullUnit = habitUnit || (habitType === 'duration' ? 'minutes' : 'units')
				parts.push(`${entry.value} ${fullUnit}`)
			}
			if (entry.note) {
				parts.push(`Note: ${entry.note}`)
			}
		} else {
			parts.push(date)
		}
		
		return parts.join('\n')
	}

	const init = async function () {
		debugLog(`Loading habit ${habitName}`, debug, undefined, pluginName)

		const getFrontmatter = async function (path) {
			const file = app.vault.getAbstractFileByPath(path)

			if (!file || !(file instanceof TFile)) {
				debugLog(
					`No file found for path: ${path}`,
					debug,
					undefined,
					pluginName,
				)
				return {}
			}

			try {
				return await app.vault.read(file).then((result) => {
					const frontmatter = result.split('---')[1]

					if (!frontmatter){
						return {"entries": []};
					}
					let fmParsed = parseYaml(frontmatter)
					if(fmParsed["entries"] == undefined){
						fmParsed["entries"] = [];
					}
					
					return fmParsed;
				})
			} catch (error) {
				debugLog(
					`Error in habit ${habitName}: ${error.message}`,
					debug,
					undefined,
					pluginName,
				)
				return {}
			}
		}

		frontmatter = await getFrontmatter(path)
		debugLog(`Frontmatter for ${path} ↴`, debug)
		debugLog(frontmatter, debug)
		
		// Load habit configuration
		habitType = frontmatter.type || 'completion'
		habitUnit = frontmatter.unit || ''
		habitGoal = frontmatter.goal
		habitMaxValue = frontmatter.maxValue
		
		entries = frontmatter.entries || []
		// Sort entries by date
		entries = entries.sort((a, b) => {
			const dateA = typeof a === 'string' ? a : a.date
			const dateB = typeof b === 'string' ? b : b.date
			return dateA.localeCompare(dateB)
		})
		
		habitName = frontmatter.title || habitName

		debugLog(`Habit "${habitName}": Found ${entries.length} entries`, debug)
		debugLog(entries, debug, undefined, pluginName)

		// TODO though this looks to be performing ok, i think i should set the watchers more efficiently
		app.vault.on('modify', (file) => {
			if (file.path === path) {
				if (!savingChanges) {
					console.log('File was modified externally, reloading...')
					init()
				}
				savingChanges = false
			}
		})
	}

	const handleCellClick = function (date: string) {
		if (habitType === 'completion') {
			// Toggle for completion habits
			toggleHabit(date)
		} else {
			// Open modal for duration/quantity habits
			openEditModal(date)
		}
	}

	const toggleHabit = function (date: string) {
		const file = app.vault.getAbstractFileByPath(path)
		if (!file || !(file instanceof TFile)) {
			new Notice(`${pluginName}: file missing while trying to toggle habit`)
			return
		}

		let newEntries = [...normalizedEntries]
		const existingIndex = newEntries.findIndex(e => e.date === date)
		
		if (existingIndex >= 0) {
			// Remove entry
			newEntries.splice(existingIndex, 1)
		} else {
			// Add entry (simple completion)
			newEntries.push({ date, value: undefined, note: undefined })
		}
		
		// Convert to storage format (keep as objects if they have value/note, otherwise simplify)
		const entriesToSave = newEntries.map(e => {
			if (e.value === undefined && e.note === undefined) {
				return e.date // Simple string format for backwards compatibility
			}
			return e // Keep as object
		}).sort((a, b) => {
			const dateA = typeof a === 'string' ? a : a.date
			const dateB = typeof b === 'string' ? b : b.date
			return dateA.localeCompare(dateB)
		})

		entries = entriesToSave
		savingChanges = true

		app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter['entries'] = entriesToSave
		})
	}

	function openEditModal(date: string) {
		const entry = normalizedEntries.find(e => e.date === date)
		editData = {
			date,
			value: entry?.value,
			note: entry?.note,
			type: habitType,
			unit: habitUnit,
			maxValue: habitMaxValue,
			goal: habitGoal
		}
		showModal = true
	}

	function handleModalSave(event: CustomEvent) {
		const { date, value, note } = event.detail
		const file = app.vault.getAbstractFileByPath(path)
		
		if (!file || !(file instanceof TFile)) {
			new Notice(`${pluginName}: file missing while trying to save entry`)
			return
		}

		let newEntries = [...normalizedEntries]
		const existingIndex = newEntries.findIndex(e => e.date === date)
		
		const newEntry: HabitEntry = {
			date,
			value: value !== undefined ? value : undefined,
			note: note || undefined
		}

		if (existingIndex >= 0) {
			newEntries[existingIndex] = newEntry
		} else {
			newEntries.push(newEntry)
		}

		// Convert to storage format
		const entriesToSave = newEntries.map(e => {
			// Only save as object if it has value or note
			if (e.value !== undefined || e.note !== undefined) {
				const obj: any = { date: e.date }
				if (e.value !== undefined) obj.value = e.value
				if (e.note) obj.note = e.note
				return obj
			}
			return e.date
		}).sort((a, b) => {
			const dateA = typeof a === 'string' ? a : a.date
			const dateB = typeof b === 'string' ? b : b.date
			return dateA.localeCompare(dateB)
		})

		entries = entriesToSave
		savingChanges = true

		app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter['entries'] = entriesToSave
		})
	}

	function handleModalDelete(event: CustomEvent) {
		const { date } = event.detail
		const file = app.vault.getAbstractFileByPath(path)
		
		if (!file || !(file instanceof TFile)) {
			new Notice(`${pluginName}: file missing while trying to delete entry`)
			return
		}

		let newEntries = normalizedEntries.filter(e => e.date !== date)
		
		// Convert to storage format
		const entriesToSave = newEntries.map(e => {
			if (e.value === undefined && e.note === undefined) {
				return e.date
			}
			const obj: any = { date: e.date }
			if (e.value !== undefined) obj.value = e.value
			if (e.note) obj.note = e.note
			return obj
		}).sort((a, b) => {
			const dateA = typeof a === 'string' ? a : a.date
			const dateB = typeof b === 'string' ? b : b.date
			return dateA.localeCompare(dateB)
		})

		entries = entriesToSave
		savingChanges = true

		app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter['entries'] = entriesToSave
		})
	}

	init()
</script>

<div class="habit-tracker__row" style={customStyles} data-view-mode={userSettings.viewMode || globalSettings.viewMode || 'default'}>
	<div class="habit-tracker__cell--name habit-tracker__cell">
		<a
			href={path}
			aria-label={path}
			class="internal-link">{habitName}</a
		>
	</div>
	{#if Object.keys(entriesInRange).length}
		{#each dates as date}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div
				class={getClasses(date)}
				ticked={entriesInRange[date].ticked}
				streak={entriesInRange[date].streak}
				title={getCellTitle(date)}
				on:click={() => handleCellClick(date)}
			>
				{#if entriesInRange[date].ticked && habitType !== 'completion' && getDisplayValue(date)}
					<span class="habit-value">{getDisplayValue(date)}</span>
				{/if}
				{#if entriesInRange[date].note}
					<span class="habit-note-indicator" title={entriesInRange[date].note}></span>
				{/if}
				{#if (userSettings.showValueWithStreak ?? globalSettings.showValueWithStreak) && entriesInRange[date].streak > 1}
					{@const isNextDayTicked = date === dates.at(-1) ? entryDates.includes(getDateAsString(addDays(parseISO(date), 1))) : entriesInRange[getDateAsString(addDays(parseISO(date), 1))]?.ticked}
					{#if !isNextDayTicked}
						<span class="habit-streak-count">{entriesInRange[date].streak}</span>
					{/if}
				{/if}
			</div>
		{/each}
	{/if}
</div>

{#if showModal && editData}
	<InputModal 
		bind:isOpen={showModal}
		editData={editData}
		habitName={habitName}
		on:save={handleModalSave}
		on:delete={handleModalDelete}
	/>
{/if}

<style>
	.habit-value {
		font-size: 0.65em;
		font-weight: 800;
		color: #ffffff;
		line-height: 1;
		position: absolute;
		z-index: 3;
		pointer-events: none;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8),
		             0 0 1px rgba(0, 0, 0, 0.9),
		             1px 1px 2px rgba(0, 0, 0, 0.7);
		letter-spacing: -0.02em;
	}

	.habit-note-indicator {
		position: absolute;
		top: 1px;
		right: 1px;
		width: 5px;
		height: 5px;
		background: #ffffff;
		border-radius: 50%;
		opacity: 0.9;
		z-index: 3;
		pointer-events: none;
		box-shadow: 0 0 2px rgba(0, 0, 0, 0.8),
		            0 0 0 1px rgba(0, 0, 0, 0.5);
	}

	.habit-tick {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Intensity levels for duration/quantity habits - only affect the background circle */
	.habit-tick--low:before {
		opacity: 0.5 !important;
	}

	.habit-tick--medium:before {
		opacity: 0.7 !important;
	}

	.habit-tick--high:before {
		opacity: 0.85 !important;
	}

	.habit-tick--complete:before {
		opacity: 1 !important;
		box-shadow: 0 0 0 1px var(--habit-bg-ticked, var(--interactive-accent)) !important;
	}
	
	/* Streak counter badge (alternative view) */
	.habit-streak-count {
		position: absolute;
		top: 1px;
		left: 1px;
		font-size: 0.5em;
		font-weight: 700;
		color: #ffffff;
		line-height: 1;
		z-index: 3;
		pointer-events: none;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8),
		             0 0 1px rgba(0, 0, 0, 0.9);
		min-width: 8px;
		text-align: center;
	}

	/* When showing streak numbers in default mode, hide the value to avoid overlap */
	.habit-tick--streak.habit-tick--streak-end .habit-value {
		display: none;
	}
	
	/* When showValueWithStreak is enabled, show the value */
	.habit-tick--streak.habit-tick--streak-end.show-value-with-streak .habit-value {
		display: block;
	}
</style>
