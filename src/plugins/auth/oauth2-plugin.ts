/**
 * OAuth2 Authentication Plugin
 * 
 * Provides OAuth2 authorization code flow with provider integration,
 * token validation, and middleware generation for Go and Node.js runtimes.
 */

import { Effect } from "effect"
import type {
    AuthenticationPlugin,
    AuthenticationRequest,
    AuthenticationResult,
    OAuth2Config,
    AuthenticationType
} from "./auth-plugin-types.js"

/**
 * OAuth2 token introspection and validation
 */
class OAuth2Validator {
    private config: OAuth2Config = {
        authorizationUrl: '',
        tokenUrl: '',
        clientId: '',
        providerName: ''
    }
    
    initialize(config: OAuth2Config): Effect.Effect<void, Error> {
        return Effect.gen(function* () {
            if (!config.clientId || !config.tokenUrl || !config.authorizationUrl) {
                return yield* Effect.fail(new Error("OAuth2 plugin requires clientId, tokenUrl, and authorizationUrl"))
            }
            
            this.config = config
            yield* Effect.log(`= OAuth2 plugin initialized for provider: ${config.providerName}`)
        }.bind(this))
    }
    
    /**
     * Validate OAuth2 access token via introspection endpoint
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
            
            // In a real implementation, this would make HTTP request to token introspection endpoint
            // For now, we simulate token validation
            try {
                const introspectionResult = yield* this.introspectToken(token)
                
                if (!introspectionResult.active) {
                    return {
                        success: false,
                        errorCode: 'TOKEN_INACTIVE',
                        errorMessage: 'Token is not active or expired'
                    }
                }
                
                // Check if token has required scopes
                if (this.config.scope && this.config.scope.length > 0) {
                    const tokenScopes = introspectionResult.scope ? introspectionResult.scope.split(' ') : []
                    const hasRequiredScopes = this.config.scope.every(requiredScope => 
                        tokenScopes.includes(requiredScope)
                    )
                    
                    if (!hasRequiredScopes) {
                        return {
                            success: false,
                            errorCode: 'INSUFFICIENT_SCOPE',
                            errorMessage: `Token does not have required scopes: ${this.config.scope.join(', ')}`
                        }
                    }
                }
                
                yield* Effect.log(` OAuth2 token validated for user: ${introspectionResult.sub || 'unknown'}`)
                
                return {
                    success: true,
                    userId: introspectionResult.sub,
                    scope: introspectionResult.scope ? introspectionResult.scope.split(' ') : [],
                    metadata: {
                        client_id: introspectionResult.client_id,
                        token_type: introspectionResult.token_type,
                        exp: introspectionResult.exp,
                        iat: introspectionResult.iat,
                        provider: this.config.providerName
                    },
                    expiresAt: introspectionResult.exp ? new Date(introspectionResult.exp * 1000) : undefined
                }
                
            } catch (error) {
                return {
                    success: false,
                    errorCode: 'TOKEN_INTROSPECTION_ERROR',
                    errorMessage: `Failed to validate token: ${error}`
                }
            }
        }.bind(this))
    }
    
    /**
     * Simulate token introspection (in real implementation, this would make HTTP request)
     */
    private introspectToken(token: string): Effect.Effect<TokenIntrospectionResponse, Error> {
        return Effect.gen(function* () {
            // Simulate HTTP request to introspection endpoint
            yield* Effect.log(`= Introspecting token at ${this.config.tokenUrl}/introspect`)
            
            // In real implementation:
            // const response = await fetch(`${this.config.tokenUrl}/introspect`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            //     body: `token=${token}&client_id=${this.config.clientId}&client_secret=${this.config.clientSecret}`
            // })
            
            // Simulate a valid response for demonstration
            const simulatedResponse: TokenIntrospectionResponse = {
                active: true,
                sub: 'user123',
                client_id: this.config.clientId,
                scope: 'read write',
                token_type: 'Bearer',
                exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
                iat: Math.floor(Date.now() / 1000) - 300,   // Issued 5 minutes ago
                username: 'testuser'
            }
            
            return simulatedResponse
        }.bind(this))
    }
}

/**
 * OAuth2 token introspection response format
 */
