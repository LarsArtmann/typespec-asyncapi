/**
 * Type-Safe State Transition System
 * 
 * Provides compile-time guaranteed state transition rules with no runtime ambiguity.
 * No split brains, no boolean flags, no inconsistent state representations.
 * All transitions are validated and tracked with strong typing.
 * 
 * @author TypeSpec AsyncAPI Emitter Team
 * @since v1.1.0
 */

import { Effect } from "effect"
import { SystemState, StateContext, StateEvent, StateTransition, isValidTransition, StateTransitionRule } from "../types/state.js"

/**
 * Type-safe State Transition Rules
 * Compile-time validation for all state transitions
 */
export const StateTransitionRules: Record<SystemState, readonly StateTransitionRule[]> = {
  [SystemState.INITIALIZING]: [
    {
      from: SystemState.INITIALIZING,
      to: [SystemState.READY, SystemState.ERROR, SystemState.TERMINATED],
      condition: (context) => true, // Always allowed
      validator: (context, targetState) => true, // Always valid
      action: (context, targetState) => ({ /* No special action needed */ }),
      recovery: (context) => SystemState.READY // Recovery target
    }
  ],
  [SystemState.READY]: [
    {
      from: SystemState.READY,
      to: [SystemState.COMPILING, SystemState.ERROR, SystemState.TERMINATED],
      condition: (context) => true, // Always allowed from ready state
      validator: (context, targetState) => true, // Always valid
      action: (context, targetState) => ({ /* No special action needed */ }),
      recovery: (context) => SystemState.READY // Recovery target
    }
  ],
  [SystemState.COMPILING]: [
    {
      from: SystemState.COMPILING,
      to: [SystemState.EMITTING, SystemState.ERROR],
      condition: (context) => {
        // Can only transition if no critical errors
        return !context.metadata?.hasCriticalErrors
      },
      validator: (context, targetState) => {
        // Validate compilation context is valid
        return context.metadata?.compilationSuccess === true
      },
      action: (context, targetState) => ({
        compilationMetadata: context.metadata?.compilationData,
        compilationDuration: context.metadata?.compilationDuration
      }),
      recovery: (context) => SystemState.READY // Recovery on compilation failure
    }
  ],
  [SystemState.EMITTING]: [
    {
      from: SystemState.EMITTING,
      to: [SystemState.VALIDATING, SystemState.ERROR],
      condition: (context) => {
        // Can only transition if emission didn't fail
        return !context.metadata?.hasCriticalErrors
      },
      validator: (context, targetState) => {
        // Validate emission context is valid
        return context.metadata?.emissionSuccess === true
      },
      action: (context, targetState) => ({
        emissionMetadata: context.metadata?.emissionData,
        emissionDuration: context.metadata?.emissionDuration
      }),
      recovery: (context) => SystemState.READY // Recovery on emission failure
    }
  ],
  [SystemState.VALIDATING]: [
    {
      from: SystemState.VALIDATING,
      to: [SystemState.READY, SystemState.ERROR, SystemState.TERMINATED],
      condition: (context) => true, // Always allowed from validating
      validator: (context, targetState) => {
        // Validate validation results
        return context.metadata?.validationSuccess === true
      },
      action: (context, targetState) => ({
        validationResults: context.metadata?.validationData,
        validationDuration: context.metadata?.validationDuration
      }),
      recovery: (context) => SystemState.READY // Recovery on validation failure
    }
  ],
  [SystemState.ERROR]: [
    {
      from: SystemState.ERROR,
      to: [SystemState.READY, SystemState.TERMINATED],
      condition: (context) => true, // Always allowed from error
      validator: (context, targetState) => true, // Always valid from error
      action: (context, targetState) => ({
        errorRecovery: context.metadata?.recoveryAttempts,
        errorType: context.metadata?.errorType,
        errorDetails: context.error?.message
      }),
      recovery: (context) => SystemState.READY // Recovery to ready state
    }
  ],
  [SystemState.TERMINATED]: [
    {
      from: SystemState.TERMINATED,
      to: [], // No transitions allowed from terminated state
      condition: (context) => false, // Never allowed
      validator: (context, targetState) => false, // Never valid
      action: (context, targetState) => ({ /* No action - terminal state */ }),
      recovery: (context) => SystemState.TERMINATED // No recovery needed
    }
  ]
} as const

