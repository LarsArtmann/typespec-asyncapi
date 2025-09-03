import {PluginError} from "./PluginError.js"
import type {IPlugin} from "./IPlugin.js"

export class PluginExecutionError extends PluginError {
	constructor(
		public override readonly plugin: IPlugin,
		public override readonly operation: string,
		public override readonly reason: string,
		public override readonly cause?: Error,
	) {
		super("PluginExecutionError", plugin, operation, reason, cause)
	}
}