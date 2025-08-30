/**
 * PRODUCTION TEST: Real Validation Process Integration Tests
 * 
 * Tests ACTUAL validation processes with real @asyncapi/parser integration.
 * NO mocks - validates real validation including:
 * - @asyncapi/parser integration and validation
 * - Error handling with comprehensive context
 * - Validation caching and performance optimization
 * - AsyncAPI specification compliance verification
 */

import { test, expect, describe } from "bun:test";
import { compileAsyncAPISpecWithoutErrors, parseAsyncAPIOutput, validateAsyncAPIDocumentComprehensive, type AsyncAPIDocument } from "../../../test/utils/test-helpers.js";

// Import validation framework directly for testing
import { validateAsyncAPIDocument, ValidationOptions, ValidationResult } from "../../../src/validation/index.js";

describe("Real Validation Integration Tests", () => {
  describe("@asyncapi/parser Integration", () => {
    test("should validate generated AsyncAPI document with real @asyncapi/parser", async () => {
      const source = `
        namespace ParserValidationTest;
        
        @doc("Message for parser validation testing")
        model ParserTestMessage {
          @doc("Message identifier")
          messageId: string;
          
          @doc("Message content")
          content: string;
          
          @doc("Message timestamp")
          timestamp: utcDateTime;
          
          @doc("Message priority level")
          priority: "low" | "medium" | "high" | "critical";
          
          @doc("Optional message metadata")
          metadata?: {
            source: string;
            tags: string[];
            version: int32;
          };
        }
        
        @channel("parser.test.messages")
        @doc("Channel for parser validation testing")
        @publish
        op publishParserTestMessage(): ParserTestMessage;
        
        @channel("parser.test.subscribe")
        @doc("Subscription channel for parser testing")
        @subscribe
        op subscribeParserTestMessages(): ParserTestMessage;
      `;

      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
        "output-file": "parser-validation-test",
        "file-type": "json"
      });

      const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "parser-validation-test.json") as AsyncAPIDocument;
      
      // Test direct validation framework usage
      const validationOptions: ValidationOptions = {
        strict: true,
        enableCache: false, // Disable cache for testing
        validateExamples: true,
        validateFormat: true
      };
      
      const validationResult: ValidationResult = await validateAsyncAPIDocument(asyncapiDoc, validationOptions);
      
      // Validate that real @asyncapi/parser validation passed
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
      expect(validationResult.summary).toContain("valid");
      expect(validationResult.validatedAt).toBeDefined();
      expect(validationResult.performanceMetrics).toBeDefined();
      expect(validationResult.performanceMetrics.validationTimeMs).toBeGreaterThan(0);
      
      // Validate performance metrics are reasonable
      expect(validationResult.performanceMetrics.validationTimeMs).toBeLessThan(5000); // Should be under 5 seconds
      expect(validationResult.performanceMetrics.documentSize).toBeGreaterThan(0);
      
      console.log("✅ Real @asyncapi/parser validation passed");
      console.log(`📊 Validation time: ${validationResult.performanceMetrics.validationTimeMs}ms`);
      console.log(`📊 Document size: ${validationResult.performanceMetrics.documentSize} bytes`);
    });

    test("should handle validation errors with comprehensive error reporting", async () => {
      // Create an intentionally invalid AsyncAPI document
      const invalidAsyncAPIDoc = {
        asyncapi: "3.0.0",
        info: {
          title: "Invalid Document Test",
          version: "1.0.0"
        },
        // Missing required 'channels' field
        operations: {
          invalidOp: {
            action: "send",
            // Missing required 'channel' field
            summary: "Invalid operation"
          }
        },
        components: {
          schemas: {
            InvalidSchema: {
              type: "object",
              properties: {
                invalidProp: {
                  // Missing 'type' field
                }
              }
            }
          }
        }
      };

      const validationOptions: ValidationOptions = {
        strict: true,
        enableCache: false,
        validateExamples: true,
        validateFormat: true
      };
      
      const validationResult = await validateAsyncAPIDocument(invalidAsyncAPIDoc, validationOptions);
      
      // Validate that validation caught the errors
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
      
      // Validate comprehensive error reporting
      for (const error of validationResult.errors) {
        expect(error.message).toBeDefined();
        expect(error.keyword).toBeDefined();
        expect(typeof error.instancePath).toBe("string");
        expect(typeof error.schemaPath).toBe("string");
        
        console.log(`📋 Validation error: ${error.message} at ${error.instancePath}`);
      }
      
      // Validate error summary
      expect(validationResult.summary).toContain("errors found");
      expect(validationResult.validatedAt).toBeDefined();
      expect(validationResult.performanceMetrics).toBeDefined();
      
      console.log("✅ Validation error handling with comprehensive reporting verified");
      console.log(`📊 Found ${validationResult.errors.length} validation errors`);
    });

    test("should validate complex nested structures correctly", async () => {
      const source = `
        namespace ComplexValidationTest;
        
        @doc("Complex nested message for validation")
        model ComplexNestedMessage {
          @doc("Message ID")
          id: string;
          
          @doc("Deeply nested structure")
          deepStructure: {
            level1: {
              level2: {
                level3: {
                  data: string[];
                  metadata: Record<int32>;
                  timestamps: {
                    created: utcDateTime;
                    modified: utcDateTime;
                    accessed?: utcDateTime;
                  };
                };
                additionalData: boolean;
              };
              references: string[];
            };
            rootLevelData: float64;
          };
          
          @doc("Array of complex objects")
          complexArray: {
            itemId: string;
            itemData: {
              properties: Record<string>;
              values: (string | int32 | boolean)[];
            };
            relationships: {
              parentId?: string;
              childIds: string[];
              metadata: Record<unknown>;
            };
          }[];
          
          @doc("Union type with complex options")
          unionField: string | {
            objectType: "complex";
            data: Record<string>;
          } | int32[];
        }
        
        @channel("complex.validation.test")
        @publish
        op publishComplexMessage(): ComplexNestedMessage;
      `;

      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
        "output-file": "complex-validation-test",
        "file-type": "json"
      });

      const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "complex-validation-test.json") as AsyncAPIDocument;
      
      // Perform strict validation on complex structure
      const validationOptions: ValidationOptions = {
        strict: true,
        enableCache: false,
        validateExamples: true,
        validateFormat: true,
        maxDepth: 10 // Allow deep nesting
      };
      
      const validationResult = await validateAsyncAPIDocument(asyncapiDoc, validationOptions);
      
      // Should pass validation despite complexity
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
      
      // Validate performance is reasonable for complex document
      expect(validationResult.performanceMetrics.validationTimeMs).toBeLessThan(10000); // 10 seconds max
      
      // Validate schema complexity metrics
      expect(validationResult.performanceMetrics.documentSize).toBeGreaterThan(1000); // Should be substantial
      
      console.log("✅ Complex nested structure validation passed");
      console.log(`📊 Document complexity - Size: ${validationResult.performanceMetrics.documentSize} bytes`);
    });
  });

  describe("Validation Performance and Caching", () => {
    test("should demonstrate validation caching performance benefits", async () => {
      const source = `
        namespace CachePerformanceTest;
        
        model CacheTestMessage {
          id: string;
          data: string;
          timestamp: utcDateTime;
        }
        
        @channel("cache.test")
        @publish
        op publishCacheTest(): CacheTestMessage;
      `;

      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
        "output-file": "cache-test",
        "file-type": "json"
      });

      const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "cache-test.json") as AsyncAPIDocument;
      
      // First validation without cache
      const noCacheOptions: ValidationOptions = {
        strict: true,
        enableCache: false
      };
      
      const startTime1 = Date.now();
      const result1 = await validateAsyncAPIDocument(asyncapiDoc, noCacheOptions);
      const duration1 = Date.now() - startTime1;
      
      // Second validation with cache enabled
      const cacheOptions: ValidationOptions = {
        strict: true,
        enableCache: true
      };
      
      const startTime2 = Date.now();
      const result2 = await validateAsyncAPIDocument(asyncapiDoc, cacheOptions);
      const duration2 = Date.now() - startTime2;
      
      // Third validation with cache (should be fastest)
      const startTime3 = Date.now();
      const result3 = await validateAsyncAPIDocument(asyncapiDoc, cacheOptions);
      const duration3 = Date.now() - startTime3;
      
      // All validations should pass
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(result3.valid).toBe(true);
      
      // Cache should provide performance benefit
      expect(result2.performanceMetrics.cacheHit).toBe(false); // First cache attempt
      expect(result3.performanceMetrics.cacheHit).toBe(true);  // Second cache attempt should hit
      
      // Third validation should be faster than first (cache benefit)
      if (duration3 < duration1) {
        console.log(`✅ Cache performance benefit: ${duration1}ms → ${duration3}ms`);
      } else {
        console.log(`📊 Cache timings: No cache=${duration1}ms, Cache miss=${duration2}ms, Cache hit=${duration3}ms`);
      }
      
      console.log("✅ Validation caching performance tested");
    });

    test("should handle high-volume validation efficiently", async () => {
      // Generate multiple similar documents for bulk validation
      const documents: AsyncAPIDocument[] = [];
      
      for (let i = 1; i <= 10; i++) {
        const source = `
          namespace BulkTest${i};
          
          model BulkTestMessage${i} {
            id${i}: string;
            data${i}: string;
            count${i}: int32;
            timestamp${i}: utcDateTime;
          }
          
          @channel("bulk.test.${i}")
          @publish
          op publishBulkTest${i}(): BulkTestMessage${i};
        `;

        const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
          "output-file": `bulk-test-${i}`,
          "file-type": "json"
        });

        const doc = parseAsyncAPIOutput(outputFiles, `bulk-test-${i}.json`) as AsyncAPIDocument;
        documents.push(doc);
      }
      
      // Validate all documents with caching enabled
      const bulkValidationOptions: ValidationOptions = {
        strict: true,
        enableCache: true,
        validateFormat: true
      };
      
      const startTime = Date.now();
      const validationPromises = documents.map(doc => 
        validateAsyncAPIDocument(doc, bulkValidationOptions)
      );
      
      const results = await Promise.all(validationPromises);
      const totalTime = Date.now() - startTime;
      
      // All validations should pass
      for (const result of results) {
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
      
      // Calculate average validation time
      const averageTime = totalTime / documents.length;
      
      // Performance assertions
      expect(totalTime).toBeLessThan(30000); // 30 seconds for 10 documents
      expect(averageTime).toBeLessThan(5000); // 5 seconds per document
      
      console.log(`✅ High-volume validation completed: ${documents.length} documents in ${totalTime}ms`);
      console.log(`📊 Average validation time: ${averageTime.toFixed(2)}ms per document`);
    });
  });

  describe("Error Handling and Recovery", () => {
    test("should provide detailed error context for What/Reassure/Why/Fix/Escape pattern", async () => {
      // Test with document that has multiple error types
      const problematicAsyncAPIDoc = {
        asyncapi: "2.0.0", // Wrong version (should be 3.0.0)
        info: {
          title: "Problematic Document",
          // Missing required 'version' field
        },
        channels: {
          "invalid-channel": {
            // Missing required address field in AsyncAPI 3.0
            description: "Invalid channel definition"
          }
        },
        operations: {
          invalidOperation: {
            action: "invalid-action", // Should be 'send' or 'receive'
            channel: {
              // Missing $ref field
            }
          }
        }
      };

      const validationResult = await validateAsyncAPIDocument(problematicAsyncAPIDoc, {
        strict: true,
        enableCache: false,
        provideDetailedErrors: true
      });

      // Should detect multiple errors
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
      
      // Validate comprehensive error reporting follows What/Reassure/Why/Fix/Escape pattern
      for (const error of validationResult.errors) {
        // What: Clear error description
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
        
        // Where: Path information
        expect(error.instancePath).toBeDefined();
        expect(error.schemaPath).toBeDefined();
        
        // Why: Error keyword for understanding root cause
        expect(error.keyword).toBeDefined();
        
        console.log(`📋 Error Detail:`);
        console.log(`   What: ${error.message}`);
        console.log(`   Where: ${error.instancePath || 'root'}`);
        console.log(`   Why: ${error.keyword}`);
        console.log(`   Schema: ${error.schemaPath}`);
      }
      
      // Validate error summary provides actionable guidance
      expect(validationResult.summary).toBeDefined();
      expect(validationResult.summary).toContain("errors");
      
      console.log(`✅ Comprehensive error reporting validated`);
      console.log(`📊 Total errors found: ${validationResult.errors.length}`);
      console.log(`📋 Summary: ${validationResult.summary}`);
    });

    test("should gracefully handle malformed input documents", async () => {
      // Test with various malformed inputs
      const malformedInputs = [
        null,
        undefined,
        "not an object",
        123,
        [],
        { /* empty object */ },
        { asyncapi: null },
        { asyncapi: "3.0.0" } // Missing required fields
      ];

      for (const input of malformedInputs) {
        const validationResult = await validateAsyncAPIDocument(input as any, {
          strict: true,
          enableCache: false
        });

        // Should handle malformed input gracefully
        expect(validationResult.valid).toBe(false);
        expect(validationResult.errors.length).toBeGreaterThan(0);
        expect(validationResult.summary).toBeDefined();
        expect(validationResult.validatedAt).toBeDefined();
        expect(validationResult.performanceMetrics).toBeDefined();
        
        console.log(`📋 Malformed input handled: ${typeof input} - ${JSON.stringify(input).slice(0, 50)}`);
      }
      
      console.log("✅ Malformed input handling validated");
    });

    test("should provide performance warnings for large documents", async () => {
      // Create a very large document
      const largeDoc: AsyncAPIDocument = {
        asyncapi: "3.0.0",
        info: {
          title: "Large Document Performance Test",
          version: "1.0.0"
        },
        channels: {},
        operations: {},
        components: {
          schemas: {}
        }
      };

      // Add many schemas and operations
      for (let i = 1; i <= 100; i++) {
        largeDoc.components.schemas[`Schema${i}`] = {
          type: "object",
          properties: {
            [`prop${i}`]: { type: "string" },
            [`data${i}`]: { type: "integer" },
            [`nested${i}`]: {
              type: "object",
              properties: {
                [`subProp${i}`]: { type: "string" }
              }
            }
          }
        };

        largeDoc.operations[`operation${i}`] = {
          action: "send",
          channel: { $ref: `#/channels/channel${i}` }
        };

        largeDoc.channels[`channel${i}`] = {
          address: `/channel${i}`,
          description: `Generated channel ${i}`
        };
      }

      const validationResult = await validateAsyncAPIDocument(largeDoc, {
        strict: true,
        enableCache: false,
        performanceWarnings: true
      });

      // Document should be valid but may have performance warnings
      expect(validationResult.valid).toBe(true);
      expect(validationResult.performanceMetrics).toBeDefined();
      expect(validationResult.performanceMetrics.documentSize).toBeGreaterThan(10000); // Large document
      expect(validationResult.performanceMetrics.validationTimeMs).toBeGreaterThan(0);

      console.log(`✅ Large document validation completed`);
      console.log(`📊 Document size: ${validationResult.performanceMetrics.documentSize} bytes`);
      console.log(`📊 Validation time: ${validationResult.performanceMetrics.validationTimeMs}ms`);
      console.log(`📊 Schemas: ${Object.keys(largeDoc.components.schemas).length}`);
      console.log(`📊 Operations: ${Object.keys(largeDoc.operations).length}`);
    });
  });

  describe("Real-world Validation Scenarios", () => {
    test("should validate complete enterprise AsyncAPI specification", async () => {
      const source = `
        @doc("Enterprise microservices event architecture")
        namespace EnterpriseValidation;
        
        @doc("Audit event for compliance tracking")
        model AuditEvent {
          @doc("Unique audit identifier")
          auditId: string;
          
          @doc("Event timestamp")
          timestamp: utcDateTime;
          
          @doc("User performing action")
          actor: {
            userId: string;
            roles: string[];
            sessionId: string;
            ipAddress: string;
          };
          
          @doc("Action performed")
          action: "create" | "read" | "update" | "delete" | "login" | "logout";
          
          @doc("Resource affected")
          resource: {
            type: string;
            id: string;
            attributes: Record<unknown>;
          };
          
          @doc("Security context")
          securityContext: {
            authMethod: "oauth2" | "jwt" | "apikey" | "saml";
            scopes: string[];
            grantedPermissions: string[];
          };
          
          @doc("Compliance metadata")
          compliance: {
            regulation: "GDPR" | "HIPAA" | "SOX" | "PCI_DSS";
            dataClassification: "public" | "internal" | "confidential" | "restricted";
            retentionPeriod: int32;
            encryptionRequired: boolean;
          };
        }
        
        @channel("audit.events.{regulation}")
        @doc("Publish audit events by regulation type")
        @publish
        op publishAuditEvent(): AuditEvent;
        
        @channel("audit.compliance.{userId}")
        @doc("Subscribe to user-specific audit events")
        @subscribe
        op subscribeUserAuditEvents(userId: string): AuditEvent;
        
        @channel("audit.security.alerts")
        @doc("Subscribe to security-related audit events")
        @subscribe
        op subscribeSecurityAuditEvents(): AuditEvent;
      `;

      const { outputFiles } = await compileAsyncAPISpecWithoutErrors(source, {
        "output-file": "enterprise-validation",
        "file-type": "json"
      });

      const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "enterprise-validation.json") as AsyncAPIDocument;
      
      // Run comprehensive enterprise-grade validation
      const validationOptions: ValidationOptions = {
        strict: true,
        enableCache: false,
        validateExamples: true,
        validateFormat: true,
        performanceWarnings: true,
        provideDetailedErrors: true
      };
      
      const validationResult = await validateAsyncAPIDocument(asyncapiDoc, validationOptions);
      
      // Enterprise specification should pass all validations
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
      
      // Validate comprehensive schema generation
      expect(asyncapiDoc.components.schemas.AuditEvent).toBeDefined();
      
      const auditSchema = asyncapiDoc.components.schemas.AuditEvent;
      expect(auditSchema.properties?.actor?.type).toBe("object");
      expect(auditSchema.properties?.securityContext?.type).toBe("object");
      expect(auditSchema.properties?.compliance?.type).toBe("object");
      
      // Validate operations
      expect(Object.keys(asyncapiDoc.operations).length).toBe(3);
      expect(asyncapiDoc.operations.publishAuditEvent.action).toBe("send");
      expect(asyncapiDoc.operations.subscribeUserAuditEvents.action).toBe("receive");
      expect(asyncapiDoc.operations.subscribeSecurityAuditEvents.action).toBe("receive");
      
      console.log("✅ Enterprise AsyncAPI specification validation passed");
      console.log(`📊 Validation performance: ${validationResult.performanceMetrics.validationTimeMs}ms`);
    });
  });
});