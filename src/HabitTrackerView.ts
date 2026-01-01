import { ItemView, WorkspaceLeaf } from 'obsidian';
import HabitTracker from './HabitTracker.svelte';
import type HabitTracker21 from './main';

export const VIEW_TYPE_HABIT_TRACKER = 'habit-tracker-view';

export class HabitTrackerView extends ItemView {
	component: HabitTracker;
	plugin: HabitTracker21;

	constructor(leaf: WorkspaceLeaf, plugin: HabitTracker21) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_HABIT_TRACKER;
	}

	getDisplayText() {
		return 'Habit Tracker';
	}

	getIcon() {
		return 'check-circle';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('habit-tracker-view-container');

		// Create the Svelte component
		this.component = new HabitTracker({
			target: container,
			props: {
				app: this.app,
				userSettings: {},
				globalSettings: this.plugin.settings,
				pluginName: this.plugin.manifest.name,
			},
		});
	}

	async onClose() {
		if (this.component) {
			this.component.$destroy();
		}
	}
}
