// TODO Add integration tests with jest
import {Plugin, Notice, setIcon, App, PluginSettingTab, Setting} from 'obsidian'
import { debugLog, renderPrettyDate, isValidCSSColor } from './utils'
import type { GlobalHabitTrackerSettings, TodayIndicator, StorageLocation } from './types'
import { HabitTrackerBasesView, HABIT_TRACKER_BASES_VIEW } from './HabitTrackerView'

	import {
		format,
	} from 'date-fns'

interface HabitTrackerSettings extends GlobalHabitTrackerSettings {}

const DEFAULT_SETTINGS: HabitTrackerSettings = {
	path: '',
	daysToShow: 21,
	debug: false,
	matchLineLength: true,
	defaultColor: '',
	showStreaks: true,
	reverseOrder: false,
	todayIndicator: 'border' as TodayIndicator,
	storageLocation: 'habit-file' as StorageLocation,
	showMetrics: true,
	autoRefresh: true,
	enableStreakFreezes: true,
	maxFreezeDays: 7,
	showValueIntensity: true
}

export default class HabitTracker21 extends Plugin {
	settings: HabitTrackerSettings;

	async onload() {
		await this.loadSettings();

		// Register the Bases view
		this.registerBasesView(HABIT_TRACKER_BASES_VIEW, {
			name: 'Habit Tracker',
			icon: 'check-circle',
			factory: (controller, containerEl) => {
				return new HabitTrackerBasesView(controller, containerEl, this);
			},
			options: () => ([
				{
					type: 'slider',
					displayName: 'Days to show',
					key: 'daysToShow',
					default: this.settings.daysToShow,
					min: 1,
					max: 90,
					step: 1,
				},
				{
					type: 'toggle',
					displayName: 'Show streaks',
					key: 'showStreaks',
					default: this.settings.showStreaks,
				},
				{
					type: 'toggle',
					displayName: 'Reverse order',
					key: 'reverseOrder',
					default: this.settings.reverseOrder,
				},
			]),
		});

		// Check for updates in background (after a short delay)
		setTimeout(() => this.checkForUpdatesBackground(), 5000)

		// Add the settings tab
		this.addSettingTab(new HabitTrackerSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		console.log('[HabitTracker] Saving settings:', this.settings);
		await this.saveData(this.settings);
	}

	async checkForUpdatesBackground() {
		const lastCheck = localStorage.getItem('habit-tracker-last-update-check')
		const now = Date.now()
		const dayInMs = 24 * 60 * 60 * 1000

		// Only check once per day for background checks
		if (lastCheck && (now - parseInt(lastCheck)) < dayInMs) {
			return
		}

		await this.performUpdateCheck()
	}

	async performUpdateCheck() {
		try {
			// Check GitHub releases for updates
			const response = await fetch('https://api.github.com/repos/zincplusplus/habit-tracker/releases/latest')
			if (!response.ok) throw new Error('Failed to fetch')

			const latestRelease = await response.json()
			const latestVersion = latestRelease.tag_name.replace('v', '')
			const currentVersion = this.manifest.version

			// Store check timestamp
			localStorage.setItem('habit-tracker-last-update-check', Date.now().toString())

			const isNewer = this.isNewerVersion(latestVersion, currentVersion)

			if (isNewer) {
				localStorage.setItem('habit-tracker-update-available', latestVersion)
			} else {
				localStorage.removeItem('habit-tracker-update-available')
			}
		} catch (error) {
			console.log('Update check failed:', error)
		}
	}

	isNewerVersion(latest: string, current: string): boolean {
		const parseVersion = (v: string) => v.split('.').map(Number)
		const latestParts = parseVersion(latest)
		const currentParts = parseVersion(current)

		for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
			const l = latestParts[i] || 0
			const c = currentParts[i] || 0
			if (l > c) return true
			if (l < c) return false
		}
		return false
	}

	onunload() {
		// Clean up any open views
		this.app.workspace.detachLeavesOfType(HABIT_TRACKER_BASES_VIEW);
	}
}

class HabitTrackerSettingTab extends PluginSettingTab {
	plugin: HabitTracker21;

	constructor(app: App, plugin: HabitTracker21) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h3', {text: `${this.plugin.manifest.name} Settings`});

		// General Settings Section
		let generalHeader = containerEl.createEl('h4', {text: '📁 General'});
		generalHeader.style.marginBottom = '0';
		const generalDesc = containerEl.createEl('div', {
			cls: 'setting-item-description',
			text: 'These apply to all trackers and can be overridden either in the codeblock or in the habit tracker file.'
		});
		generalDesc.style.marginBottom = '15px';
		generalDesc.style.fontSize = '0.85em';
		generalDesc.style.color = 'var(--text-muted)';

