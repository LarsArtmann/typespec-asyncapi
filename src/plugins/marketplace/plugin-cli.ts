#!/usr/bin/env node

import { Effect } from "effect"
import { globalPluginRegistry, PluginSearchCriteria, PluginMetadata } from "./plugin-registry.js"
import { awsSnsPlugin } from "../cloud-providers/aws-sns-plugin.js"
import { awsSqsPlugin } from "../cloud-providers/aws-sqs-plugin.js"
import { googlePubSubPlugin } from "../cloud-providers/google-pubsub-plugin.js"

/**
 * CLI command interface
 */
interface CLICommand {
  name: string
  description: string
  execute(args: string[]): Promise<void>
}

/**
 * Plugin CLI for marketplace operations
 */
export class PluginCLI {
  private commands = new Map<string, CLICommand>()
  
  constructor() {
    this.registerCommands()
  }
  
  /**
   * Register all available commands
   */
  private registerCommands(): void {
    this.commands.set('list', {
      name: 'list',
      description: 'List all available plugins',
      execute: this.listPlugins.bind(this)
    })
    
    this.commands.set('search', {
      name: 'search',
      description: 'Search for plugins',
      execute: this.searchPlugins.bind(this)
    })
    
    this.commands.set('info', {
      name: 'info',
      description: 'Show detailed information about a plugin',
      execute: this.showPluginInfo.bind(this)
    })
    
    this.commands.set('install', {
      name: 'install',
      description: 'Install a plugin',
      execute: this.installPlugin.bind(this)
    })
    
    this.commands.set('load', {
      name: 'load',
      description: 'Load a plugin into the registry',
      execute: this.loadPlugin.bind(this)
    })
    
    this.commands.set('uninstall', {
      name: 'uninstall',
      description: 'Uninstall a plugin',
      execute: this.uninstallPlugin.bind(this)
    })
    
    this.commands.set('validate', {
      name: 'validate',
      description: 'Validate plugin configuration',
      execute: this.validatePlugin.bind(this)
    })
    
    this.commands.set('stats', {
      name: 'stats',
      description: 'Show marketplace statistics',
      execute: this.showStatistics.bind(this)
    })
    
    this.commands.set('init', {
      name: 'init',
      description: 'Initialize built-in plugins',
      execute: this.initializeBuiltInPlugins.bind(this)
    })
    
    this.commands.set('help', {
      name: 'help',
      description: 'Show help information',
      execute: this.showHelp.bind(this)
    })
  }
  
