/**
 * Real-World Pattern Structural Assertions
 *
 * Verifies that specific TYPE PATTERNS from real projects render correctly
 * in the generated AsyncAPI JSON Schema. Each describe block targets one
 * pattern category and checks the exact JSON Schema output.
 *
 * These tests catch silent rendering bugs where the emitter produces valid
 * AsyncAPI but with WRONG schema content (e.g., arrays rendered as strings,
 * inheritance flattened instead of allOf, enums missing values).
 */

import { compileAsyncAPI } from "../utils/test-helpers.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const fixturesDir = join(import.meta.dirname, "fixtures");

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, `${name}.tsp`), "utf8");
}

async function getSchemas(fixtureName: string): Promise<Record<string, any>> {
  const result = await compileAsyncAPI(loadFixture(fixtureName));
  const schemas = result.asyncApiDoc?.components?.schemas ?? {};
  return schemas as Record<string, any>;
}

describe("real-world Pattern: Multi-level Scalar Inheritance (Kernovia)", () => {
  it("should render scalar extends string as type string", async () => {
    const schemas = await getSchemas("kernovia-branded-types");
    expect(schemas.NanoID?.type).toBe("string");
  });

  it("should render second-level scalar inheritance", async () => {
    const schemas = await getSchemas("kernovia-branded-types");
    expect(schemas.ActorId?.type).toBe("string");
  });

  it("should render scalar-derived types as string", async () => {
    const schemas = await getSchemas("kernovia-branded-types");
    expect(schemas.SemanticVersion?.type).toBe("string");
  });
});

describe("real-world Pattern: Generic Models with Spread (EventSourcing)", () => {
  it("should flatten spread of generic with string literal arg", async () => {
    const schemas = await getSchemas("eventsourcing-generics");
    // EventId spreads BrandedId<"event">, which has value: string and __brand: "event"
    const eventId = schemas.EventId;
    expect(eventId?.type).toBe("object");
    expect(eventId?.properties?.value).toBeDefined();
    expect(eventId?.properties?.value?.type).toBe("string");
  });

  it("should instantiate generic with different type arguments", async () => {
    const schemas = await getSchemas("eventsourcing-generics");
    // EventId and AggregateId should both exist but be separate schemas
    expect(schemas.EventId).toBeDefined();
    expect(schemas.AggregateId).toBeDefined();
    expect(schemas.CommandId).toBeDefined();
  });

  it("should render generic base event with inline type parameter", async () => {
    const schemas = await getSchemas("eventsourcing-generics");
    const userCreated = schemas.UserCreatedEvent;
    expect(userCreated).toBeDefined();
    expect(userCreated?.type).toBe("object");
    // Inherited properties from BaseEvent<TData> are via allOf
    expect(userCreated?.allOf).toBeDefined();
    expect(userCreated?.properties?.eventType).toBeDefined();
  });
});

describe("real-world Pattern: Named Union (EventSourcing)", () => {
  it("should render named union members as separate schemas", async () => {
    const schemas = await getSchemas("eventsourcing-generics");
    // Union variants should exist as named schemas
    expect(schemas.CommandSuccess).toBeDefined();
    expect(schemas.CommandFailure).toBeDefined();
  });
});

describe("real-world Pattern: 3-Level Model Inheritance (Blog Campaign)", () => {
  it("should emit allOf for model inheritance chain", async () => {
    const schemas = await getSchemas("blog-campaign-nesting");
    // CampaignCreatedEvent extends DomainEvent extends nothing special
    // But Campaign extends AggregateRoot should have allOf
    const campaign = schemas.Campaign;
    expect(campaign?.allOf).toBeDefined();
    const allOf = campaign?.allOf ?? [];
    expect(allOf.some((r: any) => r.$ref?.includes("AggregateRoot"))).toBe(
      true,
    );
  });

  it("should emit deeply nested anonymous objects (4+ levels)", async () => {
    const schemas = await getSchemas("blog-campaign-nesting");
    // CampaignBudget.alerts is a nested object with budgetThreshold etc.
    const budget = schemas.CampaignBudget;
    expect(budget?.type).toBe("object");
    const alerts = budget?.properties?.alerts;
    expect(alerts?.type).toBe("object");
    expect(alerts?.properties?.budgetThreshold).toBeDefined();
    expect(alerts?.properties?.alertRecipients).toBeDefined();
  });

  it("should emit array of inline anonymous objects", async () => {
    const schemas = await getSchemas("blog-campaign-nesting");
    // CampaignSchedule.optimalTimes is an array of inline objects
    const schedule = schemas.CampaignSchedule;
    const optimalTimes = schedule?.properties?.optimalTimes;
    expect(optimalTimes?.type).toBe("array");
    expect(optimalTimes?.items?.type).toBe("object");
    expect(optimalTimes?.items?.properties?.platform).toBeDefined();
  });

  it("should emit decimal type as string with format", async () => {
    const schemas = await getSchemas("blog-campaign-nesting");
    // Decimal is rendered as type:string with format:decimal
    const totalBudget = schemas.CampaignBudget?.properties?.totalBudget;
    expect(totalBudget?.type).toBe("string");
    expect(totalBudget?.format).toBe("decimal");
  });
});

