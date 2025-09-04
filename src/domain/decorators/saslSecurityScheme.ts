export type SaslSecurityScheme = {
	type: "sasl";
	/** SASL mechanism */
	mechanism: "PLAIN" | "SCRAM-SHA-256" | "SCRAM-SHA-512" | "GSSAPI";
	/** Description of the security scheme */
	description?: string;
}