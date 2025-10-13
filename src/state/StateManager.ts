/**
 * State Manager - Type-Safe Immutable State Management
 * 
 * Provides immutable state transitions with strong typing and compile-time guarantees.
 * No mutable state, no split brains, no inconsistent representations.
 * All state changes are tracked and validated.
 * 
 * @author TypeSpec AsyncAPI Emitter Team
 * @since v1.1.0
 */

import { Effect } from "effect"
import { SystemState, StateContext, StateTransition, isValidTransition, StateEvent, StateMachineConfig } from "../types/state.js"

/**
 * Immutable State Manager Implementation
 * 
 * Provides type-safe state management with the following guarantees:
 * - Immutable state: All state changes create new state contexts
 * - Strong typing: All state transitions are validated at compile time
 * - Single source of truth: No split brains or boolean flags
 * - Event-driven: All state changes emit typed events
 * - Recoverable: Supports recovery from error states
 */
export class StateManager {
  private readonly config: StateMachineConfig
  private currentState: StateContext
  private readonly eventHandlers: Map<string, Array<(event: StateEvent) => void>> = new Map()
  private readonly stateHistory: StateContext[] = []
  private readonly maxHistory: number = 100

  constructor(config: StateMachineConfig) {
    this.config = config
    this.currentState = {
      state: config.initialState,
      timestamp: new Date(),
      metadata: { source: "StateManager", version: "v1.1.0" }
    }
  }

  /**
   * Get current state context (immutable)
   */
  getCurrentState(): StateContext {
    return this.currentState
  }

  /**
   * Check if state is terminal (no valid transitions)
   */
  isTerminalState(state: SystemState): boolean {
    return this.config.allowedTransitions[state].length === 0
  }

  /**
   * Transition to a new state with strong type safety
   */
  transitionTo(
    targetState: SystemState,
    metadata?: Record<string, unknown>
  ): Effect.Effect<StateChangeResult, Error> {
    return Effect.gen(function* () {
      const fromState = this.currentState.state
      const timestamp = new Date()

      // Validate transition is allowed
      if (!isValidTransition(fromState, targetState)) {
        const error = new Error(`Invalid transition from ${fromState} to ${targetState}`)
        yield* Effect.log(`❌ Invalid state transition: ${error.message}`)
        throw error
      }

      // Create immutable new state context
      const newContext: StateContext = {
        state: targetState,
        timestamp,
        previousState: fromState,
        metadata: metadata ? { ...this.currentState.metadata, ...metadata } : this.currentState.metadata
      }

      // Emit state transition event
      const transitionEvent: StateEvent = {
        type: "STATE_TRANSITION",
        from: fromState,
        to: targetState,
        timestamp
      }

      // Calculate duration
      const duration = timestamp.getTime() - this.currentState.timestamp.getTime()

      // Update current state immutably
      const previousState = this.currentState
      this.currentState = newContext

      // Add to history
      this.addToHistory(newContext)

      // Emit event to listeners
      yield* Effect.log(`✅ State transition: ${fromState} → ${targetState}`)
      yield* this.emitEvent(transitionEvent)

      // Call onStateChange callback if provided
      if (this.config.onStateChange) {
        this.config.onStateChange(fromState, targetState)
      }

      return {
        success: true,
        previousState,
        newState: newContext,
        event: transitionEvent,
        duration
      }
    })
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: StateEvent): Effect.Effect<void, never> {
    return Effect.gen(function* () {
      const eventType = event.type
      const handlers = this.eventHandlers.get(eventType) || []

      yield* Effect.log(`🔔 Emitting ${eventType} event to ${handlers.length} listeners`)

      for (const handler of handlers) {
        try {
          handler(event)
        } catch (error) {
          yield* Effect.log(`❌ Error in state event handler: ${error}`)
          // Continue processing other handlers
        }
      }
    })
  }

  /**
   * Add state change to history
   */
  private addToHistory(context: StateContext): void {
    this.stateHistory.push(context)
    
    // Maintain maximum history size
    if (this.stateHistory.length > this.maxHistory) {
      this.stateHistory.shift()
    }
  }

  /**
   * Get state history (immutable)
   */
  getHistory(): readonly StateContext[] {
    return [...this.stateHistory]
  }

