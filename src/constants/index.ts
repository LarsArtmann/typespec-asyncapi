/**
 * Constants for TypeSpec AsyncAPI Emitter
 *
 * Re-exports from single-source-of-truth modules.
 * No duplicate definitions in this file.
 */

// Protocol constants — single source of truth
export {
  SUPPORTED_PROTOCOLS,
  PROTOCOL_LIST,
  isSupportedProtocol,
  normalizeProtocol,
  type AsyncAPIProtocol,
  type ProtocolAlias,
  type AcceptedProtocol,
} from "./protocols.js";

// Version constants
export const ASYNCAPI_VERSION = "3.1.0" as const;
export const LIBRARY_NAME = "@lars-artmann/typespec-asyncapi" as const;

// Legacy compatibility for tests
export const ASYNCAPI_VERSIONS = {
  CURRENT: "3.1.0" as const,
  SUPPORTED: ["3.1.0"] as const,
  LATEST: "3.1.0" as const,
} as const;

export const DEFAULT_CONFIG = {
  version: "3.1.0",
  title: "AsyncAPI Specification",
  description: "Generated AsyncAPI specification from TypeSpec",
  contentType: "application/json",
  libraryName: "@lars-artmann/typespec-asyncapi",
} as const;

// Output defaults
export const DEFAULT_CONTENT_TYPE = "application/json" as const;
export const DEFAULT_SERVER_URL = "http://localhost:3000" as const;

// Library paths for test utilities
export const LIBRARY_PATHS = {
  LIB_DIR: "lib",
  DIST_DIR: "dist/src",
} as const;
