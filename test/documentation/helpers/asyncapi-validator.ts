/**
 * AsyncAPI Validation Utilities
 * 
 * Provides comprehensive validation utilities for AsyncAPI 3.0 documents
 * generated from TypeSpec, including schema validation, structure checks,
 * and semantic validation for documentation BDD tests.
 */

import { Parser } from "@asyncapi/parser/esm"
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"

/**
 * AsyncAPI validation result with detailed feedback
 */
export interface AsyncAPIValidationResult {
  /** Whether the AsyncAPI document is valid */
  isValid: boolean
  /** Validation errors (if any) */
  errors: string[]
  /** Validation warnings (non-blocking issues) */
  warnings: string[]
  /** Successfully parsed AsyncAPI document */
  parsedDocument?: any
}

/**
 * Options for AsyncAPI validation
 */
export interface AsyncAPIValidationOptions {
  /** Whether to validate against AsyncAPI 3.0 schema strictly */
  strict?: boolean
  /** Whether to validate semantic rules beyond schema */
  validateSemantic?: boolean
  /** Whether to include warnings in validation result */
  includeWarnings?: boolean
  /** Custom validation rules to apply */
  customRules?: AsyncAPICustomRule[]
}

/**
 * Custom validation rule for AsyncAPI documents
 */
export interface AsyncAPICustomRule {
  /** Name of the rule for reporting */
  name: string
  /** Description of what the rule validates */
  description: string
  /** Validation function */
  validate: (asyncapi: AsyncAPIObject) => string[]
}

/**
 * Structure validation expectations for AsyncAPI documents
 */
export interface AsyncAPIStructureExpectation {
  /** Expected AsyncAPI version */
  version?: string
  /** Expected info fields */
  info?: {
    title?: string
    version?: string
    description?: string
  }
  /** Expected number of channels */
  channelCount?: number
  /** Expected channel names */
  channelNames?: string[]
  /** Expected number of operations */
  operationCount?: number
  /** Expected operation names */
  operationNames?: string[]
  /** Expected server configurations */
  servers?: Record<string, any>
  /** Expected component schemas */
  componentSchemas?: string[]
  /** Expected component messages */
  componentMessages?: string[]
}

/**
 * Helper class for AsyncAPI validation in documentation tests
 */
export class AsyncAPIDocumentationValidator {
  private parser: Parser

  constructor() {
    this.parser = new Parser()
  }

