import {PluginError} from "../../plugins/PluginError.js"
import type {IPlugin} from "./IPlugin.js"

export class PluginExecutionError extends PluginError {
	constructor(
		plugin: IPlugin,
		operation: string,
		reason: string,
		cause?: Error,
	) {
		super("PluginExecutionError", plugin, operation, reason, cause)
	}
}