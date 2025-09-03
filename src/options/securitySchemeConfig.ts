import type {OAuthFlowsConfig} from "./OAuthFlowsConfig.js"

//TODO: Can we do better with our Types?
export type SecuritySchemeConfig = {
	type: "oauth2" | "apiKey" | "httpApiKey" | "http" | "plain" | "scram-sha-256" | "scram-sha-512" | "gssapi";
	description?: string;
	name?: string;
	in?: "user" | "password" | "query" | "header" | "cookie";
	scheme?: string;
	bearerFormat?: string;
	flows?: OAuthFlowsConfig;
}