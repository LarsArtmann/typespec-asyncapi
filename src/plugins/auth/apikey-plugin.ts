/**
 * API Key Authentication Plugin
 * 
 * Provides API key authentication with configurable key sources (header, query, cookie),
 * rate limiting, and middleware generation for Go and Node.js runtimes.
 */

import { Effect } from "effect"
import type {
    AuthenticationPlugin,
    AuthenticationRequest,
    AuthenticationResult,
    ApiKeyConfig,
    AuthenticationType
} from "./auth-plugin-types.js"

/**
 * API Key validation and rate limiting
 */
class ApiKeyValidator {
    private config: ApiKeyConfig = {
        header: 'X-API-Key',
        storage: 'memory'
    }
    
    // Simple in-memory rate limiting (in production, use Redis or database)
    private rateLimitCache = new Map<string, { count: number; resetTime: number }>()
    
    initialize(config: ApiKeyConfig): Effect.Effect<void, Error> {
        return Effect.gen(function* () {
            this.config = {
                header: config.header || 'X-API-Key',
                queryParam: config.queryParam || 'api_key',
                prefix: config.prefix,
                storage: config.storage || 'memory',
                rateLimit: config.rateLimit
            }
            
            yield* Effect.log(`= API Key plugin initialized with header: ${this.config.header}, storage: ${this.config.storage}`)
            
            if (this.config.rateLimit) {
                yield* Effect.log(`ñ Rate limiting enabled: ${this.config.rateLimit.maxRequests} requests per ${this.config.rateLimit.windowMs}ms`)
            }
        }.bind(this))
    }
    
    /**
     * Validate API key from request headers or query parameters
     */
    validateApiKey(request: AuthenticationRequest): Effect.Effect<AuthenticationResult, Error> {
        return Effect.gen(function* () {
            // Extract API key from various sources
            const apiKey = this.extractApiKey(request)
            
            if (!apiKey) {
                return {
                    success: false,
                    errorCode: 'MISSING_API_KEY',
                    errorMessage: `API key not found in ${this.config.header} header or ${this.config.queryParam} query parameter`
                }
            }
            
            // Validate API key format (basic validation)
            const cleanKey = this.config.prefix 
                ? apiKey.replace(new RegExp(`^${this.config.prefix}\\s*`), '')
                : apiKey
                
            if (!cleanKey || cleanKey.length < 8) {
                return {
                    success: false,
                    errorCode: 'INVALID_API_KEY_FORMAT',
                    errorMessage: 'API key format is invalid'
                }
            }
            
            // Check rate limiting before key validation
            if (this.config.rateLimit) {
                const rateLimitResult = this.checkRateLimit(cleanKey)
                if (!rateLimitResult.allowed) {
                    return {
                        success: false,
                        errorCode: 'RATE_LIMIT_EXCEEDED',
                        errorMessage: `Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.resetIn! / 1000)} seconds`
                    }
                }
            }
            
            // Validate API key (in production, check against database/cache)
            const keyValidation = yield* this.validateKeyInStorage(cleanKey)
            
            if (!keyValidation.valid) {
                return {
                    success: false,
                    errorCode: 'INVALID_API_KEY',
                    errorMessage: 'API key is invalid or has been revoked'
                }
            }
            
            yield* Effect.log(` API key validated for user: ${keyValidation.userId}`)
            
            return {
                success: true,
                userId: keyValidation.userId,
                scope: keyValidation.scopes || [],
                metadata: {
                    keyId: cleanKey.substring(0, 8) + '...',
                    storage: this.config.storage,
                    source: this.getKeySource(request),
                    rateLimited: !!this.config.rateLimit
                }
            }
            
        }.bind(this))
    }
    
    /**
     * Extract API key from request headers or query parameters
     */
    private extractApiKey(request: AuthenticationRequest): string | null {
        // Try header first
        if (this.config.header) {
            const headerKey = request.headers[this.config.header.toLowerCase()] || 
                             request.headers[this.config.header]
            if (headerKey) return headerKey
        }
        
        // Try query parameter
        if (this.config.queryParam) {
            const queryKey = request.query[this.config.queryParam]
            if (queryKey) return queryKey
        }
        
        return null
    }
    
    /**
     * Determine the source of the API key for logging/debugging
     */
    private getKeySource(request: AuthenticationRequest): string {
        if (this.config.header && (request.headers[this.config.header.toLowerCase()] || request.headers[this.config.header])) {
            return 'header'
        }
        if (this.config.queryParam && request.query[this.config.queryParam]) {
            return 'query'
        }
        return 'unknown'
    }
    