/**
 * Type-safe State Transition Engine
 */
export class StateTransitionEngine {
  private readonly rules: Record<SystemState, readonly StateTransitionRule[]>

  constructor() {
    this.rules = StateTransitionRules
  }

  /**
   * Validate if transition is allowed
   */
  canTransition(from: SystemState, to: SystemState): boolean {
    const rules = this.rules[from]
    return rules ? rules.some(rule => rule.to.includes(to)) : false
  }

  /**
   * Get allowed transitions for a state
   */
  getAllowedTransitions(state: SystemState): readonly SystemState[] {
    const rules = this.rules[state]
    const allowed: SystemState[] = []
    
    if (rules) {
      for (const rule of rules) {
        allowed.push(...rule.to)
      }
    }
    
    // Remove duplicates
    return [...new Set(allowed)]
  }

  /**
   * Get transition rule for specific transition
   */
  getTransitionRule(from: SystemState, to: SystemState): StateTransitionRule | null {
    const rules = this.rules[from]
    return rules ? rules.find(rule => rule.to.includes(to)) : null
  }

  /**
   * Validate transition condition
   */
  validateCondition(context: StateContext, targetState: SystemState): boolean {
    const rule = this.getTransitionRule(context.state, targetState)
    return rule ? rule.condition(context) : false
  }

  /**
   * Validate transition validator
   */
  validateValidator(context: StateContext, targetState: SystemState): boolean {
    const rule = this.getTransitionRule(context.state, targetState)
    return rule ? rule.validator(context, targetState) : false
  }

  /**
   * Execute transition action
   */
  executeAction(context: StateContext, targetState: SystemState): Record<string, unknown> {
    const rule = this.getTransitionRule(context.state, targetState)
    return rule ? rule.action(context, targetState) : {}
  }

  /**
   * Get recovery target for error state
   */
  getRecoveryTarget(state: SystemState): SystemState {
    const rules = this.rules[state]
    return rules && rules.length > 0 ? rules[0].recovery(state) : state
  }

  /**
   * Check if state is terminal
   */
  isTerminalState(state: SystemState): boolean {
    const rules = this.rules[state]
    return rules ? rules.length === 0 : false
  }

  /**
   * Check if transition is immediate (no conditions)
   */
  isImmediateTransition(from: SystemState, to: SystemState): boolean {
    const rule = this.getTransitionRule(from, to)
    return rule ? rule.condition({} as StateContext, to) : false
  }

  /**
   * Check if transition requires validation
   */
  requiresValidation(from: SystemState, to: SystemState): boolean {
    const rule = this.getTransitionRule(from, to)
    return rule ? rule.validator({} as StateContext, to) : false
  }

  /**
   * Get all possible transitions from current state
   */
  getPossibleTransitions(state: SystemState): readonly SystemState[] {
    const rules = this.rules[state]
    const possible: SystemState[] = []
    
    if (rules) {
      for (const rule of rules) {
        if (rule.condition({} as StateContext, rule.to[0])) {
          possible.push(...rule.to)
        }
      }
    }
    
    return [...new Set(possible)]
  }

