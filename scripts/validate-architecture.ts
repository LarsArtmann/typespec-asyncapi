#!/usr/bin/env bun

/**
 * Architectural Validation Rules - Package Structure Enforcer
 * 
 * Validates domain-driven architecture boundaries and dependency rules
 * Prevents architectural drift and maintains clean package structure
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ArchitecturalViolation {
  file: string;
  line: number;
  violation: string;
  rule: string;
  severity: 'error' | 'warning';
}

const violations: ArchitecturalViolation[] = [];

// Architectural rules
const DEPENDENCY_RULES = {
  // Domain layer: No external dependencies except shared
  'domain': {
    allowed: ['domain', 'shared'],
    forbidden: ['infrastructure', 'application'],
    description: 'Domain layer must not depend on infrastructure or application layers'
  },
  
  // Application layer: Can depend on domain and shared
  'application': {
    allowed: ['domain', 'shared', 'application'],
    forbidden: ['infrastructure'],
    description: 'Application layer must not directly depend on infrastructure'
  },
  
  // Infrastructure layer: Can depend on domain and shared
  'infrastructure': {
    allowed: ['domain', 'shared', 'infrastructure'],
    forbidden: ['application'],
    description: 'Infrastructure layer must not depend on application layer'
  },
  
  // Shared layer: No dependencies on other layers
  'shared': {
    allowed: ['shared'],
    forbidden: ['domain', 'application', 'infrastructure'],
    description: 'Shared layer must not depend on any other layers'
  }
};

function getLayerFromPath(filePath: string): string | null {
  if (filePath.includes('src/domain/')) return 'domain';
  if (filePath.includes('src/application/')) return 'application';
  if (filePath.includes('src/infrastructure/')) return 'infrastructure';
  if (filePath.includes('src/shared/') || filePath.includes('src/utils/') || filePath.includes('src/constants/') || filePath.includes('src/types/')) return 'shared';
  return null;
}

function getImportLayer(importPath: string): string | null {
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    // Relative import - resolve to layer
    if (importPath.includes('/domain/')) return 'domain';
    if (importPath.includes('/application/')) return 'application';
    if (importPath.includes('/infrastructure/')) return 'infrastructure';
    if (importPath.includes('/shared/') || importPath.includes('/utils/') || importPath.includes('/constants/') || importPath.includes('/types/')) return 'shared';
  }
  return null;
}

function validateImport(filePath: string, importPath: string, lineNumber: number) {
  const fileLayer = getLayerFromPath(filePath);
  const importLayer = getImportLayer(importPath);
  
  if (!fileLayer || !importLayer) return; // Skip external imports
  
  const rules = DEPENDENCY_RULES[fileLayer as keyof typeof DEPENDENCY_RULES];
  if (!rules) return;
  
  if (rules.forbidden.includes(importLayer)) {
    violations.push({
      file: filePath,
      line: lineNumber,
      violation: `Invalid import from ${importLayer} layer`,
      rule: rules.description,
      severity: 'error'
    });
  }
}

function validateFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const importMatch = line.match(/^import.*from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      validateImport(filePath, importMatch[1], index + 1);
    }
  });
}

async function main() {
  console.log('<�  Validating Architectural Boundaries...\n');
  
  // Find all TypeScript files
  const files = await glob('src/**/*.ts', { ignore: ['**/*.test.ts', '**/*.spec.ts'] });
  
  console.log(`=� Analyzing ${files.length} files...`);
  
  // Validate each file
  files.forEach(validateFile);
  
  // Report results
  if (violations.length === 0) {
    console.log('\n No architectural violations found!');
    console.log('<� Domain-driven boundaries are properly maintained');
    process.exit(0);
  } else {
    console.log(`\nL Found ${violations.length} architectural violations:\n`);
    
    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;
    
    violations.forEach(violation => {
      const emoji = violation.severity === 'error' ? '=�' : '�';
      console.log(`${emoji} ${violation.file}:${violation.line}`);
      console.log(`   ${violation.violation}`);
      console.log(`   Rule: ${violation.rule}\n`);
    });
    
    console.log(`Summary: ${errorCount} errors, ${warningCount} warnings`);
    
    if (errorCount > 0) {
      console.log('\n🔧 Fix architectural violations to maintain clean boundaries');
      process.exit(1);
    }
  }
}

main().catch(console.error);