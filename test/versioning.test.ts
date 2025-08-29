/**
 * Tests for TypeSpec versioning integration in AsyncAPI emitter
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createTestHost } from "@typespec/compiler/testing";
import { AsyncAPITestLibrary } from "./test-host.js";
import { resolveVersioningModule, isVersioningAvailable } from "../src/versioning-module.js";

describe("AsyncAPI Versioning Integration", () => {
  let testHost: any;

  beforeEach(async () => {
    testHost = await createTestHost({
      libraries: [AsyncAPITestLibrary],
    });
  });

  describe("Versioning Module Resolution", () => {
    it("should resolve versioning module when available", async () => {
      const versioningModule = await resolveVersioningModule();
      
      if (versioningModule) {
        expect(versioningModule).toBeDefined();
        expect(typeof versioningModule.getVersioningMutators).toBe("function");
        expect(typeof versioningModule.getAddedOnVersions).toBe("function");
        expect(typeof versioningModule.getRemovedOnVersions).toBe("function");
      }
    });

    it("should check versioning availability", async () => {
      const available = await isVersioningAvailable();
      expect(typeof available).toBe("boolean");
    });
  });

  describe("Non-Versioned Service", () => {
    it("should generate single AsyncAPI document for non-versioned service", async () => {
      const code = `
        @service({ title: "Simple API", version: "1.0.0" })
        namespace SimpleAPI;
        
        model User {
          id: string;
          name: string;
        }
        
        interface UserOperations {
          @route("/users")
          getUser(): User;
        }
      `;

      testHost.addTypeSpecFile("main.tsp", code);
      const emitted = await testHost.compileAndEmit(AsyncAPITestLibrary, {
        "file-type": "json",
      });

      expect(emitted.length).toBe(1);
      const output = JSON.parse(emitted[0].content);
      expect(output.info.version).toBe("1.0.0");
      expect(output.info.title).toBe("Simple API");
    });
  });

  describe("Versioned Service", () => {
    it("should generate multiple AsyncAPI documents for versioned service", async () => {
      const code = `
        import "@typespec/versioning";
        using TypeSpec.Versioning;
        
        enum APIVersions {
          v1_0: "1.0",
          v2_0: "2.0",
        }
        
        @versioned(APIVersions)
        @service({ title: "Versioned API", version: "2.0" })
        namespace VersionedAPI;
        
        model User {
          id: string;
          name: string;
          
          @added(APIVersions.v2_0)
          email?: string;
          
          @removed(APIVersions.v2_0)
          phone?: string;
        }
        
        interface UserOperations {
          @route("/users")
          getUser(): User;
          
          @added(APIVersions.v2_0)
          @route("/users/search")
          searchUsers(): User[];
        }
      `;

      testHost.addTypeSpecFile("main.tsp", code);
      const emitted = await testHost.compileAndEmit(AsyncAPITestLibrary, {
        "file-type": "json",
      });

      // Should generate multiple files for different versions
      expect(emitted.length).toBeGreaterThan(1);
      
      // Check that versions are different
      const versions = emitted.map(file => {
        const content = JSON.parse(file.content);
        return content.info.version;
      });
      
      expect(versions).toContain("1.0");
      expect(versions).toContain("2.0");
    });

    it("should handle @added properties correctly", async () => {
      const code = `
        import "@typespec/versioning";
        using TypeSpec.Versioning;
        
        enum APIVersions {
          v1_0: "1.0",
          v2_0: "2.0",
        }
        
        @versioned(APIVersions)
        @service({ title: "Property Evolution API" })
        namespace PropertyEvolutionAPI;
        
        model User {
          id: string;
          name: string;
          
          @added(APIVersions.v2_0)
          @doc("Email address added in v2.0")
          email?: string;
        }
        
        interface UserOps {
          @route("/users")
          getUser(): User;
        }
      `;

      testHost.addTypeSpecFile("main.tsp", code);
      const emitted = await testHost.compileAndEmit(AsyncAPITestLibrary, {
        "file-type": "json",
      });

      const v1Output = emitted.find(file => 
        JSON.parse(file.content).info.version === "1.0"
      );
      const v2Output = emitted.find(file => 
        JSON.parse(file.content).info.version === "2.0"
      );

      expect(v1Output).toBeDefined();
      expect(v2Output).toBeDefined();

      const v1Schema = JSON.parse(v1Output!.content);
      const v2Schema = JSON.parse(v2Output!.content);

      // v1 should not have email property
      const v1UserSchema = v1Schema.components.schemas.User;
      expect(v1UserSchema.properties.email).toBeUndefined();

      // v2 should have email property
      const v2UserSchema = v2Schema.components.schemas.User;
      expect(v2UserSchema.properties.email).toBeDefined();
      expect(v2UserSchema.properties.email.type).toBe("string");
    });

    it("should handle @removed properties correctly", async () => {
      const code = `
        import "@typespec/versioning";
        using TypeSpec.Versioning;
        
        enum APIVersions {
          v1_0: "1.0",
          v2_0: "2.0",
        }
        
        @versioned(APIVersions)
        @service({ title: "Property Removal API" })
        namespace PropertyRemovalAPI;
        
        model User {
          id: string;
          name: string;
          
          @removed(APIVersions.v2_0)
          @deprecated("Use email instead")
          phone?: string;
        }
        
        interface UserOps {
          @route("/users") 
          getUser(): User;
        }
      `;

      testHost.addTypeSpecFile("main.tsp", code);
      const emitted = await testHost.compileAndEmit(AsyncAPITestLibrary, {
        "file-type": "json",
      });

      const v1Output = emitted.find(file => 
        JSON.parse(file.content).info.version === "1.0"
      );
      const v2Output = emitted.find(file => 
        JSON.parse(file.content).info.version === "2.0"
      );

      const v1Schema = JSON.parse(v1Output!.content);
      const v2Schema = JSON.parse(v2Output!.content);

      // v1 should have phone property
      const v1UserSchema = v1Schema.components.schemas.User;
      expect(v1UserSchema.properties.phone).toBeDefined();

      // v2 should not have phone property  
      const v2UserSchema = v2Schema.components.schemas.User;
      expect(v2UserSchema.properties.phone).toBeUndefined();
    });

    it("should handle version-specific operations", async () => {
      const code = `
        import "@typespec/versioning";
        using TypeSpec.Versioning;
        
        enum APIVersions {
          v1_0: "1.0",
          v2_0: "2.0",
        }
        
        @versioned(APIVersions)
        @service({ title: "Operation Evolution API" })
        namespace OperationEvolutionAPI;
        
        model User {
          id: string;
          name: string;
        }
        
        interface UserOps {
          @route("/users")
          getUser(): User;
          
          @added(APIVersions.v2_0)
          @route("/users/search")
          @doc("Advanced search added in v2.0")
          searchUsers(): User[];
        }
      `;

      testHost.addTypeSpecFile("main.tsp", code);
      const emitted = await testHost.compileAndEmit(AsyncAPITestLibrary, {
        "file-type": "json",
      });

      const v1Output = emitted.find(file => 
        JSON.parse(file.content).info.version === "1.0"
      );
      const v2Output = emitted.find(file => 
        JSON.parse(file.content).info.version === "2.0"
      );

      const v1Schema = JSON.parse(v1Output!.content);
      const v2Schema = JSON.parse(v2Output!.content);

      // v1 should only have getUser operation
      expect(Object.keys(v1Schema.operations)).toEqual(["getUser"]);

      // v2 should have both operations
      expect(Object.keys(v2Schema.operations)).toContain("getUser");
      expect(Object.keys(v2Schema.operations)).toContain("searchUsers");
    });
  });

  describe("Version Metadata", () => {
    it("should include version metadata in schemas", async () => {
      const code = `
        import "@typespec/versioning";
        using TypeSpec.Versioning;
        
        enum APIVersions {
          v1_0: "1.0",
          v2_0: "2.0",
        }
        
        @versioned(APIVersions)
        @service({ title: "Metadata API" })
        namespace MetadataAPI;
        
        model User {
          id: string;
          name: string;
        }
        
        interface UserOps {
          @route("/users")
          getUser(): User;
        }
      `;

      testHost.addTypeSpecFile("main.tsp", code);
      const emitted = await testHost.compileAndEmit(AsyncAPITestLibrary, {
        "file-type": "json",
        "versioning": {
          "include-version-info": true
        }
      });

      for (const file of emitted) {
        const schema = JSON.parse(file.content);
        const userSchema = schema.components.schemas.User;
        
        // Should include version metadata
        expect(userSchema["x-version"]).toBeDefined();
      }
    });
  });
});