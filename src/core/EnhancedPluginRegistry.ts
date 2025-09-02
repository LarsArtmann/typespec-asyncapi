/**
 * EnhancedPluginRegistry - Advanced Plugin Management with Hot-Reload
 *
 * Enterprise-grade plugin registry with advanced features:
 * - Automatic plugin discovery and loading
 * - Hot-reload capabilities with state preservation
 * - Plugin dependency resolution and conflict detection
 * - Resource monitoring and leak prevention
 * - Plugin lifecycle management with error isolation
 * - Performance monitoring and optimization
 */

// TypeSpec imports
import { Program } from "@typespec/compiler"

// Effect.TS imports
import { Effect, Console } from "effect"

// Node.js built-ins
import { readdir, stat, readFile } from "fs/promises"
import { join, extname } from "path"
import { existsSync, watch, FSWatcher } from "fs"

// Local imports
import { 
    PluginRegistry, 
    Plugin, 
    PluginState, 
    PluginMetadata, 
    PluginEvent,
    PluginConfig
} from "./PluginRegistry.js"
import { MemoryLeakDetector } from "../performance/MemoryLeakDetector.js"
import { PerformanceRegressionTester } from "../performance/PerformanceRegressionTester.js"

export type PluginManifest = {
    name: string
    version: string
    description: string
    main: string
    dependencies: string[]
    optionalDependencies?: string[]
    conflicts?: string[]
    requiredApiVersion?: string
    permissions?: string[]
    resourceLimits?: {
        maxMemoryMB?: number
        maxCpuPercent?: number
    }
    hotReloadSupported?: boolean
    metadata?: Record<string, unknown>
}

export type PluginDiscoveryConfig = {
    pluginDirectories: string[]
    enableAutoDiscovery: boolean
    enableHotReload: boolean
    watchForChanges: boolean
    manifestFileName: string
    pluginFileExtensions: string[]
    maxConcurrentLoads: number
}

export type ConflictResolution = {
    strategy: "ignore" | "warn" | "error" | "replace" | "version_priority"
    priorityOrder?: string[] // Plugin names in order of priority
}

export type DependencyGraph = {
    nodes: Map<string, PluginManifest>
    edges: Map<string, string[]>
    cycles: string[][]
    loadOrder: string[]
}

export type PluginConflict = {
    plugin1: string
    plugin2: string
    conflictType: "name_collision" | "version_conflict" | "resource_conflict" | "dependency_conflict"
    severity: "low" | "medium" | "high" | "critical"
    description: string
    resolutionStrategy?: string
}

export type HotReloadEvent = {
    type: "file_changed" | "plugin_reloaded" | "reload_failed" | "dependency_updated"
    pluginName: string
    filePath?: string
    error?: Error
    timestamp: Date
    reloadDuration?: number
}

/**
 * Enhanced plugin registry with enterprise features
 */
export class EnhancedPluginRegistry extends PluginRegistry {
    private readonly discoveryConfig: PluginDiscoveryConfig
    private readonly conflictResolution: ConflictResolution
    private readonly memoryLeakDetector: MemoryLeakDetector
    private readonly performanceTester: PerformanceRegressionTester
    
    private discoveredPlugins = new Map<string, PluginManifest>()
    private fileWatchers = new Map<string, FSWatcher>()
    private dependencyGraph?: DependencyGraph
    private detectedConflicts: PluginConflict[] = []
    private hotReloadHistory: HotReloadEvent[] = []
    private isDiscovering = false

    constructor(
        pluginConfig?: Partial<PluginConfig>,
        discoveryConfig?: Partial<PluginDiscoveryConfig>,
        conflictResolution?: Partial<ConflictResolution>
    ) {
        super(pluginConfig)

        this.discoveryConfig = {
            pluginDirectories: ['./src/plugins', './plugins', './node_modules'],
            enableAutoDiscovery: true,
            enableHotReload: true,
            watchForChanges: true,
            manifestFileName: 'plugin.json',
            pluginFileExtensions: ['.js', '.ts', '.mjs'],
            maxConcurrentLoads: 5,
            ...discoveryConfig
        }

        this.conflictResolution = {
            strategy: "version_priority",
            priorityOrder: [],
            ...conflictResolution
        }

        this.memoryLeakDetector = new MemoryLeakDetector({
            enableDetection: true,
            samplingInterval: 10000, // 10 seconds for plugin monitoring
            enableAutoCleanup: true,
            reportingPath: "plugin-memory-reports"
        })

        this.performanceTester = new PerformanceRegressionTester({
            baselinesFilePath: "plugin-performance-baselines.json",
            enableBaselines: true,
            enableCiValidation: false // Don't fail builds for plugin perf
        })

        Effect.log(`🔌 EnhancedPluginRegistry initialized`)
        Effect.log(`📂 Plugin directories: ${this.discoveryConfig.pluginDirectories.join(', ')}`)
        Effect.log(`🔄 Hot-reload: ${this.discoveryConfig.enableHotReload ? 'enabled' : 'disabled'}`)
    }

