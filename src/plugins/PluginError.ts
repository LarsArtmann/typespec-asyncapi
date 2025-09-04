import type {IPlugin} from "../infrastructure/adapters/IPlugin.js"

export class PluginError extends Error {
	constructor(
		public override readonly name: string,
		public readonly plugin: IPlugin,
		public readonly operation: string,
		public readonly reason: string,
		public override readonly cause: Error | undefined = undefined,
	) {
		super(`Plugin '${plugin.name}' failed during '${operation}': ${reason}`)
	}
}