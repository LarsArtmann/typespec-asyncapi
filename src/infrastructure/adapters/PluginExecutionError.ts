import {PluginError} from "./PluginError.js"
import type {IPlugin} from "./IPlugin.js"

export class PluginExecutionError extends PluginError {
	constructor(
		public readonly plugin: IPlugin,
		public override readonly operation: string,
		public readonly reason: string,
		public override readonly cause?: Error,
	) {
		super("PluginExecutionError", plugin, operation, reason, cause)
	}
}