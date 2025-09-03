export type OAuth2SecurityScheme = {
	type: "oauth2";
	/** OAuth 2.0 flows */
	flows: {
		implicit?: {
			authorizationUrl: string;
			scopes: Record<string, string>;
		};
		password?: {
			tokenUrl: string;
			refreshUrl?: string;
			scopes: Record<string, string>;
		};
		clientCredentials?: {
			tokenUrl: string;
			refreshUrl?: string;
			scopes: Record<string, string>;
		};
		authorizationCode?: {
			authorizationUrl: string;
			tokenUrl: string;
			refreshUrl?: string;
			scopes: Record<string, string>;
		};
	};
	/** Description of the security scheme */
	description?: string;
}