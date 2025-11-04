/**
 * Immutable Document Manager - Safe Document Mutation Patterns
 * 
 * Provides immutable document operations for AsyncAPI documents:
 * - Type-safe document mutations
 * - History tracking and rollback
 * - Atomic update operations
 * - Document validation after mutations
 */

import { Effect, Context, Layer, pipe } from "effect"
import { gen } from "effect/Effect"
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import type { DocumentUpdate, ServiceMetrics } from "../models/ServiceInterfaces.js"
import { MetricsCollector } from "../../infrastructure/performance/MetricsCollector.js"
import { ErrorHandler, ErrorFactory } from "../../infrastructure/errors/CentralizedErrorHandler.js"

/**
 * Internal helper: Apply mutation to document immutably
 */
const DocumentStateError = (message: string) => new Error(`Document state error: ${message}`)

/**
 * Type-safe memory usage extraction from performance API
 */
const getMemoryUsageFromPerformance = (): number => {
  // Type-safe memory usage calculation
  if (typeof performance !== "undefined") {
    // Browser performance API
    const perf = performance as unknown
    if (typeof perf === "object" && perf !== null) {
      // Check for memory API in browser
      const memoryAPI = (perf as Record<string, unknown>).memory
      if (typeof memoryAPI === "object" && memoryAPI !== null) {
        const usedJSHeapSize = (memoryAPI as Record<string, unknown>).usedJSHeapSize
        if (typeof usedJSHeapSize === "number") {
          return usedJSHeapSize / 1024 / 1024
        }
      }
    }
  }
  return 0
}

const applyMutation = <T>(document: AsyncAPIObject, mutation: DocumentUpdate<T>) =>
  Effect.gen(function* () {
    const documentCopy = JSON.parse(JSON.stringify(document))
    let current: Record<string, unknown> = documentCopy
    let oldValue: T | undefined
    
    // Navigate to mutation path
    for (let i = 0; i < mutation.path.length - 1; i++) {
      const key = mutation.path[i]
      if (!(key in current)) {
        current[key] = {}
      }
      current = current[key] as Record<string, unknown>
    }
    
    const finalKey = mutation.path[mutation.path.length - 1]
    oldValue = current[finalKey] as T
    current[finalKey] = mutation.value
    
    return {
      success: true as const,
      document: documentCopy,
      oldValue
    }
  })

/**
 * Document mutation operation interface
 */
export type DocumentMutation<T = unknown> = {
  readonly id: string
  readonly type: DocumentUpdate['type']
  readonly path: string[]
  readonly oldValue: T | undefined
  readonly newValue: T
  readonly timestamp: number
  readonly description: string
}

/**
 * Document version interface for history tracking
 */
export type DocumentVersion = {
  readonly id: string
  readonly version: number
  readonly timestamp: number
  readonly document: AsyncAPIObject
  readonly mutations: DocumentMutation[]
  readonly description: string
}

/**
 * Immutable document manager interface
 */
export type DocumentManager = {
  readonly getDocument: () => Effect.Effect<AsyncAPIObject, Error>
  readonly getCurrentVersion: () => Effect.Effect<number, Error>
  readonly mutateDocument: <T>(mutation: DocumentUpdate<T>) => Effect.Effect<AsyncAPIObject, Error, "MetricsCollector" | "ErrorHandler">
  readonly mutateDocumentAtomic: <T>(mutations: DocumentUpdate<T>[]) => Effect.Effect<AsyncAPIObject, Error, "MetricsCollector" | "ErrorHandler">
  readonly rollbackToVersion: (versionId: string) => Effect.Effect<AsyncAPIObject, Error>
  readonly getMutationHistory: () => Effect.Effect<DocumentMutation[], Error>
  readonly getVersionHistory: () => Effect.Effect<DocumentVersion[], never>
  readonly validateDocument: (document: AsyncAPIObject) => Effect.Effect<boolean, never>
}

/**
 * Document manager tag for dependency injection
 */
export const DocumentManager = Context.GenericTag<"DocumentManager", DocumentManager>("DocumentManager")

/**
 * Immutable document manager implementation
 */