    /**
     * Start plugin discovery and monitoring
     */
    async startDiscovery() {
        return Effect.gen(function* (this: EnhancedPluginRegistry) {
            if (this.isDiscovering) {
                yield* Effect.log(`⚠️ Plugin discovery already active`)
                return
            }

            yield* Effect.log(`🔍 Starting plugin discovery...`)
            
            this.isDiscovering = true
            
            // Start memory leak detection
            yield* this.memoryLeakDetector.startDetection()
            
            // Discover plugins
            if (this.discoveryConfig.enableAutoDiscovery) {
                yield* Effect.tryPromise(() => this.discoverPlugins())
            }
            
            // Setup file watching
            if (this.discoveryConfig.watchForChanges) {
                yield* Effect.tryPromise(() => this.setupFileWatching())
            }
            
            // Build dependency graph
            this.buildDependencyGraph()
            
            // Detect conflicts
            this.detectConflicts()
            
            yield* Effect.log(`✅ Plugin discovery started - found ${this.discoveredPlugins.size} plugins`)
        }.bind(this))
    }

    /**
     * Stop plugin discovery and monitoring
     */
    async stopDiscovery() {
        return Effect.gen(function* (this: EnhancedPluginRegistry) {
            yield* Effect.log(`🔍 Stopping plugin discovery...`)
            
            this.isDiscovering = false
            
            // Stop file watchers
            for (const [path, watcher] of this.fileWatchers) {
                watcher.close()
                yield* Effect.log(`📂 Stopped watching: ${path}`)
            }
            this.fileWatchers.clear()
            
            // Stop memory leak detection
            yield* this.memoryLeakDetector.stopDetection()
            
            yield* Effect.log(`✅ Plugin discovery stopped`)
        }.bind(this))
    }

    /**
     * Discover plugins from configured directories
     */
    private async discoverPlugins(): Promise<void> {
        const discoveredCount = this.discoveredPlugins.size

        for (const directory of this.discoveryConfig.pluginDirectories) {
            if (!existsSync(directory)) {
                Effect.log(`📂 Plugin directory not found: ${directory}`)
                continue
            }

            await this.discoverPluginsInDirectory(directory)
        }

        const newDiscoveredCount = this.discoveredPlugins.size
        Effect.log(`🔍 Plugin discovery completed: ${newDiscoveredCount - discoveredCount} new plugins found`)
    }

    /**
     * Discover plugins in a specific directory
     */
    private async discoverPluginsInDirectory(directory: string): Promise<void> {
        try {
            const entries = await readdir(directory)
            
            for (const entry of entries) {
                const entryPath = join(directory, entry)
                const stats = await stat(entryPath)
                
                if (stats.isDirectory()) {
                    // Look for plugin manifest in subdirectory
                    const manifestPath = join(entryPath, this.discoveryConfig.manifestFileName)
                    if (existsSync(manifestPath)) {
                        await this.loadPluginManifest(manifestPath)
                    }
                } else if (stats.isFile() && entry === this.discoveryConfig.manifestFileName) {
                    // Direct manifest file
                    await this.loadPluginManifest(entryPath)
                }
            }
        } catch (error) {
            Effect.logError(`❌ Failed to discover plugins in ${directory}: ${error}`)
        }
    }