  /**
   * Register event listener with type safety
   */
  on(eventType: string, handler: (event: StateEvent) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }

    const handlers = this.eventHandlers.get(eventType)!
    handlers.push(handler)

    // Return cleanup function
    return () => {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Remove event listener
   */
  off(eventType: string, handler: (event: StateEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (immutableData !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Get all state metrics
   */
  getMetrics() {
    const transitionCounts = this.stateHistory.reduce((counts, context) => {
      counts[context.state] = (counts[context.state] || 0) + 1
      return counts
    }, {} as Record<SystemState, number>)

    const stateTimes = this.stateHistory.reduce((times, context) => {
      if (!times[context.state]) {
        times[context.state] = []
      }
      times[context.state].push(context.timestamp.getTime() - context.timestamp.getTime())
      return times
    }, {} as Record<SystemState, number[]>)

    const averageStateTime: Record<SystemState, number> = {}
    for (const [state, times] of Object.entries(stateTimes)) {
      const sum = times.reduce((total, time) => total + time, 0)
      averageStateTime[state] = times.length > 0 ? sum / times.length : 0
    }

    const errorCount = this.stateHistory.filter(ctx => ctx.error).length

    return {
      totalTransitions: this.stateHistory.length,
      transitionCounts,
      averageStateTime,
      errorCounts: errorCount,
      lastTransitionTime: this.stateHistory.length > 0 ? this.stateHistory[this.stateHistory.length - 1].timestamp : null
    }
  }

  /**
   * Check if system is ready for operations
   */
  isReady(): boolean {
    return this.currentState.state === SystemState.READY
  }

  /**
   * Check if system has errors
   */
  hasError(): boolean {
    return this.currentState.state === SystemState.ERROR
  }

  /**
   * Get current state type
   */
  getStateType(): SystemState {
    return this.currentState.state
  }

  /**
   * Get previous state type
   */
  getPreviousStateType(): SystemState | undefined {
    return this.currentState.previousState
  }

  /**
   * Get current metadata
   */
  getMetadata(): Readonly<Record<string, unknown>> {
    return this.currentState.metadata || {}
  }

  /**
   * Get current error if in error state
   */
  getError(): Error | undefined {
    return this.currentState.error
  }

  /**
   * Get state age in milliseconds
   */
  getStateAge(): number {
    return Date.now() - this.currentState.timestamp.getTime()
  }

  /**
   * Get transition count for a specific state
   */
  getTransitionCount(state: SystemState): number {
    return this.stateHistory.filter(ctx => ctx.state === state).length
  }

  /**
   * Get total state transitions
   */
  getTotalTransitions(): number {
    return this.stateHistory.length
  }
}

/**
 * Type-safe State Factory
 */
export class StateFactory {
  /**
   * Create State Manager with default configuration
   */
  static create(config: Partial<StateMachineConfig> = {}): StateManager {
    const defaultConfig: StateMachineConfig = {
      initialState: SystemState.READY,
      allowedTransitions: {
        [SystemState.INITIALIZING]: [SystemState.READY, SystemState.ERROR, SystemState.TERMINATED],
        [SystemState.READY]: [SystemState.COMPILING, SystemState.ERROR, SystemState.TERMINATED],
        [SystemState.COMPILING]: [SystemState.EMITTING, SystemState.ERROR],
        [SystemState.EMITTING]: [SystemState.VALIDATING, SystemState.ERROR],
        [SystemState.VALIDATING]: [SystemState.READY, SystemState.ERROR, SystemState.TERMINATED],
        [SystemState.ERROR]: [SystemState.READY, SystemState.TERMINATED],
        [SystemState.TERMINATED]: []
      } as const,
      ...config
    }

    return new StateManager(defaultConfig)
  }

  /**
   * Create State Manager with custom configuration
   */
  static createWithConfiguration(config: StateMachineConfig): StateManager {
    return new StateManager(config)
  }

  /**
   * Create State Manager for testing
   */
  static createForTesting(): StateManager {
    return StateFactory.create({
      initialState: SystemState.READY,
      allowedTransitions: StateTransition,
      onStateChange: (from, to) => {
        console.log(`[TEST] State transition: ${from} → ${to}`)
      }
    })
  }

  /**
   * Create State Manager for development
   */
  static createForDevelopment(): StateManager {
    return StateFactory.create({
      initialState: SystemState.INITIALIZING,
      allowedTransitions: StateTransition,
      onStateChange: (from, to) => {
        console.log(`[DEV] State transition: ${from} → ${to}`)
      }
    })
  }

  /**
   * Create State Manager for production
   */
  static createForProduction(): StateManager {
    return StateFactory.create({
      initialState: SystemState.READY,
      allowedTransitions: StateTransition,
      onStateChange: (from, to) => {
        console.log(`[PROD] State transition: ${from} → ${to}`)
      }
    })
  }

  /**
   * Create State Manager with monitoring
   */
  static createWithMonitoring(): StateManager {
    return StateFactory.create({
      initialState: SystemState.READY,
      allowedTransitions: StateTransition,
      onStateChange: (from, to) => {
        console.log(`[MONITOR] State transition: ${from} → ${to}`)
      }
    })
  }
}

/**
 * Type-safe State Change Validator
 */
export class StateValidator {
  /**
   * Validate state transition rules
   */
  static validateTransition(from: SystemState, to: SystemState): boolean {
    return isValidTransition(from, to)
  }

  /**
   * Validate state context integrity
   */
  static validateContext(context: StateContext): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate state is valid
    if (!Object.values(SystemState).includes(context.state)) {
      errors.push(`Invalid state: ${context.state}`)
    }

    // Validate timestamp
    if (!(context.timestamp instanceof Date) || isNaN(context.timestamp.getTime())) {
      errors.push(`Invalid timestamp: ${context.timestamp}`)
    }

    // Validate metadata type
    if (context.metadata && typeof context.metadata !== 'object') {
      errors.push(`Invalid metadata: expected object, got ${typeof context.metadata}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate complete state machine configuration
   */
  static validateConfiguration(config: StateMachineConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate initial state
    if (!Object.values(SystemState).includes(config.initialState)) {
      errors.push(`Invalid initial state: ${config.initialState}`)
    }

    // Validate transition rules
    for (const [state, transitions] of Object.entries(config.allowedTransitions)) {
      if (!Object.values(SystemState).includes(state as SystemState)) {
        errors.push(`Invalid state in transitions: ${state}`)
        continue
      }

      for (const transition of transitions) {
        if (!Object.values(SystemState).includes(transition)) {
          errors.push(`Invalid transition target: ${transition} from state: ${state}`)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * Type-safe State Event Utilities
 */
export class StateEventUtils {
  /**
   * Create state transition event
   */
  static createTransitionEvent(from: SystemState, to: SystemState): StateEvent {
    return {
      type: "STATE_TRANSITION",
      from,
      to,
      timestamp: new Date()
    }
  }

  /**
   * Create error event
   */
  static createErrorEvent(error: Error): StateEvent {
    return {
      type: "STATE_ERROR",
      error,
      timestamp: new Date()
    }
  }

  /**
   * Create reset event
   */
  static createResetEvent(initialState: SystemState): StateEvent {
    return {
      type: "STATE_RESET",
      initialState,
      timestamp: new Date()
    }
  }
}

/**
 * Type-safe State History Manager
 */
export class StateHistoryManager {
  private readonly history: StateContext[] = []
  private readonly maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  /**
   * Add context to history
   */
  add(context: StateContext): void {
    this.history.push(context)
    
    // Maintain size limit
    if (this.history.length > this.maxSize) {
      this.history.shift()
    }
  }

  /**
   * Get all history (immutable)
   */
  getAll(): readonly StateContext[] {
    return [...this.history]
  }

  /**
   * Get recent history
   */
  getRecent(count: number): readonly StateContext[] {
    return this.history.slice(-count)
  }
  
  /**
   * Get history by state
   */
  getByState(state: SystemState): readonly StateContext[] {
    return this.history.filter(context => context.state === state)
  }

  /**
   * Get history by time range
   */
  getByTimeRange(startDate: Date, endDate: Date): readonly StateContext[] {
    return this.history.filter(
      context => context.timestamp >= startDate && context.timestamp <= endDate
    )
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history.splice(0)
  }

  /**
   * Get history size
   */
  size(): number {
    return this.history.length
  }
}