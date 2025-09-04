import {PluginError} from "./PluginError.js"
import type {IPlugin} from "./IPlugin.js"

/**
 * Plugin loading error types for better error handling
 */
export class PluginLoadingError extends PluginError {
	constructor(
		public readonly plugin: IPlugin,
		public override readonly operation: string,
		public readonly reason: string,
		public override readonly cause?: Error,
	) {
		super("PluginLoadingError", plugin, operation, reason, cause)
	}
}