/**
 * Type definitions for Habit Tracker 21 Enhanced
 * Includes all new features from the comprehensive roadmap
 */

/**
 * Habit tracking type - determines how the habit is tracked
 */
export type HabitType = 'completion' | 'duration' | 'quantity';

/**
 * Today indicator style options
 */
export type TodayIndicator = 'border' | 'emoji' | 'highlight' | 'none';

/**
 * Storage location for habit data
 */
export type StorageLocation = 'habit-file' | 'daily-note';

/**
 * Frequency type for habit recurrence
 */
export type FrequencyType = 'daily' | 'weekly' | 'custom';

/**
 * Individual habit entry with support for values and notes
 */
export interface HabitEntry {
	/** ISO date string (YYYY-MM-DD) */
	date: string;
	/** For duration/quantity tracking - the numeric value */
	value?: number;
	/** Optional note/comment for this entry */
	note?: string;
}

/**
 * Frequency configuration for custom habit schedules
 */
export interface FrequencyConfig {
	/** Type of frequency pattern */
	type: FrequencyType;
	/** Target number of completions (e.g., 3 times per week) */
	target?: number;
	/** Array of weekday numbers (0=Sunday, 6=Saturday) for specific days */
	weekdays?: number[];
}

/**
 * Habit file frontmatter structure
 */
export interface HabitFrontmatter {
	/** Display title for the habit */
	title?: string;
	/** Subtitle or description */
	subtitle?: string;
	/** Tracking type - completion (toggle), duration, or quantity */
	type?: HabitType;
	/** Unit for duration/quantity (e.g., "minutes", "cups", "pages") */
	unit?: string;
	/** Custom color for the habit */
	color?: string;
	/** Goal value for duration/quantity habits */
	goal?: number;
	/** Maximum value for input validation */
	maxValue?: number;
	/** Frequency configuration for non-daily habits */
	frequency?: FrequencyConfig;
	/** Start date - habit won't display before this */
	startDate?: string;
	/** End date - habit won't display after this */
	endDate?: string;
	/** Array of frozen dates that don't break streaks */
	frozenDates?: string[];
	/** If true, this habit file will be ignored */
	ignore?: boolean;
	/** Array of habit entries */
	entries: HabitEntry[];
}

/**
 * Settings for a specific habit tracker instance
 */
export interface HabitTrackerSettings {
	/** Path to folder containing habit files */
	path: string;
	/** First date to display */
	firstDisplayedDate?: string;
	/** Last date to display */
	lastDisplayedDate?: string;
	/** Number of days to show */
	daysToShow: number;
	/** Reverse order (newest first) */
	reverseOrder?: boolean;
	/** Style for today indicator */
	todayIndicator?: TodayIndicator;
	/** Where to store habit data */
	storageLocation?: StorageLocation;
	/** Files/folders to ignore (glob patterns) */
	ignoreFiles?: string[];
	/** Show metrics panel */
	showMetrics?: boolean;
	/** Match line length to available space */
	matchLineLength: boolean;
	/** Enable debug logging */
	debug: boolean;
	/** Custom color for this tracker */
	color?: string;
	/** Show streaks (existing feature) */
	showStreaks?: boolean;
}

/**
 * Global plugin settings
 */
export interface GlobalHabitTrackerSettings {
	/** Default path to habit files */
	path: string;
	/** Default number of days to show */
	daysToShow: number;
	/** Enable debug mode globally */
	debug: boolean;
	/** Match line length by default */
	matchLineLength: boolean;
	/** Default color for habits */
	defaultColor: string;
	/** Show streaks by default */
	showStreaks: boolean;
	/** Default reverse order setting */
	reverseOrder: boolean;
	/** Default today indicator */
	todayIndicator: TodayIndicator;
	/** Default storage location */
	storageLocation: StorageLocation;
	/** Default show metrics */
	showMetrics: boolean;
	/** Enable auto-refresh */
	autoRefresh: boolean;
	/** Enable streak freezes */
	enableStreakFreezes: boolean;
	/** Maximum freeze days allowed */
	maxFreezeDays: number;
}

/**
 * Habit data structure used in components
 */
export interface HabitData {
	/** The file containing this habit */
	file: any; // TFile from Obsidian
	/** Habit file path */
	path: string;
	/** Habit name/title */
	name: string;
	/** Array of date strings for entries */
	entries: string[];
	/** Full frontmatter data */
	frontmatter: HabitFrontmatter;
	/** Habit type */
	type: HabitType;
	/** Unit for values */
	unit?: string;
	/** Color for this habit */
	color?: string;
}

/**
 * Computed metrics for a habit
 */
export interface HabitMetrics {
	/** Current active streak */
	currentStreak: number;
	/** Longest streak achieved */
	longestStreak: number;
	/** Total number of completions */
	totalCompletions: number;
	/** Success rate as percentage */
	successRate: number;
	/** Average per week */
	averagePerWeek: number;
	/** Average per month */
	averagePerMonth: number;
	/** Total value (for duration/quantity habits) */
	totalValue?: number;
	/** Average value (for duration/quantity habits) */
	averageValue?: number;
}

/**
 * Entry with computed display information
 */
export interface DisplayEntry {
	/** ISO date string */
	date: string;
	/** Whether this day is completed/has value */
	ticked: boolean;
	/** Numeric value for duration/quantity */
	value?: number;
	/** Note for this entry */
	note?: string;
	/** Current streak at this date */
	streak: number;
	/** Whether this date is frozen */
	frozen: boolean;
	/** Whether this date is outside habit range */
	outsideRange: boolean;
	/** Whether this date matches frequency pattern */
	matchesFrequency: boolean;
}

/**
 * Modal data for editing an entry
 */
export interface EntryEditData {
	/** Date being edited */
	date: string;
	/** Current value (if any) */
	value?: number;
	/** Current note (if any) */
	note?: string;
	/** Habit type */
	type: HabitType;
	/** Unit label */
	unit?: string;
	/** Maximum allowed value */
	maxValue?: number;
	/** Goal value */
	goal?: number;
}
