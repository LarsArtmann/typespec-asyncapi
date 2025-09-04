// Domain Models - Core Domain Entities and Value Objects
// Contains domain entities, value objects, and domain-specific types

// Error domain models
export * from './CompilationError.js';
export type * from './StandardizedError.js';
export * from './TypeResolutionError.js';
export * from './ValidationError.js';
export type * from './ErrorCategory.js';
export type * from './ErrorHandlingConfig.js';
export * from './ErrorHandlingMigration.js';
export * from './ErrorHandlingStandardization.js';

// Comprehensive error exports
export * from "../../domain/models/errors/index.js";

// Document domain models  
export * from './DocumentStats.js';

// Serialization models
export * from "../models/serialization-format-option.js";