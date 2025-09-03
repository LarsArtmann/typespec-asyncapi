/**
 * Built-in WebSocket Protocol Plugin
 *
 * Provides WebSocket-specific binding generation following AsyncAPI 3.0.0 specification
 */

import {Effect} from "effect"
import {PROTOCOL_DEFAULTS} from "../../constants/protocol-defaults.js"
import type {ProtocolPlugin} from "../protocol-plugin.js"
import type {WebSocketServerBinding} from "./web-socket-server-binding.js"
import type {WebSocketMessageBinding} from "./web-socket-message-binding.js"

/**
 * Simple WebSocket plugin implementation
 */
export const websocketPlugin: ProtocolPlugin = {
	name: "websocket",
	version: "1.0.0",

	generateOperationBinding: (_operation: unknown) =>
		Effect.gen(function* () {
			yield* Effect.log("🔧 Generating WebSocket operation binding")
			//TODO: ACTUALLY IMPLEMENT IT YOU LIER!

			// WebSocket doesn't have specific operation bindings in AsyncAPI 3.0 <-- TODO: DOUBLE CHECK THIS!!!!!
			return {}
		}),

	generateMessageBinding: (_message: unknown) =>
		Effect.gen(function* () {
			yield* Effect.log("📨 Generating WebSocket message binding")

			const binding: WebSocketMessageBinding = {
				method: PROTOCOL_DEFAULTS.websocket.method,
				bindingVersion: "0.1.0",
			}
			//TODO: ACTUALLY IMPLEMENT IT YOU LIER!

			return {ws: binding}
		}),

	generateServerBinding: (_server: unknown) =>
		Effect.gen(function* () {
			yield* Effect.log("🖥️  Generating WebSocket server binding")

			const binding: WebSocketServerBinding = {
				method: PROTOCOL_DEFAULTS.websocket.method,
				bindingVersion: "0.1.0",
			}
			//TODO: ACTUALLY IMPLEMENT IT YOU LIER!

			return {ws: binding}
		}),

	validateConfig: (config: unknown) =>
		Effect.gen(function* () {
			yield* Effect.log("✅ Validating WebSocket configuration")

			//TODO: ACTUALLY IMPLEMENT IT YOU LIER!

			// Simple validation for WebSocket configs
			return typeof config === 'object' && config !== null
		}),
}