  /**
   * Execute CLI command
   */
  async run(args: string[]): Promise<void> {
    const [commandName, ...commandArgs] = args
    
    if (!commandName) {
      await this.showHelp([])
      return
    }
    
    const command = this.commands.get(commandName)
    
    if (!command) {
      console.error(`❌ Unknown command: ${commandName}`)
      console.error(`Run 'plugin-cli help' for available commands`)
      process.exit(1)
    }
    
    try {
      await command.execute(commandArgs)
    } catch (error) {
      console.error(`❌ Command failed: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  }
  
  /**
   * List all available plugins
   */
  private async listPlugins(args: string[]): Promise<void> {
    const effect = Effect.gen(function* () {
      const plugins = globalPluginRegistry.getAllPlugins()
      
      if (plugins.length === 0) {
        console.log('📭 No plugins registered')
        console.log('Run "plugin-cli init" to load built-in plugins')
        return
      }
      
      console.log(`📦 Available Plugins (${plugins.length}):\n`)
      
      for (const entry of plugins) {
        const { metadata, status } = entry
        const statusIcon = this.getStatusIcon(status)
        const maturityIcon = this.getMaturityIcon(metadata.maturity)
        
        console.log(`${statusIcon} ${metadata.name} ${maturityIcon}`)
        console.log(`   ID: ${metadata.id}`)
        console.log(`   Version: ${metadata.version}`)
        console.log(`   Category: ${metadata.category}`)
        console.log(`   Author: ${metadata.author.name}`)
        console.log(`   Description: ${metadata.description}`)
        
        if (metadata.rating) {
          console.log(`   Rating: ${'⭐'.repeat(Math.floor(metadata.rating))} (${metadata.rating}/5)`)
        }
        
        if (metadata.downloadCount) {
          console.log(`   Downloads: ${metadata.downloadCount.toLocaleString()}`)
        }
        
        console.log('')
      }
    })
    
    await Effect.runPromise(effect)
  }
  
  /**
   * Search for plugins
   */
  private async searchPlugins(args: string[]): Promise<void> {
    const effect = Effect.gen(function* () {
      const criteria: PluginSearchCriteria = this.parseSearchCriteria(args)
      
      const results = yield* globalPluginRegistry.searchPlugins(criteria)
      
      if (results.length === 0) {
        console.log('🔍 No plugins found matching search criteria')
        return
      }
      
      console.log(`🔍 Search Results (${results.length}):\n`)
      
      for (const entry of results) {
        const { metadata, status } = entry
        const statusIcon = this.getStatusIcon(status)
        
        console.log(`${statusIcon} ${metadata.name}`)
        console.log(`   ${metadata.description}`)
        console.log(`   Category: ${metadata.category} | Maturity: ${metadata.maturity}`)
        console.log('')
      }
    })
    
    await Effect.runPromise(effect)
  }
  
  /**
   * Show detailed plugin information
   */
  private async showPluginInfo(args: string[]): Promise<void> {
    const effect = Effect.gen(function* () {
      const [pluginId] = args
      
      if (!pluginId) {
        console.error('❌ Plugin ID is required')
        console.error('Usage: plugin-cli info <plugin-id>')
        return
      }
      
      const entry = globalPluginRegistry.getPlugin(pluginId)
      
      if (!entry) {
        console.error(`❌ Plugin not found: ${pluginId}`)
        return
      }
      
      const { metadata, status } = entry
      
      console.log(`📋 Plugin Information:\n`)
      console.log(`Name: ${metadata.name}`)
      console.log(`ID: ${metadata.id}`)
      console.log(`Version: ${metadata.version}`)
      console.log(`Status: ${this.getStatusIcon(status)} ${status}`)
      console.log(`Description: ${metadata.description}`)
      console.log(`Category: ${metadata.category}`)
      console.log(`Maturity: ${this.getMaturityIcon(metadata.maturity)} ${metadata.maturity}`)
      console.log(`Author: ${metadata.author.name}`)
      
      if (metadata.author.email) {
        console.log(`Email: ${metadata.author.email}`)
      }
      
      if (metadata.author.url) {
        console.log(`Website: ${metadata.author.url}`)
      }
      
      console.log(`License: ${metadata.license}`)
      console.log(`Keywords: ${metadata.keywords.join(', ')}`)
      console.log(`Supported AsyncAPI Versions: ${metadata.supportedAsyncApiVersions.join(', ')}`)
      console.log(`TypeSpec Version: ${metadata.typespecVersion}`)
      
      if (metadata.homepage) {
        console.log(`Homepage: ${metadata.homepage}`)
      }
      
      if (metadata.repository) {
        console.log(`Repository: ${metadata.repository}`)
      }
      
      if (metadata.documentation) {
        console.log(`Documentation: ${metadata.documentation}`)
      }
      
      console.log(`\nInstallation:`)
      console.log(`  Command: ${metadata.installation.command}`)
      
      if (metadata.installation.setup) {
        console.log(`  Setup Steps:`)
        for (const step of metadata.installation.setup) {
          console.log(`    - ${step}`)
        }
      }
      
      if (metadata.examples && metadata.examples.length > 0) {
        console.log(`\n📝 Examples:`)
        for (const example of metadata.examples) {
          console.log(`\n  ${example.name}:`)
          console.log(`  ${example.description}`)
          console.log(`  \`\`\`typescript`)
          console.log(`  ${example.code}`)
          console.log(`  \`\`\``)
        }
      }
      