  /**
   * Validate transition with complete check
   */
  validateTransition(context: StateContext, targetState: SystemState): {
    isValid: boolean
    errors: string[]
    warnings: string[]
    rule?: StateTransitionRule
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if transition is allowed
    if (!this.canTransition(context.state, targetState)) {
      errors.push(`Transition not allowed: ${context.state} → ${targetState}`)
      return { isValid: false, errors, warnings }
    }

    // Get transition rule
    const rule = this.getTransitionRule(context.state, targetState)
    if (!rule) {
      errors.push(`No transition rule found: ${context.state} → ${targetState}`)
      return { isValid: false, errors, warnings }
    }

    // Validate condition
    if (!rule.condition(context)) {
      errors.push(`Transition condition failed: ${context.state} → ${targetState}`)
    }

    // Validate validator
    if (!rule.validator(context, targetState)) {
      errors.push(`Transition validation failed: ${context.state} → ${targetState}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      rule
    }
  }
}

/**
 * Type-safe State Transition Coordinator
 */
export class StateTransitionCoordinator {
  private readonly engine: StateTransitionEngine

  constructor() {
    this.engine = new StateTransitionEngine()
  }

  /**
   * Execute type-safe state transition with full validation
   */
  executeTransition(
    context: StateContext,
    targetState: SystemState
  ): Effect.Effect<StateTransitionResult, Error> {
    return Effect.gen(function* () {
      // Validate transition is allowed
      if (!StateTransition.isValidTransition(context.state, targetState)) {
        const error = new Error(`Invalid transition: ${context.state} → ${targetState}`)
        yield* Effect.log(`❌ Invalid state transition: ${error.message}`)
        throw error
      }

      // Get transition rule
      const rule = engine.getTransitionRule(context.state, targetState)
      if (!rule) {
        const error = new Error(`No transition rule: ${context.state} → ${targetState}`)
        yield* Effect.log(`❌ No transition rule: ${error.message}`)
        throw error
      }

      // Validate transition condition
      if (!rule.condition(context)) {
        const error = new Error(`Transition condition failed: ${context.state} → ${targetState}`)
        yield* Effect.log(`❌ Transition condition failed: ${error.message}`)
        throw error
      }

      // Validate transition validator
      if (!rule.validator(context, targetState)) {
        const error = new Error(`Transition validation failed: ${context.state} → ${targetState}`)
        yield* Effect.log(`❌ Transition validation failed: ${error.message}`)
        throw error
      }

      // Execute transition action
      const actionData = rule.action(context, targetState)

      // Create new state context
      const newContext: StateContext = {
        state: targetState,
        timestamp: new Date(),
        previousState: context.state,
        metadata: context.metadata ? { ...context.metadata, actionData } : actionData
      }

      // Create transition event
      const transitionEvent: StateEvent = {
        type: "STATE_TRANSITION",
        from: context.state,
        to: targetState,
        timestamp: newContext.timestamp
      }

      // Calculate duration
      const duration = newContext.timestamp.getTime() - context.timestamp.getTime()

      yield* Effect.log(`✅ State transition: ${context.state} → ${targetState} (${duration}ms)`)

      return {
        success: true,
        previousState: context,
        newState: newContext,
        event: transitionEvent,
        duration,
        actionData,
        rule
      }
    })
  }

  /**
   * Attempt recovery from error state
   */
  attemptRecovery(context: StateContext): Effect.Effect<StateTransitionResult, Error> {
    return Effect.gen(function* () {
      const recoveryTarget = engine.getRecoveryTarget(context.state)
      
      if (recoveryTarget === context.state) {
        const error = new Error(`No recovery target available for state: ${context.state}`)
        yield* Effect.log(`❌ No recovery available: ${error.message}`)
        throw error
      }

      yield* Effect.log(`🔄 Attempting recovery: ${context.state} → ${recoveryTarget}`)

      return yield* this.executeTransition(context, recoveryTarget)
    })
  }

  /**
   * Check if state is terminal
   */
  isTerminalState(state: SystemState): boolean {
    return engine.isTerminalState(state)
  }

  /**
   * Get all possible transitions from state
   */
  getPossibleTransitions(state: SystemState): readonly SystemState[] {
    return engine.getPossibleTransitions(state)
  }

  /**
   * Get transition metrics
   */
  getTransitionMetrics(history: readonly StateContext[]) {
    const transitionCounts = history.reduce((counts, context) => {
      const transition = `${context.state} → ${context.state}`
      counts[transition] = (counts[transition] || 0) + 1
      return counts
    }, {} as Record<string, number>)

    const stateDurations = history.reduce((durations, context) => {
      if (context.previousState) {
        const transition = `${context.previousState} → ${context.state}`
        const duration = context.timestamp.getTime() - context.timestamp.getTime()
        if (!durations[transition]) {
          durations[transition] = []
        }
        durations[transition].push(duration)
      }
      return durations
    }, {} as Record<string, number[]>)

    const averageDurations: Record<string, number> = {}
    for (const [transition, durations] of Object.entries(stateDurations)) {
      const sum = durations.reduce((total, duration) => total + duration, 0)
      averageDurations[transition] = durations.length > 0 ? sum / durations.length : 0
    }

    return {
      totalTransitions: history.length,
      transitionCounts,
      averageDurations
    }
  }

	/**
	 * Analyze transition patterns
	 */
	analyzePatterns(history: readonly StateContext[]): {
		commonTransitions: Record<string, number>
		errorPatterns: Array<{ from: SystemState; to: SystemState; count: number }>
		recoveryPatterns: Array<{ from: SystemState; to: SystemState; count: number }>
		cyclicPatterns: Array<Array<SystemState>>
		deadEndStates: SystemState[]
	} {
		const patterns = {
			commonTransitions: {} as Record<string, number>,
			errorPatterns: [] as Array<{ from: SystemState; to: SystemState; count: number }>,
			recoveryPatterns: [] as Array<{ from: SystemState; to: SystemState; count: number }>,
			cyclicPatterns: [] as Array<Array<SystemState>>,
			deadEndStates: [] as SystemState[]
		}

    // Count transitions
    const transitionCounts = history.reduce((counts, context) => {
      if (context.previousState) {
        const transition = `${context.previousState} → ${context.state}`
        counts[transition] = (counts[transition] || 0) + 1
      }
      return counts
    }, {} as Record<string, number>)

    patterns.commonTransitions = transitionCounts

    // Find error patterns
    patterns.errorPatterns = history
      .filter(ctx => ctx.state === SystemState.ERROR)
      .filter(ctx => ctx.previousState)
      .map(ctx => ({
        from: ctx.previousState!,
        to: ctx.state,
        count: transitionCounts[`${ctx.previousState!} → ${ctx.state}`] || 0
      }))

    // Find recovery patterns
    patterns.recoveryPatterns = history
      .filter(ctx => ctx.state !== SystemState.ERROR && ctx.previousState === SystemState.ERROR)
      .map(ctx => ({
        from: SystemState.ERROR,
        to: ctx.state,
        count: transitionCounts[`ERROR → ${ctx.state}`] || 0
      }))

    // Find cyclic patterns
    for (const [transition, count] of Object.entries(transitionCounts)) {
      if (count > 3) { // Repeated transitions suggest cycles
        const [from, to] = transition.split(' → ')
        if (from && to) {
          const stateFrom = from as SystemState
          const stateTo = to as SystemState
          patterns.cyclicPatterns.push([stateFrom, stateTo])
        }
      }
    }

    // Find dead end states
    const terminalStates = [SystemState.TERMINATED]
    patterns.deadEndStates = terminalStates.filter(state => 
      !Object.values(transitionCounts).some(([transition]) => transition.includes(state))
    )

    return patterns
  }
}

/**
 * Type-safe Transition StateValidator
 */
export class TransitionStateValidator {
  /**
   * Validate transition configuration completeness
   */
  validateConfiguration(rules: Record<SystemState, readonly StateTransitionRule[]>): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate all SystemState values are covered
    const allStates = Object.values(SystemState)
    const coveredStates = Object.keys(rules)
    
    for (const state of allStates) {
      if (!coveredStates.includes(state)) {
        errors.push(`Missing transition rules for state: ${state}`)
      }
    }

    // Validate transition rules completeness
    for (const [state, stateRules] of Object.entries(rules)) {
      if (!Object.values(SystemState).includes(state as SystemState)) {
        errors.push(`Invalid state in rules: ${state}`)
        continue
      }

      if (stateRules.length === 0) {
        if (state !== SystemState.TERMINATED) {
          errors.push(`No transitions from non-terminal state: ${state}`)
        }
        continue
      }

      for (const rule of stateRules) {
        if (!Object.values(SystemState).includes(rule.from as SystemState)) {
          errors.push(`Invalid from state in rule: ${rule.from}`)
        }
        
        for (const targetState of rule.to) {
          if (!Object.values(SystemState).includes(targetState)) {
            errors.push(`Invalid to state in rule: ${targetState}`)
          }
        }

        if (!rule.from.includes(state as SystemState)) {
          errors.push(`Rule from state doesn't match transition: ${rule.from} → ${targetState}`)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

/**
 * Type-safe Transition StateUtils
 */
export class TransitionStateUtils {
  /**
   * Create state transition schema
   */
  static createTransitionSchema(from: SystemState, to: SystemState) {
    return {
      type: "state_transition",
      from,
      to,
      timestamp: new Date(),
      metadata: {
        type: "state_transition",
        from_state: from,
        to_state: to,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Create error transition schema
   */
  static createErrorTransitionSchema(from: SystemState, error: Error) {
    return {
      type: "error_transition",
      from,
      to: SystemState.ERROR,
      error: error.message,
      stack: error.stack,
      timestamp: new Date(),
      metadata: {
        type: "error_transition",
        from_state: from,
        to_state: SystemState.ERROR,
        error_message: error.message,
        error_stack: error.stack
      }
    }
  }

  /**
   * Create recovery transition schema
   */
  static createRecoveryTransitionSchema(from: SystemState, to: SystemState) {
    return {
      type: "recovery_transition",
      from,
      to,
      timestamp: new Date(),
      metadata: {
        type: "recovery_transition",
        from_state: from,
        to_state: to,
        recovered_at: new Date().toISOString()
      }
    }
  }

	/**
	 * Analyze state transition history
	 */
	static analyzeHistory(history: readonly StateContext[]): {
		totalTransitions: number
		uniqueStates: SystemState[]
		terminalTransitions: number
		errorTransitions: number
		averageTransitionTime: number
		stateTransitions: SystemState[]
	} {
		return {
      totalTransitions: history.length,
      uniqueStates: [...new Set(history.map(ctx => ctx.state))],
      terminalTransitions: history.filter(ctx => ctx.state === SystemState.TERMINATED).length,
      errorTransitions: history.filter(ctx => ctx.state === SystemState.ERROR).length,
      averageTransitionTime: history.length > 0 
        ? history.reduce((total, ctx) => {
            const prev = history[Math.max(0, history.indexOf(ctx) - 1)]
            return prev ? total + (ctx.timestamp.getTime() - prev.timestamp.getTime()) : total
          }, 0) / history.length
        : 0,
      stateTransitions: history.map(ctx => ctx.state)
    }
  }
}

/**
 * Type-safe transition state interface
 */
export interface StateTransitionResult {
  readonly success: boolean
  readonly previousState: StateContext
  readonly newState: StateContext
  readonly event: StateEvent
  readonly duration: number
  readonly actionData?: Record<string, unknown>
  readonly rule?: StateTransitionRule
}

/**
 * Type-safe transition metrics interface
 */
export interface TransitionMetrics {
  readonly totalTransitions: number
  readonly transitionCounts: Record<string, number>
  readonly averageDurations: Record<string, number>
}