export const ImmutableDocumentManager: DocumentManager = {
  getDocument: () =>
    Effect.gen(function* () {
      const currentState = globalThis.__ASYNCAPI_DOCUMENT_STATE
      if (!currentState) {
        yield* Effect.fail(new Error("Document not initialized"))
        return undefined as never
      }
      return currentState.currentDocument
    }),
  
  getCurrentVersion: () =>
    Effect.gen(function* () {
      const currentState = globalThis.__ASYNCAPI_DOCUMENT_STATE
      if (!currentState) {
        yield* Effect.fail(new Error("Document not initialized"))
        return undefined as never
      }
      return currentState.currentVersion
    }),
  
  mutateDocument: <T>(mutation: DocumentUpdate<T>) =>
    Effect.gen(function* () {
      const metrics = yield* MetricsCollector
      const errorHandler = yield* ErrorHandler
      
      yield* metrics.startTiming('document-mutation')
      
      try {
        const currentState = globalThis.__ASYNCAPI_DOCUMENT_STATE
        if (!currentState) {
          throw new Error("Document state not initialized")
        }
        
        // Create deep copy of current document
        const currentDocument = JSON.parse(JSON.stringify(currentState.currentDocument))
        
        // Apply mutation immutably using proper Effect composition
        const mutationResult = yield* applyMutation<T>(currentDocument, mutation)
        
        if (!mutationResult.success) {
          yield* errorHandler.handleCompilationError(
            ErrorFactory.compilationError(`Document mutation failed`, {
              context: { mutation, path: mutation.path },
              typeName: 'DocumentMutation',
              decorator: 'mutateDocument'
            })
          )
          throw new Error("Document mutation operation failed")
        }
        
        // Create mutation record
        const documentMutation: DocumentMutation<T> = {
          id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: mutation.type,
          path: mutation.path,
          oldValue: mutationResult.oldValue,
          newValue: mutation.value,
          timestamp: Date.now(),
          description: `Mutation at ${mutation.path.join('.')}`
        }
        
        // Create new version
        const newVersion: DocumentVersion = {
          id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          version: currentState.currentVersion + 1,
          timestamp: Date.now(),
          document: mutationResult.document,
          mutations: [...currentState.currentMutations, documentMutation],
          description: 'Document mutation'
        }
        
        // Update global state
        globalThis.__ASYNCAPI_DOCUMENT_STATE = {
          currentDocument: mutationResult.document,
          currentVersion: newVersion.version,
          currentMutations: newVersion.mutations,
          versionHistory: [...currentState.versionHistory, newVersion],
          mutationHistory: [...currentState.mutationHistory, documentMutation]
        }
        
        // Validate new document
        const isValid = yield* ImmutableDocumentManager.validateDocument(mutationResult.document)
        if (!isValid) {
          // Rollback on validation failure
          yield* ImmutableDocumentManager.rollbackToVersion(currentState.versionHistory[0]?.id ?? 'initial')
          throw new Error("Document validation failed, rolled back to previous version")
        }
        
        yield* metrics.endTiming('document-mutation')
        yield* metrics.recordMetrics({
          timestamp: Date.now(),
          operation: 'document-mutation',
          duration: 0, // Will be calculated by endTiming
          memoryUsage: getMemoryUsageFromPerformance(),
          cacheHits: 0,
          cacheMisses: 0,
          documentsProcessed: 1
        })
        
        return mutationResult.document
      } catch (error) {
        yield* errorHandler.handleCompilationError(
          ErrorFactory.compilationError('Document mutation failed', {
            context: { mutation, error: String(error) },
            typeName: 'DocumentMutation',
            decorator: 'mutateDocument'
          })
        )
        throw error
      }
    }),
  
  mutateDocumentAtomic: <T>(mutations: DocumentUpdate<T>[]) =>
    Effect.gen(function* () {
      const metrics = yield* MetricsCollector
      const errorHandler = yield* ErrorHandler
      
      yield* metrics.startTiming('atomic-document-mutation')
      
      const currentState = globalThis.__ASYNCAPI_DOCUMENT_STATE
      if (!currentState) {
        throw new Error("Document state not initialized")
      }
      
      // Apply mutations sequentially to ensure atomicity
      let currentDocument = currentState.currentDocument
      const appliedMutations: DocumentMutation[] = []
      
      for (const mutation of mutations) {
        const mutationResult = yield* applyMutation<T>(currentDocument, mutation)
        
        if (!mutationResult.success) {
          // Rollback all mutations on failure
          yield* errorHandler.handleCompilationError(
            ErrorFactory.compilationError(`Atomic mutation failed at step ${appliedMutations.length + 1}`, {
              context: { failedMutation: mutation, appliedMutations },
              typeName: 'DocumentMutation',
              decorator: 'mutateDocumentAtomic'
            })
          )
          throw new Error(`Atomic mutation failed: operation unsuccessful`)
        }
        
        const documentMutation: DocumentMutation<T> = {
          id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: mutation.type,
          path: mutation.path,
          oldValue: mutationResult.oldValue,
          newValue: mutation.value,
          timestamp: Date.now(),
          description: `Atomic mutation at ${mutation.path.join('.')}`
        }
        
        appliedMutations.push(documentMutation)
        currentDocument = mutationResult.document
      }
      
      // Create single atomic version
      const newVersion: DocumentVersion = {
        id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: currentState.currentVersion + 1,
        timestamp: Date.now(),
        document: currentDocument,
        mutations: [...currentState.currentMutations, ...appliedMutations],
        description: `Atomic document mutation with ${mutations.length} changes`
      }
      
      // Update global state
      globalThis.__ASYNCAPI_DOCUMENT_STATE = {
        currentDocument,
        currentVersion: newVersion.version,
        currentMutations: newVersion.mutations,
        versionHistory: [...currentState.versionHistory, newVersion],
        mutationHistory: [...currentState.mutationHistory, ...appliedMutations]
      }
      
      yield* metrics.endTiming('atomic-document-mutation')
      return currentDocument
    }),
  
  rollbackToVersion: (versionId: string) =>
    Effect.gen(function* () {
      const currentState = globalThis.__ASYNCAPI_DOCUMENT_STATE
      if (!currentState) {
        throw new Error("Document state not initialized")
      }
      
      const targetVersion = currentState.versionHistory.find(v => v.id === versionId)
      if (!targetVersion) {
        throw new Error(`Version ${versionId} not found`)
      }
      
      // Update state to target version
      globalThis.__ASYNCAPI_DOCUMENT_STATE = {
        currentDocument: targetVersion.document,
        currentVersion: targetVersion.version,
        currentMutations: targetVersion.mutations,
        versionHistory: currentState.versionHistory.slice(
          0, 
          currentState.versionHistory.findIndex(v => v.id === versionId) + 1
        ),
        mutationHistory: currentState.mutationHistory.slice(
          0, 
          currentState.mutationHistory.findIndex(m => targetVersion.mutations.some(tm => tm.id === m.id)) + 1
        )
      }
      
      yield* Effect.logInfo(`🔄 Rolled back to version ${targetVersion.version} (${versionId})`)
      return targetVersion.document
    }),
  
  getMutationHistory: () =>
    Effect.sync(() => {
      const currentState = globalThis.__ASYNCAPI_DOCUMENT_STATE
      return currentState?.mutationHistory ?? []
    }),
  
  getVersionHistory: () =>
    Effect.sync(() => {
      const currentState = globalThis.__ASYNCAPI_DOCUMENT_STATE
      return currentState?.versionHistory ?? []
    }),
  
  validateDocument: (document: AsyncAPIObject) =>
    Effect.sync(() => {
      // Basic AsyncAPI document validation
      if (!document || typeof document !== 'object') {
        return false
      }
      
      if (!('asyncapi' in document)) {
        return false
      }
      
      if (!('info' in document)) {
        return false
      }
      
      // Type-safe validation of document info
      const info = document.info as unknown as Record<string, unknown>
      if (!(typeof info === 'object' && info !== null && 'title' in info && 'version' in info)) {
        return false
      }
      
      // Type-safe property access
      const title = (info).title
      const version = (info).version
      
      if (!title || !version) {
      }
      
      // Additional validation rules could be added here
      return true
    }),
  
  
}

