/**
 * Strong Types for System State Management
 * 
 * This file defines the type-safe foundation for all system states,
 * ensuring UNREPRESENTABLE states are enforced by the TypeScript compiler.
 * No boolean flags, no split brains, no inconsistent state representations.
 * 
 * @author TypeSpec AsyncAPI Emitter Team
 * @since v1.1.0
 */

// import { z } from "@effect/schema" // TODO: Use when needed

/**
 * System State Enumeration
 * Single source of truth for all system states
 */
export enum SystemState {
  INITIALIZING = "INITIALIZING",
  READY = "READY",
  COMPILING = "COMPILING",
  EMITTING = "EMITTING",
  VALIDATING = "VALIDATING",
  ERROR = "ERROR",
  TERMINATED = "TERMINATED"
}

/**
 * State Transition Rules
 * Enforces which transitions are allowed
 */
export const STATE_TRANSITIONS: Record<SystemState, readonly SystemState[]> = {
  [SystemState.INITIALIZING]: [SystemState.READY, SystemState.ERROR, SystemState.TERMINATED],
  [SystemState.READY]: [SystemState.COMPILING, SystemState.ERROR, SystemState.TERMINATED],
  [SystemState.COMPILING]: [SystemState.EMITTING, SystemState.ERROR],
  [SystemState.EMITTING]: [SystemState.VALIDATING, SystemState.ERROR],
  [SystemState.VALIDATING]: [SystemState.READY, SystemState.ERROR, SystemState.TERMINATED],
  [SystemState.ERROR]: [SystemState.READY, SystemState.TERMINATED],
  [SystemState.TERMINATED]: [] // Terminal state
} as const

/**
 * Type-safe State Transition Validation
 * Ensures transitions are valid at compile time
 */
export function isValidTransition(from: SystemState, to: SystemState): boolean {
  return STATE_TRANSITIONS[from].includes(to)
}

/**
 * Strong-typed State Machine Configuration
 */
export type StateMachineConfig = {
  readonly initialState: SystemState
  readonly allowedTransitions: typeof StateTransitions
  readonly onStateChange?: (from: SystemState, to: SystemState) => void
}

/**
 * Strong-typed State Context
 * Contains all state-related data with strong typing
 */
export type StateContext = {
  readonly state: SystemState
  readonly timestamp: Date
  readonly previousState?: SystemState
  readonly error?: Error
  readonly metadata?: Readonly<Record<string, unknown>>
}

/**
 * Type-safe State Manager Interface
 */
export type StateManager = {
  readonly getCurrentState: () => StateContext
  readonly transitionTo: (targetState: SystemState, metadata?: Record<string, unknown>) => void
  readonly isTerminalState: (state: SystemState) => boolean
}

/**
 * Schema for validating State Context
 * TODO: Implement with @effect/schema
 */
export const STATE_CONTEXT_SCHEMA = {
  state: "SystemState",
  timestamp: "Date", 
  previousState: "SystemState?",
  error: "Error?",
  metadata: "Record<string, unknown>?"
} as const

/**
 * Type-safe State Event System
 */
export type StateEvent = 
  | { readonly type: "STATE_TRANSITION", from: SystemState, to: SystemState, timestamp: Date }
  | { readonly type: "STATE_ERROR", error: Error, timestamp: Date }
  | { readonly type: "STATE_RESET", initialState: SystemState, timestamp: Date }

/**
 * Strong-typed Event Bus Interface
 */
export type StateEventBus = {
  readonly emit: (event: StateEvent) => void
  readonly on: (eventType: string, handler: (event: StateEvent) => void) => void
  readonly off: (eventType: string, handler: (event: StateEvent) => void) => void
}

/**
 * Type-safe State Persistence Interface
 */
export type StatePersistence = {
  readonly save: (context: StateContext) => Promise<void>
  readonly load: () => Promise<StateContext | null>
  readonly clear: () => Promise<void>
}

/**
 * Type-safe Configuration Interface
 */
export type StateConfiguration = {
  readonly enablePersistence: boolean
  readonly enableEventBus: boolean
  readonly enableMetrics: boolean
  readonly enableStateHistory: boolean
  readonly maxStateHistory: number
}

/**
 * Type-safe State Metrics Interface
 */
export type StateMetrics = {
  readonly totalTransitions: number
  readonly transitionCounts: Partial<Record<SystemState, number>>
  readonly averageStateTime: Partial<Record<SystemState, number>>
  readonly errorCounts: number
  readonly lastTransitionTime: Date | null
}

/**
 * State Validation Result Interface
 */
export type StateValidationResult = {
  readonly isValid: boolean
  readonly errors: string[]
  readonly warnings: string[]
  readonly suggestions: string[]
}

/**
 * Type-safe State History Interface
 */
export type StateHistory = {
  readonly entries: readonly StateContext[]
  readonly totalCount: number
  readonly maxEntries: number
  readonly getCurrentContext: () => StateContext | null
  readonly addEntry: (context: StateContext) => void
  readonly clear: () => void
}

/**
 * Type-safe State Configuration Interface
 */
export type StateSystemConfig = {
  readonly stateMachine: StateMachineConfig
  readonly eventBus: StateEventBus
  readonly persistence: StatePersistence
  readonly configuration: StateConfiguration
  readonly metrics: StateMetrics
  readonly history: StateHistory
}

/**
 * Type-safe State Change Result Interface
 */
export type StateChangeResult = {
  readonly success: boolean
  readonly previousState: StateContext
  readonly newState: StateContext
  readonly event: StateEvent
  readonly duration: number
}

/**
 * Type-safe State Listener Interface
 */
export type StateListener = {
  readonly id: string
  readonly type: readonly string[]
  readonly handler: (event: StateEvent) => void
  readonly active: boolean
}

/**
 * Type-safe State Recovery Interface
 */
export type StateRecovery = {
  readonly canRecover: (from: SystemState) => boolean
  readonly recover: (from: SystemState, error: Error) => Promise<StateContext>
  readonly maxRetries: number
  readonly retryDelay: number
}

/**
 * Type-safe State Initialization Interface
 */
export type StateInitialization = {
  readonly initialize: () => Promise<StateContext>
  readonly validate: (context: StateContext) => StateValidationResult
  readonly onInitialized: (context: StateContext) => void
}

/**
 * State Transition Rule Interface
 * Enforces which transitions are allowed with validation logic
 */
export type StateTransitionRule = {
  readonly from: SystemState
  readonly to: readonly SystemState[]
  readonly condition: (context: StateContext) => boolean
  readonly validator: (context: StateContext, targetState: SystemState) => boolean
  readonly action: (context: StateContext, targetState: SystemState) => Record<string, unknown>
  readonly recovery: (context: StateContext) => SystemState
}

/**
 * Type-safe State Termination Interface
 */
export type StateTermination = {
  readonly canTerminate: (state: SystemState) => boolean
  readonly terminate: (state: SystemState) => Promise<void>
  readonly onTerminated: (finalState: StateContext) => void
}