export type HttpSecurityScheme = {
	type: "http";
	/** HTTP authentication scheme - IANA registered schemes per RFC9110 */
	scheme:
		| "basic"           // RFC7617
		| "bearer"          // RFC6750
		| "digest"          // RFC7616
		| "hoba"            // RFC7486
		| "mutual"          // RFC8120
		| "negotiate"       // RFC4559
		| "oauth"           // RFC5849
		| "scram-sha-1"     // RFC7804
		| "scram-sha-256"   // RF7804
		| "vapid"           // RFC8292
		| "dpop"            // RFC9449 - Demonstrating Proof-of-Possession
		| "gnap"            // RFC9635 - Grant Negotiation and Authorization Protocol
		| "privatetoken";   // RFC Private Token - Privacy-preserving tokens
	/** Bearer format (for bearer scheme) */
	bearerFormat?: string;
	/** Description of the security scheme */
	description?: string;
}