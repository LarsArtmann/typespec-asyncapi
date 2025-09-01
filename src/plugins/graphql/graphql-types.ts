/**
 * GraphQL Integration Types
 * 
 * Types for GraphQL schema generation, resolver creation, and subscription
 * support from TypeSpec AsyncAPI operations and models.
 */

import { Effect } from "effect"

/**
 * GraphQL operation types
 */
export const GraphQLOperationType = {
    QUERY: "query",
    MUTATION: "mutation", 
    SUBSCRIPTION: "subscription"
} as const

export type GraphQLOperationType = typeof GraphQLOperationType[keyof typeof GraphQLOperationType]

/**
 * GraphQL scalar types
 */
export const GraphQLScalarType = {
    STRING: "String",
    INT: "Int",
    FLOAT: "Float",
    BOOLEAN: "Boolean",
    ID: "ID",
    DATE: "Date",
    DATETIME: "DateTime",
    JSON: "JSON",
    UPLOAD: "Upload"
} as const

export type GraphQLScalarType = typeof GraphQLScalarType[keyof typeof GraphQLScalarType]

/**
 * GraphQL field definition
 */
export type GraphQLField = {
    readonly name: string
    readonly type: string
    readonly description?: string
    readonly arguments?: GraphQLArgument[]
    readonly nullable?: boolean
    readonly isList?: boolean
    readonly deprecated?: boolean
    readonly deprecationReason?: string
    readonly directives?: GraphQLDirective[]
}

/**
 * GraphQL argument definition
 */
export type GraphQLArgument = {
    readonly name: string
    readonly type: string
    readonly description?: string
    readonly defaultValue?: unknown
    readonly nullable?: boolean
    readonly isList?: boolean
}

/**
 * GraphQL directive definition
 */
export type GraphQLDirective = {
    readonly name: string
    readonly arguments?: Record<string, unknown>
}

/**
 * GraphQL type definition
 */
export type GraphQLType = {
    readonly name: string
    readonly kind: 'object' | 'interface' | 'union' | 'enum' | 'input' | 'scalar'
    readonly description?: string
    readonly fields?: GraphQLField[]
    readonly interfaces?: string[]
    readonly possibleTypes?: string[]
    readonly enumValues?: string[]
    readonly directives?: GraphQLDirective[]
}

/**
 * GraphQL operation definition
 */
export type GraphQLOperation = {
    readonly name: string
    readonly type: GraphQLOperationType
    readonly field: GraphQLField
    readonly resolver?: GraphQLResolver
}

/**
 * GraphQL resolver function
 */
export type GraphQLResolver = {
    readonly name: string
    readonly operationType: GraphQLOperationType
    readonly returnType: string
    readonly implementation: string
    readonly dependencies: string[]
    readonly middleware?: string[]
}

/**
 * GraphQL subscription configuration
 */
export type GraphQLSubscriptionConfig = {
    readonly trigger: string
    readonly filter?: string
    readonly payloadTransform?: string
    readonly authentication?: boolean
    readonly rateLimit?: {
        maxConnections: number
        messagesPerSecond: number
    }
}

/**
 * GraphQL schema configuration
 */
export type GraphQLSchemaConfig = {
    readonly enableIntrospection: boolean
    readonly enablePlayground: boolean
    readonly cors: {
        origin: string[]
        credentials: boolean
    }
    readonly authentication: {
        enabled: boolean
        type: 'jwt' | 'apikey' | 'oauth2'
        config: Record<string, unknown>
    }
    readonly subscriptions: {
        enabled: boolean
        transport: 'websocket' | 'sse'
        path: string
        config: GraphQLSubscriptionConfig
    }
    readonly caching: {
        enabled: boolean
        maxAge: number
        staleWhileRevalidate: boolean
    }
    readonly complexity: {
        enabled: boolean
        maxDepth: number
        maxComplexity: number
    }
}

/**
 * GraphQL federation configuration
 */
export type GraphQLFederationConfig = {
    readonly enabled: boolean
    readonly serviceName: string
    readonly version: string
    readonly entities: GraphQLEntity[]
    readonly extends: string[]
    readonly provides: Record<string, string[]>
    readonly requires: Record<string, string[]>
}

/**
 * GraphQL federated entity
 */
export type GraphQLEntity = {
    readonly typeName: string
    readonly keyFields: string[]
    readonly resolvable: boolean
    readonly resolverReference?: string
}

/**
 * GraphQL generation result
 */
export type GraphQLGenerationResult = {
    readonly schema: string
    readonly resolvers: string
    readonly types: GraphQLType[]
    readonly operations: GraphQLOperation[]
    readonly subscriptions: GraphQLOperation[]
    readonly federationConfig?: GraphQLFederationConfig
    readonly errors: string[]
    readonly warnings: string[]
}

/**
 * GraphQL plugin interface
 */
export type GraphQLPlugin = {
    readonly name: string
    readonly version: string
    readonly supportedTargets: ('nodejs' | 'go' | 'python' | 'java')[]
    
    /**
     * Initialize the GraphQL plugin
     */
    initialize(config: GraphQLSchemaConfig): Effect.Effect<void, Error>
    
    /**
     * Generate GraphQL schema from TypeSpec models and operations
     */
    generateSchema(
        models: unknown[],
        operations: unknown[],
        config: GraphQLSchemaConfig
    ): Effect.Effect<string, Error>
    
    /**
     * Generate GraphQL resolvers
     */
    generateResolvers(
        operations: GraphQLOperation[],
        target: 'nodejs' | 'go' | 'python' | 'java'
    ): Effect.Effect<string, Error>
    
    /**
     * Generate subscription handlers
     */
    generateSubscriptions(
        subscriptions: GraphQLOperation[],
        config: GraphQLSubscriptionConfig
    ): Effect.Effect<string, Error>
    
    /**
     * Enable GraphQL federation
     */
    enableFederation(config: GraphQLFederationConfig): Effect.Effect<string, Error>
    
    /**
     * Validate GraphQL schema
     */
    validateSchema(schema: string): Effect.Effect<{
        valid: boolean
        errors: string[]
        warnings: string[]
    }, Error>
}

/**
 * Database integration types for resolver generation
 */
export type DatabaseConfig = {
    readonly type: 'postgres' | 'mysql' | 'mongodb' | 'redis'
    readonly connection: {
        host: string
        port: number
        database: string
        username?: string
        password?: string
        ssl?: boolean
    }
    readonly pooling: {
        min: number
        max: number
        idleTimeoutMillis: number
    }
    readonly migrations: {
        enabled: boolean
        directory: string
    }
}

/**
 * Caching configuration for GraphQL operations
 */
export type CachingConfig = {
    readonly provider: 'redis' | 'memory' | 'memcached'
    readonly ttl: number
    readonly keyPrefix: string
    readonly compression: boolean
    readonly serialization: 'json' | 'msgpack' | 'protobuf'
}

/**
 * Real-time subscription configuration
 */
export type RealtimeConfig = {
    readonly enabled: boolean
    readonly transport: 'websocket' | 'sse' | 'polling'
    readonly connectionLimit: number
    readonly heartbeatInterval: number
    readonly messageQueue: {
        type: 'redis' | 'rabbitmq' | 'kafka'
        config: Record<string, unknown>
    }
}