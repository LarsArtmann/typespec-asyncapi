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
    initialize(): Promise<void>
    start(): Promise<void>
    stop(): Promise<void>
    reload?(): Promise<void>
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
        memory: number
        cpu: number
    }
    errorCount: number
    restartCount: number
}

//TODO: I do not like boolean's use Enums smartly instead!
export type PluginConfig = {
    enableHotReload: boolean
    enableResourceMonitoring: boolean
	//TODO: Have a Better type! e.g. ByteAmount
    maxMemoryUsage: number // in MB
	//TODO: Have a Better type!
    maxCpuUsage: number // percentage
    enableCircularDependencyDetection: boolean
    gracefulShutdownTimeout: Milliseconds // in ms
}

/**
 * Micro-kernel plugin registry with hot-reload and isolation
 */
export class PluginRegistry {
    private readonly plugins = new Map<string, Plugin>()
    private readonly pluginMetadata = new Map<string, PluginMetadata>()
    private readonly config: PluginConfig
	//TODO: No fucking any!
	private readonly eventBus = new Map<string, Array<(event: any) => void>>()

    constructor(config?: Partial<PluginConfig>) {
        this.config = {
            enableHotReload: true,
            enableResourceMonitoring: true,
            maxMemoryUsage: 100, // 100MB per plugin
            maxCpuUsage: 10, // 10% CPU per plugin
            enableCircularDependencyDetection: true,
            gracefulShutdownTimeout: 5000, // 5 seconds
            ...config
        }

        Effect.log(`🔌 PluginRegistry initialized with config: ${JSON.stringify(this.config)}`)
    }

