#!/usr/bin/env bun
/**
 * Script to fix ghost tests by adding proper AsyncAPI validation
 */

import * as fs from 'fs'
import * as path from 'path'

// Pattern to match: await host.compile("./main.tsp") followed by expect(true).toBe(true)
const GHOST_PATTERN = /(\t\t)(await host\.compile\("\.\/main\.tsp"\))\s*\n\s*expect\(true\)\.toBe\(true\)/g

// Replacement: Get AsyncAPI spec and validate it exists
const REPLACEMENT = `$1const spec = await compileAndGetAsyncAPI(host, "./main.tsp")
$1expect(spec).toBeDefined()
$1expect(spec?.asyncapi).toBe("3.0.0")`

function fixGhostTests(filePath: string): number {
  console.log(`\n🔍 Processing: ${filePath}`)

  const content = fs.readFileSync(filePath, 'utf-8')
  const originalMatches = content.match(GHOST_PATTERN)

  if (!originalMatches) {
    console.log(`   ✅ No ghost patterns found`)
    return 0
  }

  console.log(`   ⚠️  Found ${originalMatches.length} ghost test patterns`)

  // Replace ghost patterns
  const fixed = content.replace(GHOST_PATTERN, REPLACEMENT)

  // Write back
  fs.writeFileSync(filePath, fixed, 'utf-8')

  console.log(`   ✅ Fixed ${originalMatches.length} ghost tests`)
  return originalMatches.length
}

// Files to fix
const filesToFix = [
  'test/domain/security-comprehensive.test.ts',
  'test/domain/protocol-kafka-comprehensive.test.ts',
  'test/domain/protocol-websocket-mqtt.test.ts',
]

let totalFixed = 0

for (const file of filesToFix) {
  const fullPath = path.join(process.cwd(), file)
  if (fs.existsSync(fullPath)) {
    totalFixed += fixGhostTests(fullPath)
  } else {
    console.log(`⚠️  File not found: ${file}`)
  }
}

console.log(`\n🎉 TOTAL: Fixed ${totalFixed} ghost tests across ${filesToFix.length} files!`)
