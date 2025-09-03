export type ApiKeySecurityScheme = {
	type: "apiKey";
	/** Location of the API key */
	in: "user" | "password" | "query" | "header" | "cookie";
	/** Description of the security scheme */
	description?: string;
}