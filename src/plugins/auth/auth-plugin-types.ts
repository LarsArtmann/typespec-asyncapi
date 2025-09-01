/**
 * Authentication Plugin Types
 * 
 * Defines the core authentication plugin architecture for generated applications.
 * Supports JWT, OAuth2, API Keys, and custom authentication mechanisms.
 */

import { Effect } from "effect"

export const AuthenticationType = {
    JWT: "jwt",
    OAUTH2: "oauth2",
    API_KEY: "apikey", 
    BASIC: "basic",
    CUSTOM: "custom"
} as const

export type AuthenticationType = typeof AuthenticationType[keyof typeof AuthenticationType]

export const AuthenticationState = {
    IDLE: "idle",
    AUTHENTICATING: "authenticating", 
    AUTHENTICATED: "authenticated",
    FAILED: "failed",
    EXPIRED: "expired"
} as const

export type AuthenticationState = typeof AuthenticationState[keyof typeof AuthenticationState]

/**
 * Authentication result for verification operations
 */
export type AuthenticationResult = {
    readonly success: boolean
    readonly userId?: string
    readonly scope?: string[]
    readonly metadata?: Record<string, unknown>
    readonly expiresAt?: Date
    readonly errorCode?: string
    readonly errorMessage?: string
}

/**
 * Token-based authentication configuration
 */
export type TokenAuthConfig = {
    readonly issuer?: string
    readonly audience?: string
    readonly secret?: string
    readonly publicKeyUrl?: string
    readonly algorithm?: string
    readonly expirationTime?: number
    readonly refreshEnabled?: boolean
}

/**
 * OAuth2 provider configuration
 */
export type OAuth2Config = {
    readonly authorizationUrl: string
    readonly tokenUrl: string
    readonly clientId: string
    readonly clientSecret?: string
    readonly scope?: string[]
    readonly redirectUri?: string
    readonly providerName: string
}

/**
 * API key authentication configuration
 */
export type ApiKeyConfig = {
    readonly header?: string
    readonly queryParam?: string
    readonly prefix?: string
    readonly storage: 'memory' | 'redis' | 'database'
    readonly rateLimit?: {
        maxRequests: number
        windowMs: number
    }
}

/**
 * Core authentication plugin interface
 */
export type AuthenticationPlugin = {
    readonly name: string
    readonly version: string
    readonly type: AuthenticationType
    readonly dependencies: string[]
    
    /**
     * Initialize the authentication plugin with configuration
     */
    initialize(config: unknown): Effect.Effect<void, Error>
    
    /**
     * Start the authentication service
     */
    start(): Effect.Effect<void, Error>
    
    /**
     * Stop the authentication service gracefully
     */
    stop(): Effect.Effect<void, Error>
    
    /**
     * Authenticate a request and return verification result
     */
    authenticate(request: AuthenticationRequest): Effect.Effect<AuthenticationResult, Error>
    
    /**
     * Validate authentication configuration
     */
    validateConfig(config: unknown): Effect.Effect<boolean, Error>
    
    /**
     * Generate middleware code for the target runtime
     */
    generateMiddleware(runtime: 'go' | 'nodejs', config: unknown): Effect.Effect<string, Error>
    
    /**
     * Generate authentication documentation
     */
    generateDocs(): Effect.Effect<string, Error>
}

/**
 * Authentication request context
 */
export type AuthenticationRequest = {
    readonly headers: Record<string, string>
    readonly query: Record<string, string>
    readonly body?: unknown
    readonly method: string
    readonly path: string
    readonly ip?: string
    readonly userAgent?: string
}

/**
 * Authentication middleware configuration for code generation
 */
export type AuthMiddlewareConfig = {
    readonly type: AuthenticationType
    readonly config: TokenAuthConfig | OAuth2Config | ApiKeyConfig
    readonly routes?: string[]
    readonly excludeRoutes?: string[]
    readonly requireScopes?: string[]
    readonly errorHandling: 'return' | 'redirect' | 'custom'
}

/**
 * Authentication plugin metadata for the registry
 */
export type AuthPluginMetadata = {
    readonly name: string
    readonly version: string
    readonly type: AuthenticationType
    readonly supportedRuntimes: ('go' | 'nodejs')[]
    readonly configSchema: Record<string, unknown>
    readonly description: string
    readonly examples: Record<string, unknown>[]
}