    /**
     * Register and load a plugin
     */
    async loadPlugin(plugin: Plugin): Promise<void> {
        Effect.log(`🔌 Loading plugin: ${plugin.name} v${plugin.version}`)

        // Check for circular dependencies
        if (this.config.enableCircularDependencyDetection) {
            this.checkCircularDependencies(plugin)
        }

        // Check if plugin already exists
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin ${plugin.name} is already loaded`)
        }

        // Validate dependencies
        await this.validateDependencies(plugin)

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
        await this.initializePlugin(plugin.name)

        Effect.log(`✅ Plugin ${plugin.name} loaded successfully`)
    }

    /**
     * Unload a plugin
     */
    async unloadPlugin(name: string): Promise<void> {
        Effect.log(`🔌 Unloading plugin: ${name}`)

        const plugin = this.plugins.get(name)
        const metadata = this.pluginMetadata.get(name)

        if (!plugin || !metadata) {
            throw new Error(`Plugin ${name} not found`)
        }

        // Stop plugin if running
        if (metadata.state === PluginState.STARTED) {
            await this.stopPlugin(name)
        }

        // Remove from registry
        this.plugins.delete(name)
        this.pluginMetadata.delete(name)

        Effect.log(`✅ Plugin ${name} unloaded successfully`)
    }

    /**
     * Reload a plugin (hot-reload)
     */
    async reloadPlugin(name: string): Promise<void> {
        if (!this.config.enableHotReload) {
            throw new Error("Hot reload is disabled")
        }

        Effect.log(`🔄 Hot-reloading plugin: ${name}`)

        const plugin = this.plugins.get(name)
        const metadata = this.pluginMetadata.get(name)

        if (!plugin || !metadata) {
            throw new Error(`Plugin ${name} not found`)
        }

        const wasRunning = metadata.state === PluginState.STARTED

        try {
            // Stop plugin if running
            if (wasRunning) {
                await this.stopPlugin(name)
            }

            // Call reload if supported
            if (plugin.reload) {
                await plugin.reload()
                metadata.lastActivity = new Date()
                metadata.restartCount++
                Effect.log(`🔄 Plugin ${name} reloaded using custom reload method`)
            } else {
                // Fallback: reinitialize
                await this.initializePlugin(name)
                Effect.log(`🔄 Plugin ${name} reloaded using reinitialization`)
            }

            // Restart if it was running
            if (wasRunning) {
                await this.startPlugin(name)
            }

            Effect.log(`✅ Plugin ${name} hot-reload completed`)
        } catch (error) {
            metadata.state = PluginState.ERROR
            metadata.errorCount++
            Effect.logError(`❌ Plugin ${name} hot-reload failed: ${error}`)
            throw error
        }
    }

    /**
     * Initialize a plugin
     */
    private async initializePlugin(name: string): Promise<void> {
        const plugin = this.plugins.get(name)
        const metadata = this.pluginMetadata.get(name)

        if (!plugin || !metadata) {
            throw new Error(`Plugin ${name} not found`)
        }

        try {
            await plugin.initialize()
            metadata.state = PluginState.INITIALIZED
            metadata.lastActivity = new Date()
            Effect.log(`✅ Plugin ${name} initialized`)
        } catch (error) {
            metadata.state = PluginState.ERROR
            metadata.errorCount++
            Effect.logError(`❌ Plugin ${name} initialization failed: ${error}`)
            throw error
        }
    }

    /**
     * Start a plugin
     */
    async startPlugin(name: string): Promise<void> {
        const plugin = this.plugins.get(name)
        const metadata = this.pluginMetadata.get(name)

        if (!plugin || !metadata) {
            throw new Error(`Plugin ${name} not found`)
        }

        if (metadata.state !== PluginState.INITIALIZED && metadata.state !== PluginState.STOPPED) {
            throw new Error(`Plugin ${name} is not in a startable state (current: ${metadata.state})`)
        }

        try {
            await plugin.start()
            metadata.state = PluginState.STARTED
            metadata.lastActivity = new Date()
            Effect.log(`✅ Plugin ${name} started`)
        } catch (error) {
            metadata.state = PluginState.ERROR
            metadata.errorCount++
            Effect.logError(`❌ Plugin ${name} start failed: ${error}`)
            throw error
        }
    }

    /**
     * Stop a plugin
     */
    async stopPlugin(name: string): Promise<void> {
        const plugin = this.plugins.get(name)
        const metadata = this.pluginMetadata.get(name)

        if (!plugin || !metadata) {
            throw new Error(`Plugin ${name} not found`)
        }

        if (metadata.state !== PluginState.STARTED) {
            Effect.logWarning(`⚠️ Plugin ${name} is not running (current state: ${metadata.state})`)
            return
        }

        try {
            metadata.state = PluginState.STOPPING
            
            // Set timeout for graceful shutdown
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Plugin ${name} shutdown timeout`)), this.config.gracefulShutdownTimeout)
            )

            await Promise.race([plugin.stop(), timeoutPromise])
            
            metadata.state = PluginState.STOPPED
            metadata.lastActivity = new Date()
            Effect.log(`✅ Plugin ${name} stopped`)
        } catch (error) {
            metadata.state = PluginState.ERROR
            metadata.errorCount++
            Effect.logError(`❌ Plugin ${name} stop failed: ${error}`)
            throw error
        }
    }

    /**
     * Validate plugin dependencies
     */
    private async validateDependencies(plugin: Plugin): Promise<void> {
        for (const dependency of plugin.dependencies) {
            const depMetadata = this.pluginMetadata.get(dependency)
            
            if (!depMetadata) {
                throw new Error(`Plugin ${plugin.name} requires dependency ${dependency} which is not loaded`)
            }

            if (depMetadata.state === PluginState.ERROR) {
                throw new Error(`Plugin ${plugin.name} dependency ${dependency} is in error state`)
            }
        }
    }

    /**
     * Check for circular dependencies
     */
    private checkCircularDependencies(plugin: Plugin): void {
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
                const depPlugin = this.plugins.get(dep)
                if (depPlugin && checkCircular(dep, depPlugin.dependencies)) {
                    return true
                }
            }

            visiting.delete(pluginName)
            visited.add(pluginName)
            return false
        }

        if (checkCircular(plugin.name, plugin.dependencies)) {
            throw new Error(`Circular dependency detected for plugin ${plugin.name}`)
        }
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

	//TODO: No fucking any!
	/**
     * Subscribe to plugin events
     */
    on(eventType: string, handler: (event: any) => void): void {
        if (!this.eventBus.has(eventType)) {
            this.eventBus.set(eventType, [])
        }
        this.eventBus.get(eventType)!.push(handler)
    }

	//TODO: No fucking any!
	/**
     * Emit plugin event
     */
    emit(eventType: string, event: any): void {
        const handlers = this.eventBus.get(eventType) || []
        handlers.forEach(handler => {
            try {
                handler(event)
            } catch (error) {
                Effect.logError(`❌ Event handler error for ${eventType}: ${error}`)
            }
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
}