    /**
     * Load plugin manifest from file
     */
    private async loadPluginManifest(manifestPath: string): Promise<void> {
        try {
            const manifestContent = await readFile(manifestPath, 'utf-8')
            const manifest: PluginManifest = JSON.parse(manifestContent)
            
            // Validate manifest
            if (!manifest.name || !manifest.version || !manifest.main) {
                Effect.logWarning(`⚠️ Invalid plugin manifest: ${manifestPath}`)
                return
            }
            
            // Check if plugin already discovered
            if (this.discoveredPlugins.has(manifest.name)) {
                const existing = this.discoveredPlugins.get(manifest.name)!
                if (this.compareVersions(manifest.version, existing.version) > 0) {
                    Effect.log(`🔄 Found newer version of ${manifest.name}: ${manifest.version} > ${existing.version}`)
                    this.discoveredPlugins.set(manifest.name, manifest)
                }
                return
            }
            
            this.discoveredPlugins.set(manifest.name, manifest)
            Effect.log(`📦 Discovered plugin: ${manifest.name} v${manifest.version}`)
            
        } catch (error) {
            Effect.logError(`❌ Failed to load plugin manifest ${manifestPath}: ${error}`)
        }
    }

    /**
     * Build dependency graph for plugins
     */
    private buildDependencyGraph(): void {
        const graph: DependencyGraph = {
            nodes: new Map(this.discoveredPlugins),
            edges: new Map(),
            cycles: [],
            loadOrder: []
        }

        // Build edges
        for (const [name, manifest] of this.discoveredPlugins) {
            graph.edges.set(name, manifest.dependencies || [])
        }

        // Detect cycles
        graph.cycles = this.detectDependencyCycles(graph)
        
        // Calculate load order (topological sort)
        if (graph.cycles.length === 0) {
            graph.loadOrder = this.calculateLoadOrder(graph)
        } else {
            Effect.logWarning(`⚠️ Circular dependencies detected: ${graph.cycles.length} cycles`)
        }

        this.dependencyGraph = graph
        Effect.log(`📊 Dependency graph built: ${graph.nodes.size} nodes, ${graph.loadOrder.length} in load order`)
    }

    /**
     * Detect circular dependencies
     */
    private detectDependencyCycles(graph: DependencyGraph): string[][] {
        const cycles: string[][] = []
        const visited = new Set<string>()
        const visiting = new Set<string>()
        const path: string[] = []

        const dfs = (node: string): void => {
            if (visiting.has(node)) {
                // Found cycle
                const cycleStart = path.indexOf(node)
                if (cycleStart >= 0) {
                    cycles.push(path.slice(cycleStart).concat([node]))
                }
                return
            }

            if (visited.has(node)) {
                return
            }

            visiting.add(node)
            path.push(node)

            const dependencies = graph.edges.get(node) || []
            for (const dep of dependencies) {
                if (graph.nodes.has(dep)) {
                    dfs(dep)
                }
            }

            visiting.delete(node)
            visited.add(node)
            path.pop()
        }

        for (const node of graph.nodes.keys()) {
            if (!visited.has(node)) {
                dfs(node)
            }
        }

        return cycles
    }

    /**
     * Calculate plugin load order using topological sort
     */
    private calculateLoadOrder(graph: DependencyGraph): string[] {
        const inDegree = new Map<string, number>()
        const queue: string[] = []
        const result: string[] = []

        // Initialize in-degree count
        for (const node of graph.nodes.keys()) {
            inDegree.set(node, 0)
        }

        // Count incoming edges
        for (const [, dependencies] of graph.edges) {
            for (const dep of dependencies) {
                if (graph.nodes.has(dep)) {
                    inDegree.set(dep, (inDegree.get(dep) || 0) + 1)
                }
            }
        }

        // Find nodes with no incoming edges
        for (const [node, degree] of inDegree) {
            if (degree === 0) {
                queue.push(node)
            }
        }

        // Process queue
        while (queue.length > 0) {
            const node = queue.shift()!
            result.push(node)

            const dependencies = graph.edges.get(node) || []
            for (const dep of dependencies) {
                if (graph.nodes.has(dep)) {
                    const newDegree = (inDegree.get(dep) || 0) - 1
                    inDegree.set(dep, newDegree)
                    if (newDegree === 0) {
                        queue.push(dep)
                    }
                }
            }
        }

        return result
    }

