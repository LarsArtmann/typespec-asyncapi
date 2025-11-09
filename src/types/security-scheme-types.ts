/** Type Safety Crisis Resolution - Security Scheme Types */

import type { SecuritySchemeType } from "./securitySchemeType.js"

export interface OAuth2Flow {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes?: Record<string, string>
}

export interface OAuth2Scheme {
  type: "oauth2"
  description?: string
  flows: Record<string, OAuth2Flow>
}
export interface ApiKeyScheme {
  type: "apiKey"
  description?: string
  name: string
  in: "header" | "query" | "cookie"
}

export interface HttpScheme {
  type: "http"
  description?: string
  scheme: string
  bearerFormat?: string
}
export type SecuritySchemeConfig = OAuth2Scheme | ApiKeyScheme | HttpScheme

export const isOAuth2Scheme = (scheme: unknown): scheme is OAuth2Scheme => {
  return typeof scheme === "object" && scheme !== null && "type" in scheme && (scheme as any).type === "oauth2"
}

export const isApiKeyScheme = (scheme: unknown): scheme is ApiKeyScheme => {
  return typeof scheme === "object" && scheme !== null && "type" in scheme && (scheme as any).type === "apiKey"
}
export const isHttpScheme = (scheme: unknown): scheme is HttpScheme => {
  return typeof scheme === "object" && scheme !== null && "type" in scheme && (scheme as any).type === "http"
}

export interface ValidationSuccess {
  valid: true
  scheme: SecuritySchemeConfig
  errors: string[]
}

export interface ValidationFailure {
  valid: false
  scheme: null
  errors: string[]
}

export type ValidationResult = ValidationSuccess | ValidationFailure
