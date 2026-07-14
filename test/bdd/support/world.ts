/**
 * BDD World Configuration for TypeSpec AsyncAPI Emitter
 *
 * Provides shared context and utilities for behavior-driven testing
 */

import { Before, Given, When, Then } from "@cucumber/cucumber";
import { Effect } from "effect";
import { $asyncApi } from "../../../src/index.js";
import type { Program } from "@typespec/compiler";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";

/**
 * BDD World - Shared test context
 */
export class AsyncAPIWorld {
  public program: Program | null = null;
  public asyncApiDoc: AsyncAPIObject | null = null;
  public errors: string[] = [];
  public warnings: string[] = [];

  /**
   * Reset world state for each scenario
   */
  public reset(): void {
    this.program = null;
    this.asyncApiDoc = null;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Get current AsyncAPI document with type safety
   */
  public getAsyncAPIDocument(): AsyncAPIObject {
    if (!this.asyncApiDoc) {
      throw new Error("AsyncAPI document not initialized");
    }
    return this.asyncApiDoc;
  }

  /**
   * Check if document is valid AsyncAPI 3.0
   */
  public isValidAsyncAPI(): boolean {
    return (
      this.asyncApiDoc !== null &&
      typeof this.asyncApiDoc === "object" &&
      "asyncapi" in this.asyncApiDoc &&
      "info" in this.asyncApiDoc
    );
  }
}

// Create world instance for cucumber
let world: AsyncAPIWorld;

Before(function (this: AsyncAPIWorld) {
  world = this;
  world.reset();
});

export { world };

/**
 * Step definitions for TypeSpec compilation
 */
Given("I have a TypeSpec model with @channel decorator", async function (this: AsyncAPIWorld) {
  // TODO: Implement TypeSpec model creation with @channel decorator
  console.log("🚧 BDD: Creating TypeSpec model with @channel decorator");
});

Given(
  "I have a TypeSpec model with @securityEnhanced decorator",
  async function (this: AsyncAPIWorld) {
    // TODO: Implement security decorator setup
    console.log("🚧 BDD: Creating TypeSpec model with @securityEnhanced decorator");
  },
);

Given("I have a TypeSpec model with MQTT protocol binding", async function (this: AsyncAPIWorld) {
  // TODO: Implement MQTT protocol binding setup
  console.log("🚧 BDD: Creating TypeSpec model with MQTT protocol binding");
});

Given("I have invalid TypeSpec decorator configuration", async function (this: AsyncAPIWorld) {
  // TODO: Implement invalid configuration setup
  console.log("🚧 BDD: Creating invalid TypeSpec decorator configuration");
});

When("I compile TypeSpec to AsyncAPI", async function (this: AsyncAPIWorld) {
  // TODO: Implement TypeSpec compilation using $asyncApi
  console.log("🚧 BDD: Compiling TypeSpec to AsyncAPI");
});

Then("I should receive a valid AsyncAPI 3.0 document", async function (this: AsyncAPIWorld) {
  if (!world.isValidAsyncAPI()) {
    throw new Error("Expected valid AsyncAPI 3.0 document, but got invalid or null document");
  }
});

Then("document should contain be corresponding channel", async function (this: AsyncAPIWorld) {
  const doc = world.getAsyncAPIDocument();
  if (!("channels" in doc) || Object.keys(doc.channels || {}).length === 0) {
    throw new Error("Expected AsyncAPI document to contain channels");
  }
});

Then("channel should have correct operation bindings", async function (this: AsyncAPIWorld) {
  // TODO: Implement operation binding validation
  console.log("🚧 BDD: Validating operation bindings");
});
