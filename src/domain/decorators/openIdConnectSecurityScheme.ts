export type OpenIdConnectSecurityScheme = {
	type: "openIdConnect";
	/** OpenID Connect URL */
	openIdConnectUrl: string;
	/** Description of the security scheme */
	description?: string;
}