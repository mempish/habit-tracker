import { BasesView, QueryController } from 'obsidian';
import HabitTrackerBases from './HabitTrackerBases.svelte';
import type HabitTracker21 from './main';

export const HABIT_TRACKER_BASES_VIEW = 'habit-tracker-bases';

export class HabitTrackerBasesView extends BasesView {
	readonly type = HABIT_TRACKER_BASES_VIEW;
	private containerEl: HTMLElement;
	private component: HabitTrackerBases | null = null;
	plugin: HabitTracker21;

	constructor(controller: QueryController, parentEl: HTMLElement, plugin: HabitTracker21) {
		super(controller);
		this.plugin = plugin;
		this.containerEl = parentEl.createDiv('habit-tracker-bases-container');
	}

	onDataUpdated(): void {
		// Destroy existing component if any
		if (this.component) {
			this.component.$destroy();
			this.component = null;
		}

		// Clear container
		this.containerEl.empty();

		// Create new Svelte component with Bases data
		this.component = new HabitTrackerBases({
			target: this.containerEl,
			props: {
				app: this.app,
				basesData: this.data,
				basesConfig: this.config,
				userSettings: {},
				globalSettings: this.plugin.settings,
				pluginName: this.plugin.manifest.name,
			},
		});
	}

	onunload(): void {
		if (this.component) {
			this.component.$destroy();
			this.component = null;
		}
	}
}
