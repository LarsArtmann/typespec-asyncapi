import { Effect } from "effect"
import type { CloudBindingPlugin } from "../interfaces/cloud-binding-plugin.js"

/**
 * Plugin metadata for marketplace registry
 */
export type PluginMetadata = {
  /** Unique plugin identifier */
  id: string
  /** Plugin display name */
  name: string
  /** Plugin version (semver) */
  version: string
  /** Short description */
  description: string
  /** Plugin author information */
  author: {
    name: string
    email?: string
    url?: string
  }
  /** Plugin license */
  license: string
  /** Plugin keywords for search */
  keywords: string[]
  /** Plugin category */
  category: 'cloud-provider' | 'protocol' | 'transformation' | 'validation' | 'integration'
  /** Plugin maturity level */
  maturity: 'experimental' | 'beta' | 'stable' | 'deprecated'
  /** Supported AsyncAPI versions */
  supportedAsyncApiVersions: string[]
  /** TypeSpec version compatibility */
  typespecVersion: string
  /** Plugin homepage URL */
  homepage?: string
  /** Repository URL */
  repository?: string
  /** Documentation URL */
  documentation?: string
  /** Plugin installation instructions */
  installation: {
    /** NPM package name */
    package?: string
    /** Installation command */
    command: string
    /** Additional setup instructions */
    setup?: string[]
  }
  /** Plugin configuration schema */
  configSchema?: Record<string, unknown>
  /** Plugin capabilities */
  capabilities: Record<string, unknown>
  /** Usage examples */
  examples?: Array<{
    name: string
    description: string
    code: string
  }>
  /** Plugin dependencies */
  dependencies?: string[]
  /** Peer dependencies */
  peerDependencies?: string[]
  /** Minimum plugin system version */
  minimumSystemVersion: string
  /** Plugin checksum for integrity verification */
  checksum?: string
  /** Download count (marketplace analytics) */
  downloadCount?: number
  /** Average rating (1-5 stars) */
  rating?: number
  /** Last updated timestamp */
  lastUpdated: string
  /** Creation timestamp */
  created: string
}

/**
 * Plugin registry entry combining metadata and implementation
 */
export type PluginRegistryEntry = {
  /** Plugin metadata */
  metadata: PluginMetadata
  /** Plugin implementation (if loaded) */
  plugin?: CloudBindingPlugin
  /** Plugin loading status */
  status: 'registered' | 'loading' | 'loaded' | 'error'
  /** Error message if loading failed */
  error?: string
  /** Load timestamp */
  loadedAt?: string
}

/**
 * Plugin search filters and criteria
 */
export type PluginSearchCriteria = {
  /** Text search across name, description, keywords */
  query?: string
  /** Filter by category */
  category?: string
  /** Filter by maturity level */
  maturity?: string
  /** Filter by author */
  author?: string
  /** Filter by keywords */
  keywords?: string[]
  /** Minimum rating threshold */
  minRating?: number
  /** Sort by field */
  sortBy?: 'name' | 'downloads' | 'rating' | 'updated' | 'created'
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
  /** Result limit */
  limit?: number
  /** Result offset for pagination */
  offset?: number
}

/**
 * Plugin marketplace registry for discovery and management
 */
export class PluginMarketplaceRegistry {
  private readonly plugins = new Map<string, PluginRegistryEntry>()
  private readonly loadedPlugins = new Map<string, CloudBindingPlugin>()
  
  /**
   * Register a plugin in the marketplace
   */
  register(metadata: PluginMetadata, plugin?: CloudBindingPlugin): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      // Validate metadata
      yield* this.validatePluginMetadata(metadata)
      
      const entry: PluginRegistryEntry = {
        metadata,
        plugin,
        status: plugin ? 'loaded' : 'registered',
        loadedAt: plugin ? new Date().toISOString() : undefined
      }
      
      this.plugins.set(metadata.id, entry)
      
      if (plugin) {
        this.loadedPlugins.set(metadata.id, plugin)
      }
      
