/**
 * PluginRegistry - Micro-kernel Plugin Management
 * 
 * Core plugin registry implementing micro-kernel architecture principles.
 * Manages plugin lifecycle, isolation, hot-reload, and dependency resolution.
 * 
 * Plugin States:
 * - discovered: Plugin found but not loaded
 * - loaded: Plugin loaded into memory
 * - initialized: Plugin initialization complete
 * - started: Plugin actively running
 * - stopping: Plugin graceful shutdown in progress
 * - stopped: Plugin stopped but still loaded
 * - error: Plugin in error state
 */

import { Effect } from "effect"
import type {Milliseconds} from "../performance/Durations.js"
import type {ByteAmount} from "../performance/ByteAmount.js"
import {createMegabyteAmount} from "../performance/ByteAmount.js"
import { emitterErrors, type StandardizedError } from "../../utils/standardized-errors.js"

// Additional branded types for plugin configuration
type CpuPercentage = number & { readonly brand: 'CpuPercentage' };
export const createCpuPercentage = (value: number): CpuPercentage => value as CpuPercentage;

export enum PluginState {
    DISCOVERED = "discovered",
    LOADED = "loaded", 
    INITIALIZED = "initialized",
    STARTED = "started",
    STOPPING = "stopping",
    STOPPED = "stopped",
    ERROR = "error"
}

export type Plugin = {
    name: string
    version: string
    dependencies: string[]
    initialize(): Effect.Effect<void, StandardizedError, never>
    start(): Effect.Effect<void, StandardizedError, never>
    stop(): Effect.Effect<void, StandardizedError, never>
    reload?(): Effect.Effect<void, StandardizedError, never>
}

export type PluginEvent = {
	type: string
	target: string
	data?: unknown
	timestamp: Date
}

export type PluginMetadata = {
    name: string
    version: string
    state: PluginState
	//TODO THIS FUNCTION IS GETTING TO BIG SPLIT IT UP!
    dependencies: string[]
    loadedAt: Date
    lastActivity: Date
    resourceUsage?: {
        memory: ByteAmount
        cpu: CpuPercentage
    }
    errorCount: number
    restartCount: number
}

export enum PluginConfigFlags {
    HOT_RELOAD_ENABLED = 'enabled',
    HOT_RELOAD_DISABLED = 'disabled'
}

export enum ResourceMonitoringFlags {
    MONITORING_ENABLED = 'enabled',
    MONITORING_DISABLED = 'disabled'
}

export enum CircularDependencyDetectionFlags {
    DETECTION_ENABLED = 'enabled',
    DETECTION_DISABLED = 'disabled'
}

export type PluginConfig = {
    enableHotReload: PluginConfigFlags
    enableResourceMonitoring: ResourceMonitoringFlags
    maxMemoryUsage: ByteAmount
    maxCpuUsage: CpuPercentage
    enableCircularDependencyDetection: CircularDependencyDetectionFlags
    gracefulShutdownTimeout: Milliseconds
}

/**
 * Micro-kernel plugin registry with hot-reload and isolation
 */
export class PluginRegistry {
    private readonly plugins = new Map<string, Plugin>()
    private readonly pluginMetadata = new Map<string, PluginMetadata>()
    private readonly config: PluginConfig
	private readonly eventBus = new Map<string, Array<(event: PluginEvent) => void>>()

    constructor(config?: Partial<PluginConfig>) {
        this.config = {
            enableHotReload: PluginConfigFlags.HOT_RELOAD_ENABLED,
            enableResourceMonitoring: ResourceMonitoringFlags.MONITORING_ENABLED,
            maxMemoryUsage: createMegabyteAmount(100), // 100MB per plugin
            maxCpuUsage: createCpuPercentage(10), // 10% CPU per plugin
            enableCircularDependencyDetection: CircularDependencyDetectionFlags.DETECTION_ENABLED,
            gracefulShutdownTimeout: 5000 as Milliseconds, // 5 seconds
            ...config
        }

        Effect.log(`🔌 PluginRegistry initialized with config: ${JSON.stringify(this.config)}`)
    }

