/**
 * Serialization Format Options
 *
 * Defines supported output formats for AsyncAPI generation
 */

export type SerializationFormat = "json" | "yaml" | "yml";

export interface SerializationFormatOption {
  format: SerializationFormat;
  pretty: boolean;
  indent: number;
}

/**
 * Create serialization format options
 */
export function createSerializationFormatOption(
  format: SerializationFormat = "yaml",
  pretty: boolean = true,
  indent: number = 2,
): SerializationFormatOption {
  return {
    format,
    indent,
    pretty,
  };
}

/**
 * Validate serialization format
 */
export function isValidSerializationFormat(
  format: string,
): format is SerializationFormat {
  return ["json", "yaml", "yml"].includes(format);
}

/**
 * Legacy compatibility exports for tests
 */
export const SERIALIZATION_FORMAT_OPTION_JSON = {
  format: "json" as const,
  indent: 2,
  pretty: true,
};

export const SERIALIZATION_FORMAT_OPTION_YAML = {
  format: "yaml" as const,
  indent: 2,
  pretty: true,
};

/**
 * Default format options
 */
export const DEFAULT_SERIALIZATION_FORMAT_OPTION: SerializationFormatOption = {
  format: "yaml",
  indent: 2,
  pretty: true,
};

/**
 * All serialization format options
 */
export const SERIALIZATION_FORMAT_OPTIONS = ["json", "yaml", "yml"] as const;

/**
 * Legacy object format for backward compatibility
 */
export const SERIALIZATION_FORMAT_OPTION_OBJECTS = {
  DEFAULT: DEFAULT_SERIALIZATION_FORMAT_OPTION,
  JSON: SERIALIZATION_FORMAT_OPTION_JSON,
  YAML: SERIALIZATION_FORMAT_OPTION_YAML,
};
