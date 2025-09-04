import {PluginError} from "./PluginError.js"
import type {IPlugin} from "./IPlugin.js"

export class PluginConfigurationError extends PluginError {
	constructor(
		public override readonly plugin: IPlugin,
		public override readonly operation: string,
		public override readonly reason: string,
		public override readonly cause?: Error,
	) {
		super("PluginConfigurationError", plugin, operation, reason, cause)
	}
}