    /**
     * Register and load a plugin
     */
    loadPlugin(plugin: Plugin): Effect.Effect<void, StandardizedError, never> {
        return Effect.gen((function* (this: PluginRegistry) {
            yield* Effect.log(`🔌 Loading plugin: ${plugin.name} v${plugin.version}`)

            // Check for circular dependencies
            if (this.config.enableCircularDependencyDetection === CircularDependencyDetectionFlags.DETECTION_ENABLED) {
                yield* this.checkCircularDependencies(plugin)
            }

            // Check if plugin already exists
            if (this.plugins.has(plugin.name)) {
                return yield* Effect.fail(emitterErrors.pluginInitializationFailed(
                    plugin.name, 
                    `Plugin ${plugin.name} is already loaded`
                ))
            }

            // Validate dependencies
            yield* this.validateDependencies(plugin)

            // Create metadata
            const metadata: PluginMetadata = {
                name: plugin.name,
                version: plugin.version,
                state: PluginState.LOADED,
                dependencies: plugin.dependencies,
                loadedAt: new Date(),
                lastActivity: new Date(),
                errorCount: 0,
                restartCount: 0
            }

            // Store plugin and metadata
            this.plugins.set(plugin.name, plugin)
            this.pluginMetadata.set(plugin.name, metadata)

            // Initialize plugin
            yield* this.initializePlugin(plugin.name)

            yield* Effect.log(`✅ Plugin ${plugin.name} loaded successfully`)
        }).bind(this))
    }

    /**
     * Unload a plugin
     */
    unloadPlugin(name: string): Effect.Effect<void, StandardizedError, never> {
        return Effect.gen((function* (this: PluginRegistry) {
            yield* Effect.log(`🔌 Unloading plugin: ${name}`)

            const { metadata } = yield* this.getPluginAndMetadata(name)

            // Stop plugin if running
            if (metadata.state === PluginState.STARTED) {
                yield* this.stopPlugin(name)
            }

            // Remove from registry
            yield* Effect.sync(() => {
                this.plugins.delete(name)
                this.pluginMetadata.delete(name)
            })

            yield* Effect.log(`✅ Plugin ${name} unloaded successfully`)
        }).bind(this))
    }

    /**
     * Reload a plugin (hot-reload)
     */
    reloadPlugin(name: string): Effect.Effect<void, StandardizedError, never> {
        return Effect.gen((function* (this: PluginRegistry) {
            if (this.config.enableHotReload === PluginConfigFlags.HOT_RELOAD_DISABLED) {
                return yield* Effect.fail(emitterErrors.pluginInitializationFailed(
                    name,
                    "Hot reload is disabled"
                ))
            }

            yield* Effect.log(`🔄 Hot-reloading plugin: ${name}`)

            const { plugin, metadata } = yield* this.getPluginAndMetadata(name)

            const wasRunning = metadata.state === PluginState.STARTED

            const reloadEffect = Effect.gen((function* (this: PluginRegistry) {
                // Stop plugin if running
                if (wasRunning) {
                    yield* this.stopPlugin(name)
                }

                // Call reload if supported
                if (plugin.reload) {
                    yield* plugin.reload()
                    yield* Effect.sync(() => {
                        metadata.lastActivity = new Date()
                        metadata.restartCount++
                    })
                    yield* Effect.log(`🔄 Plugin ${name} reloaded using custom reload method`)
                } else {
                    // Fallback: reinitialize
                    yield* this.initializePlugin(name)
                    yield* Effect.log(`🔄 Plugin ${name} reloaded using reinitialization`)
                }

                // Restart if it was running
                if (wasRunning) {
                    yield* this.startPlugin(name)
                }

                yield* Effect.log(`✅ Plugin ${name} hot-reload completed`)
            }).bind(this))

            const result = yield* reloadEffect.pipe(
                Effect.tapError(() => Effect.sync(() => {
                    metadata.state = PluginState.ERROR
                    metadata.errorCount++
                })),
                Effect.mapError(error => emitterErrors.pluginInitializationFailed(
                    name,
                    `Plugin ${name} hot-reload failed: ${error}`
                ))
            )

            return result
        }).bind(this))
    }