  /**
   * Validate AsyncAPI document against schema and semantic rules
   * 
   * @param asyncapi - AsyncAPI document to validate
   * @param options - Validation options
   * @returns Detailed validation result
   */
  async validateAsyncAPI(asyncapi: AsyncAPIObject, options: AsyncAPIValidationOptions = {}): Promise<AsyncAPIValidationResult> {
    const {
      strict = true,
      validateSemantic = true,
      includeWarnings = true,
      customRules = []
    } = options

    const result: AsyncAPIValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      // Parse and validate against AsyncAPI schema
      const document = await this.parser.parse(JSON.stringify(asyncapi))
      result.parsedDocument = document

      // Check for parsing errors
      if (document.diagnostics && document.diagnostics.length > 0) {
        const errors = document.diagnostics.filter((d: any) => d.severity === 'error')
        const warnings = document.diagnostics.filter((d: any) => d.severity === 'warning')
        
        result.errors.push(...errors.map((e: any) => e.message))
        if (includeWarnings) {
          result.warnings.push(...warnings.map((w: any) => w.message))
        }
      }

      // Semantic validation
      if (validateSemantic && result.errors.length === 0) {
        const semanticErrors = await this.performSemanticValidation(asyncapi)
        result.errors.push(...semanticErrors)
      }

      // Apply custom validation rules
      for (const rule of customRules) {
        const ruleErrors = rule.validate(asyncapi)
        if (ruleErrors.length > 0) {
          result.errors.push(...ruleErrors.map(error => `${rule.name}: ${error}`))
        }
      }

      result.isValid = result.errors.length === 0

    } catch (error) {
      result.isValid = false
      result.errors.push(`AsyncAPI parsing failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    return result
  }

  /**
   * Validate AsyncAPI document structure against expectations
   * 
   * @param asyncapi - AsyncAPI document to validate
   * @param expectations - Structure expectations
   * @returns Validation errors (empty if structure is valid)
   */
  validateStructure(asyncapi: AsyncAPIObject, expectations: AsyncAPIStructureExpectation): string[] {
    const errors: string[] = []

    // Validate AsyncAPI version
    if (expectations.version && asyncapi.asyncapi !== expectations.version) {
      errors.push(`Expected AsyncAPI version ${expectations.version}, got ${asyncapi.asyncapi}`)
    }

    // Validate info section
    if (expectations.info) {
      if (!asyncapi.info) {
        errors.push("Missing info section")
      } else {
        if (expectations.info.title && asyncapi.info.title !== expectations.info.title) {
          errors.push(`Expected info.title "${expectations.info.title}", got "${asyncapi.info.title}"`)
        }
        if (expectations.info.version && asyncapi.info.version !== expectations.info.version) {
          errors.push(`Expected info.version "${expectations.info.version}", got "${asyncapi.info.version}"`)
        }
        if (expectations.info.description && asyncapi.info.description !== expectations.info.description) {
          errors.push(`Expected info.description "${expectations.info.description}", got "${asyncapi.info.description}"`)
        }
      }
    }

    // Validate channels
    if (expectations.channelCount !== undefined) {
      const actualChannelCount = Object.keys(asyncapi.channels || {}).length
      if (actualChannelCount !== expectations.channelCount) {
        errors.push(`Expected ${expectations.channelCount} channels, got ${actualChannelCount}`)
      }
    }

    if (expectations.channelNames) {
      const actualChannelNames = Object.keys(asyncapi.channels || {})
      const missingChannels = expectations.channelNames.filter(name => !actualChannelNames.includes(name))
      if (missingChannels.length > 0) {
        errors.push(`Missing expected channels: ${missingChannels.join(', ')}`)
      }
    }

    // Validate operations
    if (expectations.operationCount !== undefined) {
      const actualOperationCount = Object.keys(asyncapi.operations || {}).length
      if (actualOperationCount !== expectations.operationCount) {
        errors.push(`Expected ${expectations.operationCount} operations, got ${actualOperationCount}`)
      }
    }

    if (expectations.operationNames) {
      const actualOperationNames = Object.keys(asyncapi.operations || {})
      const missingOperations = expectations.operationNames.filter(name => !actualOperationNames.includes(name))
      if (missingOperations.length > 0) {
        errors.push(`Missing expected operations: ${missingOperations.join(', ')}`)
      }
    }

    // Validate servers
    if (expectations.servers) {
      if (!asyncapi.servers) {
        errors.push("Expected servers configuration, but none found")
      } else {
        for (const [serverName, serverConfig] of Object.entries(expectations.servers)) {
          if (!asyncapi.servers[serverName]) {
            errors.push(`Missing expected server: ${serverName}`)
          }
        }
      }
    }

    // Validate component schemas
    if (expectations.componentSchemas) {
      const actualSchemas = Object.keys(asyncapi.components?.schemas || {})
      const missingSchemas = expectations.componentSchemas.filter(name => !actualSchemas.includes(name))
      if (missingSchemas.length > 0) {
        errors.push(`Missing expected component schemas: ${missingSchemas.join(', ')}`)
      }
    }

    // Validate component messages
    if (expectations.componentMessages) {
      const actualMessages = Object.keys(asyncapi.components?.messages || {})
      const missingMessages = expectations.componentMessages.filter(name => !actualMessages.includes(name))
      if (missingMessages.length > 0) {
        errors.push(`Missing expected component messages: ${missingMessages.join(', ')}`)
      }
    }

    return errors
  }

  /**
   * Perform semantic validation beyond schema validation
   */
  private async performSemanticValidation(asyncapi: AsyncAPIObject): Promise<string[]> {
    const errors: string[] = []

    // Validate that all channel references in operations exist
    if (asyncapi.operations) {
      for (const [operationId, operation] of Object.entries(asyncapi.operations)) {
        if (operation.channel) {
          const channelRef = operation.channel.$ref || operation.channel
          if (typeof channelRef === 'string' && channelRef.startsWith('#/channels/')) {
            const channelName = channelRef.replace('#/channels/', '')
            if (!asyncapi.channels || !asyncapi.channels[channelName]) {
              errors.push(`Operation '${operationId}' references non-existent channel '${channelName}'`)
            }
          }
        }
      }
    }

    // Validate that all message references exist
    if (asyncapi.channels) {
      for (const [channelName, channel] of Object.entries(asyncapi.channels)) {
        if (channel.messages) {
          for (const [messageKey, message] of Object.entries(channel.messages)) {
            if (typeof message === 'object' && message.$ref) {
              const messageRef = message.$ref
              if (messageRef.startsWith('#/components/messages/')) {
                const messageName = messageRef.replace('#/components/messages/', '')
                if (!asyncapi.components?.messages || !asyncapi.components.messages[messageName]) {
                  errors.push(`Channel '${channelName}' references non-existent message '${messageName}'`)
                }
              }
            }
          }
        }
      }
    }

    return errors
  }

  /**
   * Create common custom validation rules for TypeSpec-generated AsyncAPI documents
   */
  createTypeSpecValidationRules(): AsyncAPICustomRule[] {
    return [
      {
        name: "TypeSpec AsyncAPI Version",
        description: "Ensures AsyncAPI version is 3.0.0 as generated by TypeSpec",
        validate: (asyncapi: AsyncAPIObject): string[] => {
          if (asyncapi.asyncapi !== "3.0.0") {
            return [`Expected AsyncAPI version 3.0.0, got ${asyncapi.asyncapi}`]
          }
          return []
        }
      },
      {
        name: "Required Components Structure",
        description: "Ensures components section has required structure",
        validate: (asyncapi: AsyncAPIObject): string[] => {
          const errors: string[] = []
          if (!asyncapi.components) {
            errors.push("Missing components section")
            return errors
          }
          
          const requiredSections = ['schemas', 'messages', 'securitySchemes']
          for (const section of requiredSections) {
            if (!asyncapi.components[section as keyof typeof asyncapi.components]) {
              errors.push(`Missing components.${section} section`)
            }
          }
          return errors
        }
      },
      {
        name: "TypeSpec Info Validation",
        description: "Validates info section has TypeSpec-specific fields",
        validate: (asyncapi: AsyncAPIObject): string[] => {
          const errors: string[] = []
          if (!asyncapi.info) {
            errors.push("Missing info section")
            return errors
          }
          
          if (!asyncapi.info.title) {
            errors.push("Missing info.title")
          }
          if (!asyncapi.info.version) {
            errors.push("Missing info.version")
          }
          
          return errors
        }
      }
    ]
  }
}

/**
 * Create a new AsyncAPI documentation validator
 */
export function createAsyncAPIValidator(): AsyncAPIDocumentationValidator {
  return new AsyncAPIDocumentationValidator()
}