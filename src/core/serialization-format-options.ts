export const SERIALIZATION_FORMAT_OPTION_YAML = "yaml" as const
export const SERIALIZATION_FORMAT_OPTION_JSON = "json" as const

export const SERIALIZATION_FORMAT_OPTIONS = [
	SERIALIZATION_FORMAT_OPTION_YAML,
	SERIALIZATION_FORMAT_OPTION_JSON,
] as const

export const DEFAULT_SERIALIZATION_FORMAT: SerializationFormatOptions =
	SERIALIZATION_FORMAT_OPTION_YAML

export type SerializationFormatOptions = typeof SERIALIZATION_FORMAT_OPTIONS[number]
export type SerializationOptions = {
	format: SerializationFormatOptions
	indent?: number
	compact?: boolean
	preserveOrder?: boolean
}