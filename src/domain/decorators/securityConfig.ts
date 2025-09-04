import type {SecurityScheme} from "./securityScheme.js"

export type SecurityConfig = {
	/** Security scheme name */
	name: string;
	/** Security scheme configuration */
	scheme: SecurityScheme;
	/** Required scopes (for OAuth2 and OpenID Connect) */
	scopes?: string[];
	/** Additional security metadata */
	metadata?: Record<string, unknown>;
}