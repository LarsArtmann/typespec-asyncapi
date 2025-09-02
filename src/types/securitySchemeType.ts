// Security scheme type enum
export type SecuritySchemeType =
	| 'userPassword'
	| 'apiKey'
	| 'X509'
	| 'symmetricEncryption'
	| 'asymmetricEncryption'
	| 'httpApiKey'
	| 'http'
	| 'oauth2'
	| 'openIdConnect'
	| 'plain'
	| 'scram-sha-256'
	| 'scram-sha-512'
	| 'gssapi';