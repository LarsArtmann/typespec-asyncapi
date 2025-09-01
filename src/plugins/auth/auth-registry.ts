/**
 * Authentication Plugin Registry
 * 
 * Centralized registry for authentication plugins that integrates with the
 * core PluginRegistry system. Provides authentication middleware generation
 * and plugin management for generated applications.
 */

import { Effect } from "effect"
import { PluginRegistry, type Plugin } from "../../../core/PluginRegistry.js"
import type {
    AuthenticationPlugin,
    AuthenticationType,
    AuthMiddlewareConfig,
    AuthPluginMetadata
} from "./auth-plugin-types.js"
import { jwtAuthPlugin, jwtAuthPluginMetadata } from "./jwt-plugin.js"
import { oauth2AuthPlugin, oauth2AuthPluginMetadata } from "./oauth2-plugin.js"
import { apiKeyAuthPlugin, apiKeyAuthPluginMetadata } from "./apikey-plugin.js"

/**
 * Authentication-specific plugin wrapper that implements the core Plugin interface
 */
class AuthenticationPluginAdapter implements Plugin {
    public readonly name: string
    public readonly version: string
    public readonly dependencies: string[]

    constructor(private authPlugin: AuthenticationPlugin) {
        this.name = authPlugin.name
        this.version = authPlugin.version
        this.dependencies = authPlugin.dependencies
    }

    async initialize(): Promise<void> {
        await Effect.runPromise(this.authPlugin.start())
    }

    async start(): Promise<void> {
        await Effect.runPromise(this.authPlugin.start())
    }

    async stop(): Promise<void> {
        await Effect.runPromise(this.authPlugin.stop())
    }

    async reload?(): Promise<void> {
        await this.stop()
        await this.start()
    }

    getAuthPlugin(): AuthenticationPlugin {
        return this.authPlugin
    }
}

/**
 * Authentication Plugin Registry with middleware generation capabilities
 */
export class AuthenticationRegistry {
    private readonly coreRegistry: PluginRegistry
    private readonly authPlugins = new Map<string, AuthenticationPlugin>()
    private readonly pluginMetadata = new Map<string, AuthPluginMetadata>()

    constructor() {
        this.coreRegistry = new PluginRegistry({
            enableHotReload: true,
            enableResourceMonitoring: true,
            maxMemoryUsage: 50, // 50MB per auth plugin
            maxCpuUsage: 5,     // 5% CPU per auth plugin
            enableCircularDependencyDetection: true,
            gracefulShutdownTimeout: 3000 // 3 seconds
        })

        Effect.log("= Authentication Plugin Registry initialized")
    }

    /**
     * Register an authentication plugin
     */
    async registerAuthPlugin(plugin: AuthenticationPlugin, metadata: AuthPluginMetadata): Promise<void> {
        return Effect.runPromise(
            Effect.gen(function* () {
                yield* Effect.log(`= Registering authentication plugin: ${plugin.name} v${plugin.version}`)

                // Validate plugin configuration
                const isValid = yield* plugin.validateConfig(metadata.examples[0]?.config || {})
                if (!isValid) {
                    return yield* Effect.fail(new Error(`Invalid configuration for plugin: ${plugin.name}`))
                }

                // Create adapter and register with core registry
                const adapter = new AuthenticationPluginAdapter(plugin)
                yield* Effect.promise(() => this.coreRegistry.loadPlugin(adapter))

                // Store authentication-specific data
                this.authPlugins.set(plugin.name, plugin)
                this.pluginMetadata.set(plugin.name, metadata)

                yield* Effect.log(` Authentication plugin ${plugin.name} registered successfully`)
            }.bind(this))
        )
    }

    /**
     * Get an authentication plugin by name
     */
    getAuthPlugin(name: string): AuthenticationPlugin | undefined {
        return this.authPlugins.get(name)
    }

    /**
     * Get authentication plugin metadata
     */
    getAuthPluginMetadata(name: string): AuthPluginMetadata | undefined {
        return this.pluginMetadata.get(name)
    }

    /**
     * Get all registered authentication plugins
     */
    getAllAuthPlugins(): AuthenticationPlugin[] {
        return Array.from(this.authPlugins.values())
    }

    /**
     * Get plugins by authentication type
     */
    getPluginsByType(type: AuthenticationType): AuthenticationPlugin[] {
        return Array.from(this.authPlugins.values())
            .filter(plugin => plugin.type === type)
    }

