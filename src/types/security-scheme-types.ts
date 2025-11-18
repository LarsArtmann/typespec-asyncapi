/**
 * Type Safety Crisis Resolution - Security Scheme Types
 *
 * Complete discriminated union for all AsyncAPI 3.0 security schemes
 * This replaces dangerous `any` types with proper type-safe variants
 */

// ============================================================================
// OAuth2 Security Scheme
// ============================================================================

export type OAuth2Flow = {
  readonly authorizationUrl?: string
  readonly tokenUrl?: string
  readonly refreshUrl?: string
  readonly scopes?: Record<string, string>
}

export type OAuth2Scheme = {
  readonly type: "oauth2"
  readonly description?: string
  readonly flows: Record<string, OAuth2Flow>
}

// ============================================================================
// API Key Security Schemes
// ============================================================================

export type ApiKeyScheme = {
  readonly type: "apiKey"
  readonly description?: string
  readonly name: string
  readonly in: "user" | "password" | "query" | "header" | "cookie"
}

export type HttpApiKeyScheme = {
  readonly type: "httpApiKey"
  readonly description?: string
  readonly name: string
  readonly in: "user" | "password" | "query" | "header" | "cookie"
}

// ============================================================================
// HTTP Authentication Security Scheme
// ============================================================================

export type HttpScheme = {
  readonly type: "http"
  readonly description?: string
  readonly scheme: string
  readonly bearerFormat?: string
}

// ============================================================================
// OpenID Connect Security Scheme
// ============================================================================

export type OpenIdConnectScheme = {
  readonly type: "openIdConnect"
  readonly description?: string
  readonly openIdConnectUrl: string
}

// ============================================================================
// SASL Security Scheme
// ============================================================================

export type SaslScheme = {
  readonly type: "sasl"
  readonly description?: string
  readonly mechanism?: string
}

// ============================================================================
// User/Password Security Scheme
// ============================================================================

export type UserPasswordScheme = {
  readonly type: "userPassword"
  readonly description?: string
}

// ============================================================================
// X.509 Certificate Security Scheme
// ============================================================================

export type X509Scheme = {
  readonly type: "X509"
  readonly description?: string
}

// ============================================================================
// Encryption Security Schemes
// ============================================================================

export type SymmetricEncryptionScheme = {
  readonly type: "symmetricEncryption"
  readonly description?: string
}

export type AsymmetricEncryptionScheme = {
  readonly type: "asymmetricEncryption"
  readonly description?: string
}

// ============================================================================
// Complete Discriminated Union
// ============================================================================

/**
 * Complete discriminated union of all supported security schemes
 *
 * This type makes invalid states unrepresentable:
 * - Cannot have oauth2 without flows
 * - Cannot have apiKey without name/in
 * - Cannot have openIdConnect without URL
 * - Type discriminator enables exhaustive pattern matching
 */
export type SecurityScheme =
  | OAuth2Scheme
  | ApiKeyScheme
  | HttpApiKeyScheme
  | HttpScheme
  | OpenIdConnectScheme
  | SaslScheme
  | UserPasswordScheme
  | X509Scheme
  | SymmetricEncryptionScheme
  | AsymmetricEncryptionScheme

/**
 * Legacy alias for backwards compatibility
 * @deprecated Use SecurityScheme instead
 */
export type SecuritySchemeConfig = SecurityScheme

// ============================================================================
// Type Guards (Runtime Type Checking)
// ============================================================================

/**
 * Type guard helpers for runtime validation
 * These enable exhaustive pattern matching and type-safe validation
 */

const hasType = (value: unknown, expectedType: string): boolean => {
  return typeof value === "object" &&
         value !== null &&
         "type" in value &&
         (value as { type: unknown }).type === expectedType
}

export const isOAuth2Scheme = (scheme: unknown): scheme is OAuth2Scheme => {
  if (!hasType(scheme, "oauth2")) return false
  const s = scheme as Record<string, unknown>
  return "flows" in s && typeof s.flows === "object" && s.flows !== null
}

/**
 * Generic helper for checking schemes with name and in properties
 * Eliminates duplication between isApiKeyScheme and isHttpApiKeyScheme
 */
const isSchemeWithNameAndIn = (scheme: unknown, expectedType: string): scheme is Record<string, unknown> & { name: string; in: string } => {
	if (!hasType(scheme, expectedType)) return false
	const s = scheme as Record<string, unknown>
	return "name" in s && typeof s.name === "string" &&
	       "in" in s && typeof s.in === "string"
}

export const isApiKeyScheme = (scheme: unknown): scheme is ApiKeyScheme => {
	return isSchemeWithNameAndIn(scheme, "apiKey")
}

export const isHttpApiKeyScheme = (scheme: unknown): scheme is HttpApiKeyScheme => {
	return isSchemeWithNameAndIn(scheme, "httpApiKey")
}

export const isHttpScheme = (scheme: unknown): scheme is HttpScheme => {
  if (!hasType(scheme, "http")) return false
  const s = scheme as Record<string, unknown>
  return "scheme" in s && typeof s.scheme === "string"
}

export const isOpenIdConnectScheme = (scheme: unknown): scheme is OpenIdConnectScheme => {
  if (!hasType(scheme, "openIdConnect")) return false
  const s = scheme as Record<string, unknown>
  return "openIdConnectUrl" in s && typeof s.openIdConnectUrl === "string"
}

export const isSaslScheme = (scheme: unknown): scheme is SaslScheme => {
  return hasType(scheme, "sasl")
}

export const isUserPasswordScheme = (scheme: unknown): scheme is UserPasswordScheme => {
  return hasType(scheme, "userPassword")
}

export const isX509Scheme = (scheme: unknown): scheme is X509Scheme => {
  return hasType(scheme, "X509")
}

export const isSymmetricEncryptionScheme = (scheme: unknown): scheme is SymmetricEncryptionScheme => {
  return hasType(scheme, "symmetricEncryption")
}

export const isAsymmetricEncryptionScheme = (scheme: unknown): scheme is AsymmetricEncryptionScheme => {
  return hasType(scheme, "asymmetricEncryption")
}

/**
 * Main type guard that validates any unknown value is a valid SecurityScheme
 * Uses discriminated union pattern for exhaustive checking
 */
export const isSecurityScheme = (scheme: unknown): scheme is SecurityScheme => {
  return isOAuth2Scheme(scheme) ||
         isApiKeyScheme(scheme) ||
         isHttpApiKeyScheme(scheme) ||
         isHttpScheme(scheme) ||
         isOpenIdConnectScheme(scheme) ||
         isSaslScheme(scheme) ||
         isUserPasswordScheme(scheme) ||
         isX509Scheme(scheme) ||
         isSymmetricEncryptionScheme(scheme) ||
         isAsymmetricEncryptionScheme(scheme)
}