    /**
     * Simple rate limiting implementation
     */
    private checkRateLimit(apiKey: string): { allowed: boolean; resetIn?: number } {
        if (!this.config.rateLimit) {
            return { allowed: true }
        }
        
        const now = Date.now()
        const windowMs = this.config.rateLimit.windowMs
        const maxRequests = this.config.rateLimit.maxRequests
        
        const record = this.rateLimitCache.get(apiKey)
        
        // No existing record or window has passed
        if (!record || now > record.resetTime) {
            this.rateLimitCache.set(apiKey, {
                count: 1,
                resetTime: now + windowMs
            })
            return { allowed: true }
        }
        
        // Within the window - check if limit exceeded
        if (record.count >= maxRequests) {
            return {
                allowed: false,
                resetIn: record.resetTime - now
            }
        }
        
        // Increment count
        record.count++
        return { allowed: true }
    }
    
    /**
     * Validate API key against storage (simulate database/cache lookup)
     */
    private validateKeyInStorage(apiKey: string): Effect.Effect<{ valid: boolean; userId?: string; scopes?: string[] }, Error> {
        return Effect.gen(function* () {
            // In production, this would query your storage system:
            // - Database lookup for key validation
            // - Redis cache for fast key verification
            // - Key metadata (user, scopes, expiration)
            
            yield* Effect.log(`= Validating API key in ${this.config.storage}: ${apiKey.substring(0, 8)}...`)
            
            // Simulate storage validation
            const validKeys = new Map([
                ['sk_live_123456789abcdef', { userId: 'user_123', scopes: ['read', 'write'] }],
                ['ak_test_987654321fedcba', { userId: 'user_456', scopes: ['read'] }],
                ['key_demo_abcdef123456789', { userId: 'demo_user', scopes: ['read', 'write', 'admin'] }]
            ])
            
            const keyData = validKeys.get(apiKey)
            if (keyData) {
                return {
                    valid: true,
                    userId: keyData.userId,
                    scopes: keyData.scopes
                }
            }
            
            return { valid: false }
        }.bind(this))
    }
}

/**
 * API Key Authentication Plugin Implementation
 */
