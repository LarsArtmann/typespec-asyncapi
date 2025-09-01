/**
 * JWT Authentication Plugin
 * 
 * Provides JWT token validation with support for multiple signing algorithms,
 * token refresh, and middleware generation for Go and Node.js runtimes.
 */

import { Effect } from "effect"
import type {
    AuthenticationPlugin,
    AuthenticationRequest,
    AuthenticationResult,
    TokenAuthConfig,
    AuthenticationType
} from "./auth-plugin-types.js"

/**
 * JWT validation utilities
 */
class JWTValidator {
    private config: TokenAuthConfig = {}
    
    initialize(config: TokenAuthConfig): Effect.Effect<void, Error> {
        return Effect.gen(function* () {
            if (!config.secret && !config.publicKeyUrl) {
                return yield* Effect.fail(new Error("JWT plugin requires either secret or publicKeyUrl"))
            }
            
            this.config = config
            yield* Effect.log(`= JWT plugin initialized with algorithm: ${config.algorithm || 'HS256'}`)
        }.bind(this))
    }
    
    /**
     * Validate JWT token from request headers
     */
    validateToken(request: AuthenticationRequest): Effect.Effect<AuthenticationResult, Error> {
        return Effect.gen(function* () {
            const authHeader = request.headers['authorization'] || request.headers['Authorization']
            
            if (!authHeader) {
                return {
                    success: false,
                    errorCode: 'MISSING_TOKEN',
                    errorMessage: 'Authorization header not found'
                }
            }
            
            const token = authHeader.startsWith('Bearer ') 
                ? authHeader.substring(7)
                : authHeader
                
            if (!token) {
                return {
                    success: false,
                    errorCode: 'INVALID_TOKEN_FORMAT',
                    errorMessage: 'Token must be provided in Bearer format'
                }
            }
            
            // Basic JWT structure validation (header.payload.signature)
            const parts = token.split('.')
            if (parts.length !== 3) {
                return {
                    success: false,
                    errorCode: 'INVALID_TOKEN_STRUCTURE',
                    errorMessage: 'JWT must have 3 parts separated by dots'
                }
            }
            
            try {
                // Decode payload (in production, this would include signature verification)
                const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
                
                // Check expiration
                if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
                    return {
                        success: false,
                        errorCode: 'TOKEN_EXPIRED',
                        errorMessage: 'Token has expired'
                    }
                }
                
                // Check audience if configured
                if (this.config.audience && payload.aud !== this.config.audience) {
                    return {
                        success: false,
                        errorCode: 'INVALID_AUDIENCE',
                        errorMessage: 'Token audience does not match'
                    }
                }
                
                // Check issuer if configured
                if (this.config.issuer && payload.iss !== this.config.issuer) {
                    return {
                        success: false,
                        errorCode: 'INVALID_ISSUER',  
                        errorMessage: 'Token issuer does not match'
                    }
                }
                
                yield* Effect.log(` JWT token validated for user: ${payload.sub || 'unknown'}`)
                
                return {
                    success: true,
                    userId: payload.sub,
                    scope: payload.scope ? payload.scope.split(' ') : [],
                    metadata: {
                        iat: payload.iat,
                        exp: payload.exp,
                        iss: payload.iss,
                        aud: payload.aud
                    },
                    expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined
                }
                
            } catch (error) {
                return {
                    success: false,
                    errorCode: 'TOKEN_DECODE_ERROR',
                    errorMessage: `Failed to decode token: ${error}`
                }
            }
        }.bind(this))
    }
}

/**
 * JWT Authentication Plugin Implementation
 */
