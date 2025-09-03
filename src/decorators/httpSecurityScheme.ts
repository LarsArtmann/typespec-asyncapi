export type HttpSecurityScheme = {
	type: "http";
	/** HTTP authentication scheme */
	scheme: "basic" | "bearer" | "digest" | "hoba" | "mutual" | "negotiate" | "oauth" | "scram-sha-1" | "scram-sha-256" | "vapid";
	/** Bearer format (for bearer scheme) */
	bearerFormat?: string;
	/** Description of the security scheme */
	description?: string;
}