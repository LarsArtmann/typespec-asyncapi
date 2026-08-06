/**
 * AsyncAPI Emitter Options
 *
 * Only the options the emitter actually reads at runtime.
 */

import type {
  ContactObject,
  LicenseObject,
  ExternalDocumentationObject,
} from "../../domain/models/asyncapi-document.js";

export interface EmitterOptions {
  /** Target AsyncAPI specification version */
  version?: string;

  /** Generated document title */
  title?: string;

  /** Generated document description */
  description?: string;

  /** Contact information for the API */
  contact?: ContactObject;

  /** License information for the API */
  license?: LicenseObject;

  /** URL to the Terms of Service */
  termsOfService?: string;

  /** External documentation URL */
  externalDocs?: ExternalDocumentationObject;

  /** Output file name without extension */
  "output-file"?: string;

  /** Output file format (json, yaml) or detailed format config */
  "file-type"?: "json" | "yaml" | { format: string; pretty?: boolean; indent?: number };

  /** Output directory for generated files */
  "output-dir"?: string;

  /** Split schemas into individual files under a schemas/ subdirectory */
  "split-schemas"?: boolean;
}

export type AsyncAPIEmitterOptions = EmitterOptions;
