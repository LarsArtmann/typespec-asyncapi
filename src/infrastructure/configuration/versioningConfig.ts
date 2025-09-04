/**
 * Versioning configuration options
 * TODO: Can we do better with our Types?
 */
export type VersioningConfig = {
	/**
	 * Whether to generate separate files for each version
	 * @default true
	 */
	"separate-files"?: boolean;

	/**
	 * Version naming strategy for file output
	 * @default "suffix"
	 */
	"file-naming"?: "suffix" | "directory" | "prefix";

	/**
	 * Whether to include version metadata in AsyncAPI info
	 * @default true
	 */
	"include-version-info"?: boolean;

	/**
	 * Custom version mappings
	 */
	"version-mappings"?: Record<string, string>;

	/**
	 * Whether to validate version compatibility
	 * @default false
	 */
	"validate-version-compatibility"?: boolean;
}