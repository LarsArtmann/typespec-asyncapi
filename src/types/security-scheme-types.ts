/** Type Safety Crisis Resolution - Security Scheme Types */

export type OAuth2Flow = {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes?: Record<string, string>
}

export type OAuth2Scheme = {
  type: "oauth2"
  description?: string
  flows: Record<string, OAuth2Flow>
}

export type ApiKeyScheme = {
  type: "apiKey"
  description?: string
  name: string
  in: "header" | "query" | "cookie"
}

export type HttpScheme = {
  type: "http"
  description?: string
  scheme: string
  bearerFormat?: string
}

export type SecuritySchemeConfig = OAuth2Scheme | ApiKeyScheme | HttpScheme

export const isOAuth2Scheme = (scheme: unknown): scheme is OAuth2Scheme => {
  return typeof scheme === "object" && scheme !== null && "type" in scheme && (scheme as {type: unknown}).type === "oauth2"
}

export const isApiKeyScheme = (scheme: unknown): scheme is ApiKeyScheme => {
  return typeof scheme === "object" && scheme !== null && "type" in scheme && (scheme as {type: unknown}).type === "apiKey"
}

export const isHttpScheme = (scheme: unknown): scheme is HttpScheme => {
  return typeof scheme === "object" && scheme !== null && "type" in scheme && (scheme as {type: unknown}).type === "http"
}

export type ValidationSuccess = {
  readonly valid: true
  readonly scheme: SecuritySchemeConfig
  readonly errors: readonly string[]
}

export type ValidationFailure = {
  readonly valid: false
  readonly scheme: null
  readonly errors: readonly string[]
}

export type ValidationResult = ValidationSuccess | ValidationFailure