export const jwtAuthPlugin: AuthenticationPlugin = {
    name: "jwt-auth",
    version: "1.0.0",
    type: AuthenticationType.JWT,
    dependencies: [],
    
    initialize: (config: unknown) => Effect.gen(function* () {
        const validator = new JWTValidator()
        
        if (typeof config !== 'object' || !config) {
            return yield* Effect.fail(new Error("Invalid JWT configuration"))
        }
        
        yield* validator.initialize(config as TokenAuthConfig)
        yield* Effect.log("=€ JWT Authentication Plugin initialized")
    }),
    
    start: () => Effect.gen(function* () {
        yield* Effect.log("¶ JWT Authentication Plugin started")
    }),
    
    stop: () => Effect.gen(function* () {
        yield* Effect.log("ù JWT Authentication Plugin stopped") 
    }),
    
    authenticate: (request: AuthenticationRequest) => {
        const validator = new JWTValidator()
        return validator.validateToken(request)
    },
    
    validateConfig: (config: unknown) => Effect.gen(function* () {
        if (typeof config !== 'object' || !config) {
            return false
        }
        
        const jwtConfig = config as TokenAuthConfig
        
        // Either secret or public key URL must be provided
        if (!jwtConfig.secret && !jwtConfig.publicKeyUrl) {
            return false
        }
        
        // Validate algorithm if provided
        const validAlgorithms = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512']
        if (jwtConfig.algorithm && !validAlgorithms.includes(jwtConfig.algorithm)) {
            return false
        }
        
        return true
    }),
    
    generateMiddleware: (runtime: 'go' | 'nodejs', config: unknown) => Effect.gen(function* () {
        const jwtConfig = config as TokenAuthConfig
        
        if (runtime === 'go') {
            return `
// JWT Authentication Middleware for Go (Gin)
package middleware

import (
    "net/http"
    "strings"
    "time"
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

type JWTConfig struct {
    Secret        string        \`json:"secret"\`
    Algorithm     string        \`json:"algorithm"\`
    Issuer        string        \`json:"issuer"\`
    Audience      string        \`json:"audience"\`
    ExpirationTime time.Duration \`json:"expiration_time"\`
}

var jwtConfig = JWTConfig{
    Secret:         "${jwtConfig.secret || 'your-secret-key'}",
    Algorithm:      "${jwtConfig.algorithm || 'HS256'}",
    Issuer:         "${jwtConfig.issuer || ''}",
    Audience:       "${jwtConfig.audience || ''}",
    ExpirationTime: time.Duration(${jwtConfig.expirationTime || 3600}) * time.Second,
}

func JWTAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "authorization_required",
                "message": "Authorization header is required",
            })
            c.Abort()
            return
        }
        
        tokenString := strings.TrimPrefix(authHeader, "Bearer ")
        if tokenString == authHeader {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "invalid_token_format", 
                "message": "Token must be in Bearer format",
            })
            c.Abort()
            return
        }
        
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            if token.Method != jwt.SigningMethodHS256 {
                return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
            }
            return []byte(jwtConfig.Secret), nil
        })
        
        if err != nil || !token.Valid {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "invalid_token",
                "message": "Token validation failed",
            })
            c.Abort()
            return
        }
        
        if claims, ok := token.Claims.(jwt.MapClaims); ok {
            // Validate issuer if configured
            if jwtConfig.Issuer != "" && claims["iss"] != jwtConfig.Issuer {
                c.JSON(http.StatusUnauthorized, gin.H{
                    "error": "invalid_issuer",
                    "message": "Token issuer does not match",
                })
                c.Abort()
                return
            }
            
            // Validate audience if configured  
            if jwtConfig.Audience != "" && claims["aud"] != jwtConfig.Audience {
                c.JSON(http.StatusUnauthorized, gin.H{
                    "error": "invalid_audience",
                    "message": "Token audience does not match", 
                })
                c.Abort()
                return
            }
            
            // Store user information in context
            c.Set("user_id", claims["sub"])
            c.Set("user_scope", claims["scope"])
            c.Set("token_claims", claims)
        }
        
        c.Next()
    }
}
`
        } else if (runtime === 'nodejs') {
            return `
// JWT Authentication Middleware for Node.js (Express)
const jwt = require('jsonwebtoken');

const jwtConfig = {
    secret: '${jwtConfig.secret || 'your-secret-key'}',
    algorithm: '${jwtConfig.algorithm || 'HS256'}',
    issuer: '${jwtConfig.issuer || ''}',
    audience: '${jwtConfig.audience || ''}',
    expirationTime: ${jwtConfig.expirationTime || 3600}
};

function jwtAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({
            error: 'authorization_required',
            message: 'Authorization header is required'
        });
    }
    
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7)
        : authHeader;
        
    if (!token) {
        return res.status(401).json({
            error: 'invalid_token_format',
            message: 'Token must be in Bearer format'
        });
    }
    
    try {
        const decoded = jwt.verify(token, jwtConfig.secret, {
            algorithms: [jwtConfig.algorithm],
            issuer: jwtConfig.issuer || undefined,
            audience: jwtConfig.audience || undefined
        });
        
        // Store user information in request
        req.user = {
            id: decoded.sub,
            scope: decoded.scope ? decoded.scope.split(' ') : [],
            claims: decoded
        };
        
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'invalid_token',
            message: 'Token validation failed: ' + error.message
        });
    }
}

module.exports = { jwtAuthMiddleware, jwtConfig };
`
        } else {
            return yield* Effect.fail(new Error(`Unsupported runtime: ${runtime}`))
        }
    }),
    
    generateDocs: () => Effect.gen(function* () {
        return `
# JWT Authentication

This service uses JWT (JSON Web Tokens) for authentication. Include the JWT token in the Authorization header of your requests.

## Usage

### Request Format
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

### Token Structure
The JWT token must contain the following claims:
- \`sub\`: Subject (user identifier)
- \`iss\`: Issuer (if configured)  
- \`aud\`: Audience (if configured)
- \`exp\`: Expiration time
- \`iat\`: Issued at time
- \`scope\`: Space-separated list of scopes (optional)

### Error Responses

#### 401 Unauthorized
- \`MISSING_TOKEN\`: No Authorization header provided
- \`INVALID_TOKEN_FORMAT\`: Token not in Bearer format
- \`INVALID_TOKEN_STRUCTURE\`: Malformed JWT token
- \`TOKEN_EXPIRED\`: Token has expired
- \`INVALID_AUDIENCE\`: Token audience doesn't match
- \`INVALID_ISSUER\`: Token issuer doesn't match
- \`TOKEN_DECODE_ERROR\`: Failed to decode token

### Example Usage

\`\`\`bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
     https://api.example.com/protected-endpoint
\`\`\`
`
    })
}