    /**
     * Initialize a plugin
     */
    private initializePlugin(name: string): Effect.Effect<void, StandardizedError, never> {
        return Effect.gen(function* () {
            const { plugin, metadata } = yield* this.getPluginAndMetadata(name)

            const result = yield* plugin.initialize().pipe(
                Effect.tapError(() => Effect.sync(() => {
                    metadata.state = PluginState.ERROR
                    metadata.errorCount++
                })),
                Effect.tap(() => Effect.sync(() => {
                    metadata.state = PluginState.INITIALIZED
                    metadata.lastActivity = new Date()
                })),
                Effect.tap(() => Effect.log(`✅ Plugin ${name} initialized`)),
                Effect.mapError(error => emitterErrors.pluginInitializationFailed(
                    name,
                    `Plugin ${name} initialization failed: ${error}`
                ))
            )

            return result
        }).bind(this)
    }

    /**
     * Start a plugin
     */
    startPlugin(name: string): Effect.Effect<void, StandardizedError, never> {
        return Effect.gen(function* () {
            const { plugin, metadata } = yield* this.getPluginAndMetadata(name)

            if (metadata.state !== PluginState.INITIALIZED && metadata.state !== PluginState.STOPPED) {
                return yield* Effect.fail(emitterErrors.pluginInitializationFailed(
                    name,
                    `Plugin ${name} is not in a startable state (current: ${metadata.state})`
                ))
            }

            const result = yield* plugin.start().pipe(
                Effect.tapError(() => Effect.sync(() => {
                    metadata.state = PluginState.ERROR
                    metadata.errorCount++
                })),
                Effect.tap(() => Effect.sync(() => {
                    metadata.state = PluginState.STARTED
                    metadata.lastActivity = new Date()
                })),
                Effect.tap(() => Effect.log(`✅ Plugin ${name} started`)),
                Effect.mapError(error => emitterErrors.pluginInitializationFailed(
                    name,
                    `Plugin ${name} start failed: ${error}`
                ))
            )

            return result
        }).bind(this)
    }

    /**
     * Stop a plugin
     */
    stopPlugin(name: string): Effect.Effect<void, StandardizedError, never> {
        return Effect.gen(function* () {
            const { plugin, metadata } = yield* this.getPluginAndMetadata(name)

            if (metadata.state !== PluginState.STARTED) {
                yield* Effect.logWarning(`⚠️ Plugin ${name} is not running (current state: ${metadata.state})`)
                return
            }

            yield* Effect.sync(() => {
                metadata.state = PluginState.STOPPING
            })

            // Create timeout effect
            const timeoutEffect = Effect.sleep(this.config.gracefulShutdownTimeout).pipe(
                Effect.flatMap(() => Effect.fail(new Error(`Plugin ${name} shutdown timeout`)))
            )

            const result = yield* Effect.race(plugin.stop(), timeoutEffect).pipe(
                Effect.tapError(() => Effect.sync(() => {
                    metadata.state = PluginState.ERROR
                    metadata.errorCount++
                })),
                Effect.tap(() => Effect.sync(() => {
                    metadata.state = PluginState.STOPPED
                    metadata.lastActivity = new Date()
                })),
                Effect.tap(() => Effect.log(`✅ Plugin ${name} stopped`)),
                Effect.mapError(error => emitterErrors.pluginInitializationFailed(
                    name,
                    `Plugin ${name} stop failed: ${error}`
                ))
            )

            return result
        }).bind(this)
    }

    /**
     * Validate plugin dependencies
     */
    private validateDependencies(plugin: Plugin): Effect.Effect<void, StandardizedError, never> {
        return Effect.gen(function* () {
            for (const dependency of plugin.dependencies) {
                const depMetadata = this.pluginMetadata.get(dependency)
                
                if (!depMetadata) {
                    return yield* Effect.fail(emitterErrors.pluginInitializationFailed(
                        plugin.name,
                        `Plugin ${plugin.name} requires dependency ${dependency} which is not loaded`
                    ))
                }

                if (depMetadata.state === PluginState.ERROR) {
                    return yield* Effect.fail(emitterErrors.pluginInitializationFailed(
                        plugin.name,
                        `Plugin ${plugin.name} dependency ${dependency} is in error state`
                    ))
                }
            }
        })
    }