		new Setting(containerEl)
			.setName('Default path')
			.setDesc('Default path for habits (folder or file). Can be overridden with "path" in code blocks.')
			.addDropdown(dropdown => {
				// Get all folders in the vault
				const folders = this.app.vault.getAllLoadedFiles()
					.filter(file => 'children' in file && file.children !== undefined) // Only folders
					.map(folder => folder.path)
					.sort();

				// Add each folder as an option
				folders.forEach(folderPath => {
					dropdown.addOption(folderPath, folderPath);
				});

				// Set current value
				dropdown.setValue(this.plugin.settings.path);

				// Handle changes
				dropdown.onChange(async (value) => {
					this.plugin.settings.path = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Days to show')
			.setDesc('Number of days to display in the habit tracker. Can be overridden with "daysToShow" in code blocks.')
			.addText(text => text
				.setValue(this.plugin.settings.daysToShow.toString())
				.onChange(async (value) => {
					const numValue = parseInt(value);
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.daysToShow = numValue;
						await this.plugin.saveSettings();
					}
				}))
			.then(setting => {
				// Add number input attributes
				const inputEl = setting.controlEl.querySelector('input') as HTMLInputElement;
				if (inputEl) {
					inputEl.type = 'number';
					inputEl.min = '1';
					inputEl.step = '1';
				}
			});

		new Setting(containerEl)
			.setName('Reverse order')
			.setDesc('Show newest days first (right to left). Can be overridden per tracker.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.reverseOrder)
				.onChange(async (value) => {
					this.plugin.settings.reverseOrder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Match line length')
			.setDesc('Make habit tracker match the width of the readable line length. Can be overridden with "matchLineLength" in code blocks.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.matchLineLength)
				.onChange(async (value) => {
					this.plugin.settings.matchLineLength = value;
					await this.plugin.saveSettings();
				}));

		// Appearance Section
		const appearanceHeader = containerEl.createEl('h4', {text: '🎨 Appearance'});
		appearanceHeader.style.marginTop = '20px';
		appearanceHeader.style.marginBottom = '0';

		new Setting(containerEl)
			.setName('Today indicator')
			.setDesc('How to highlight the current day in the tracker.')
			.addDropdown(dropdown => dropdown
				.addOption('border', 'Pulsing border (default)')
				.addOption('emoji', 'Emoji indicator (⭐)')
				.addOption('highlight', 'Background highlight')
				.addOption('none', 'No indicator')
				.setValue(this.plugin.settings.todayIndicator)
				.onChange(async (value) => {
					this.plugin.settings.todayIndicator = value as any;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Default color')
			.setDesc('Default habit color (hex, RGB, or CSS color name). Can be overridden with "color" in code blocks or habit frontmatter.')
			.addText(text => text
				.setValue(this.plugin.settings.defaultColor)
				.setPlaceholder('#4CAF50 or green')
				.onChange(async (value) => {
					// Only save valid colors or empty string
					if (!value || isValidCSSColor(value)) {
						this.plugin.settings.defaultColor = value;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Show streaks')
			.setDesc('Display streak indicators and counts. Can be overridden with "showStreaks" in code blocks.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showStreaks)
				.onChange(async (value) => {
					this.plugin.settings.showStreaks = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show metrics panel')
			.setDesc('Display habit statistics (streaks, completion rate, etc.) below each tracker.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showMetrics)
				.onChange(async (value) => {
					this.plugin.settings.showMetrics = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show value intensity')
			.setDesc('For duration/quantity habits, show color intensity based on value (darker = higher value).')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showValueIntensity)
				.onChange(async (value) => {
					this.plugin.settings.showValueIntensity = value;
					await this.plugin.saveSettings();
				}));

		// Data Storage Section
		const storageHeader = containerEl.createEl('h4', {text: '💾 Data Storage'});
		storageHeader.style.marginTop = '20px';
		storageHeader.style.marginBottom = '0';

		new Setting(containerEl)
			.setName('Storage location')
			.setDesc('Where to store habit tracking data. Note: Daily note storage stores each habit as a property in your daily notes.')
			.addDropdown(dropdown => dropdown
				.addOption('habit-file', 'Habit files (default)')
				.addOption('daily-note', 'Daily notes properties')
				.setValue(this.plugin.settings.storageLocation)
				.onChange(async (value) => {
					this.plugin.settings.storageLocation = value as any;
					await this.plugin.saveSettings();
				}));

		// Tracking Features Section
		const trackingHeader = containerEl.createEl('h4', {text: '📊 Tracking Features'});
		trackingHeader.style.marginTop = '20px';
		trackingHeader.style.marginBottom = '0';

		new Setting(containerEl)
			.setName('Enable streak freezes')
			.setDesc('Allow marking days as "frozen" (e.g., vacations) that don\'t break streaks.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableStreakFreezes)
				.onChange(async (value) => {
					this.plugin.settings.enableStreakFreezes = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Maximum freeze days')
			.setDesc('Maximum number of consecutive days that can be frozen.')
			.addText(text => text
				.setValue(this.plugin.settings.maxFreezeDays.toString())
				.onChange(async (value) => {
					const numValue = parseInt(value);
					if (!isNaN(numValue) && numValue >= 0) {
						this.plugin.settings.maxFreezeDays = numValue;
						await this.plugin.saveSettings();
					}
				}))
			.then(setting => {
				// Add number input attributes
				const inputEl = setting.controlEl.querySelector('input') as HTMLInputElement;
				if (inputEl) {
					inputEl.type = 'number';
					inputEl.min = '0';
					inputEl.step = '1';
				}
			});

		// Advanced Section
		const advancedHeader = containerEl.createEl('h4', {text: '🔧 Advanced'});
		advancedHeader.style.marginTop = '20px';
		advancedHeader.style.marginBottom = '0';

		new Setting(containerEl)
			.setName('Auto-refresh')
			.setDesc('Automatically refresh trackers at midnight and when habit files change.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoRefresh)
				.onChange(async (value) => {
					this.plugin.settings.autoRefresh = value;
					await this.plugin.saveSettings();
				}));

		// Troubleshooting Section
		const troubleshootingHeader = containerEl.createEl('h4', {text: 'Troubleshooting'});
		troubleshootingHeader.style.marginTop = '20px';

		new Setting(containerEl)
			.setName('Debug mode')
			.setDesc('Enable debug output to console. Can be overridden with "debug" in code blocks.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.debug)
				.onChange(async (value) => {
					this.plugin.settings.debug = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Reset settings')
			.setDesc('Reset all settings to their default values')
			.addButton(button => button
				.setButtonText('Reset to defaults')
				.setWarning()
				.onClick(async () => {
					// Reset to default settings
					this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
					await this.plugin.saveSettings();
					// Refresh the settings display
					this.display();
				}));
	}
}
