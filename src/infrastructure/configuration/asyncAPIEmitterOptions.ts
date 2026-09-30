/**
 * AsyncAPI Emitter Options
 *
 * Only the options the emitter actually reads at runtime.
 */

import type { InfoOptionalFields } from "../../domain/models/asyncapi-document.js";

export interface EmitterOptions extends InfoOptionalFields {
  /** Target AsyncAPI specification version */
  version?: string;

  /** Generated document title */
  title?: string;

  /** Unique document identifier (AsyncAPI root `id`, e.g. a URN) */
  "asyncapi-id"?: string;

  /** Output file name without extension */
  "output-file"?: string;

  /** Output file format (json, yaml, yml) or detailed format config */
  "file-type"?:
    | "json"
    | "yaml"
    | "yml"
    | { format: "json" | "yaml" | "yml"; pretty?: boolean; indent?: number };

  /** Output directory for generated files */
  "output-dir"?: string;

  /** Split schemas into individual files under a schemas/ subdirectory */
  "split-schemas"?: boolean;
}

export type AsyncAPIEmitterOptions = EmitterOptions;