    /**
     * Check for circular dependencies
     */
    private checkCircularDependencies(plugin: Plugin): Effect.Effect<void, StandardizedError, never> {
        const self = this
        return Effect.gen(function* () {
            const visited = new Set<string>()
            const visiting = new Set<string>()

            const checkCircular = (pluginName: string, dependencies: string[]): boolean => {
                if (visiting.has(pluginName)) {
                    return true // Circular dependency found
                }

                if (visited.has(pluginName)) {
                    return false
                }

                visiting.add(pluginName)

                for (const dep of dependencies) {
                    const depPlugin = self.plugins.get(dep)
                    if (depPlugin && checkCircular(dep, depPlugin.dependencies)) {
                        return true
                    }
                }

                visiting.delete(pluginName)
                visited.add(pluginName)
                return false
            }

            if (checkCircular(plugin.name, plugin.dependencies)) {
                return yield* Effect.fail(emitterErrors.pluginInitializationFailed(
                    plugin.name,
                    `Circular dependency detected for plugin ${plugin.name}`
                ))
            }
        })
    }

    /**
     * Get plugin metadata
     */
    getPluginMetadata(name: string): PluginMetadata | undefined {
        return this.pluginMetadata.get(name)
    }

    /**
     * Get all plugins metadata
     */
    getAllPluginsMetadata(): PluginMetadata[] {
        return Array.from(this.pluginMetadata.values())
    }

    /**
     * Get plugins by state
     */
    getPluginsByState(state: PluginState): PluginMetadata[] {
        return Array.from(this.pluginMetadata.values())
            .filter(metadata => metadata.state === state)
    }

	/**
     * Subscribe to plugin events
     */
    on(eventType: string, handler: (event: PluginEvent) => void): void {
        if (!this.eventBus.has(eventType)) {
            this.eventBus.set(eventType, [])
        }
        const handlers = this.eventBus.get(eventType);
        if (handlers) {
            handlers.push(handler);
        }
    }

	/**
     * Emit plugin event
     */
    emit(eventType: string, event: PluginEvent): void {
        const handlers = this.eventBus.get(eventType) || []
        handlers.forEach(handler => {
            Effect.runSync(
                Effect.tryPromise({
                    try: () => Promise.resolve(handler(event)),
                    catch: (error) => new Error(`Event handler error for ${eventType}: ${error}`)
                }).pipe(
                    Effect.catchAll(error => Effect.logError(`❌ ${error.message}`))
                )
            )
        })
    }

    /**
     * Generate plugin health report
     */
    generateHealthReport(): string {
        const allPlugins = this.getAllPluginsMetadata()
        const totalPlugins = allPlugins.length
        const runningPlugins = this.getPluginsByState(PluginState.STARTED).length
        const errorPlugins = this.getPluginsByState(PluginState.ERROR).length

        let report = `\n🔌 Plugin Registry Health Report\n`
        report += `📊 Total Plugins: ${totalPlugins}\n`
        report += `✅ Running: ${runningPlugins}\n`
        report += `❌ Errors: ${errorPlugins}\n`
        report += `📈 Success Rate: ${totalPlugins > 0 ? ((totalPlugins - errorPlugins) / totalPlugins * 100).toFixed(1) : 0}%\n`

        if (errorPlugins > 0) {
            report += `\n❌ Error Details:\n`
            this.getPluginsByState(PluginState.ERROR).forEach(plugin => {
                report += `  - ${plugin.name}: ${plugin.errorCount} errors, last restart: ${plugin.restartCount}\n`
            })
        }

        return report
    }

    /**
     * Helper method to get plugin and metadata with validation - eliminates duplication
     * Used by unloadPlugin, hotReloadPlugin, initializePlugin, startPlugin, stopPlugin
     */
    private getPluginAndMetadata(name: string): Effect.Effect<{ plugin: Plugin; metadata: PluginMetadata }, StandardizedError, never> {
        const self = this
        return Effect.gen(function* () {
            const plugin = self.plugins.get(name)
            const metadata = self.pluginMetadata.get(name)

            if (!plugin || !metadata) {
                return yield* Effect.fail(emitterErrors.pluginInitializationFailed(
                    name,
                    `Plugin ${name} not found in registry`
                ))
            }

            return { plugin, metadata }
        })
    }
}