      if (entry.plugin) {
        console.log(`\n🎯 Capabilities:`)
        const capabilities = entry.plugin.getCapabilities()
        console.log(JSON.stringify(capabilities, null, 2))
      }
    })
    
    await Effect.runPromise(effect)
  }
  
  /**
   * Install a plugin
   */
  private async installPlugin(args: string[]): Promise<void> {
    const [pluginId] = args
    
    if (!pluginId) {
      console.error('❌ Plugin ID is required')
      console.error('Usage: plugin-cli install <plugin-id>')
      return
    }
    
    console.log(`📦 Installing plugin: ${pluginId}`)
    
    const effect = Effect.gen(function* () {
      const plugin = yield* globalPluginRegistry.loadPlugin(pluginId)
      console.log(`✅ Successfully installed plugin: ${plugin.name}`)
    })
    
    await Effect.runPromise(effect)
  }
  
  /**
   * Load a plugin into the registry
   */
  private async loadPlugin(args: string[]): Promise<void> {
    const [pluginId] = args
    
    if (!pluginId) {
      console.error('❌ Plugin ID is required')
      console.error('Usage: plugin-cli load <plugin-id>')
      return
    }
    
    console.log(`🔄 Loading plugin: ${pluginId}`)
    
    const effect = Effect.gen(function* () {
      const plugin = yield* globalPluginRegistry.loadPlugin(pluginId)
      console.log(`✅ Successfully loaded plugin: ${plugin.name}`)
    })
    
    await Effect.runPromise(effect)
  }
  
  /**
   * Uninstall a plugin
   */
  private async uninstallPlugin(args: string[]): Promise<void> {
    const [pluginId] = args
    
    if (!pluginId) {
      console.error('❌ Plugin ID is required')
      console.error('Usage: plugin-cli uninstall <plugin-id>')
      return
    }
    
    console.log(`🗑️ Uninstalling plugin: ${pluginId}`)
    
    const effect = Effect.gen(function* () {
      const success = yield* globalPluginRegistry.unregister(pluginId)
      
      if (success) {
        console.log(`✅ Successfully uninstalled plugin: ${pluginId}`)
      } else {
        console.log(`⚠️ Plugin was not registered: ${pluginId}`)
      }
    })
    
    await Effect.runPromise(effect)
  }
  
  /**
   * Validate plugin configuration
   */
  private async validatePlugin(args: string[]): Promise<void> {
    const [pluginId, configFile] = args
    
    if (!pluginId) {
      console.error('❌ Plugin ID is required')
      console.error('Usage: plugin-cli validate <plugin-id> [config-file]')
      return
    }
    
    console.log(`🔍 Validating plugin: ${pluginId}`)
    
    const effect = Effect.gen(function* () {
      const plugin = globalPluginRegistry.getLoadedPlugin(pluginId)
      
      if (!plugin) {
        console.error(`❌ Plugin not loaded: ${pluginId}`)
        return
      }
      
      // Load configuration if file provided
      let config: Record<string, unknown> = {}
      
      if (configFile) {
        try {
          const fs = await import('fs/promises')
          const configContent = await fs.readFile(configFile, 'utf-8')
          config = JSON.parse(configContent)
          console.log(`📄 Loaded configuration from: ${configFile}`)
        } catch (error) {
          console.error(`❌ Failed to load config file: ${error instanceof Error ? error.message : String(error)}`)
          return
        }
      }
      
      // Validate configuration
      const isValid = yield* plugin.validateConfiguration(config)
      
      if (isValid) {
        console.log(`✅ Plugin configuration is valid`)
      } else {
        console.log(`❌ Plugin configuration is invalid`)
      }
    })
    
    await Effect.runPromise(effect)
  }
  
  /**
   * Show marketplace statistics
   */
  private async showStatistics(_args: string[]): Promise<void> {
    const stats = globalPluginRegistry.getStatistics()
    
    console.log(`📊 Plugin Marketplace Statistics:\n`)
    console.log(`Total Plugins: ${stats.totalPlugins}`)
    console.log(`Loaded Plugins: ${stats.loadedPlugins}`)
    console.log(`Average Rating: ${typeof stats.averageRating === 'number' ? stats.averageRating.toFixed(1) : 'N/A'}`)
    console.log(`Total Downloads: ${typeof stats.totalDownloads === 'number' ? stats.totalDownloads.toLocaleString() : 'N/A'}`)
    
    console.log(`\n📂 By Category:`)
    const categories = stats.categories as Record<string, number>
    for (const [category, count] of Object.entries(categories)) {
      console.log(`  ${category}: ${count}`)
    }
    
    console.log(`\n🏷️ By Maturity:`)
    const maturity = stats.maturityLevels as Record<string, number>
    for (const [level, count] of Object.entries(maturity)) {
      console.log(`  ${this.getMaturityIcon(level)} ${level}: ${count}`)
    }
  }
  
  /**
   * Initialize built-in plugins
   */
  private async initializeBuiltInPlugins(_args: string[]): Promise<void> {
    console.log('🚀 Initializing built-in plugins...\n')
    
    const effect = Effect.gen(function* () {
      // Register AWS SNS Plugin
      yield* globalPluginRegistry.register({
        id: 'aws-sns',
        name: 'AWS Simple Notification Service',
        version: '1.0.0',
        description: 'Enterprise-grade AWS SNS messaging service binding support',
        author: {
          name: 'TypeSpec AsyncAPI Community',
          url: 'https://github.com/typespec/asyncapi'
        },
        license: 'MIT',
        keywords: ['aws', 'sns', 'cloud', 'messaging', 'notifications'],
        category: 'cloud-provider',
        maturity: 'stable',
        supportedAsyncApiVersions: ['3.0.0'],
        typespecVersion: '>=0.50.0',
        homepage: 'https://aws.amazon.com/sns/',
        repository: 'https://github.com/typespec/asyncapi',
        documentation: 'https://docs.aws.amazon.com/sns/',
        installation: {
          package: '@typespec/asyncapi',
          command: 'npm install @typespec/asyncapi',
          setup: [
            'Configure AWS credentials',
            'Set up IAM permissions for SNS access'
          ]
        },
        capabilities: awsSnsPlugin.getCapabilities(),
        examples: [
          {
            name: 'Basic SNS Topic',
            description: 'Simple SNS topic binding',
            code: `@bindings("aws-sns", { topic: "user-notifications" })\n@publish\nop publishNotification(): NotificationMessage;`
          }
        ],
        minimumSystemVersion: '1.0.0',
        lastUpdated: new Date().toISOString(),
        created: new Date().toISOString()
      }, awsSnsPlugin)
      
      // Register AWS SQS Plugin
      yield* globalPluginRegistry.register({
        id: 'aws-sqs',
        name: 'AWS Simple Queue Service',
        version: '1.0.0',
        description: 'Enterprise-grade AWS SQS messaging service binding support',
        author: {
          name: 'TypeSpec AsyncAPI Community',
          url: 'https://github.com/typespec/asyncapi'
        },
        license: 'MIT',
        keywords: ['aws', 'sqs', 'cloud', 'messaging', 'queues'],
        category: 'cloud-provider',
        maturity: 'stable',
        supportedAsyncApiVersions: ['3.0.0'],
        typespecVersion: '>=0.50.0',
        homepage: 'https://aws.amazon.com/sqs/',
        repository: 'https://github.com/typespec/asyncapi',
        documentation: 'https://docs.aws.amazon.com/sqs/',
        installation: {
          package: '@typespec/asyncapi',
          command: 'npm install @typespec/asyncapi',
          setup: [
            'Configure AWS credentials',
            'Set up IAM permissions for SQS access'
          ]
        },
        capabilities: awsSqsPlugin.getCapabilities(),
        examples: [
          {
            name: 'Basic SQS Queue',
            description: 'Simple SQS queue binding',
            code: `@bindings("aws-sqs", { queue: "order-processing" })\n@subscribe\nop processOrder(): OrderMessage;`
          }
        ],
        minimumSystemVersion: '1.0.0',
        lastUpdated: new Date().toISOString(),
        created: new Date().toISOString()
      }, awsSqsPlugin)
      
      // Register Google Pub/Sub Plugin
      yield* globalPluginRegistry.register({
        id: 'google-pubsub',
        name: 'Google Cloud Pub/Sub',
        version: '1.0.0',
        description: 'Enterprise-grade Google Cloud Pub/Sub messaging service binding support',
        author: {
          name: 'TypeSpec AsyncAPI Community',
          url: 'https://github.com/typespec/asyncapi'
        },
        license: 'MIT',
        keywords: ['google', 'pubsub', 'cloud', 'messaging', 'gcp'],
        category: 'cloud-provider',
        maturity: 'stable',
        supportedAsyncApiVersions: ['3.0.0'],
        typespecVersion: '>=0.50.0',
        homepage: 'https://cloud.google.com/pubsub',
        repository: 'https://github.com/typespec/asyncapi',
        documentation: 'https://cloud.google.com/pubsub/docs',
        installation: {
          package: '@typespec/asyncapi',
          command: 'npm install @typespec/asyncapi',
          setup: [
            'Configure Google Cloud credentials',
            'Set up service account permissions for Pub/Sub access'
          ]
        },
        capabilities: googlePubSubPlugin.getCapabilities(),
        examples: [
          {
            name: 'Basic Pub/Sub Topic',
            description: 'Simple Pub/Sub topic binding',
            code: `@bindings("google-pubsub", { topic: "user-events", projectId: "my-project" })\n@publish\nop publishUserEvent(): UserEventMessage;`
          }
        ],
        minimumSystemVersion: '1.0.0',
        lastUpdated: new Date().toISOString(),
        created: new Date().toISOString()
      }, googlePubSubPlugin)
      
      console.log('✅ Successfully initialized 3 built-in plugins:')
      console.log('   - AWS SNS Plugin')
      console.log('   - AWS SQS Plugin') 
      console.log('   - Google Cloud Pub/Sub Plugin')
      console.log('\nRun "plugin-cli list" to see all available plugins')
    })
    
    await Effect.runPromise(effect)
  }
  
  /**
   * Show help information
   */
  private async showHelp(_args: string[]): Promise<void> {
    console.log('🔧 TypeSpec AsyncAPI Plugin CLI\n')
    console.log('Usage: plugin-cli <command> [options]\n')
    console.log('Available Commands:\n')
    
    for (const command of this.commands.values()) {
      console.log(`  ${command.name.padEnd(12)} ${command.description}`)
    }
    
    console.log('\nExamples:')
    console.log('  plugin-cli init                    # Initialize built-in plugins')
    console.log('  plugin-cli list                    # List all plugins')
    console.log('  plugin-cli search --category=cloud-provider  # Search cloud provider plugins')
    console.log('  plugin-cli info aws-sns            # Show AWS SNS plugin details')
    console.log('  plugin-cli install aws-sns         # Install AWS SNS plugin')
    console.log('  plugin-cli stats                   # Show marketplace statistics')
  }
  
  /**
   * Parse search criteria from command line arguments
   */
  private parseSearchCriteria(args: string[]): PluginSearchCriteria {
    const criteria: PluginSearchCriteria = {}
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      
      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=')
        
        switch (key) {
          case 'query':
            criteria.query = value
            break
          case 'category':
            criteria.category = value
            break
          case 'maturity':
            criteria.maturity = value
            break
          case 'author':
            criteria.author = value
            break
          case 'min-rating':
            criteria.minRating = parseFloat(value)
            break
          case 'sort-by':
            criteria.sortBy = value as 'name' | 'downloads' | 'rating' | 'updated' | 'created'
            break
          case 'sort-order':
            criteria.sortOrder = value as 'asc' | 'desc'
            break
          case 'limit':
            criteria.limit = parseInt(value)
            break
          case 'offset':
            criteria.offset = parseInt(value)
            break
        }
      } else if (!criteria.query) {
        criteria.query = arg
      }
    }
    
    return criteria
  }
  
  /**
   * Get status icon for plugin status
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'loaded': return '✅'
      case 'loading': return '⏳'
      case 'error': return '❌'
      case 'registered': return '📦'
      default: return '❓'
    }
  }
  
  /**
   * Get maturity icon for plugin maturity level
   */
  private getMaturityIcon(maturity: string): string {
    switch (maturity) {
      case 'stable': return '🟢'
      case 'beta': return '🟡'
      case 'experimental': return '🟠'
      case 'deprecated': return '🔴'
      default: return '⚪'
    }
  }
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const cli = new PluginCLI()
  const args = process.argv.slice(2)
  
  await cli.run(args)
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}

export { PluginCLI }