type TokenIntrospectionResponse = {
    active: boolean
    sub?: string
    client_id?: string
    scope?: string
    token_type?: string
    exp?: number
    iat?: number
    username?: string
}

/**
 * OAuth2 Authentication Plugin Implementation
 */
export const oauth2AuthPlugin: AuthenticationPlugin = {
    name: "oauth2-auth",
    version: "1.0.0",
    type: AuthenticationType.OAUTH2,
    dependencies: [],
    
    initialize: (config: unknown) => Effect.gen(function* () {
        const validator = new OAuth2Validator()
        
        if (typeof config !== 'object' || !config) {
            return yield* Effect.fail(new Error("Invalid OAuth2 configuration"))
        }
        
        yield* validator.initialize(config as OAuth2Config)
        yield* Effect.log("=€ OAuth2 Authentication Plugin initialized")
    }),
    
    start: () => Effect.gen(function* () {
        yield* Effect.log("¶ OAuth2 Authentication Plugin started")
    }),
    
    stop: () => Effect.gen(function* () {
        yield* Effect.log("ù OAuth2 Authentication Plugin stopped") 
    }),
    
    authenticate: (request: AuthenticationRequest) => {
        const validator = new OAuth2Validator()
        return validator.validateToken(request)
    },
    
    validateConfig: (config: unknown) => Effect.gen(function* () {
        if (typeof config !== 'object' || !config) {
            return false
        }
        
        const oauth2Config = config as OAuth2Config
        
        // Required fields
        if (!oauth2Config.clientId || !oauth2Config.authorizationUrl || !oauth2Config.tokenUrl) {
            return false
        }
        
        // Validate URLs
        try {
            new URL(oauth2Config.authorizationUrl)
            new URL(oauth2Config.tokenUrl)
            if (oauth2Config.redirectUri) {
                new URL(oauth2Config.redirectUri)
            }
        } catch {
            return false
        }
        
        return true
    }),
    
    generateMiddleware: (runtime: 'go' | 'nodejs', config: unknown) => Effect.gen(function* () {
        const oauth2Config = config as OAuth2Config
        
        if (runtime === 'go') {
            return `
// OAuth2 Authentication Middleware for Go (Gin)
package middleware

import (
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
    "strings"
    "time"
    "github.com/gin-gonic/gin"
)

type OAuth2Config struct {
    AuthorizationURL string   \`json:"authorization_url"\`
    TokenURL         string   \`json:"token_url"\`
    ClientID         string   \`json:"client_id"\`
    ClientSecret     string   \`json:"client_secret"\`
    Scope            []string \`json:"scope"\`
    RedirectURI      string   \`json:"redirect_uri"\`
    ProviderName     string   \`json:"provider_name"\`
}

type TokenIntrospectionResponse struct {
    Active    bool   \`json:"active"\`
    Sub       string \`json:"sub"\`
    ClientID  string \`json:"client_id"\`
    Scope     string \`json:"scope"\`
    TokenType string \`json:"token_type"\`
    Exp       int64  \`json:"exp"\`
    Iat       int64  \`json:"iat"\`
    Username  string \`json:"username"\`
}

var oauth2Config = OAuth2Config{
    AuthorizationURL: "${oauth2Config.authorizationUrl}",
    TokenURL:         "${oauth2Config.tokenUrl}",
    ClientID:         "${oauth2Config.clientId}",
    ClientSecret:     "${oauth2Config.clientSecret || ''}",
    Scope:            []string{${oauth2Config.scope?.map(s => `"${s}"`).join(', ') || ''}},
    RedirectURI:      "${oauth2Config.redirectUri || ''}",
    ProviderName:     "${oauth2Config.providerName}",
}

func OAuth2AuthMiddleware() gin.HandlerFunc {
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
        
        token := strings.TrimPrefix(authHeader, "Bearer ")
        if token == authHeader {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "invalid_token_format", 
                "message": "Token must be in Bearer format",
            })
            c.Abort()
            return
        }
        
        // Introspect token
        introspectionResult, err := introspectToken(token)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "token_introspection_error",
                "message": "Failed to validate token: " + err.Error(),
            })
            c.Abort()
            return
        }
        
        if !introspectionResult.Active {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "token_inactive",
                "message": "Token is not active or expired",
            })
            c.Abort()
            return
        }
        
        // Check token expiration
        if introspectionResult.Exp > 0 && time.Now().Unix() > introspectionResult.Exp {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "token_expired",
                "message": "Token has expired",
            })
            c.Abort()
            return
        }
        
        // Store user information in context
        c.Set("user_id", introspectionResult.Sub)
        c.Set("user_scope", strings.Split(introspectionResult.Scope, " "))
        c.Set("client_id", introspectionResult.ClientID)
        c.Set("token_info", introspectionResult)
        
        c.Next()
    }
}

func introspectToken(token string) (*TokenIntrospectionResponse, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    data := url.Values{
        "token":         {token},
        "client_id":     {oauth2Config.ClientID},
        "client_secret": {oauth2Config.ClientSecret},
    }
    
    req, err := http.NewRequestWithContext(ctx, "POST", oauth2Config.TokenURL+"/introspect", 
        strings.NewReader(data.Encode()))
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }
    
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, fmt.Errorf("failed to make request: %w", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("introspection failed with status: %d", resp.StatusCode)
    }
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, fmt.Errorf("failed to read response: %w", err)
    }
    
    var result TokenIntrospectionResponse
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, fmt.Errorf("failed to parse response: %w", err)
    }
    
    return &result, nil
}
`
        } else if (runtime === 'nodejs') {
            return `
// OAuth2 Authentication Middleware for Node.js (Express)
const fetch = require('node-fetch');

const oauth2Config = {
    authorizationUrl: '${oauth2Config.authorizationUrl}',
    tokenUrl: '${oauth2Config.tokenUrl}',
    clientId: '${oauth2Config.clientId}',
    clientSecret: '${oauth2Config.clientSecret || ''}',
    scope: [${oauth2Config.scope?.map(s => `'${s}'`).join(', ') || ''}],
    redirectUri: '${oauth2Config.redirectUri || ''}',
    providerName: '${oauth2Config.providerName}'
};

async function oauth2AuthMiddleware(req, res, next) {
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
        const introspectionResult = await introspectToken(token);
        
        if (!introspectionResult.active) {
            return res.status(401).json({
                error: 'token_inactive',
                message: 'Token is not active or expired'
            });
        }
        
        // Check token expiration
        if (introspectionResult.exp && Date.now() / 1000 > introspectionResult.exp) {
            return res.status(401).json({
                error: 'token_expired',
                message: 'Token has expired'
            });
        }
        
        // Store user information in request
        req.user = {
            id: introspectionResult.sub,
            scope: introspectionResult.scope ? introspectionResult.scope.split(' ') : [],
            clientId: introspectionResult.client_id,
            tokenInfo: introspectionResult
        };
        
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'token_introspection_error',
            message: 'Failed to validate token: ' + error.message
        });
    }
}

async function introspectToken(token) {
    const response = await fetch(oauth2Config.tokenUrl + '/introspect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            token: token,
            client_id: oauth2Config.clientId,
            client_secret: oauth2Config.clientSecret
        })
    });
    
    if (!response.ok) {
        throw new Error(\`Introspection failed with status: \${response.status}\`);
    }
    
    return await response.json();
}

// OAuth2 Authorization URL generator
function getAuthorizationUrl(state, nonce) {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: oauth2Config.clientId,
        redirect_uri: oauth2Config.redirectUri,
        scope: oauth2Config.scope.join(' '),
        state: state || '',
        nonce: nonce || ''
    });
    
    return oauth2Config.authorizationUrl + '?' + params.toString();
}

module.exports = { 
    oauth2AuthMiddleware, 
    oauth2Config, 
    getAuthorizationUrl 
};
`
        } else {
            return yield* Effect.fail(new Error(`Unsupported runtime: ${runtime}`))
        }
    }),
    
    generateDocs: () => Effect.gen(function* () {
        return `
# OAuth2 Authentication

This service uses OAuth2 authorization code flow for authentication. Obtain an access token from the OAuth2 provider and include it in the Authorization header of your requests.

## Authorization Flow

### Step 1: Authorization Request
Redirect users to the authorization endpoint:

\`\`\`
GET ${oauth2Config.authorizationUrl}?response_type=code&client_id=${oauth2Config.clientId}&redirect_uri=${encodeURIComponent(oauth2Config.redirectUri || 'YOUR_REDIRECT_URI')}&scope=${encodeURIComponent((oauth2Config.scope || []).join(' '))}&state=RANDOM_STATE
\`\`\`

### Step 2: Token Exchange
Exchange the authorization code for an access token:

\`\`\`bash
curl -X POST ${oauth2Config.tokenUrl} \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=${encodeURIComponent(oauth2Config.redirectUri || 'YOUR_REDIRECT_URI')}&client_id=${oauth2Config.clientId}&client_secret=CLIENT_SECRET"
\`\`\`

### Step 3: API Requests
Include the access token in API requests:

\`\`\`
Authorization: Bearer <access-token>
\`\`\`

## Configuration

- **Provider**: ${oauth2Config.providerName}
- **Client ID**: ${oauth2Config.clientId}
- **Authorization URL**: ${oauth2Config.authorizationUrl}
- **Token URL**: ${oauth2Config.tokenUrl}
- **Scopes**: ${(oauth2Config.scope || []).join(', ') || 'None configured'}

## Error Responses

#### 401 Unauthorized
- \`MISSING_TOKEN\`: No Authorization header provided
- \`INVALID_TOKEN_FORMAT\`: Token not in Bearer format  
- \`TOKEN_INACTIVE\`: Token is not active or has been revoked
- \`TOKEN_EXPIRED\`: Token has expired
- \`INSUFFICIENT_SCOPE\`: Token does not have required scopes
- \`TOKEN_INTROSPECTION_ERROR\`: Failed to validate token with provider

## Example Usage

\`\`\`bash
# Get authorization URL (implement in your application)
curl https://api.example.com/auth/oauth2/authorize

# Use access token for API calls
curl -H "Authorization: Bearer ya29.a0AfH6SMC..." \\
     https://api.example.com/protected-endpoint
\`\`\`
`
    })
}

