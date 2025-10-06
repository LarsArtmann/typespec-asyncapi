#!/usr/bin/env bun
/**
 * Script to fix reserved keyword usage in test files
 * 'pub' is a reserved keyword in TypeSpec, need to rename to 'publishMessage'
 */

import * as fs from 'fs'
import * as path from 'path'

// Replace op pub() with op publishMessage()
const RESERVED_KEYWORD_PATTERN = /op (pub|sub|receiveWebhook|consumeMessages|receive|consume)\(\)/g

function fixReservedKeywords(filePath: string): number {
  console.log(`\n🔍 Processing: ${filePath}`)

  const content = fs.readFileSync(filePath, 'utf-8')
  const originalMatches = content.match(RESERVED_KEYWORD_PATTERN)

  if (!originalMatches) {
    console.log(`   ✅ No reserved keyword issues found`)
    return 0
  }

  console.log(`   ⚠️  Found ${originalMatches.length} reserved keyword usages`)

  // Replace reserved keywords with safe alternatives
  const fixed = content
    .replace(/op pub\(\)/g, 'op publishMessage()')
    .replace(/op sub\(\)/g, 'op subscribeMessage()')
    .replace(/op receive\(\)/g, 'op receiveMessage()')
    .replace(/op consume\(\)/g, 'op consumeMessage()')

  fs.writeFileSync(filePath, fixed, 'utf-8')

  console.log(`   ✅ Fixed ${originalMatches.length} reserved keyword usages`)
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
    totalFixed += fixReservedKeywords(fullPath)
  } else {
    console.log(`⚠️  File not found: ${file}`)
  }
}

console.log(`\n🎉 TOTAL: Fixed ${totalFixed} reserved keyword usages across ${filesToFix.length} files!`)
