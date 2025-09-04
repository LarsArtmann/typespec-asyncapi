import type {ApiKeySecurityScheme} from "./apiKeySecurityScheme.js"
import type {HttpSecurityScheme} from "./httpSecurityScheme.js"
import type {OAuth2SecurityScheme} from "./OAuth2SecurityScheme.js"
import type {OpenIdConnectSecurityScheme} from "./openIdConnectSecurityScheme.js"
import type {AsymmetricEncryptionSecurityScheme} from "./asymmetricEncryptionSecurityScheme.js"
import type {SymmetricEncryptionSecurityScheme} from "./symmetricEncryptionSecurityScheme.js"
import type {X509SecurityScheme} from "./x509SecurityScheme.js"
import type {SaslSecurityScheme} from "./saslSecurityScheme.js"

export type SecurityScheme =
	| ApiKeySecurityScheme
	| HttpSecurityScheme
	| OAuth2SecurityScheme
	| OpenIdConnectSecurityScheme
	| SaslSecurityScheme
	| X509SecurityScheme
	| SymmetricEncryptionSecurityScheme
	| AsymmetricEncryptionSecurityScheme;