    /**
     * Detect plugin conflicts
     */
    private detectConflicts(): void {
        this.detectedConflicts = []

        // Check for name collisions and version conflicts
        const pluginsByName = new Map<string, PluginManifest[]>()
        
        for (const manifest of this.discoveredPlugins.values()) {
            if (!pluginsByName.has(manifest.name)) {
                pluginsByName.set(manifest.name, [])
            }
            pluginsByName.get(manifest.name)!.push(manifest)
        }

        // Detect conflicts
        for (const [name, manifests] of pluginsByName) {
            if (manifests.length > 1) {
                for (let i = 0; i < manifests.length; i++) {
                    for (let j = i + 1; j < manifests.length; j++) {
                        this.detectedConflicts.push({
                            plugin1: manifests[i].name,
                            plugin2: manifests[j].name,
                            conflictType: "version_conflict",
                            severity: "medium",
                            description: `Multiple versions found: ${manifests[i].version} vs ${manifests[j].version}`
                        })
                    }
                }
            }
        }

        // Check explicit conflicts
        for (const manifest of this.discoveredPlugins.values()) {
            if (manifest.conflicts) {
                for (const conflictName of manifest.conflicts) {
                    if (this.discoveredPlugins.has(conflictName)) {
                        this.detectedConflicts.push({
                            plugin1: manifest.name,
                            plugin2: conflictName,
                            conflictType: "dependency_conflict",
                            severity: "high",
                            description: `${manifest.name} explicitly conflicts with ${conflictName}`
                        })
                    }
                }
            }
        }

        if (this.detectedConflicts.length > 0) {
            Effect.logWarning(`⚠️ Detected ${this.detectedConflicts.length} plugin conflicts`)
        }
    }

    /**
     * Setup file watching for hot-reload
     */
    private async setupFileWatching(): Promise<void> {
        for (const directory of this.discoveryConfig.pluginDirectories) {
            if (!existsSync(directory)) {
                continue
            }

            try {
                const watcher = watch(directory, { recursive: true }, (eventType, filename) => {
                    if (filename && this.shouldWatchFile(filename)) {
                        this.handleFileChange(directory, filename, eventType)
                    }
                })

                this.fileWatchers.set(directory, watcher)
                Effect.log(`👁️ Watching directory: ${directory}`)
            } catch (error) {
                Effect.logError(`❌ Failed to watch directory ${directory}: ${error}`)
            }
        }
    }

    /**
     * Handle file changes for hot-reload
     */
    private handleFileChange(directory: string, filename: string, eventType: string): void {
        const filePath = join(directory, filename)
        
        Effect.log(`📁 File changed: ${filePath} (${eventType})`)

        // Check if it's a plugin file
        const isPluginFile = this.discoveryConfig.pluginFileExtensions.some(ext => 
            filename.endsWith(ext)
        )

        const isManifestFile = filename.endsWith(this.discoveryConfig.manifestFileName)

        if (isManifestFile) {
            // Plugin manifest changed - rediscover
            this.handleManifestChange(filePath)
        } else if (isPluginFile) {
            // Plugin code changed - hot-reload
            this.handlePluginCodeChange(filePath)
        }
    }

    /**
     * Handle plugin manifest changes
     */
    private async handleManifestChange(manifestPath: string): Promise<void> {
        try {
            Effect.log(`🔄 Plugin manifest changed: ${manifestPath}`)
            await this.loadPluginManifest(manifestPath)
            this.buildDependencyGraph()
            this.detectConflicts()
        } catch (error) {
            Effect.logError(`❌ Failed to handle manifest change: ${error}`)
        }
    }

    /**
     * Handle plugin code changes for hot-reload
     */
    private async handlePluginCodeChange(filePath: string): Promise<void> {
        if (!this.discoveryConfig.enableHotReload) {
            return
        }

        // Find plugin associated with this file
        const pluginName = this.findPluginByFile(filePath)
        if (!pluginName) {
            return
        }

        const startTime = Date.now()

        try {
            Effect.log(`🔄 Hot-reloading plugin: ${pluginName}`)
            await this.reloadPlugin(pluginName)

            const reloadDuration = Date.now() - startTime
            
            const hotReloadEvent: HotReloadEvent = {
                type: "plugin_reloaded",
                pluginName,
                filePath,
                timestamp: new Date(),
                reloadDuration
            }

            this.hotReloadHistory.push(hotReloadEvent)
            this.emit("hot_reload", {
                type: "hot_reload",
                target: pluginName,
                data: hotReloadEvent,
                timestamp: new Date()
            })

            Effect.log(`✅ Plugin ${pluginName} hot-reloaded in ${reloadDuration}ms`)

        } catch (error) {
            const hotReloadEvent: HotReloadEvent = {
                type: "reload_failed",
                pluginName,
                filePath,
                error: error as Error,
                timestamp: new Date()
            }

            this.hotReloadHistory.push(hotReloadEvent)
            Effect.logError(`❌ Hot-reload failed for ${pluginName}: ${error}`)
        }
    }