/**
 * Document manager layer for dependency injection
 */
export const DocumentManagerLive = Layer.succeed(DocumentManager, ImmutableDocumentManager)

/**
 * Global type declarations for document state
 */
export type DocumentState = {
  readonly currentDocument: AsyncAPIObject
  readonly currentVersion: number
  readonly currentMutations: DocumentMutation[]
  readonly versionHistory: DocumentVersion[]
  readonly mutationHistory: DocumentMutation[]
}

declare global {
  var __ASYNCAPI_DOCUMENT_STATE: DocumentState | undefined
}

/**
 * Document manager utilities
 */
export const DocumentUtils = {
  /**
   * Initialize document manager with initial document
   */
  initialize: (document: AsyncAPIObject) =>
    Effect.sync(() => {
      const initialVersion: DocumentVersion = {
        id: 'initial',
        version: 1,
        timestamp: Date.now(),
        document,
        mutations: [],
        description: 'Initial document'
      }
      
      globalThis.__ASYNCAPI_DOCUMENT_STATE = {
        currentDocument: document,
        currentVersion: 1,
        currentMutations: [],
        versionHistory: [initialVersion],
        mutationHistory: []
      }
    }),
  
  /**
   * Get document health metrics
   */
  getHealthMetrics: () =>
    Effect.gen(function* () {
      const currentState = globalThis.__ASYNCAPI_DOCUMENT_STATE
      if (!currentState) {
        throw new Error("Document state not initialized")
      }
      
      const errorHandler = yield* ErrorHandler
      const errorSummary = yield* errorHandler.getErrorSummary()
      
      return {
        version: currentState.currentVersion,
        totalMutations: currentState.mutationHistory.length,
        versionsHistory: currentState.versionHistory.length,
        documentSize: JSON.stringify(currentState.currentDocument).length,
        errors: errorSummary.totalErrors,
        lastMutationTime: currentState.mutationHistory[currentState.mutationHistory.length - 1]?.timestamp ?? 0
      }
    })
}
