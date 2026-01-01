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
	let isEditMode: boolean = false;

	// Initialize values when modal opens
	$: if (isOpen && editData && editData.date !== lastOpenedDate) {
		inputValue = editData.value !== undefined ? String(editData.value) : '';
		noteValue = editData.note || '';
		lastOpenedDate = editData.date;
		// Check if entry is empty - if so, go straight to edit mode
		isEditMode = !editData.value && !editData.note;
		// Focus input after render if in edit mode
		if (isEditMode) {
			setTimeout(() => inputElement?.focus(), 50);
		}
	}
	
	function enterEditMode() {
		isEditMode = true;
		setTimeout(() => inputElement?.focus(), 50);
	}

	function handleSave() {
		let numValue = undefined;
		
		// Only validate if user entered a value
		if (inputValue && inputValue.trim() !== '') {
			numValue = parseFloat(inputValue);
			
			if (isNaN(numValue)) {
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
		}

		const trimmedNote = noteValue.trim();
		
		// Require at least a value or a note
		if (numValue === undefined && !trimmedNote) {
			alert('Please enter a value or a note');
			return;
		}

		dispatch('save', {
			date: editData.date,
			value: numValue,
			note: trimmedNote || undefined
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
		isEditMode = false;
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

			<{#if !isEditMode}
					<!-- Read-only view mode -->
					<div class="view-mode">
						<div class="view-group">
							<div class="view-label">
								{editData.type === 'duration' ? 'Duration' : 'Quantity'}
							</div>
							<div class="view-value">
								{#if editData.value !== undefined}
									{editData.value} {getUnitLabel()}
									{#if editData.goal}
										<span class="goal-info">/ {editData.goal} goal</span>
									{/if}
								{:else}
									<span class="empty-value">Not set</span>
								{/if}
							</div>
						</div>

						{#if editData.note}
							<div class="view-group">
								<div class="view-label">Note</div>
								<div class="view-value note-content">{editData.note}</div>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Edit mode -->
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
				{#if !isEditMode}
					<!-- View mode buttons -->
					<button class="btn btn-delete" on:click={handleDelete}>
						Delete
					</button>
					<div class="button-group">
						<button class="btn btn-cancel" on:click={close}>
							Close
						</button>
						<button class="btn btn-primary" on:click={enterEditMode}>
							Edit
						</button>
					</div>
				{:else}
					<!-- Edit mode buttons -->
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
				{/if}v class="help-text">Maximum: {editData.maxValue}</div>
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
				{/if}
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
		view-mode {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.view-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.view-label {
		font-weight: 500;
		color: var(--text-muted);
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.view-value {
		font-size: 1.1rem;
		color: var(--text-normal);
		font-weight: 500;
	}

	.view-value.note-content {
		font-weight: 400;
		font-size: 0.95rem;
		line-height: 1.5;
		white-space: pre-wrap;
		background: var(--background-secondary);
		padding: 12px;
		border-radius: 4px;
		border: 1px solid var(--background-modifier-border);
	}

	.empty-value {
		color: var(--text-faint);
		font-style: italic;
		font-weight: 400;
	}

	.goal-info {
		color: var(--text-muted);
		font-size: 0.9rem;
		font-weight: 400;
		margin-left: 8px;
	}

	.left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
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
		position: relative;
		z-index: 10001;
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
