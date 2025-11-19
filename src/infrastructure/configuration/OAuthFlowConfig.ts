//TODO: Can we do better with our Types?
export type OAuthFlowConfig = {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  availableScopes?: Record<string, string>;
};
