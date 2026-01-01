<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { EntryEditData } from './types';

	export let isOpen: boolean = false;
	export let editData: EntryEditData;
	export let habitName: string = '';

	const dispatch = createEventDispatcher();

	let inputValue: string = '';
	let noteValue: string = '';
	let inputElement: HTMLInputElement;
	let lastOpenedDate: string = '';

	// Initialize values when modal opens
	$: if (isOpen && editData && editData.date !== lastOpenedDate) {
		inputValue = editData.value !== undefined ? String(editData.value) : '';
		noteValue = editData.note || '';
		lastOpenedDate = editData.date;
		// Focus input after render
		setTimeout(() => inputElement?.focus(), 50);
	}

	function handleSave() {
		const numValue = parseFloat(inputValue);
		
		// Validate input
		if (inputValue && isNaN(numValue)) {
			alert('Please enter a valid number');
			return;
		}

		// Check max value
		if (editData.maxValue && numValue > editData.maxValue) {
			alert(`Value cannot exceed ${editData.maxValue}`);
			return;
		}

		// Check min value (must be positive)
		if (numValue < 0) {
			alert('Value cannot be negative');
			return;
		}

		dispatch('save', {
			date: editData.date,
			value: inputValue ? numValue : undefined,
			note: noteValue.trim() || undefined
		});

		close();
	}

	function handleDelete() {
		if (confirm('Delete this entry?')) {
			dispatch('delete', {
				date: editData.date
			});
			close();
		}
	}

	function close() {
		isOpen = false;
		inputValue = '';
		noteValue = '';
		lastOpenedDate = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		}
	}

	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSave();
		}
	}

	function handleTextareaKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleSave();
		}
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		if (date.getTime() === today.getTime()) {
			return 'Today';
		}
		
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		if (date.getTime() === yesterday.getTime()) {
			return 'Yesterday';
		}
		
		return date.toLocaleDateString('en-US', { 
			weekday: 'short', 
			month: 'short', 
			day: 'numeric' 
		});
	}

	function getUnitLabel(): string {
		if (editData.unit) {
			return editData.unit;
		}
		return editData.type === 'duration' ? 'minutes' : 'units';
	}
</script>

{#if isOpen}
	<div class="modal-backdrop" on:click={close} on:keydown={handleKeydown}>
		<div class="habit-input-modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3>{habitName}</h3>
				<div class="modal-date">{formatDate(editData.date)}</div>
			</div>

			<div class="modal-body">
				<div class="input-group">
					<label for="value-input">
						{editData.type === 'duration' ? 'Duration' : 'Quantity'}
						{#if editData.goal}
							<span class="goal-label">(goal: {editData.goal} {getUnitLabel()})</span>
						{/if}
					</label>
					<div class="input-with-unit">
						<input
							id="value-input"
							type="number"
							bind:value={inputValue}
							bind:this={inputElement}
							placeholder="0"
							min="0"
							max={editData.maxValue}
							step={editData.type === 'duration' ? '1' : '0.1'}
							on:keydown={handleInputKeydown}
						/>
						<span class="unit-label">{getUnitLabel()}</span>
					</div>
					{#if editData.maxValue}
						<div class="help-text">Maximum: {editData.maxValue}</div>
					{/if}
				</div>

				<div class="input-group">
					<label for="note-input">Note (optional)</label>
					<textarea
						id="note-input"
						bind:value={noteValue}
						placeholder="Add a note about this entry..."
						rows="3"
						on:keydown={handleTextareaKeydown}
					/>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn btn-delete" on:click={handleDelete}>
					Delete
				</button>
				<div class="button-group">
					<button class="btn btn-cancel" on:click={close}>
						Cancel
					</button>
					<button class="btn btn-primary" on:click={handleSave}>
						Save
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(2px);
	}

	.habit-input-modal {
		background: var(--background-primary);
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		width: 90%;
		max-width: 480px;
		max-height: 85vh;
		overflow: auto;
		border: 1px solid var(--background-modifier-border);
	}

	.modal-header {
		padding: 20px 24px 16px;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.modal-header h3 {
		margin: 0 0 8px 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-normal);
	}

	.modal-date {
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.modal-body {
		padding: 24px;
	}

	.input-group {
		margin-bottom: 20px;
	}

	.input-group:last-child {
		margin-bottom: 0;
	}

	.input-group label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: var(--text-normal);
		font-size: 0.95rem;
	}

	.goal-label {
		font-weight: 400;
		color: var(--text-muted);
		font-size: 0.85rem;
		margin-left: 4px;
	}

	.input-with-unit {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	input[type="number"] {
		flex: 1;
		padding: 10px 12px;
		font-size: 1rem;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-primary);
		color: var(--text-normal);
		min-width: 0;
	}

	input[type="number"]:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px rgba(var(--interactive-accent-rgb), 0.2);
	}

	.unit-label {
		font-size: 0.95rem;
		color: var(--text-muted);
		white-space: nowrap;
		min-width: fit-content;
	}

	textarea {
		width: 100%;
		padding: 10px 12px;
		font-size: 0.95rem;
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
		background: var(--background-primary);
		color: var(--text-normal);
		resize: vertical;
		font-family: inherit;
		min-height: 60px;
	}

	textarea:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px rgba(var(--interactive-accent-rgb), 0.2);
	}

	.help-text {
		margin-top: 6px;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.modal-footer {
		padding: 16px 24px;
		border-top: 1px solid var(--background-modifier-border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.button-group {
		display: flex;
		gap: 8px;
	}

	.btn {
		padding: 8px 16px;
		font-size: 0.95rem;
		font-weight: 500;
		border-radius: 4px;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-primary {
		background: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.btn-primary:hover {
		background: var(--interactive-accent-hover);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.btn-cancel {
		background: transparent;
		color: var(--text-normal);
		border: 1px solid var(--background-modifier-border);
	}

	.btn-cancel:hover {
		background: var(--background-modifier-hover);
	}

	.btn-delete {
		background: transparent;
		color: var(--text-error);
		border: 1px solid var(--background-modifier-border);
	}

	.btn-delete:hover {
		background: var(--background-modifier-error);
		border-color: var(--text-error);
	}

	/* Remove number input spinners in some browsers */
	input[type="number"]::-webkit-inner-spin-button,
	input[type="number"]::-webkit-outer-spin-button {
		opacity: 1;
	}
</style>
