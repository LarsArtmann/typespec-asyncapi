/**
 * Comprehensive test utilities for AsyncAPI emitter testing
 */

import { createTestHost, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { AsyncAPITestLibrary } from "../test-host.js";
import type { AsyncAPIEmitterOptions } from "../../src/options.js";

/**
 * Create a test host configured for AsyncAPI testing
 */
export async function createAsyncAPITestHost() {
  return createTestHost({
    libraries: [AsyncAPITestLibrary],
  });
}

/**
 * Compile TypeSpec source and return both diagnostics and output files
 */
export async function compileAsyncAPISpec(
  source: string, 
  options: AsyncAPIEmitterOptions = {}
) {
  const host = await createAsyncAPITestHost();
  
  // Wrap source with imports
  const wrappedSource = `
    import "@typespec/asyncapi";
    using TypeSpec.AsyncAPI;
    ${source}
  `;
  
  host.addTypeSpecFile("main.tsp", wrappedSource);
  
  const result = await host.compileAndDiagnose("main.tsp", {
    emitters: {
      "@typespec/asyncapi": options,
    },
    outputDir: "test-output",
    noEmit: false,
  });
  
  return {
    diagnostics: result.diagnostics,
    outputFiles: host.fs,
    program: result.program,
  };
}

/**
 * Compile TypeSpec and expect no errors
 */
export async function compileAsyncAPISpecWithoutErrors(
  source: string,
  options: AsyncAPIEmitterOptions = {}
) {
  const { diagnostics, outputFiles, program } = await compileAsyncAPISpec(source, options);
  
  const errors = diagnostics.filter(d => d.severity === "error");
  if (errors.length > 0) {
    throw new Error(`Compilation failed with errors: ${errors.map(d => d.message).join(", ")}`);
  }
  
  return { outputFiles, program, diagnostics };
}

/**
 * Parse AsyncAPI output from compilation result
 */
export function parseAsyncAPIOutput(outputFiles: any, filename: string) {
  const filePath = `test-output/${filename}`;
  
  try {
    const content = outputFiles.get(filePath);
    if (!content) {
      // Try without test-output prefix
      const alternativeContent = outputFiles.get(filename);
      if (!alternativeContent) {
        const availableFiles = Array.from(outputFiles.keys());
        throw new Error(`Output file ${filename} not found. Available files: ${availableFiles.join(", ")}`);
      }
      return parseFileContent(alternativeContent, filename);
    }
    
    return parseFileContent(content, filename);
  } catch (error) {
    const availableFiles = Array.from(outputFiles.keys());
    throw new Error(`Failed to parse ${filename}: ${error}. Available files: ${availableFiles.join(", ")}`);
  }
}

function parseFileContent(content: string, filename: string) {
  if (filename.endsWith('.json')) {
    return JSON.parse(content);
  } else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
    // For YAML, we'll just return the string content for now
    // In a real implementation, you might want to use a YAML parser
    return content;
  }
  
  throw new Error(`Unsupported file format: ${filename}`);
}

/**
 * Validate basic AsyncAPI 3.0 structure
 */
export function validateAsyncAPIStructure(asyncapiDoc: any) {
  if (typeof asyncapiDoc === 'string') {
    throw new Error("Expected parsed AsyncAPI document, got string. Use parseAsyncAPIOutput first.");
  }
  
  const requiredFields = ['asyncapi', 'info', 'channels'];
  const missingFields = requiredFields.filter(field => !(field in asyncapiDoc));
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required AsyncAPI fields: ${missingFields.join(", ")}`);
  }
  
  if (asyncapiDoc.asyncapi !== "3.0.0") {
    throw new Error(`Expected AsyncAPI version 3.0.0, got ${asyncapiDoc.asyncapi}`);
  }
  
  return true;
}

/**
 * Create test TypeSpec source for common scenarios
 */
export const TestSources = {
  basicEvent: `
    namespace TestEvents;
    
    model BasicEvent {
      id: string;
      timestamp: utcDateTime;
      data: string;
    }
    
    @channel("test.basic")
    op publishBasicEvent(): BasicEvent;
  `,
  
  complexEvent: `
    namespace ComplexEvents;
    
    model ComplexEvent {
      @doc("Event identifier")
      id: string;
      
      @doc("Event timestamp")
      timestamp: utcDateTime;
      
      @doc("Optional description")
      description?: string;
      
      @doc("Event metadata")
      metadata: {
        source: string;
        version: int32;
        tags: string[];
      };
      
      @doc("Event status")
      status: "pending" | "processed" | "failed";
    }
    
    @channel("complex.events")
    op publishComplexEvent(): ComplexEvent;
  `,
  
  multipleOperations: `
    namespace MultiOps;
    
    model UserEvent {
      userId: string;
      action: string;
    }
    
    model SystemEvent {
      component: string;
      level: "info" | "warning" | "error";
    }
    
    @channel("user.events")
    op publishUserEvent(): UserEvent;
    
    @channel("system.events")
    op publishSystemEvent(): SystemEvent;
    
    @channel("user.notifications")
    op subscribeUserNotifications(userId: string): UserEvent;
  `,
  
  withDocumentation: `
    @doc("Test namespace with full documentation")
    namespace DocumentedEvents;
    
    @doc("Fully documented event model")
    model DocumentedEvent {
      @doc("Primary identifier")
      id: string;
      
      @doc("Human-readable name")
      name: string;
      
      @doc("Creation timestamp")
      createdAt: utcDateTime;
    }
    
    @channel("documented.events")
    @doc("Channel for well-documented events")
    op publishDocumentedEvent(): DocumentedEvent;
  `,
};

/**
 * Common test assertions for AsyncAPI validation
 */
export const AsyncAPIAssertions = {
  hasValidStructure: (doc: any) => {
    validateAsyncAPIStructure(doc);
    return true;
  },
  
  hasChannel: (doc: any, channelName: string) => {
    if (!doc.channels || !(channelName in doc.channels)) {
      throw new Error(`Expected channel '${channelName}' not found. Available channels: ${Object.keys(doc.channels || {}).join(", ")}`);
    }
    return true;
  },
  
  hasOperation: (doc: any, operationName: string) => {
    if (!doc.operations || !(operationName in doc.operations)) {
      throw new Error(`Expected operation '${operationName}' not found. Available operations: ${Object.keys(doc.operations || {}).join(", ")}`);
    }
    return true;
  },
  
  hasSchema: (doc: any, schemaName: string) => {
    if (!doc.components || !doc.components.schemas || !(schemaName in doc.components.schemas)) {
      const availableSchemas = doc.components?.schemas ? Object.keys(doc.components.schemas) : [];
      throw new Error(`Expected schema '${schemaName}' not found. Available schemas: ${availableSchemas.join(", ")}`);
    }
    return true;
  },
  
  schemaHasProperty: (doc: any, schemaName: string, propertyName: string) => {
    AsyncAPIAssertions.hasSchema(doc, schemaName);
    const schema = doc.components.schemas[schemaName];
    
    if (!schema.properties || !(propertyName in schema.properties)) {
      const availableProperties = schema.properties ? Object.keys(schema.properties) : [];
      throw new Error(`Expected property '${propertyName}' not found in schema '${schemaName}'. Available properties: ${availableProperties.join(", ")}`);
    }
    return true;
  },
  
  hasDocumentation: (obj: any, expectedDoc: string) => {
    if (!obj.description || !obj.description.includes(expectedDoc)) {
      throw new Error(`Expected documentation containing '${expectedDoc}', got: ${obj.description || 'no description'}`);
    }
    return true;
  },
};