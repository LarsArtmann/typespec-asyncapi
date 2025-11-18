import {dirname, isAbsolute, join, resolve} from "node:path"
import {cwd} from "node:process"
import {existsSync} from "node:fs"
import {Effect} from "effect"
import type {TemplateValidationResult} from "./template-validation-result.js"
import type {PathTemplateContext} from "./path-template-context.js"
import type {PathTemplateVariables} from "./path-template-variables.js"
import {safeStringify} from "../../utils/standardized-errors.js"

/**
 * Template variable patterns for validation and replacement
 */
const TEMPLATE_VARIABLE_PATTERN = /\{([^{}]+)\}/g

/**
 * Supported template variable names
 */
export const SUPPORTED_TEMPLATE_VARIABLES = [
	"cmd",
	"project-root",
	"emitter-name",
	"output-dir",
] as const

export type SupportedTemplateVariable = typeof SUPPORTED_TEMPLATE_VARIABLES[number];

/**
 * Validate template variables in a path string
 *
 * @param pathTemplate - Path template string with variables like "{cmd}/output.yaml"
 * @returns Validation result using discriminated union for type-safe error handling
 */
export function validatePathTemplate(pathTemplate: string): TemplateValidationResult {
	const variables: string[] = []
	const unsupportedVariables: string[] = []
	const errors: string[] = []

	// Extract all template variables
	let match
	while ((match = TEMPLATE_VARIABLE_PATTERN.exec(pathTemplate)) !== null) {
		const variable = match[1]
		if (variable) {
			variables.push(variable)

			if (!SUPPORTED_TEMPLATE_VARIABLES.includes(variable as SupportedTemplateVariable)) {
				unsupportedVariables.push(variable)
			}
		}
	}

	// Generate validation errors
	if (unsupportedVariables.length > 0) {
		errors.push(
			`Unsupported template variables: ${unsupportedVariables.join(", ")}. ` +
			`Supported variables: ${SUPPORTED_TEMPLATE_VARIABLES.join(", ")}`,
		)
	}

	// Return discriminated union based on validation state
	return errors.length === 0
		? { _tag: "valid", variables, unsupportedVariables }
		: { _tag: "invalid", variables, unsupportedVariables, errors }
}

/**
 * Detect command name from process arguments or environment
 *
 * @returns Detected command name (e.g., "typespec", "tsp")
 */
export function detectCommandName(): string {
	// Check process argv for command name
	const argv = process.argv

	// Look for common TypeSpec command names
	for (const arg of argv) {
		if (arg.includes("typespec") || arg.includes("tsp")) {
			const basename = arg.split(/[/\\]/).pop() ?? ""
			if (basename.startsWith("typespec") || basename.startsWith("tsp")) {
				return basename.replace(/\.(js|exe)$/, "")
			}
		}
	}

	// Check NODE_OPTIONS or other env vars
	const nodeOptions = process.env['NODE_OPTIONS'] ?? ""
	if (nodeOptions.includes("typespec")) {
		return "typespec"
	}

	// Default fallback
	return "typespec"
}

//TODO: MAKE SURE THIS FOLLOWS TypeSpec standards!
/**
 * Detect project root directory by looking for TypeSpec configuration files
 *
 * @param startPath - Starting directory for search (defaults to cwd)
 * @returns Project root directory path
 */
export function detectProjectRoot(startPath?: string): string {
	const searchPath = startPath ?? cwd()

	// Configuration files that indicate project root
	const configFiles = [
		"tspconfig.yaml",
		"tspconfig.json",
		"package.json",
		".git",
	]

	let currentPath = resolve(searchPath)
	const rootPath = resolve("/")

	while (currentPath !== rootPath) {
		// Check if configuration files exist in current directory
		for (const configFile of configFiles) {
			const configPath = join(currentPath, configFile)
			const fileCheckResult = Effect.runSync(
				Effect.gen(function* () {
					// Use basic file system check with Effect.TS Railway programming
					if (existsSync(configPath)) {
						return true
					}
					return false
				}).pipe(
					Effect.catchAll((error) =>
						Effect.gen(function* () {
							yield* Effect.logWarning(`⚠️  File check failed for ${configPath}: ${safeStringify(error)}`)
							return false
						})
					)
				)
			)

			if (fileCheckResult) {
				return currentPath
			}
		}

		// Move up one directory
		const parentPath = dirname(currentPath)
		if (parentPath === currentPath) {
			break // Reached filesystem root
		}
		currentPath = parentPath
	}

	// Fall back to starting directory if no project root found
	return resolve(searchPath)
}

/**
 * Create template variables from context
 *
 * @param context - Path template context
 * @returns Template variables for path resolution
 */
export function createTemplateVariables(context: PathTemplateContext): PathTemplateVariables {
	const workingDir = context.cwd ?? cwd()
	const projectRoot = detectProjectRoot(workingDir)

	return {
		cmd: detectCommandName(),
		"project-root": projectRoot,
		"emitter-name": "asyncapi",
		"output-dir": context.emitterOutputDir ?? join(projectRoot, "generated"),
	}
}

/**
 * Resolve template variables in a path string
 *
 * @param pathTemplate - Path template string with variables
 * @param variables - Template variables to substitute
 * @returns Resolved path string
 */
export function resolvePathTemplate(
	pathTemplate: string,
	variables: PathTemplateVariables,
): string {
	let resolvedPath = pathTemplate

	// Replace each template variable
	for (const [key, value] of Object.entries(variables)) {
		const pattern = new RegExp(`\\{${key}\\}`, "g")
		resolvedPath = resolvedPath.replace(pattern, value)
	}

	// Normalize path separators for cross-platform compatibility
	resolvedPath = resolvedPath.replace(/[/\\]+/g, "/")

	// Convert to absolute path if not already absolute
	if (!isAbsolute(resolvedPath)) {
		resolvedPath = resolve(variables["project-root"], resolvedPath)
	}

	// Normalize the final path
	return resolve(resolvedPath)
}

/**
 * Resolve path template with validation and context
 *
 * @param pathTemplate - Path template string
 * @param context - Path template context
 * @returns Resolved absolute path
 * @throws Error if template validation fails
 */
export function resolvePathTemplateWithValidation(
	pathTemplate: string,
	context: PathTemplateContext = {},
): Effect.Effect<string, Error, never> {
	// Validate template variables first
	const validation = validatePathTemplate(pathTemplate)

	// Use discriminated union for type-safe validation checking
	if (validation._tag === "invalid") {
		return Effect.fail(new Error(`Path template validation failed: ${validation.errors.join("; ")}`))
	}

	// Create template variables from context
	const variables = createTemplateVariables(context)

	// Resolve template
	return Effect.succeed(resolvePathTemplate(pathTemplate, variables))
}

/**
 * Check if a path contains template variables
 *
 * @param path - Path string to check
 * @returns True if path contains template variables
 */
export function hasTemplateVariables(path: string): boolean {
	return TEMPLATE_VARIABLE_PATTERN.test(path)
}

/**
 * Utility function to get template variables from a path
 *
 * @param pathTemplate - Path template string
 * @returns Array of template variable names found in the path
 */
export function getTemplateVariables(pathTemplate: string): string[] {
	const variables: string[] = []
	let match
	const regex = new RegExp(TEMPLATE_VARIABLE_PATTERN.source, "g")

	while ((match = regex.exec(pathTemplate)) !== null) {
		if (match[1]) {
			variables.push(match[1])
		}
	}

	return variables
}