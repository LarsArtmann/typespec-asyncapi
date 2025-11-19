/**
 * Document Management Helper Utilities
 *
 * Extracted from ImmutableDocumentManager.ts to eliminate code duplication.
 * Provides reusable patterns for document state management, mutation tracking,
 * and version control.
 */

import { Effect } from "effect";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";
import type {
  DocumentMutation,
  DocumentVersion,
  DocumentState,
} from "./ImmutableDocumentManager.js";

/**
 * Safely retrieve current document state
 *
 * @returns Effect that succeeds with DocumentState or fails with error
 */
export const getCurrentState = () =>
  Effect.gen(function* () {
    const currentState = globalThis.__ASYNCAPI_DOCUMENT_STATE;
    if (!currentState) {
      yield* Effect.fail(new Error("Document state not initialized"));
      return undefined as never;
    }
    return currentState;
  });

/**
 * Generate unique mutation ID
 *
 * @returns Unique ID string in format: mut_<timestamp>_<random>
 */
export const generateMutationId = (): string =>
  `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Generate unique version ID
 *
 * @returns Unique ID string in format: ver_<timestamp>_<random>
 */
export const generateVersionId = (): string =>
  `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Create document mutation record
 *
 * @param mutation - Mutation details including type, path, and values
 * @param description - Human-readable mutation description
 * @returns DocumentMutation record with generated ID and timestamp
 */
export const createMutationRecord = <T>(params: {
  type: DocumentMutation["type"];
  path: string[];
  oldValue: T | undefined;
  newValue: T;
  description: string;
}): DocumentMutation<T> => ({
  id: generateMutationId(),
  type: params.type,
  path: params.path,
  oldValue: params.oldValue,
  newValue: params.newValue,
  timestamp: Date.now(),
  description: params.description,
});

/**
 * Create document version record
 *
 * @param params - Version details including document, mutations, and description
 * @param currentVersion - Current version number to increment
 * @returns DocumentVersion record with generated ID and timestamp
 */
export const createVersionRecord = (params: {
  document: AsyncAPIObject;
  mutations: DocumentMutation[];
  description: string;
  currentVersion: number;
}): DocumentVersion => ({
  id: generateVersionId(),
  version: params.currentVersion + 1,
  timestamp: Date.now(),
  document: params.document,
  mutations: params.mutations,
  description: params.description,
});

/**
 * Update global document state immutably
 *
 * @param newState - New state to apply
 * @returns Effect that updates state
 */
export const updateDocumentState = (newState: DocumentState) =>
  Effect.sync(() => {
    globalThis.__ASYNCAPI_DOCUMENT_STATE = newState;
  });

/**
 * Create new document state with updated fields
 *
 * @param currentState - Current document state
 * @param updates - Fields to update in state
 * @returns New DocumentState with updates applied
 */
export const createUpdatedState = (
  currentState: DocumentState,
  updates: {
    document?: AsyncAPIObject;
    version?: number;
    mutations?: DocumentMutation[];
    versionHistory?: DocumentVersion[];
    mutationHistory?: DocumentMutation[];
  },
): DocumentState => ({
  currentDocument: updates.document ?? currentState.currentDocument,
  currentVersion: updates.version ?? currentState.currentVersion,
  currentMutations: updates.mutations ?? currentState.currentMutations,
  versionHistory: updates.versionHistory ?? currentState.versionHistory,
  mutationHistory: updates.mutationHistory ?? currentState.mutationHistory,
});

/**
 * Creates and updates document state with new version and mutations
 * Eliminates duplication between appendMutation and appendAtomicMutations
 */
const createVersionAndUpdateState = (
  currentState: DocumentState,
  document: AsyncAPIObject,
  mutations: DocumentMutation[],
  description: string,
) => {
  const newVersion = createVersionRecord({
    document,
    mutations: [...currentState.currentMutations, ...mutations],
    description,
    currentVersion: currentState.currentVersion,
  });

  return {
    newVersion,
    stateUpdate: updateDocumentState({
      currentDocument: document,
      currentVersion: newVersion.version,
      currentMutations: newVersion.mutations,
      versionHistory: [...currentState.versionHistory, newVersion],
      mutationHistory: [...currentState.mutationHistory, ...mutations],
    }),
  };
};

/**
 * Append mutation to state history
 *
 * @param currentState - Current document state
 * @param mutation - Mutation to append
 * @param document - New document after mutation
 * @returns Effect that updates state with new mutation
 */
export const appendMutation = (
  currentState: DocumentState,
  mutation: DocumentMutation,
  document: AsyncAPIObject,
) =>
  Effect.gen(function* () {
    const { newVersion, stateUpdate } = createVersionAndUpdateState(
      currentState,
      document,
      [mutation],
      "Document mutation",
    );

    yield* stateUpdate;

    return newVersion;
  });

/**
 * Append multiple mutations atomically
 *
 * @param currentState - Current document state
 * @param mutations - Mutations to append
 * @param document - Final document after all mutations
 * @param description - Description of atomic operation
 * @returns Effect that updates state with atomic mutations
 */
export const appendAtomicMutations = (
  currentState: DocumentState,
  mutations: DocumentMutation[],
  document: AsyncAPIObject,
  description: string,
) =>
  Effect.gen(function* () {
    const { newVersion, stateUpdate } = createVersionAndUpdateState(
      currentState,
      document,
      mutations,
      description,
    );

    yield* stateUpdate;

    return newVersion;
  });
