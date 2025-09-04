#!/usr/bin/env bun

/**
 * Import Path Fixer - Systematic Import Resolution
 * 
 * Fixes all import paths after package structure reorganization
 * Maps old paths to new domain-driven architecture paths
 */

import * as fs from 'fs';
import { glob } from 'glob';

// Mapping of old paths to new paths
const IMPORT_MAPPINGS: Record<string, string> = {
  // Options/Configuration
  './options.js': '../../infrastructure/configuration/options.js',
  '../options.js': '../../infrastructure/configuration/options.js',
  '../options/asyncAPIEmitterOptions.js': '../../infrastructure/configuration/asyncAPIEmitterOptions.js',
  '../options/': '../../infrastructure/configuration/',
  
  // Core services moved to domain
  './core/AsyncAPIEmitter.js': '../../domain/emitter/AsyncAPIEmitter.js',
  './PerformanceMonitor.js': '../../infrastructure/performance/PerformanceMonitor.js',
  './PluginRegistry.js': '../../infrastructure/adapters/PluginRegistry.js',
  './serialization-format-option.js': '../models/serialization-format-option.js',
  '../core/': '../../domain/emitter/',
  './core/': '../domain/emitter/',
  
  // Decorators moved to domain
  '../decorators/server.js': '../domain/decorators/server.js',
  '../decorators/message.js': '../domain/decorators/message.js',
  '../decorators/protocolConfig.js': '../domain/decorators/protocolConfig.js',
  '../decorators/securityConfig.js': '../domain/decorators/securityConfig.js',
  '../decorators/': '../../domain/decorators/',
  './decorators/': '../domain/decorators/',
  
  // Validation moved to domain
  '../validation/': '../../domain/validation/',
  './validation/': '../domain/validation/',
  '../core/ValidationError.js': '../../domain/models/ValidationError.js',
  '../../domain/models/ValidationError.js': '../ValidationError.js',
  
  // Errors moved to domain models
  './errors/index.js': '../../domain/models/errors/index.js',
  '../errors/': '../../domain/models/errors/',
  
  // Performance moved to infrastructure
  '../performance/': '../../infrastructure/performance/',
  './performance/': '../infrastructure/performance/',
  
  // Plugins moved to infrastructure adapters
  './plugins/plugin-system.js': '../../infrastructure/adapters/plugin-system.js',
  '../plugins/plugin-system.js': '../adapters/plugin-system.js',
  '../plugins/': '../../infrastructure/adapters/',
  './plugins/': '../infrastructure/adapters/',
  
  // Constants need updates for new paths
  '../constants/cloud-binding-type.js': '../../constants/cloud-binding-type.js',
  '../constants/protocol-defaults.js': '../../constants/protocol-defaults.js',
  '../constants/': '../../constants/',
  './constants/': '../constants/',
  
  // Utils remain but need path updates
  '../utils/effect-helpers.js': '../../utils/effect-helpers.js',
  '../utils/typespec-helpers.js': '../utils/typespec-helpers.js',
  '../utils/protocol-validation.js': '../utils/protocol-validation.js',
  '../utils/asyncapi-helpers.js': '../utils/asyncapi-helpers.js',
  '../utils/schema-conversion.js': '../utils/schema-conversion.js',
  './utils/': '../utils/',
  '../utils/': '../utils/',
  
  // Lib file at root
  '../lib.js': '../../lib.js',
  './lib.js': '../lib.js'
};

// Additional layer-specific mappings
const LAYER_MAPPINGS: Record<string, Record<string, string>> = {
  'domain': {
    '../constants/': '../../constants/',
    '../utils/': '../../utils/',
    '../lib.js': '../../lib.js',
    '../types/': '../../types/'
  },
  'infrastructure': {
    '../constants/': '../../constants/',
    '../utils/': '../../utils/',
    '../lib.js': '../../lib.js',
    '../options/': '../configuration/',
    '../performance/': '../performance/'
  },
  'application': {
    '../constants/': '../../constants/',
    '../utils/': '../../utils/',
    '../lib.js': '../../lib.js'
  }
};

function getLayer(filePath: string): string | null {
  if (filePath.includes('/domain/')) return 'domain';
  if (filePath.includes('/application/')) return 'application';
  if (filePath.includes('/infrastructure/')) return 'infrastructure';
  return null;
}

function fixImportsInFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let updatedContent = content;
  let changeCount = 0;
  
  const layer = getLayer(filePath);
  const layerMappings = layer ? LAYER_MAPPINGS[layer] : {};
  
  // Apply all mappings
  const allMappings = { ...IMPORT_MAPPINGS, ...layerMappings };
  
  for (const [oldPath, newPath] of Object.entries(allMappings)) {
    const oldImportPattern = new RegExp(`from\\s+['"]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    const newImportStatement = `from "${newPath}"`;
    
    if (oldImportPattern.test(updatedContent)) {
      updatedContent = updatedContent.replace(oldImportPattern, newImportStatement);
      changeCount++;
    }
  }
  
  if (changeCount > 0) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(` Fixed ${changeCount} imports in ${filePath}`);
    return changeCount;
  }
  
  return 0;
}

async function main() {
  console.log('🔧 Fixing import paths after package reorganization...\n');
  
  const files = await glob('src/**/*.ts', { ignore: ['**/*.test.ts', '**/*.spec.ts'] });
  
  console.log(`=� Processing ${files.length} TypeScript files...`);
  
  let totalFixes = 0;
  let filesChanged = 0;
  
  for (const file of files) {
    const fixes = fixImportsInFile(file);
    if (fixes > 0) {
      totalFixes += fixes;
      filesChanged++;
    }
  }
  
  console.log(`\n=� Import Fix Summary:`);
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Files changed: ${filesChanged}`);
  console.log(`   Total imports fixed: ${totalFixes}`);
  
  if (totalFixes > 0) {
    console.log('\n<� Import paths updated for new domain-driven architecture!');
    console.log('=� Run `just build` to verify all imports are resolved');
  } else {
    console.log('\n No import path fixes needed');
  }
}

main().catch(console.error);