export const apiKeyAuthPlugin: AuthenticationPlugin = {
    name: "apikey-auth",
    version: "1.0.0",
    type: AuthenticationType.API_KEY,
    dependencies: [],
    
    initialize: (config: unknown) => Effect.gen(function* () {
        const validator = new ApiKeyValidator()
        
        if (typeof config !== 'object' || !config) {
            return yield* Effect.fail(new Error("Invalid API Key configuration"))
        }
        
        yield* validator.initialize(config as ApiKeyConfig)
        yield* Effect.log("=€ API Key Authentication Plugin initialized")
    }),
    
    start: () => Effect.gen(function* () {
        yield* Effect.log("¶ API Key Authentication Plugin started")
    }),
    
    stop: () => Effect.gen(function* () {
        yield* Effect.log("ù API Key Authentication Plugin stopped") 
    }),
    
    authenticate: (request: AuthenticationRequest) => {
        const validator = new ApiKeyValidator()
        return validator.validateApiKey(request)
    },
    
    validateConfig: (config: unknown) => Effect.gen(function* () {
        if (typeof config !== 'object' || !config) {
            return false
        }
        
        const apiKeyConfig = config as ApiKeyConfig
        
        // At least one source must be specified
        if (!apiKeyConfig.header && !apiKeyConfig.queryParam) {
            return false
        }
        
        // Validate rate limit configuration
        if (apiKeyConfig.rateLimit) {
            if (!apiKeyConfig.rateLimit.maxRequests || apiKeyConfig.rateLimit.maxRequests <= 0) {
                return false
            }
            if (!apiKeyConfig.rateLimit.windowMs || apiKeyConfig.rateLimit.windowMs <= 0) {
                return false
            }
        }
        
        // Validate storage type
        if (apiKeyConfig.storage && !['memory', 'redis', 'database'].includes(apiKeyConfig.storage)) {
            return false
        }
        
        return true
    }),
    
    generateMiddleware: (runtime: 'go' | 'nodejs', config: unknown) => Effect.gen(function* () {
        const apiKeyConfig = config as ApiKeyConfig
        
        if (runtime === 'go') {
            return `
// API Key Authentication Middleware for Go (Gin)
package middleware

import (
    "fmt"
    "net/http"
    "strings"
    "sync"
    "time"
    "github.com/gin-gonic/gin"
)

type ApiKeyConfig struct {
    Header      string \`json:"header"\`
    QueryParam  string \`json:"query_param"\`
    Prefix      string \`json:"prefix"\`
    Storage     string \`json:"storage"\`
    RateLimit   *RateLimitConfig \`json:"rate_limit"\`
}

type RateLimitConfig struct {
    MaxRequests int   \`json:"max_requests"\`
    WindowMs    int64 \`json:"window_ms"\`
}

type RateLimitRecord struct {
    Count     int   \`json:"count"\`
    ResetTime int64 \`json:"reset_time"\`
}

var apiKeyConfig = ApiKeyConfig{
    Header:     "${apiKeyConfig.header || 'X-API-Key'}",
    QueryParam: "${apiKeyConfig.queryParam || 'api_key'}",
    Prefix:     "${apiKeyConfig.prefix || ''}",
    Storage:    "${apiKeyConfig.storage || 'memory'}",
    RateLimit: ${apiKeyConfig.rateLimit ? `&RateLimitConfig{
        MaxRequests: ${apiKeyConfig.rateLimit.maxRequests},
        WindowMs:    ${apiKeyConfig.rateLimit.windowMs},
    }` : 'nil'},
}

// Simple in-memory rate limiting
var (
    rateLimitCache = make(map[string]*RateLimitRecord)
    rateLimitMutex sync.RWMutex
)

func ApiKeyAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Extract API key from header or query
        apiKey := extractApiKey(c)
        if apiKey == "" {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "missing_api_key",
                "message": fmt.Sprintf("API key not found in %s header or %s query parameter", 
                    apiKeyConfig.Header, apiKeyConfig.QueryParam),
            })
            c.Abort()
            return
        }
        
        // Remove prefix if configured
        cleanKey := apiKey
        if apiKeyConfig.Prefix != "" {
            cleanKey = strings.TrimPrefix(apiKey, apiKeyConfig.Prefix)
            cleanKey = strings.TrimSpace(cleanKey)
        }
        
        if len(cleanKey) < 8 {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "invalid_api_key_format",
                "message": "API key format is invalid",
            })
            c.Abort()
            return
        }
        
        // Check rate limiting
        if apiKeyConfig.RateLimit != nil {
            allowed, resetIn := checkRateLimit(cleanKey)
            if !allowed {
                c.JSON(http.StatusTooManyRequests, gin.H{
                    "error": "rate_limit_exceeded",
                    "message": fmt.Sprintf("Rate limit exceeded. Try again in %d seconds", 
                        int(resetIn/1000)),
                })
                c.Abort()
                return
            }
        }
        
        // Validate API key
        keyData, valid := validateApiKey(cleanKey)
        if !valid {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "invalid_api_key",
                "message": "API key is invalid or has been revoked",
            })
            c.Abort()
            return
        }
        
        // Store user information in context
        c.Set("user_id", keyData["user_id"])
        c.Set("user_scope", keyData["scopes"])
        c.Set("api_key_id", cleanKey[:8]+"...")
        
        c.Next()
    }
}

func extractApiKey(c *gin.Context) string {
    // Try header first
    if apiKeyConfig.Header != "" {
        if key := c.GetHeader(apiKeyConfig.Header); key != "" {
            return key
        }
    }
    
    // Try query parameter
    if apiKeyConfig.QueryParam != "" {
        if key := c.Query(apiKeyConfig.QueryParam); key != "" {
            return key
        }
    }
    
    return ""
}

func checkRateLimit(apiKey string) (allowed bool, resetIn int64) {
    if apiKeyConfig.RateLimit == nil {
        return true, 0
    }
    
    now := time.Now().UnixMilli()
    windowMs := apiKeyConfig.RateLimit.WindowMs
    maxRequests := apiKeyConfig.RateLimit.MaxRequests
    
    rateLimitMutex.Lock()
    defer rateLimitMutex.Unlock()
    
    record, exists := rateLimitCache[apiKey]
    
    // No existing record or window has passed
    if !exists || now > record.ResetTime {
        rateLimitCache[apiKey] = &RateLimitRecord{
            Count:     1,
            ResetTime: now + windowMs,
        }
        return true, 0
    }
    
    // Within window - check if limit exceeded
    if record.Count >= maxRequests {
        return false, record.ResetTime - now
    }
    
    // Increment count
    record.Count++
    return true, 0
}

func validateApiKey(apiKey string) (map[string]interface{}, bool) {
    // In production, query your storage system
    validKeys := map[string]map[string]interface{}{
        "sk_live_123456789abcdef": {
            "user_id": "user_123",
            "scopes":  []string{"read", "write"},
        },
        "ak_test_987654321fedcba": {
            "user_id": "user_456", 
            "scopes":  []string{"read"},
        },
        "key_demo_abcdef123456789": {
            "user_id": "demo_user",
            "scopes":  []string{"read", "write", "admin"},
        },
    }
    
    if keyData, exists := validKeys[apiKey]; exists {
        return keyData, true
    }
    
    return nil, false
}
`
        } else if (runtime === 'nodejs') {
            return `
// API Key Authentication Middleware for Node.js (Express)

const apiKeyConfig = {
    header: '${apiKeyConfig.header || 'X-API-Key'}',
    queryParam: '${apiKeyConfig.queryParam || 'api_key'}',
    prefix: '${apiKeyConfig.prefix || ''}',
    storage: '${apiKeyConfig.storage || 'memory'}',
    rateLimit: ${apiKeyConfig.rateLimit ? JSON.stringify(apiKeyConfig.rateLimit) : 'null'}
};

// Simple in-memory rate limiting
const rateLimitCache = new Map();

function apiKeyAuthMiddleware(req, res, next) {
    // Extract API key from header or query
    const apiKey = extractApiKey(req);
    
    if (!apiKey) {
        return res.status(401).json({
            error: 'missing_api_key',
            message: \`API key not found in \${apiKeyConfig.header} header or \${apiKeyConfig.queryParam} query parameter\`
        });
    }
    
    // Remove prefix if configured
    let cleanKey = apiKey;
    if (apiKeyConfig.prefix) {
        cleanKey = apiKey.replace(new RegExp(\`^\${apiKeyConfig.prefix}\\\\s*\`), '');
    }
    
    if (!cleanKey || cleanKey.length < 8) {
        return res.status(401).json({
            error: 'invalid_api_key_format',
            message: 'API key format is invalid'
        });
    }
    
    // Check rate limiting
    if (apiKeyConfig.rateLimit) {
        const rateLimitResult = checkRateLimit(cleanKey);
        if (!rateLimitResult.allowed) {
            return res.status(429).json({
                error: 'rate_limit_exceeded',
                message: \`Rate limit exceeded. Try again in \${Math.ceil(rateLimitResult.resetIn / 1000)} seconds\`
            });
        }
    }
    
    // Validate API key
    const keyData = validateApiKey(cleanKey);
    if (!keyData) {
        return res.status(401).json({
            error: 'invalid_api_key',
            message: 'API key is invalid or has been revoked'
        });
    }
    
    // Store user information in request
    req.user = {
        id: keyData.userId,
        scope: keyData.scopes || [],
        apiKeyId: cleanKey.substring(0, 8) + '...'
    };
    
    next();
}

function extractApiKey(req) {
    // Try header first
    if (apiKeyConfig.header) {
        const headerKey = req.headers[apiKeyConfig.header.toLowerCase()] || req.headers[apiKeyConfig.header];
        if (headerKey) return headerKey;
    }
    
    // Try query parameter
    if (apiKeyConfig.queryParam && req.query[apiKeyConfig.queryParam]) {
        return req.query[apiKeyConfig.queryParam];
    }
    
    return null;
}

function checkRateLimit(apiKey) {
    if (!apiKeyConfig.rateLimit) {
        return { allowed: true };
    }
    
    const now = Date.now();
    const windowMs = apiKeyConfig.rateLimit.windowMs;
    const maxRequests = apiKeyConfig.rateLimit.maxRequests;
    
    const record = rateLimitCache.get(apiKey);
    
    // No existing record or window has passed
    if (!record || now > record.resetTime) {
        rateLimitCache.set(apiKey, {
            count: 1,
            resetTime: now + windowMs
        });
        return { allowed: true };
    }
    
    // Within window - check if limit exceeded
    if (record.count >= maxRequests) {
        return {
            allowed: false,
            resetIn: record.resetTime - now
        };
    }
    
    // Increment count
    record.count++;
    return { allowed: true };
}

function validateApiKey(apiKey) {
    // In production, query your storage system
    const validKeys = new Map([
        ['sk_live_123456789abcdef', { userId: 'user_123', scopes: ['read', 'write'] }],
        ['ak_test_987654321fedcba', { userId: 'user_456', scopes: ['read'] }],
        ['key_demo_abcdef123456789', { userId: 'demo_user', scopes: ['read', 'write', 'admin'] }]
    ]);
    
    return validKeys.get(apiKey) || null;
}

module.exports = { 
    apiKeyAuthMiddleware, 
    apiKeyConfig,
    extractApiKey,
    validateApiKey
};
`
        } else {
            return yield* Effect.fail(new Error(`Unsupported runtime: ${runtime}`))
        }
    }),
    
    generateDocs: () => Effect.gen(function* () {
        return `
# API Key Authentication

This service uses API keys for authentication. Include your API key in the request header or query parameter.

## Usage

### Header Authentication (Recommended)
\`\`\`
${apiKeyConfig.header || 'X-API-Key'}: ${apiKeyConfig.prefix ? apiKeyConfig.prefix + ' ' : ''}your-api-key
\`\`\`

### Query Parameter Authentication
\`\`\`
GET /api/endpoint?${apiKeyConfig.queryParam || 'api_key'}=${apiKeyConfig.prefix ? apiKeyConfig.prefix + ' ' : ''}your-api-key
\`\`\`

## Configuration

- **Header**: \`${apiKeyConfig.header || 'X-API-Key'}\`
- **Query Parameter**: \`${apiKeyConfig.queryParam || 'api_key'}\`
- **Prefix**: \`${apiKeyConfig.prefix || 'None'}\`
- **Storage**: \`${apiKeyConfig.storage || 'memory'}\`
${apiKeyConfig.rateLimit ? `- **Rate Limit**: ${apiKeyConfig.rateLimit.maxRequests} requests per ${apiKeyConfig.rateLimit.windowMs}ms` : '- **Rate Limit**: None'}

## Error Responses

#### 401 Unauthorized
- \`MISSING_API_KEY\`: No API key provided in header or query parameter
- \`INVALID_API_KEY_FORMAT\`: API key format is invalid (too short)
- \`INVALID_API_KEY\`: API key is invalid or has been revoked

#### 429 Too Many Requests
- \`RATE_LIMIT_EXCEEDED\`: API key has exceeded rate limit

## Example Usage

\`\`\`bash
# Using header authentication
curl -H "${apiKeyConfig.header || 'X-API-Key'}: ${apiKeyConfig.prefix ? apiKeyConfig.prefix + ' ' : ''}sk_live_123456789abcdef" \\
     https://api.example.com/protected-endpoint

# Using query parameter authentication
curl "https://api.example.com/protected-endpoint?${apiKeyConfig.queryParam || 'api_key'}=${apiKeyConfig.prefix ? apiKeyConfig.prefix + ' ' : ''}sk_live_123456789abcdef"
\`\`\`

## API Key Formats

API keys should follow these patterns:
- \`sk_live_*\`: Live/production keys with full permissions
- \`sk_test_*\`: Test/sandbox keys with limited permissions  
- \`ak_*\`: Application keys for specific use cases
- \`key_*\`: Generic API keys

Minimum key length: 8 characters (excluding prefix)
`
    })
}

