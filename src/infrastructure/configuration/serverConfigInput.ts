//TODO: Can we do better with our Types?
export type ServerConfigInput = {
	host: string;
	protocol: string;
	description?: string;
	variables?: Record<string, {
		description?: string;
		default?: string;
		enum?: string[];
		examples?: string[];
	}>;
	security?: string[];
	bindings?: Record<string, unknown>;
}