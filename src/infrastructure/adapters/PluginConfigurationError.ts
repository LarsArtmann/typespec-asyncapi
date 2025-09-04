import {PluginError} from "../../plugins/PluginError.js"
import type {IPlugin} from "./IPlugin.js"

export class PluginConfigurationError extends PluginError {
	constructor(
		plugin: IPlugin,
		operation: string,
		reason: string,
		cause?: Error,
	) {
		super("PluginConfigurationError", plugin, operation, reason, cause)
	}
}