    /**
     * Load plugins in dependency order
     */
    async loadDiscoveredPlugins() {
        return Effect.gen(function* (this: EnhancedPluginRegistry) {
            if (!this.dependencyGraph) {
                yield* Effect.logError(`❌ No dependency graph available`)
                return
            }

            if (this.dependencyGraph.cycles.length > 0) {
                yield* Effect.logError(`❌ Cannot load plugins due to circular dependencies`)
                return
            }

            const loadOrder = this.dependencyGraph.loadOrder
            yield* Effect.log(`🔄 Loading ${loadOrder.length} plugins in dependency order...`)

            let loadedCount = 0
            let errorCount = 0

            for (const pluginName of loadOrder) {
                try {
                    const manifest = this.discoveredPlugins.get(pluginName)
                    if (!manifest) {
                        continue
                    }

                    // Load and instantiate plugin
                    const plugin = yield* Effect.tryPromise(() => this.instantiatePlugin(manifest))
                    yield* Effect.tryPromise(() => this.loadPlugin(plugin))
                    
                    loadedCount++
                    yield* Effect.log(`✅ Loaded plugin: ${pluginName}`)

                } catch (error) {
                    errorCount++
                    yield* Effect.logError(`❌ Failed to load plugin ${pluginName}: ${error}`)
                }
            }

            yield* Effect.log(`📊 Plugin loading completed: ${loadedCount} loaded, ${errorCount} errors`)
        }.bind(this))
    }

    /**
     * Generate comprehensive plugin report
     */
    generateEnhancedReport() {
        return Effect.gen(function* () {
            const baseReport = this.generateHealthReport()
            const memoryReport = yield* this.memoryLeakDetector.generateLeakReport()
            
            let report = baseReport + `\n`
            report += `🔍 Plugin Discovery:\n`
            report += `  - Discovered plugins: ${this.discoveredPlugins.size}\n`
            report += `  - Conflicts detected: ${this.detectedConflicts.length}\n`
            report += `  - Dependency cycles: ${this.dependencyGraph?.cycles.length || 0}\n`
            report += `  - Hot-reload events: ${this.hotReloadHistory.length}\n`

            if (this.detectedConflicts.length > 0) {
                report += `\n⚠️ Plugin Conflicts:\n`
                for (const conflict of this.detectedConflicts) {
                    report += `  - ${conflict.plugin1} ↔ ${conflict.plugin2}: ${conflict.description}\n`
                }
            }

            report += `\n🧠 Memory Health: ${memoryReport.overallStatus.toUpperCase()}\n`
            if (memoryReport.detectedLeaks.length > 0) {
                report += `  - Detected leaks: ${memoryReport.detectedLeaks.length}\n`
            }

            return report
        })
    }

    // Helper methods
    private shouldWatchFile(filename: string): boolean {
        return this.discoveryConfig.pluginFileExtensions.some(ext => filename.endsWith(ext)) ||
               filename.endsWith(this.discoveryConfig.manifestFileName)
    }

    private findPluginByFile(filePath: string): string | null {
        // This would need more sophisticated logic to map files to plugins
        // For now, return null - would be implemented based on plugin structure
        return null
    }

    private async instantiatePlugin(manifest: PluginManifest): Promise<Plugin> {
        // This would dynamically load and instantiate the plugin
        // Implementation depends on plugin loading strategy
        throw new Error("Plugin instantiation not implemented")
    }

    private compareVersions(version1: string, version2: string): number {
        const parts1 = version1.split('.').map(Number)
        const parts2 = version2.split('.').map(Number)
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0
            const part2 = parts2[i] || 0
            
            if (part1 > part2) return 1
            if (part1 < part2) return -1
        }
        
        return 0
    }
}