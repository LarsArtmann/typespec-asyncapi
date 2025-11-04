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
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import type { DocumentUpdate, ServiceMetrics } from "../models/ServiceInterfaces.js"
import { MetricsCollector } from "../../infrastructure/performance/MetricsCollector.js"
import { ErrorHandler, ErrorFactory } from "../../infrastructure/errors/CentralizedErrorHandler.js"

/**
 * Document mutation operation interface
 */
export interface DocumentMutation<T = unknown> {
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
export interface DocumentVersion {
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
export interface DocumentManager {
  readonly getDocument: () => Effect.Effect<AsyncAPIObject, never>
  readonly getCurrentVersion: () => Effect.Effect<number, never>
  readonly mutateDocument: <T>(mutation: DocumentUpdate<T>) => Effect.Effect<AsyncAPIObject, Error>
  readonly mutateDocumentAtomic: <T>(mutations: DocumentUpdate<T>[]) => Effect.Effect<AsyncAPIObject, Error>
  readonly rollbackToVersion: (versionId: string) => Effect.Effect<AsyncAPIObject, Error>
  readonly getMutationHistory: () => Effect.Effect<DocumentMutation[], never>
  readonly getVersionHistory: () => Effect.Effect<DocumentVersion[], never>
  readonly validateDocument: (document: AsyncAPIObject) => Effect.Effect<boolean, never>
}

/**
 * Document manager tag for dependency injection
 */
export const DocumentManager = Context.Tag<DocumentManager>()

/**
 * Immutable document manager implementation
 */
export const ImmutableDocumentManager: DocumentManager = {
  getDocument: () =>
    Effect.sync(() => {
      const currentState = globalThis.__ASYNCAPI_DOCUMENT_STATE
      if (!currentState) {
        throw new Error("Document state not initialized")
      }
      return currentState.currentDocument
    }),
  
  getCurrentVersion: () =>
    Effect.sync(() => {
      const currentState = globalThis.__ASYNCAPI_DOCUMENT_STATE
      if (!currentState) {
        throw new Error("Document state not initialized")
      }
      return currentState.currentVersion
    }),
  
  mutateDocument: <T>(mutation: DocumentUpdate<T>) =>
    Effect.gen(function* () {
      yield* MetricsCollector.startTiming('document-mutation')
      
      try {
        const currentState = globalThis.__ASYNCAPI_DOCUMENT_STATE
        if (!currentState) {
          throw new Error("Document state not initialized")
        }
        
        // Create deep copy of current document
        const currentDocument = JSON.parse(JSON.stringify(currentState.currentDocument))
        
        // Apply mutation immutably
        const mutationResult = yield* ImmutableDocumentManager.applyMutation<T>(
          currentDocument, 
          mutation
        )
        
        if (!mutationResult.success) {
          yield* ErrorHandler.handleCompilationError(
            ErrorFactory.compilationError(`Document mutation failed: ${mutationResult.error}`, {
              context: { mutation, path: mutation.path }
            })
          )
          throw new Error(mutationResult.error)
        }
        
        // Create mutation record
        const documentMutation: DocumentMutation<T> = {
          id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: mutation.type,
          path: mutation.path,
          oldValue: mutationResult.oldValue,
          newValue: mutation.value,
          timestamp: Date.now(),
          description: mutation.metadata?.description ?? `Mutation at ${mutation.path.join('.')}`
        }
        
        // Create new version
        const newVersion: DocumentVersion = {
          id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          version: currentState.currentVersion + 1,
          timestamp: Date.now(),
          document: mutationResult.newDocument,
          mutations: [...currentState.currentMutations, documentMutation],
          description: mutation.metadata?.description ?? 'Document mutation'
        }
        
        // Update global state
        globalThis.__ASYNCAPI_DOCUMENT_STATE = {
          currentDocument: mutationResult.newDocument,
          currentVersion: newVersion.version,
          currentMutations: newVersion.mutations,
          versionHistory: [...currentState.versionHistory, newVersion],
          mutationHistory: [...currentState.mutationHistory, documentMutation]
        }
        
        // Validate new document
        const isValid = yield* ImmutableDocumentManager.validateDocument(mutationResult.newDocument)
        if (!isValid) {
          // Rollback on validation failure
          yield* ImmutableDocumentManager.rollbackToVersion(currentState.versionHistory[0]?.id ?? 'initial')
          throw new Error("Document validation failed, rolled back to previous version")
        }
        
        yield* MetricsCollector.endTiming('document-mutation')
        yield* MetricsCollector.recordMetrics({
          timestamp: Date.now(),
          operation: 'document-mutation',
          duration: 0, // Will be calculated by endTiming
          memoryUsage: performance.memory?.usedJSHeapSize ?? 0,
          cacheHits: 0,
          cacheMisses: 0,
          documentsProcessed: 1
        })
        
        return mutationResult.newDocument
      } catch (error) {
        yield* ErrorHandler.handleCompilationError(
          ErrorFactory.compilationError('Document mutation failed', {
            context: { mutation, error: String(error) }
          })
        )
        throw error
      }
    }),
  
  mutateDocumentAtomic: <T>(mutations: DocumentUpdate<T>[]) =>
    Effect.gen(function* () {
      yield* MetricsCollector.startTiming('atomic-document-mutation')
      
      const currentState = globalThis.__ASYNCAPI_DOCUMENT_STATE
      if (!currentState) {
        throw new Error("Document state not initialized")
      }
      
      // Apply mutations sequentially to ensure atomicity
      let currentDocument = currentState.currentDocument
      const appliedMutations: DocumentMutation[] = []
      
      for (const mutation of mutations) {
        const mutationResult = yield* ImmutableDocumentManager.applyMutation<T>(
          currentDocument,
          mutation
        )
        
        if (!mutationResult.success) {
          // Rollback all mutations on failure
          yield* ErrorHandler.handleCompilationError(
            ErrorFactory.compilationError(`Atomic mutation failed at step ${appliedMutations.length + 1}`, {
              context: { failedMutation: mutation, appliedMutations }
            })
          )
          throw new Error(`Atomic mutation failed: ${mutationResult.error}`)
        }
        
        const documentMutation: DocumentMutation<T> = {
          id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: mutation.type,
          path: mutation.path,
          oldValue: mutationResult.oldValue,
          newValue: mutation.value,
          timestamp: Date.now(),
          description: mutation.metadata?.description ?? `Atomic mutation at ${mutation.path.join('.')}`
        }
        
        appliedMutations.push(documentMutation)
        currentDocument = mutationResult.newDocument
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
      
      yield* MetricsCollector.endTiming('atomic-document-mutation')
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
      
      const info = document.info as any
      if (!info.title || !info.version) {
        return false
      }
      
      // Additional validation rules could be added here
      return true
    }),
  
  /**
   * Helper: Apply mutation to document immutably
   */
  applyMutation: <T>(document: AsyncAPIObject, mutation: DocumentUpdate<T>) =>
    Effect.sync(() => {
      try {
        const documentCopy = JSON.parse(JSON.stringify(document))
        let current: any = documentCopy
        let oldValue: T | undefined
        
        // Navigate to mutation path
        for (let i = 0; i < mutation.path.length - 1; i++) {
          const key = mutation.path[i]
          if (!(key in current)) {
            current[key] = {}
          }
          current = current[key]
        }
        
        const finalKey = mutation.path[mutation.path.length - 1]
        oldValue = current[finalKey]
        current[finalKey] = mutation.value
        
        return {
          success: true as const,
          newDocument: documentCopy as AsyncAPIObject,
          oldValue
        }
      } catch (error) {
        return {
          success: false as const,
          error: String(error),
          newDocument: document,
          oldValue: undefined
        }
      }
    })
}

/**
 * Document manager layer for dependency injection
 */
export const DocumentManagerLive = Layer.succeed(
  DocumentManager,
  ImmutableDocumentManager
)

/**
 * Global type declarations for document state
 */
export interface DocumentState {
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
      
      const errorSummary = yield* ErrorHandler.getErrorHandler().getErrorSummary()
      
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
