/**
 * Test Fixtures for TypeSpec-AsyncAPI Documentation Tests
 * 
 * REFACTORED: Split massive 1822-line file into maintainable modules
 * - CoreFixtures.ts: Core concepts, data types, operations (60% of content)
 * - EdgeCaseFixtures.ts: Edge cases, error scenarios, validation (25% of content) 
 * - PerformanceFixtures.ts: Performance tests, large datasets (15% of content)
 * 
 * This file now serves as the main entry point with re-exports for backward compatibility.
 */

/**
 * Legacy exports for backward compatibility - DEPRECATED
 * TODO: Remove these after updating all test files to use specific fixture imports
 */
import { CoreTypeSpecFixtures, CoreAsyncAPIFixtures } from './CoreFixtures.js'
import { EdgeCaseFixtures, ErrorFixtures } from './EdgeCaseFixtures.js'
import { PerformanceFixtures, TestDataGenerator, RealWorldExamples } from './PerformanceFixtures.js'

// Re-export all fixtures from the modular structure (avoiding duplicates)
export {
  CoreTypeSpecFixtures,
  CoreAsyncAPIFixtures
} from './CoreFixtures.js'

export {
  ProtocolEdgeCases
} from './EdgeCaseFixtures.js'

export {
  AdvancedPatternFixtures,
  RealWorldExamples
} from './PerformanceFixtures.js'


// Legacy TypeSpecFixtures export - combines all TypeSpec fixtures
export const TypeSpecFixtures = {
  ...CoreTypeSpecFixtures,
  ...EdgeCaseFixtures,
  ...RealWorldExamples  // Include real-world examples for test compatibility
}

// Legacy AsyncAPIFixtures export - core AsyncAPI expectations
export const AsyncAPIFixtures = {
  ...CoreAsyncAPIFixtures
}

// Direct re-exports for immediate compatibility (avoiding duplicates)
export { EdgeCaseFixtures, PerformanceFixtures, ErrorFixtures, TestDataGenerator }

/**
 * MIGRATION GUIDE for test files:
 * 
 * OLD (deprecated):
 * import { TypeSpecFixtures, AsyncAPIFixtures } from './helpers/test-fixtures.js'
 * 
 * NEW (recommended):
 * import { CoreTypeSpecFixtures } from './helpers/CoreFixtures.js'
 * import { EdgeCaseFixtures } from './helpers/EdgeCaseFixtures.js'
 * import { PerformanceFixtures } from './helpers/PerformanceFixtures.js'
 * 
 * This provides better tree-shaking and clearer dependencies.
 */