    /**
     * Generate authentication middleware for a specific runtime
     */
    generateAuthMiddleware(pluginName: string, runtime: 'go' | 'nodejs', config: unknown): Effect.Effect<string, Error> {
        return Effect.gen(function* () {
            const plugin = this.authPlugins.get(pluginName)
            
            if (!plugin) {
                return yield* Effect.fail(new Error(`Authentication plugin not found: ${pluginName}`))
            }

            yield* Effect.log(`=' Generating ${runtime} middleware for ${pluginName}`)
            
            const middlewareCode = yield* plugin.generateMiddleware(runtime, config)
            
            yield* Effect.log(` Generated ${middlewareCode.length} bytes of ${runtime} middleware`)
            
            return middlewareCode
        }.bind(this))
    }

    /**
     * Generate complete authentication setup for an application
     */
    generateAuthSetup(configs: AuthMiddlewareConfig[], runtime: 'go' | 'nodejs'): Effect.Effect<string, Error> {
        return Effect.gen(function* () {
            yield* Effect.log(`<× Generating complete authentication setup for ${runtime}`)
            yield* Effect.log(`=Ë Processing ${configs.length} authentication configurations`)

            let setupCode = ''
            const imports: string[] = []
            const middlewares: string[] = []

            // Generate middleware for each configuration
            for (const config of configs) {
                const pluginName = this.getPluginNameByType(config.type)
                if (!pluginName) {
                    yield* Effect.logWarning(`  No plugin found for authentication type: ${config.type}`)
                    continue
                }

                const middlewareCode = yield* this.generateAuthMiddleware(pluginName, runtime, config.config)
                
                if (runtime === 'go') {
                    // Extract package imports and middleware setup
                    imports.push(`// Middleware for ${config.type}`)
                    middlewares.push(middlewareCode)
                } else if (runtime === 'nodejs') {
                    // Extract require statements and middleware setup
                    imports.push(`// Middleware for ${config.type}`)
                    middlewares.push(middlewareCode)
                }
            }

            // Generate runtime-specific setup code
            if (runtime === 'go') {
                setupCode = this.generateGoAuthSetup(imports, middlewares, configs)
            } else if (runtime === 'nodejs') {
                setupCode = this.generateNodeJSAuthSetup(imports, middlewares, configs)
            }

            yield* Effect.log(` Generated ${setupCode.length} bytes of ${runtime} authentication setup`)
            
            return setupCode
        }.bind(this))
    }

    /**
     * Get plugin name by authentication type
     */
    private getPluginNameByType(type: AuthenticationType): string | undefined {
        for (const [name, plugin] of this.authPlugins.entries()) {
            if (plugin.type === type) {
                return name
            }
        }
        return undefined
    }

    /**
     * Generate Go authentication setup
     */
    private generateGoAuthSetup(imports: string[], middlewares: string[], configs: AuthMiddlewareConfig[]): string {
        return `
// Generated Authentication Setup for Go (Gin)
package main

import (
    "github.com/gin-gonic/gin"
    "your-app/middleware"
)

${imports.join('\n')}

// Authentication middleware setup
func setupAuthentication(r *gin.Engine) {
    ${configs.map((config, index) => {
        const middlewareName = `${config.type}AuthMiddleware`
        
        // Add route-specific middleware
        if (config.routes && config.routes.length > 0) {
            return config.routes.map(route => 
                `r.Use("${route}", middleware.${middlewareName}())`
            ).join('\n    ')
        } else if (config.excludeRoutes && config.excludeRoutes.length > 0) {
            // Global middleware with exclusions (requires custom implementation)
            return `// Global ${config.type} auth with exclusions: ${config.excludeRoutes.join(', ')}
    r.Use(middleware.${middlewareName}())`
        } else {
            // Global middleware
            return `r.Use(middleware.${middlewareName}())`
        }
    }).join('\n    ')}
}

// Authentication middleware functions
${middlewares.join('\n\n')}

// Usage in main function:
// func main() {
//     r := gin.Default()
//     setupAuthentication(r)
//     r.Run(":8080")
// }
`
    }

