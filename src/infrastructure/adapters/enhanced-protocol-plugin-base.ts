/**
 * Enhanced Protocol Plugin Base Class
 * 
 * TASK M24: Extract protocol plugin base class to reduce duplication
 * Base class for enhanced protocol plugins (AMQP, MQTT, WebSocket, etc.)
 * 
 * Provides common functionality:
 * - Effect.gen wrapper patterns with consistent error handling
 * - Standardized logging and error management
 * - Common binding version management
 * - Base testing utility structure
 * - Validation pattern extraction
 */

import { Effect } from "effect"
import type { ProtocolPlugin } from "./protocol-plugin.js"
import type { AsyncAPIProtocolType } from "../../constants/index.js"

/**
 * Base configuration for enhanced protocol plugins
 */
export interface EnhancedProtocolConfig {
  bindingVersion: string
}

/**
 * Base operation data structure
 */
export interface BaseOperationData {
  channel: {
    name: string
    parameters?: Record<string, unknown>
    config?: Record<string, unknown>
  }
  operation: {
    name: string
    action: "send" | "receive"
    parameters?: Record<string, unknown>
  }
  message?: {
    name: string
    payload?: unknown
  }
}

/**
 * Base server data structure
 */
export interface BaseServerData {
  url: string
  protocol: string
  config?: Record<string, unknown>
}

/**
 * Testing utilities base structure
 */
export interface BaseTestingUtils<TOperation, TServer> {
  createTestOperationData: (overrides?: Partial<TOperation>) => TOperation
  createTestServerData: (overrides?: Partial<TServer>) => TServer
  validateBindingOutput: (binding: unknown) => boolean
}

/**
 * Enhanced Protocol Plugin Base Class
 * Extracts common patterns from AMQP, MQTT, and WebSocket plugins
 */
export abstract class EnhancedProtocolPluginBase implements ProtocolPlugin {
  public abstract readonly name: AsyncAPIProtocolType
  public abstract readonly version: string
  protected abstract readonly bindingVersion: string

