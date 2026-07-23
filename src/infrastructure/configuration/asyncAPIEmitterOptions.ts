/**
 * AsyncAPI Emitter Options
 *
 * Only the options the emitter actually reads at runtime.
 */

export interface EmitterOptions {
  /** Target AsyncAPI specification version */
  version?: string;

  /** Generated document title */
  title?: string;

  /** Generated document description */
  description?: string;

  /** Output file name without extension */
  "output-file"?: string;

  /** Output file format (json, yaml) */
  "file-type"?: "json" | "yaml";

  /** Output directory for generated files */
  "output-dir"?: string;

  /** Split schemas into individual files under a schemas/ subdirectory */
  "split-schemas"?: boolean;
}

export type AsyncAPIEmitterOptions = EmitterOptions;