// Export plugin metadata for registry
export const apiKeyAuthPluginMetadata = {
    name: "apikey-auth",
    version: "1.0.0", 
    type: AuthenticationType.API_KEY,
    supportedRuntimes: ['go', 'nodejs'] as const,
    configSchema: {
        type: 'object',
        properties: {
            header: { 
                type: 'string', 
                description: 'HTTP header name for API key',
                default: 'X-API-Key'
            },
            queryParam: { 
                type: 'string', 
                description: 'Query parameter name for API key',
                default: 'api_key'
            },
            prefix: { 
                type: 'string', 
                description: 'Optional prefix for API keys (e.g., "Bearer", "Key")'
            },
            storage: { 
                type: 'string',
                enum: ['memory', 'redis', 'database'],
                description: 'Storage backend for API key validation',
                default: 'memory'
            },
            rateLimit: {
                type: 'object',
                properties: {
                    maxRequests: { 
                        type: 'integer',
                        minimum: 1,
                        description: 'Maximum requests allowed in time window'
                    },
                    windowMs: { 
                        type: 'integer',
                        minimum: 1000,
                        description: 'Time window in milliseconds'
                    }
                },
                required: ['maxRequests', 'windowMs'],
                description: 'Rate limiting configuration'
            }
        },
        anyOf: [
            { required: ['header'] },
            { required: ['queryParam'] }
        ]
    },
    description: 'API key authentication with configurable sources and rate limiting',
    examples: [
        {
            name: 'Header-based API Key',
            config: {
                header: 'X-API-Key',
                storage: 'redis',
                rateLimit: {
                    maxRequests: 100,
                    windowMs: 60000
                }
            }
        },
        {
            name: 'Query Parameter API Key with Prefix',
            config: {
                queryParam: 'token',
                prefix: 'Bearer',
                storage: 'database',
                rateLimit: {
                    maxRequests: 1000,
                    windowMs: 3600000
                }
            }
        }
    ]
}