  /**
   * Common Effect.gen wrapper for operation binding generation
   * Provides consistent logging and error handling
   */
  protected wrapOperationBinding<T>(
    logPrefix: string,
    bindingGenerator: () => Effect.Effect<T, never>,
    fallbackBinding: T
  ): Effect.Effect<T, Error> {
    return Effect.gen(this, function* () {
      yield* Effect.log(`🔧 ${logPrefix} operation binding generation`)
      
      return yield* bindingGenerator().pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`❌ ${logPrefix} operation binding error: ${error}`)
            return fallbackBinding
          })
        )
      )
    })
  }

  /**
   * Common Effect.gen wrapper for message binding generation
   * Provides consistent logging and error handling
   */
  protected wrapMessageBinding<T>(
    logPrefix: string,
    bindingGenerator: () => Effect.Effect<T, never>,
    fallbackBinding: T
  ): Effect.Effect<T, Error> {
    return Effect.gen(this, function* () {
      yield* Effect.log(`📨 ${logPrefix} message binding generation`)
      
      return yield* bindingGenerator().pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`❌ ${logPrefix} message binding error: ${error}`)
            return fallbackBinding
          })
        )
      )
    })
  }

  /**
   * Common Effect.gen wrapper for server binding generation
   * Provides consistent logging and error handling
   */
  protected wrapServerBinding<T>(
    logPrefix: string,
    bindingGenerator: () => Effect.Effect<T, never>,
    fallbackBinding: T
  ): Effect.Effect<T, Error> {
    return Effect.gen(this, function* () {
      yield* Effect.log(`🖥️ ${logPrefix} server binding generation`)
      
      return yield* bindingGenerator().pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`❌ ${logPrefix} server binding error: ${error}`)
            return fallbackBinding
          })
        )
      )
    })
  }

  /**
   * Common Effect.gen wrapper for configuration validation
   * Provides consistent logging and error handling
   */
  protected wrapConfigValidation(
    logPrefix: string,
    validator: () => Effect.Effect<boolean, never>
  ): Effect.Effect<boolean, Error> {
    return Effect.gen(this, function* () {
      yield* Effect.log(`🔍 ${logPrefix} configuration validation`)
      
      return yield* validator().pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* Effect.logError(`❌ ${logPrefix} validation error: ${error}`)
            return false
          })
        )
      )
    })
  }

  /**
   * Common object type validation
   * Used by all protocol plugins for initial config validation
   */
  protected validateConfigIsObject(config: unknown, logPrefix: string): Effect.Effect<boolean, never> {
    return Effect.gen(function* () {
      if (!config || typeof config !== 'object') {
        yield* Effect.logWarning(`⚠️ ${logPrefix} config is not an object`)
        return false
      }
      return true
    })
  }

  /**
   * Common numeric range validation
   * Used for port numbers, timeouts, etc.
   */
  protected validateNumericRange(
    value: unknown,
    fieldName: string,
    min: number,
    max: number,
    logPrefix: string
  ): Effect.Effect<boolean, never> {
    return Effect.gen(function* () {
      if (typeof value !== 'number' || value < min || value > max) {
        yield* Effect.logError(`❌ Invalid ${logPrefix} ${fieldName}: ${value} (must be ${min}-${max})`)
        return false
      }
      return true
    })
  }

  /**
   * Common string array validation
   * Used for protocol arrays, sub-protocols, etc.
   */
  protected validateStringArray(
    value: unknown,
    fieldName: string,
    logPrefix: string
  ): Effect.Effect<boolean, never> {
    return Effect.gen(function* () {
      if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) {
        yield* Effect.logError(`❌ Invalid ${logPrefix} ${fieldName}: must be string array`)
        return false
      }
      return true
    })
  }

  /**
   * Common enum validation
   * Used for protocol-specific enums
   */
  protected validateEnum<T extends string>(
    value: unknown,
    validValues: readonly T[],
    fieldName: string,
    logPrefix: string
  ): Effect.Effect<boolean, never> {
    return Effect.gen(function* () {
      if (typeof value !== 'string' || !validValues.includes(value as T)) {
        yield* Effect.logError(`❌ Invalid ${logPrefix} ${fieldName}: ${value} (must be one of: ${validValues.join(', ')})`)
        return false
      }
      return true
    })
  }

  /**
   * Create base binding with version
   */
  protected createBaseBinding<T extends EnhancedProtocolConfig>(
    additionalConfig: Omit<T, 'bindingVersion'> = {} as Omit<T, 'bindingVersion'>
  ): T {
    return {
      bindingVersion: this.bindingVersion,
      ...additionalConfig
    } as T
  }

  /**
   * Base testing utilities structure
   * Subclasses should extend this with protocol-specific implementations
   */
  protected createBaseTestingUtils<TOperation extends BaseOperationData, TServer extends BaseServerData>(
    protocolKey: string,
    defaultOperation: TOperation,
    defaultServer: TServer
  ): BaseTestingUtils<TOperation, TServer> {
    return {
      createTestOperationData: (overrides: Partial<TOperation> = {}): TOperation => ({
        ...defaultOperation,
        ...overrides,
        channel: {
          ...defaultOperation.channel,
          ...overrides.channel
        },
        operation: {
          ...defaultOperation.operation,
          ...overrides.operation
        },
        message: {
          ...defaultOperation.message,
          ...overrides.message
        }
      }),

      createTestServerData: (overrides: Partial<TServer> = {}): TServer => ({
        ...defaultServer,
        ...overrides,
        config: {
          ...defaultServer.config,
          ...overrides.config
        }
      }),

      validateBindingOutput: (binding: unknown): boolean => {
        return (
          typeof binding === 'object' &&
          binding !== null &&
          protocolKey in binding &&
          typeof (binding as Record<string, unknown>)[protocolKey] === 'object' &&
          'bindingVersion' in ((binding as Record<string, unknown>)[protocolKey] as Record<string, unknown>)
        )
      }
    }
  }

  // Abstract methods that subclasses must implement
  public abstract generateOperationBinding(operation: unknown): Effect.Effect<Record<string, unknown>, Error>
  public abstract generateMessageBinding(message: unknown): Effect.Effect<Record<string, unknown>, Error>
  public abstract generateServerBinding(server: unknown): Effect.Effect<Record<string, unknown>, Error>
  public abstract validateConfig(config: unknown): Effect.Effect<boolean, Error>
}

/**
 * Utility type for extracting protocol-specific configuration
 */
export type ProtocolConfig<T> = T extends { config?: infer C } ? C : never

/**
 * Common protocol validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Enhanced validation helper that accumulates errors and warnings
 */
export class ValidationAccumulator {
  private errors: string[] = []
  private warnings: string[] = []

  addError(message: string): void {
    this.errors.push(message)
  }

  addWarning(message: string): void {
    this.warnings.push(message)
  }

  getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings]
    }
  }

  hasErrors(): boolean {
    return this.errors.length > 0
  }

  hasWarnings(): boolean {
    return this.warnings.length > 0
  }
}