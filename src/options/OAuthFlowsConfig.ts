import type {OAuthFlowConfig} from "./OAuthFlowConfig.js"

//TODO: Can we do better with our Types?
export type OAuthFlowsConfig = {
	implicit?: OAuthFlowConfig;
	password?: OAuthFlowConfig;
	clientCredentials?: OAuthFlowConfig;
	authorizationCode?: OAuthFlowConfig;
}