describe("real-world Pattern: Enums with/without Values (Accountability)", () => {
  it("should emit enum WITH string values", async () => {
    const schemas = await getSchemas("accountability-domain");
    expect(schemas.GoalStatus?.enum).toStrictEqual([
      "active",
      "paused",
      "completed",
      "abandoned",
    ]);
  });

  it("should emit enum WITHOUT explicit values (implicit string)", async () => {
    const schemas = await getSchemas("accountability-domain");
    expect(schemas.GoalCategory?.enum).toBeDefined();
    expect(schemas.GoalCategory?.enum?.length).toBe(6);
  });

  it("should apply @format decorator correctly", async () => {
    const schemas = await getSchemas("accountability-domain");
    const userProfile = schemas.UserProfile;
    expect(userProfile?.properties?.id?.format).toBe("uuid");
    expect(userProfile?.properties?.email?.format).toBe("email");
  });

  it("should apply @pattern with regex", async () => {
    const schemas = await getSchemas("accountability-domain");
    const prefs = schemas.NotificationPreferences;
    const quietHours = prefs?.properties?.quietHours;
    expect(quietHours?.properties?.startTime?.pattern).toBeDefined();
    expect(quietHours?.properties?.endTime?.pattern).toBeDefined();
  });
});

describe("real-world Pattern: Scalar Extending Numeric + uint Types (Milestone)", () => {
  it("should render scalar extends uint8", async () => {
    const schemas = await getSchemas("milestone-analysis");
    // Custom scalars render as their base intrinsic type
    expect(schemas.CompletionPercentage).toBeDefined();
  });

  it("should render uint32 as integer", async () => {
    const schemas = await getSchemas("milestone-analysis");
    const milestone = schemas.Milestone;
    expect(milestone?.properties?.number?.type).toBe("integer");
  });

  it("should apply @format uuid and uri", async () => {
    const schemas = await getSchemas("milestone-analysis");
    const milestone = schemas.Milestone;
    expect(milestone?.properties?.id?.format).toBe("uuid");
    const repo = schemas.RepositoryInfo;
    expect(repo?.properties?.url?.format).toBe("uri");
  });

  it("should render float64 as number", async () => {
    const schemas = await getSchemas("milestone-analysis");
    const stats = schemas.MilestoneStats;
    expect(stats?.properties?.velocity?.type).toBe("number");
  });
});

describe("real-world Pattern: Full E-commerce Domain", () => {
  it("should produce 15+ schemas for the full domain", async () => {
    const schemas = await getSchemas("ecommerce-complete");
    expect(Object.keys(schemas).length).toBeGreaterThanOrEqual(15);
  });

  it("should emit $ref for array of named model (OrderItem[])", async () => {
    const schemas = await getSchemas("ecommerce-complete");
    const items = schemas.Order?.properties?.items;
    expect(items?.type).toBe("array");
    expect(items?.items?.$ref).toContain("OrderItem");
  });

  it("should emit $ref for nested named model (shippingAddress: Address)", async () => {
    const schemas = await getSchemas("ecommerce-complete");
    const addr = schemas.Order?.properties?.shippingAddress;
    expect(addr?.$ref).toContain("Address");
  });

  it("should emit default values correctly", async () => {
    const schemas = await getSchemas("ecommerce-complete");
    expect(schemas.Customer?.properties?.loyaltyTier?.default).toBe("bronze");
    expect(schemas.Customer?.properties?.totalOrders?.default).toBe(0);
  });

  it("should emit decimal for price fields as string with format", async () => {
    const schemas = await getSchemas("ecommerce-complete");
    const price = schemas.Product?.properties?.price;
    expect(price?.format).toBe("decimal");
  });

  it("should emit string literal union for status fields", async () => {
    const schemas = await getSchemas("ecommerce-complete");
    expect(schemas.Order?.properties?.status?.enum).toBeDefined();
    expect(schemas.Order?.properties?.status?.enum?.length).toBe(7);
  });
});
