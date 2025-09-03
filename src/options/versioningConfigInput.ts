//TODO: Can we do better with our Types?
export type VersioningConfigInput = {
	"separate-files"?: boolean;
	"file-naming"?: "suffix" | "directory" | "prefix";
	"include-version-info"?: boolean;
	"version-mappings"?: Record<string, string>;
	"validate-version-compatibility"?: boolean;
}