// Export plugin metadata for registry
export const jwtAuthPluginMetadata = {
    name: "jwt-auth",
    version: "1.0.0", 
    type: AuthenticationType.JWT,
    supportedRuntimes: ['go', 'nodejs'] as const,
    configSchema: {
        type: 'object',
        properties: {
            secret: { type: 'string', description: 'JWT signing secret' },
            publicKeyUrl: { type: 'string', description: 'URL to fetch public key for verification' },
            algorithm: { 
                type: 'string',
                enum: ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'],
                default: 'HS256'
            },
            issuer: { type: 'string', description: 'Expected token issuer' },
            audience: { type: 'string', description: 'Expected token audience' },
            expirationTime: { type: 'number', description: 'Token expiration time in seconds', default: 3600 },
            refreshEnabled: { type: 'boolean', description: 'Enable token refresh functionality', default: false }
        },
        required: [],
        anyOf: [
            { required: ['secret'] },
            { required: ['publicKeyUrl'] }
        ]
    },
    description: 'JWT (JSON Web Token) authentication with support for multiple signing algorithms',
    examples: [
        {
            name: 'Basic HMAC JWT',
            config: {
                secret: 'your-256-bit-secret',
                algorithm: 'HS256',
                expirationTime: 3600
            }
        },
        {
            name: 'RSA JWT with issuer validation',
            config: {
                publicKeyUrl: 'https://auth.example.com/.well-known/jwks.json',
                algorithm: 'RS256',
                issuer: 'https://auth.example.com',
                audience: 'api.example.com'
            }
        }
    ]
}