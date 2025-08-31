#!/usr/bin/env bun
/**
 * Performance Test Runner Script
 *
 * Executes comprehensive performance validation for AsyncAPI emitter
 * with Railway Programming and Effect.TS architecture validation.
 */

import {runTestSuiteCLI} from "../src/test-runner"
import {Effect} from "effect"

// Configuration for CI/CD performance validation
const ciConfig = {
	runPerformanceValidation: true,
	runBenchmarkSuite: true,
	runArchitectureValidation: true,
	runIntegrationTests: true,
	generateReports: true,
	environment: "test" as const,
}

// Configuration for development performance testing
const devConfig = {
	runPerformanceValidation: true,
	runBenchmarkSuite: false, // Skip heavy benchmarks in dev
	runArchitectureValidation: true,
	runIntegrationTests: true,
	generateReports: true,
	environment: "development" as const,
}

// Configuration for production validation
const prodConfig = {
	runPerformanceValidation: true,
	runBenchmarkSuite: true,
	runArchitectureValidation: true,
	runIntegrationTests: true,
	generateReports: true,
	environment: "high-performance" as const,
}

// Parse command line arguments
const args = process.argv.slice(2)
const mode = args[0] || "ci"

Effect.log(`🚀 Running AsyncAPI Performance Tests in ${mode} mode`)

switch (mode) {
	case "ci":
		await runTestSuiteCLI(ciConfig)
		break
	case "dev":
		await runTestSuiteCLI(devConfig)
		break
	case "prod":
		await runTestSuiteCLI(prodConfig)
		break
	case "quick":
		await runTestSuiteCLI({
			runPerformanceValidation: false,
			runBenchmarkSuite: false,
			runArchitectureValidation: true,
			runIntegrationTests: true,
			generateReports: false,
			environment: "test",
		})
		break
	default:
		Effect.log("Usage: bun run-performance-tests.ts [ci|dev|prod|quick]")
		process.exit(1)
}
