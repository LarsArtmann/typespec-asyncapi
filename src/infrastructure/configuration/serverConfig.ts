import type {VariableConfig} from "./variableConfig.js"

//TODO: Can we do better with our Types?
export type ServerConfig = {
	host: string;
	protocol: string;
	description?: string;
	variables?: Record<string, VariableConfig>;
	security?: string[];
	bindings?: Record<string, unknown>;
}