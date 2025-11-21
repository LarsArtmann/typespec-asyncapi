/**
 * Serialization Format Options
 * 
 * Defines supported output formats for AsyncAPI generation
 */

export type SerializationFormat = 'json' | 'yaml' | 'yml';

export type SerializationFormatOption = {
  format: SerializationFormat;
  pretty: boolean;
  indent: number;
};

/**
 * Create serialization format options
 */
export function createSerializationFormatOption(
  format: SerializationFormat = 'yaml',
  pretty: boolean = true,
  indent: number = 2
): SerializationFormatOption {
  return {
    format,
    pretty,
    indent
  };
}

/**
 * Validate serialization format
 */
export function isValidSerializationFormat(format: string): format is SerializationFormat {
  return ['json', 'yaml', 'yml'].includes(format);
}

/**
 * Legacy compatibility exports for tests
 */
export const SERIALIZATION_FORMAT_OPTION_JSON = {
  format: 'json' as const,
  pretty: true,
  indent: 2
};

export const SERIALIZATION_FORMAT_OPTION_YAML = {
  format: 'yaml' as const,
  pretty: true,
  indent: 2
};

/**
 * Default format options
 */
export const DEFAULT_SERIALIZATION_FORMAT_OPTION: SerializationFormatOption = {
  format: 'yaml',
  pretty: true,
  indent: 2
};

/**
 * All serialization format options
 */
export const SERIALIZATION_FORMAT_OPTIONS = {
  JSON: SERIALIZATION_FORMAT_OPTION_JSON,
  YAML: SERIALIZATION_FORMAT_OPTION_YAML,
  DEFAULT: DEFAULT_SERIALIZATION_FORMAT_OPTION
};