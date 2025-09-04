import type {DecoratorContext, Model, Operation, Namespace} from "@typespec/compiler"
import {$lib} from "../../lib.js"
import {Effect} from "effect"

/**
 * Configuration for @tags decorator
 */
export type TagsConfig = {
	/** Array of tag names for categorization */
	tags: string[];
	/** Optional metadata for tag organization */
	metadata?: {
		/** Tag category for grouping */
		category?: string;
		/** Priority for tag ordering */
		priority?: number;
		/** Whether tags are required or optional */
		required?: boolean;
	};
}

/**
 * @tags decorator for applying metadata tags to TypeSpec targets
 *
 * Applies categorization and organizational tags to operations, models, or namespaces.
 * Tags are used in AsyncAPI specifications for:
 * - Grouping related operations and messages
 * - API documentation organization  
 * - Tooling integration and filtering
 * - Version and lifecycle management
 *
 * @example
 * ```typespec
 * @tags(["user", "authentication", "v1"])
 * @channel("/auth/user-login")
 * @publish
 * op publishUserLogin(): UserLoginEvent;
 *
 * @tags(["internal", "high-priority"])
 * @message("CriticalAlert")
 * model CriticalAlertMessage {
 *   severity: "critical" | "high" | "medium";
 *   message: string;
 * }
 * ```
 */
export function $tags(
	context: DecoratorContext,
	target: Operation | Model | Namespace,
	tags: string[],
): void {
	Effect.log(`🏷️ PROCESSING @tags decorator on ${target.kind}: ${target.name}`)
	Effect.log(`🏷️ Tags:`, tags)

	// Validate tags array
	if (!Array.isArray(tags)) {
		Effect.log(`❌ Tags must be an array, got: ${typeof tags}`)
		return
	}

	if (tags.length === 0) {
		Effect.log(`⚠️ Empty tags array for ${target.name}`)
		return
	}

	// Validate individual tag names
	const validTags = tags.filter(tag => {
		if (typeof tag !== 'string') {
			Effect.log(`⚠️ Skipping non-string tag: ${tag}`)
			return false
		}
		if (tag.trim().length === 0) {
			Effect.log(`⚠️ Skipping empty tag`)
			return false
		}
		if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(tag)) {
			Effect.log(`⚠️ Tag '${tag}' contains invalid characters`)
			return false
		}
		return true
	})

	if (validTags.length === 0) {
		Effect.log(`❌ No valid tags found for ${target.name}`)
		return
	}

	// Create tags configuration
	const tagsConfig: TagsConfig = {
		tags: validTags,
		metadata: {
			category: inferTagCategory(validTags),
			priority: inferTagPriority(validTags),
			required: validTags.includes('required') || validTags.includes('critical')
		}
	}

	// Store tags configuration in program state
	const tagsMap = context.program.stateMap($lib.stateKeys.tags)
	tagsMap.set(target, tagsConfig)

	Effect.log(`✅ Successfully stored ${validTags.length} tags for ${target.name}`)
	Effect.log(`🏷️ Valid tags: ${validTags.join(', ')}`)
	Effect.log(`🏷️ Category: ${tagsConfig.metadata?.category}`)
}

/**
 * Get tags configuration for a target
 */
export function getTagsConfig(
	context: DecoratorContext,
	target: Operation | Model | Namespace,
): TagsConfig | undefined {
	const tagsMap = context.program.stateMap($lib.stateKeys.tags)
	return tagsMap.get(target) as TagsConfig | undefined
}

/**
 * Check if a target has tags
 */
export function hasTags(
	context: DecoratorContext,
	target: Operation | Model | Namespace,
): boolean {
	const tagsMap = context.program.stateMap($lib.stateKeys.tags)
	return tagsMap.has(target)
}

/**
 * Get all tags for a target as a simple array
 */
export function getTags(
	context: DecoratorContext,
	target: Operation | Model | Namespace,
): string[] {
	const config = getTagsConfig(context, target)
	return config?.tags ?? []
}

/**
 * Infer tag category from tag names
 */
function inferTagCategory(tags: string[]): string {
	// Common category patterns
	const categoryMappings = {
		auth: ['auth', 'authentication', 'login', 'oauth', 'jwt'],
		user: ['user', 'users', 'account', 'profile'],
		admin: ['admin', 'management', 'system'],
		api: ['api', 'rest', 'graphql', 'webhook'],
		data: ['data', 'analytics', 'metrics', 'reporting'],
		notification: ['notification', 'alert', 'message', 'email'],
		payment: ['payment', 'billing', 'invoice', 'subscription'],
		internal: ['internal', 'system', 'health', 'monitoring']
	}

	for (const [category, keywords] of Object.entries(categoryMappings)) {
		if (tags.some(tag => keywords.includes(tag.toLowerCase()))) {
			return category
		}
	}

	return 'general'
}

/**
 * Infer tag priority from tag names
 */
function inferTagPriority(tags: string[]): number {
	const priorityMappings = {
		critical: 1,
		high: 2,
		'high-priority': 2,
		important: 3,
		normal: 4,
		low: 5,
		'low-priority': 5,
		optional: 6
	}

	for (const tag of tags) {
		const priority = priorityMappings[tag.toLowerCase() as keyof typeof priorityMappings]
		if (priority !== undefined) {
			return priority
		}
	}

	return 4 // Default to normal priority
}

/**
 * Merge tags from multiple sources (inheritance, composition)
 */
export function mergeTags(
	primaryTags: string[],
	secondaryTags: string[],
): string[] {
	const uniqueTags = new Set([...primaryTags, ...secondaryTags])
	return Array.from(uniqueTags).sort()
}

/**
 * Filter tags by category or pattern
 */
export function filterTags(
	tags: string[],
	filter: string | RegExp,
): string[] {
	if (typeof filter === 'string') {
		return tags.filter(tag => tag.includes(filter))
	}
	return tags.filter(tag => filter.test(tag))
}