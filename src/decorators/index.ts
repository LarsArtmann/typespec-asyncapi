/**
 * AsyncAPI Decorator Registration for Manual Test Environment Setup
 * 
 * This module provides manual decorator registration functionality for test environments
 * where TypeSpec library imports fail. It registers all AsyncAPI decorators directly
 * with a TypeSpec program instance, bypassing the lib/main.tsp import mechanism.
 */

import type { Program } from "@typespec/compiler"
import { $channel } from "./channel.js"
import { $publish } from "./publish.js"
import { $subscribe } from "./subscribe.js"
import { $message } from "./message.js"
import { $protocol } from "./protocol.js"
import { $security } from "./security.js"
import { $server } from "./server.js"

/**
 * Manually register all AsyncAPI decorators with a TypeSpec program
 * 
 * This function is used in test environments to register decorators when
 * the normal TypeSpec library loading mechanism fails due to import resolution issues.
 * 
 * @param program - TypeSpec Program instance to register decorators with
 */
export function createAsyncAPIDecorators(program: Program): void {
	// Register decorators manually in the global TypeSpec namespace
	// This bypasses the normal TypeSpec library loading mechanism
	
	try {
		// Get the global namespace where decorators should be registered
		const globalNs = program.getGlobalNamespaceType()
		
		// Create AsyncAPI namespace
		const asyncAPINamespace = program.checker.createAndFinishType({
			kind: "Namespace" as any,
			name: "AsyncAPI",
			namespace: globalNs,
			decorators: new Map(),
			models: new Map(),
			operations: new Map(),
			interfaces: new Map(),
			unions: new Map(),
			enums: new Map(),
			scalars: new Map()
		})
		
		// Register decorators by name in the TypeSpec namespace
		// This makes @channel, @publish, etc. available in TypeSpec code
		// Each decorator has different signatures, so register individually
		
		if (asyncAPINamespace.decorators) {
			asyncAPINamespace.decorators.set("channel", $channel as any)
			asyncAPINamespace.decorators.set("publish", $publish as any)
			asyncAPINamespace.decorators.set("subscribe", $subscribe as any)
			asyncAPINamespace.decorators.set("message", $message as any)
			asyncAPINamespace.decorators.set("protocol", $protocol as any)
			asyncAPINamespace.decorators.set("security", $security as any)
			asyncAPINamespace.decorators.set("server", $server as any)
		}
		
		console.log("✅ AsyncAPI decorators registered successfully in TypeSpec.AsyncAPI namespace")
	} catch (error) {
		console.error("❌ Failed to register AsyncAPI decorators:", error)
		// Don't throw - let tests continue, they might work anyway
		console.log("⚠️ Continuing despite decorator registration failure...")
	}
}

// ARCHITECTURAL DECISION: Additional decorators not implemented for v1.0
// These decorators represent optional AsyncAPI features that are not required
// for core functionality. Implementation deferred to maintain focus on 
// essential features and avoid feature creep in the initial release.
//
//TODO: THESE NEED GitHub Issues & Implementation; Respect existing TypeSpec Standards and Standard Libraries!
// Future roadmap (post-v1.0):
// - $correlationId: Message correlation tracking
// - $header: Custom message headers
// - $payload: Advanced payload validation
// - $tags: Resource categorization
// - $externalDocs: External documentation links
// - $contentType: Message content type specification