      Effect.log(`📦 Registered plugin: ${metadata.name} (${metadata.version})`)
    }.bind(this))
  }
  
  /**
   * Load a plugin dynamically
   */
  loadPlugin(pluginId: string): Effect.Effect<CloudBindingPlugin, Error> {
    return Effect.gen(function* () {
      const entry = this.plugins.get(pluginId)
      
      if (!entry) {
        return yield* Effect.fail(new Error(`Plugin not found: ${pluginId}`))
      }
      
      if (entry.plugin) {
        return entry.plugin
      }
      
      // Mark as loading
      entry.status = 'loading'
      this.plugins.set(pluginId, entry)
      
      try {
        // Dynamic import based on package name or path
        const packageName = entry.metadata.installation.package || pluginId
        Effect.log(`📥 Loading plugin: ${packageName}`)
        
        const pluginModule = await import(packageName)
        const plugin = pluginModule.default || pluginModule[pluginId] || pluginModule
        
        if (!this.isValidPlugin(plugin)) {
          throw new Error(`Invalid plugin implementation: ${pluginId}`)
        }
        
        // Update registry entry
        entry.plugin = plugin
        entry.status = 'loaded'
        entry.loadedAt = new Date().toISOString()
        entry.error = undefined
        this.plugins.set(pluginId, entry)
        
        // Cache loaded plugin
        this.loadedPlugins.set(pluginId, plugin)
        
        Effect.log(`✅ Successfully loaded plugin: ${entry.metadata.name}`)
        return plugin
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        // Update registry entry with error
        entry.status = 'error'
        entry.error = errorMessage
        this.plugins.set(pluginId, entry)
        
        Effect.log(`❌ Failed to load plugin ${pluginId}: ${errorMessage}`)
        return yield* Effect.fail(new Error(`Failed to load plugin ${pluginId}: ${errorMessage}`))
      }
    }.bind(this))
  }
  
  /**
   * Search plugins in the marketplace
   */
  searchPlugins(criteria: PluginSearchCriteria): Effect.Effect<PluginRegistryEntry[], never> {
    return Effect.gen(function* () {
      let results = Array.from(this.plugins.values())
      
      // Apply filters
      if (criteria.query) {
        const query = criteria.query.toLowerCase()
        results = results.filter(entry => 
          entry.metadata.name.toLowerCase().includes(query) ||
          entry.metadata.description.toLowerCase().includes(query) ||
          entry.metadata.keywords.some(keyword => keyword.toLowerCase().includes(query))
        )
      }
      
      if (criteria.category) {
        results = results.filter(entry => entry.metadata.category === criteria.category)
      }
      
      if (criteria.maturity) {
        results = results.filter(entry => entry.metadata.maturity === criteria.maturity)
      }
      
      if (criteria.author) {
        results = results.filter(entry => 
          entry.metadata.author.name.toLowerCase().includes(criteria.author!.toLowerCase())
        )
      }
      
      if (criteria.keywords && criteria.keywords.length > 0) {
        results = results.filter(entry =>
          criteria.keywords!.some(keyword =>
            entry.metadata.keywords.includes(keyword.toLowerCase())
          )
        )
      }
      
      if (criteria.minRating && criteria.minRating > 0) {
        results = results.filter(entry =>
          entry.metadata.rating && entry.metadata.rating >= criteria.minRating!
        )
      }
      
      // Apply sorting
      const sortBy = criteria.sortBy || 'name'
      const sortOrder = criteria.sortOrder || 'asc'
      
      results.sort((a, b) => {
        let comparison = 0
        
        switch (sortBy) {
          case 'name':
            comparison = a.metadata.name.localeCompare(b.metadata.name)
            break
          case 'downloads':
            comparison = (a.metadata.downloadCount || 0) - (b.metadata.downloadCount || 0)
            break
          case 'rating':
            comparison = (a.metadata.rating || 0) - (b.metadata.rating || 0)
            break
          case 'updated':
            comparison = new Date(a.metadata.lastUpdated).getTime() - new Date(b.metadata.lastUpdated).getTime()
            break
          case 'created':
            comparison = new Date(a.metadata.created).getTime() - new Date(b.metadata.created).getTime()
            break
        }
        
        return sortOrder === 'desc' ? -comparison : comparison
      })
      
      // Apply pagination
      if (criteria.offset) {
        results = results.slice(criteria.offset)
      }
      
      if (criteria.limit) {
        results = results.slice(0, criteria.limit)
      }
      
      Effect.log(`🔍 Found ${results.length} plugins matching search criteria`)
      return results
    })
  }
  
  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): PluginRegistryEntry | undefined {
    return this.plugins.get(pluginId)
  }
  
  /**
   * Get all registered plugins
   */
  getAllPlugins(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values())
  }
  
  /**
   * Get loaded plugin instance
   */
  getLoadedPlugin(pluginId: string): CloudBindingPlugin | undefined {
    return this.loadedPlugins.get(pluginId)
  }
  
  /**
   * Check if plugin is loaded
   */
  isPluginLoaded(pluginId: string): boolean {
    const entry = this.plugins.get(pluginId)
    return entry?.status === 'loaded' && !!entry.plugin
  }
  
  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): Effect.Effect<boolean, never> {
    return Effect.gen(function* () {
      const existed = this.plugins.has(pluginId)
      
      if (existed) {
        this.plugins.delete(pluginId)
        this.loadedPlugins.delete(pluginId)
        Effect.log(`🗑️ Unregistered plugin: ${pluginId}`)
      }
      
      return existed
    }.bind(this))
  }
  
  /**
   * Get plugin statistics
   */
  getStatistics(): Record<string, unknown> {
    const plugins = Array.from(this.plugins.values())
    
    return {
      totalPlugins: plugins.length,
      loadedPlugins: plugins.filter(p => p.status === 'loaded').length,
      categories: this.getPluginsByCategory(),
      maturityLevels: this.getPluginsByMaturity(),
      averageRating: this.calculateAverageRating(plugins),
      totalDownloads: plugins.reduce((sum, p) => sum + (p.metadata.downloadCount || 0), 0)
    }
  }
  
  /**
   * Validate plugin metadata
   */
  private validatePluginMetadata(metadata: PluginMetadata): Effect.Effect<void, Error> {
    return Effect.gen(function* () {
      if (!metadata.id || typeof metadata.id !== 'string') {
        return yield* Effect.fail(new Error('Plugin ID is required and must be a string'))
      }
      
      if (!metadata.name || typeof metadata.name !== 'string') {
        return yield* Effect.fail(new Error('Plugin name is required and must be a string'))
      }
      
      if (!metadata.version || typeof metadata.version !== 'string') {
        return yield* Effect.fail(new Error('Plugin version is required and must be a string'))
      }
      
      // Validate version format (basic semver check)
      const semverPattern = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9-]+))?(?:\+([a-zA-Z0-9-]+))?$/
      if (!semverPattern.test(metadata.version)) {
        return yield* Effect.fail(new Error('Plugin version must be valid semantic version'))
      }
      
      if (!metadata.author?.name) {
        return yield* Effect.fail(new Error('Plugin author name is required'))
      }
      
      const validCategories = ['cloud-provider', 'protocol', 'transformation', 'validation', 'integration']
      if (!validCategories.includes(metadata.category)) {
        return yield* Effect.fail(new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`))
      }
      
      const validMaturityLevels = ['experimental', 'beta', 'stable', 'deprecated']
      if (!validMaturityLevels.includes(metadata.maturity)) {
        return yield* Effect.fail(new Error(`Invalid maturity level. Must be one of: ${validMaturityLevels.join(', ')}`))
      }
      
      if (metadata.rating !== undefined && (metadata.rating < 0 || metadata.rating > 5)) {
        return yield* Effect.fail(new Error('Plugin rating must be between 0 and 5'))
      }
    })
  }
  
  /**
   * Validate plugin implementation
   */
  private isValidPlugin(plugin: unknown): plugin is CloudBindingPlugin {
    if (!plugin || typeof plugin !== 'object') {
      return false
    }
    
    const p = plugin as Record<string, unknown>
    
    return (
      typeof p.bindingType === 'string' &&
      typeof p.name === 'string' &&
      typeof p.version === 'string' &&
      typeof p.processBindings === 'function' &&
      typeof p.validateConfiguration === 'function' &&
      typeof p.getCapabilities === 'function'
    )
  }
  
  /**
   * Group plugins by category
   */
  private getPluginsByCategory(): Record<string, number> {
    const categories: Record<string, number> = {}
    
    for (const entry of this.plugins.values()) {
      const category = entry.metadata.category
      categories[category] = (categories[category] || 0) + 1
    }
    
    return categories
  }
  
  /**
   * Group plugins by maturity level
   */
  private getPluginsByMaturity(): Record<string, number> {
    const maturity: Record<string, number> = {}
    
    for (const entry of this.plugins.values()) {
      const level = entry.metadata.maturity
      maturity[level] = (maturity[level] || 0) + 1
    }
    
    return maturity
  }
  
  /**
   * Calculate average rating across all plugins
   */
  private calculateAverageRating(plugins: PluginRegistryEntry[]): number {
    const ratingsSum = plugins
      .filter(p => p.metadata.rating !== undefined)
      .reduce((sum, p) => sum + p.metadata.rating!, 0)
    
    const ratingsCount = plugins.filter(p => p.metadata.rating !== undefined).length
    
    return ratingsCount > 0 ? ratingsSum / ratingsCount : 0
  }
}

/**
 * Global plugin marketplace registry instance
 */
export const globalPluginRegistry = new PluginMarketplaceRegistry()

/**
 * Plugin registration helper function
 */
export function registerMarketplacePlugin(
  metadata: PluginMetadata,
  plugin?: CloudBindingPlugin
): Effect.Effect<void, Error> {
  return globalPluginRegistry.register(metadata, plugin)
}

/**
 * Plugin search helper function
 */
export function searchMarketplacePlugins(
  criteria: PluginSearchCriteria
): Effect.Effect<PluginRegistryEntry[], never> {
  return globalPluginRegistry.searchPlugins(criteria)
}