    /**
     * Generate Node.js authentication setup
     */
    private generateNodeJSAuthSetup(imports: string[], middlewares: string[], configs: AuthMiddlewareConfig[]): string {
        return `
// Generated Authentication Setup for Node.js (Express)
const express = require('express');

${imports.join('\n')}

// Authentication middleware setup
function setupAuthentication(app) {
    ${configs.map((config, index) => {
        const middlewareName = `${config.type}AuthMiddleware`
        
        // Add route-specific middleware
        if (config.routes && config.routes.length > 0) {
            return config.routes.map(route => 
                `app.use('${route}', ${middlewareName});`
            ).join('\n    ')
        } else if (config.excludeRoutes && config.excludeRoutes.length > 0) {
            // Global middleware with exclusions
            return `// Global ${config.type} auth with exclusions: ${config.excludeRoutes.join(', ')}
    app.use((req, res, next) => {
        const excludedRoutes = [${config.excludeRoutes.map(route => `'${route}'`).join(', ')}];
        if (excludedRoutes.some(route => req.path.startsWith(route))) {
            return next();
        }
        return ${middlewareName}(req, res, next);
    });`
        } else {
            // Global middleware
            return `app.use(${middlewareName});`
        }
    }).join('\n    ')}
}

// Authentication middleware functions
${middlewares.join('\n\n')}

// Usage:
// const app = express();
// setupAuthentication(app);
// app.listen(3000);

module.exports = { setupAuthentication };
`
    }

    /**
     * Generate authentication documentation
     */
    generateAuthDocs(pluginNames?: string[]): Effect.Effect<string, Error> {
        return Effect.gen(function* () {
            const plugins = pluginNames 
                ? pluginNames.map(name => this.authPlugins.get(name)).filter(Boolean) as AuthenticationPlugin[]
                : Array.from(this.authPlugins.values())

            let docs = `# Authentication Documentation\n\n`
            docs += `This application supports ${plugins.length} authentication method(s).\n\n`

            for (const plugin of plugins) {
                const pluginDocs = yield* plugin.generateDocs()
                docs += pluginDocs + '\n\n---\n\n'
            }

            return docs
        }.bind(this))
    }

    /**
     * Get authentication registry health status
     */
    getHealthStatus(): string {
        const coreHealth = this.coreRegistry.generateHealthReport()
        const authPluginCount = this.authPlugins.size
        const supportedTypes = new Set(Array.from(this.authPlugins.values()).map(p => p.type)).size

        let report = `\n= Authentication Registry Health Report\n`
        report += `=Ê Total Auth Plugins: ${authPluginCount}\n`
        report += `<¯ Supported Auth Types: ${supportedTypes}\n`
        report += `${coreHealth}\n`

        return report
    }

    /**
     * Shutdown the authentication registry
     */
    async shutdown(): Promise<void> {
        return Effect.runPromise(
            Effect.gen(function* () {
                yield* Effect.log("=Ñ Shutting down authentication registry...")
                
                // Stop all auth plugins
                for (const [name] of this.authPlugins) {
                    yield* Effect.promise(() => this.coreRegistry.stopPlugin(name))
                    yield* Effect.promise(() => this.coreRegistry.unloadPlugin(name))
                }
                
                yield* Effect.log(" Authentication registry shutdown complete")
            }.bind(this))
        )
    }
}

/**
 * Global authentication registry instance
 */
export const authRegistry = new AuthenticationRegistry()

/**
 * Register built-in authentication plugins
 */
export const registerBuiltInAuthPlugins = (): Effect.Effect<void, Error> =>
    Effect.gen(function* () {
        yield* Effect.log("=€ Loading built-in authentication plugins...")
        
        // Register JWT authentication plugin
        yield* Effect.promise(() => authRegistry.registerAuthPlugin(jwtAuthPlugin, jwtAuthPluginMetadata))
        
        // Register OAuth2 authentication plugin
        yield* Effect.promise(() => authRegistry.registerAuthPlugin(oauth2AuthPlugin, oauth2AuthPluginMetadata))
        
        // Register API Key authentication plugin
        yield* Effect.promise(() => authRegistry.registerAuthPlugin(apiKeyAuthPlugin, apiKeyAuthPluginMetadata))
        
        yield* Effect.log(" Built-in authentication plugins loaded successfully")
    })

/**
 * Helper function to generate authentication middleware code
 */
export const generateAuthenticationMiddleware = (
    type: AuthenticationType,
    runtime: 'go' | 'nodejs',
    config: unknown
): Effect.Effect<string, Error> =>
    Effect.gen(function* () {
        const plugin = authRegistry.getPluginsByType(type)[0]
        
        if (!plugin) {
            return yield* Effect.fail(new Error(`No authentication plugin found for type: ${type}`))
        }
        
        return yield* authRegistry.generateAuthMiddleware(plugin.name, runtime, config)
    })

/**
 * Helper function to validate authentication configuration
 */
export const validateAuthConfig = (
    type: AuthenticationType,
    config: unknown
): Effect.Effect<boolean, Error> =>
    Effect.gen(function* () {
        const plugin = authRegistry.getPluginsByType(type)[0]
        
        if (!plugin) {
            return yield* Effect.fail(new Error(`No authentication plugin found for type: ${type}`))
        }
        
        return yield* plugin.validateConfig(config)
    })