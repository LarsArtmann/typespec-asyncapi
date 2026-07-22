/**
 * Template Spread & Late-Bound Member Resolution Tests
 *
 * TypeSpec 1.13.0 improved late-bound member resolution for models that use
 * template spreads or `is` bases. These tests verify our emitter handles
 * these patterns correctly.
 *
 * @see https://typespec.io/release-notes/typespec-1-13-0/
 */
import { describe, it, expect } from "vitest";
import { compileAsyncAPIWithoutErrors } from "../utils/test-helpers.js";

describe("Template Spread Patterns (TypeSpec 1.13 Compatibility)", () => {
  it("should generate schema for model using template spread", async () => {
    const source = `
      model BaseEntity {
        id: string;
        createdAt: string;
      }

      model Timestamps {
        updatedAt: string;
        deletedAt?: string;
      }

      model User {
        ...BaseEntity;
        ...Timestamps;
        name: string;
        email: string;
      }

      @channel("users")
      @publish
      op publishUser(): User;
    `;

    const result = await compileAsyncAPIWithoutErrors(source);
    const spec = result.asyncApiDoc;

    expect(spec).toBeDefined();
    const schema = spec?.components?.schemas?.User as {
      type: string;
      properties: Record<string, { type: string }>;
      required: string[];
    };
    expect(schema).toBeDefined();
    expect(schema.type).toBe("object");

    // Spread properties should be included
    expect(schema.properties.id).toBeDefined();
    expect(schema.properties.createdAt).toBeDefined();
    expect(schema.properties.updatedAt).toBeDefined();
    expect(schema.properties.name).toBeDefined();
    expect(schema.properties.email).toBeDefined();
  });

  it("should generate schema for model using 'is' inheritance", async () => {
    const source = `
      model Animal {
        species: string;
        age: int32;
      }

      model Dog is Animal {
        breed: string;
      }

      @channel("dogs")
      @publish
      op publishDog(): Dog;
    `;

    const result = await compileAsyncAPIWithoutErrors(source);
    const spec = result.asyncApiDoc;

    expect(spec).toBeDefined();
    const schema = spec?.components?.schemas?.Dog as {
      type: string;
      properties: Record<string, { type: string }>;
      required: string[];
    };
    expect(schema).toBeDefined();
    expect(schema.type).toBe("object");

    // Inherited properties
    expect(schema.properties.species).toBeDefined();
    expect(schema.properties.age).toBeDefined();
    // Own properties
    expect(schema.properties.breed).toBeDefined();
  });

  it("should handle generic template with spread", async () => {
    const source = `
      model Paginated<T> {
        items: T[];
        totalCount: int32;
        nextPage?: string;
      }

      model Product {
        sku: string;
        price: float32;
      }

      model ProductPage is Paginated<Product> {
        category: string;
      }

      @channel("products")
      @publish
      op publishProducts(): ProductPage;
    `;

    const result = await compileAsyncAPIWithoutErrors(source);
    const spec = result.asyncApiDoc;

    expect(spec).toBeDefined();
    const schema = spec?.components?.schemas?.ProductPage;
    expect(schema).toBeDefined();
  });

  it("should handle optional spread properties", async () => {
    const source = `
      model Required {
        mandatory: string;
      }

      model Optional {
        optional?: string;
      }

      model Combined {
        ...Required;
        ...Optional;
        own: string;
      }

      @channel("combined")
      @publish
      op publishCombined(): Combined;
    `;

    const result = await compileAsyncAPIWithoutErrors(source);
    const spec = result.asyncApiDoc;

    expect(spec).toBeDefined();
    const schema = spec?.components?.schemas?.Combined as {
      type: string;
      properties: Record<string, { type: string }>;
      required: string[];
    };
    expect(schema).toBeDefined();
    expect(schema.properties.mandatory).toBeDefined();
    expect(schema.properties.optional).toBeDefined();
    expect(schema.properties.own).toBeDefined();

    // mandatory and own should be required; optional should not
    expect(schema.required).toContain("mandatory");
    expect(schema.required).toContain("own");
    expect(schema.required).not.toContain("optional");
  });
});
