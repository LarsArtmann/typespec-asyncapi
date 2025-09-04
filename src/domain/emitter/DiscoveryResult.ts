// TODO: CRITICAL - DiscoveryResult arrays could be empty but no validation for minimum required elements
// TODO: CRITICAL - Consider adding metadata fields (discovery timestamp, source locations) for debugging
import type {Model, Operation} from "@typespec/compiler"

import type {SecurityConfig} from "../decorators/securityConfig.js"

export type DiscoveryResult = {
	operations: Operation[]
	messageModels: Model[]
	securityConfigs: SecurityConfig[]
}