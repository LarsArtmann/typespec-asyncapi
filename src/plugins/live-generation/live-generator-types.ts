/**
 * Live Code Generation Types
 * 
 * Real-time code generation system with hot reload, file watching,
 * and incremental compilation for enhanced developer experience.
 */

import { Effect } from "effect"

/**
 * Live generation events
 */
export const LiveGenerationEvent = {
    FILE_CHANGED: "file-changed",
    GENERATION_STARTED: "generation-started",
    GENERATION_COMPLETED: "generation-completed",
    GENERATION_FAILED: "generation-failed",
    HOT_RELOAD_TRIGGERED: "hot-reload-triggered",
    SERVER_RESTARTED: "server-restarted"
} as const

export type LiveGenerationEvent = typeof LiveGenerationEvent[keyof typeof LiveGenerationEvent]

/**
 * File change types
 */
export const ChangeType = {
    ADDED: "added",
    MODIFIED: "modified",
    DELETED: "deleted",
    RENAMED: "renamed"
} as const

export type ChangeType = typeof ChangeType[keyof typeof ChangeType]

/**
 * Generation target types
 */
export const GenerationTarget = {
    GO: "go",
    NODEJS: "nodejs",
    PYTHON: "python",
    JAVA: "java",
    CSHARP: "csharp",
    RUST: "rust",
    ASYNCAPI: "asyncapi"
} as const

export type GenerationTarget = typeof GenerationTarget[keyof typeof GenerationTarget]

/**
 * File change event
 */
export type FileChangeEvent = {
    readonly path: string
    readonly changeType: ChangeType
    readonly timestamp: Date
    readonly size?: number
    readonly checksum?: string
}

/**
 * Generation request
 */
export type GenerationRequest = {
    readonly id: string
    readonly trigger: 'manual' | 'auto' | 'watch'
    readonly targets: GenerationTarget[]
    readonly sourceFiles: string[]
    readonly options: Record<string, unknown>
    readonly timestamp: Date
}

/**
 * Generation result
 */
export type GenerationResult = {
    readonly requestId: string
    readonly success: boolean
    readonly targets: GenerationTarget[]
    readonly generatedFiles: GeneratedFile[]
    readonly errors: GenerationError[]
    readonly warnings: string[]
    readonly duration: number
    readonly stats: GenerationStats
    readonly timestamp: Date
}

/**
 * Generated file information
 */
export type GeneratedFile = {
    readonly path: string
    readonly target: GenerationTarget
    readonly size: number
    readonly checksum: string
    readonly lastModified: Date
}

/**
 * Generation error
 */
export type GenerationError = {
    readonly code: string
    readonly message: string
    readonly file?: string
    readonly line?: number
    readonly column?: number
    readonly severity: 'error' | 'warning'
}

/**
 * Generation statistics
 */
export type GenerationStats = {
    readonly sourceFilesProcessed: number
    readonly filesGenerated: number
    readonly linesOfCode: number
    readonly compilationTime: number
    readonly memoryUsage: number
}

/**
 * Hot reload configuration
 */
export type HotReloadConfig = {
    readonly enabled: boolean
    readonly port: number
    readonly watchPaths: string[]
    readonly ignorePaths: string[]
    readonly debounceMs: number
    readonly reloadDelay: number
    readonly preserveConsole: boolean
}

/**
 * Development server configuration
 */
export type DevServerConfig = {
    readonly port: number
    readonly host: string
    readonly https: boolean
    readonly cors: boolean
    readonly proxy?: Record<string, string>
    readonly staticPaths: Record<string, string>
    readonly hotReload: HotReloadConfig
}

/**
 * Incremental generation configuration
 */
export type IncrementalConfig = {
    readonly enabled: boolean
    readonly cacheDir: string
    readonly dependencyTracking: boolean
    readonly parallelGeneration: boolean
    readonly maxWorkers: number
    readonly checksumAlgorithm: 'md5' | 'sha1' | 'sha256'
}

/**
 * Live generation configuration
 */
export type LiveGenerationConfig = {
    readonly targets: GenerationTarget[]
    readonly watchPatterns: string[]
    readonly ignorePatterns: string[]
    readonly outputDir: string
    readonly devServer: DevServerConfig
    readonly incremental: IncrementalConfig
    readonly notifications: {
        desktop: boolean
        console: boolean
        webhook?: string
    }
}

/**
 * Core live generation plugin interface
 */
export type LiveGenerationPlugin = {
    readonly name: string
    readonly version: string
    readonly supportedTargets: GenerationTarget[]
    
    /**
     * Initialize the live generation system
     */
    initialize(config: LiveGenerationConfig): Effect.Effect<void, Error>
    
    /**
     * Start file watching and live generation
     */
    start(): Effect.Effect<void, Error>
    
    /**
     * Stop live generation and cleanup
     */
    stop(): Effect.Effect<void, Error>
    
    /**
     * Generate code for specific targets
     */
    generate(request: GenerationRequest): Effect.Effect<GenerationResult, Error>
    
    /**
     * Enable hot reload for development server
     */
    enableHotReload(config: HotReloadConfig): Effect.Effect<void, Error>
    
    /**
     * Subscribe to live generation events
     */
    subscribe(callback: (event: LiveGenerationEvent, data: unknown) => void): Effect.Effect<void, Error>
    
    /**
     * Get current generation status
     */
    getStatus(): Effect.Effect<{
        running: boolean
        activeGenerations: number
        lastGeneration?: GenerationResult
        stats: GenerationStats
    }, Error>
}

/**
 * File watcher interface
 */
export type FileWatcher = {
    readonly watchPaths: string[]
    readonly ignorePatterns: string[]
    
    /**
     * Start watching files
     */
    start(): Effect.Effect<void, Error>
    
    /**
     * Stop watching files
     */
    stop(): Effect.Effect<void, Error>
    
    /**
     * Add path to watch
     */
    addPath(path: string): Effect.Effect<void, Error>
    
    /**
     * Remove path from watching
     */
    removePath(path: string): Effect.Effect<void, Error>
    
    /**
     * Subscribe to file change events
     */
    onFileChange(callback: (event: FileChangeEvent) => void): Effect.Effect<void, Error>
}

/**
 * Incremental compilation cache
 */
export type CompilationCache = {
    readonly cacheDir: string
    
    /**
     * Get cached generation result
     */
    get(key: string): Effect.Effect<GenerationResult | null, Error>
    
    /**
     * Store generation result in cache
     */
    set(key: string, result: GenerationResult): Effect.Effect<void, Error>
    
    /**
     * Invalidate cache entry
     */
    invalidate(key: string): Effect.Effect<void, Error>
    
    /**
     * Clear entire cache
     */
    clear(): Effect.Effect<void, Error>
    
    /**
     * Get cache statistics
     */
    getStats(): Effect.Effect<{
        entries: number
        hitRate: number
        totalSize: number
        lastCleanup: Date
    }, Error>
}