import {PluginError} from "../../plugins/PluginError.js"
import type {IPlugin} from "./IPlugin.js"

/**
 * Plugin loading error types for better error handling
 */
export class PluginLoadingError extends PluginError {
	constructor(
		plugin: IPlugin,
		operation: string,
		reason: string,
		cause?: Error,
	) {
		super("PluginLoadingError", plugin, operation, reason, cause)
	}
}