// Export plugin metadata for registry
export const oauth2AuthPluginMetadata = {
    name: "oauth2-auth",
    version: "1.0.0", 
    type: AuthenticationType.OAUTH2,
    supportedRuntimes: ['go', 'nodejs'] as const,
    configSchema: {
        type: 'object',
        properties: {
            authorizationUrl: { 
                type: 'string', 
                format: 'uri',
                description: 'OAuth2 provider authorization endpoint URL' 
            },
            tokenUrl: { 
                type: 'string', 
                format: 'uri',
                description: 'OAuth2 provider token endpoint URL' 
            },
            clientId: { 
                type: 'string', 
                description: 'OAuth2 client ID' 
            },
            clientSecret: { 
                type: 'string', 
                description: 'OAuth2 client secret (for server-side apps)' 
            },
            scope: { 
                type: 'array',
                items: { type: 'string' },
                description: 'Required OAuth2 scopes'
            },
            redirectUri: { 
                type: 'string', 
                format: 'uri',
                description: 'OAuth2 redirect URI after authorization' 
            },
            providerName: { 
                type: 'string', 
                description: 'Human-readable name of OAuth2 provider' 
            }
        },
        required: ['authorizationUrl', 'tokenUrl', 'clientId', 'providerName']
    },
    description: 'OAuth2 authorization code flow with token introspection and provider integration',
    examples: [
        {
            name: 'Google OAuth2',
            config: {
                authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenUrl: 'https://oauth2.googleapis.com/token',
                clientId: 'your-client-id.apps.googleusercontent.com',
                scope: ['openid', 'email', 'profile'],
                redirectUri: 'https://yourapp.com/auth/callback',
                providerName: 'Google'
            }
        },
        {
            name: 'GitHub OAuth2',
            config: {
                authorizationUrl: 'https://github.com/login/oauth/authorize',
                tokenUrl: 'https://github.com/login/oauth/access_token',
                clientId: 'your-github-client-id',
                scope: ['user:email', 'read:user'],
                redirectUri: 'https://yourapp.com/auth/github/callback',
                providerName: 'GitHub'
            }
        }
    ]
}