import { compileAsyncAPI } from "../utils/test-helpers.js";
import YAML from "yaml";

describe("schema splitting (split-schemas option)", () => {
  const multiSchemaSource = `
    namespace SplitTest;

    model User {
      @doc("User identifier")
      id: string;
      @doc("Display name")
      name: string;
      email: string;
    }

    model Order {
      orderId: string;
      userId: string;
      total: decimal;
      status: "pending" | "shipped" | "delivered";
    }

    @channel("users.created")
    op publishUserCreated(): User;

    @channel("orders.placed")
    op publishOrderPlaced(): Order;
  `;

  it("produces multiple output files when split-schemas is enabled", async () => {
    const result = await compileAsyncAPI(multiSchemaSource, {
      "split-schemas": true,
      "file-type": "json",
    } as never);

    const outputFiles = [...result.allOutputFiles.keys()];
    expect(outputFiles.length).toBeGreaterThanOrEqual(3);
    expect(outputFiles).toContain("asyncapi.json");
    expect(outputFiles.some((f) => f.startsWith("User."))).toBe(true);
    expect(outputFiles.some((f) => f.startsWith("Order."))).toBe(true);
  });

  it("removes schemas from components in the main document", async () => {
    const result = await compileAsyncAPI(multiSchemaSource, {
      "split-schemas": true,
      "file-type": "json",
    } as never);

    const mainDoc = result.asyncApiDoc;
    expect(mainDoc).not.toBeNull();
    expect(mainDoc!.components?.schemas).toBeUndefined();
  });

  it("rewrites $ref values in the main document to external paths", async () => {
    const result = await compileAsyncAPI(multiSchemaSource, {
      "split-schemas": true,
      "file-type": "json",
    } as never);

    const mainDoc = result.asyncApiDoc!;
    const mainJson = JSON.stringify(mainDoc);

    expect(mainJson).not.toContain("#/components/schemas/User");
    expect(mainJson).not.toContain("#/components/schemas/Order");

    expect(mainJson).toContain("schemas/User.json");
    expect(mainJson).toContain("schemas/Order.json");
  });

  it("writes valid schema objects to external files", async () => {
    const result = await compileAsyncAPI(multiSchemaSource, {
      "split-schemas": true,
      "file-type": "json",
    } as never);

    const userFile = result.allOutputFiles.get("User.json");
    expect(userFile).toBeDefined();

    const userSchema = JSON.parse(userFile!);
    expect(userSchema.type).toBe("object");
    expect(userSchema.properties).toBeDefined();
    expect(userSchema.properties.id).toBeDefined();
    expect(userSchema.properties.id.description).toBe("User identifier");
    expect(userSchema.properties.name).toBeDefined();
    expect(userSchema.properties.email).toBeDefined();
    expect(userSchema.required).toContain("id");
    expect(userSchema.required).toContain("name");
    expect(userSchema.required).toContain("email");

    const orderFile = result.allOutputFiles.get("Order.json");
    expect(orderFile).toBeDefined();

    const orderSchema = JSON.parse(orderFile!);
    expect(orderSchema.type).toBe("object");
    expect(orderSchema.properties.orderId).toBeDefined();
    expect(orderSchema.properties.status).toBeDefined();
    expect(orderSchema.properties.status.enum).toStrictEqual([
      "pending",
      "shipped",
      "delivered",
    ]);
  });

  it("works with YAML file type", async () => {
    const result = await compileAsyncAPI(multiSchemaSource, {
      "split-schemas": true,
      "file-type": "yaml",
    } as never);

    const userFile = result.allOutputFiles.get("User.yaml");
    expect(userFile).toBeDefined();

    const userSchema = YAML.parse(userFile!);
    expect(userSchema.type).toBe("object");
    expect(userSchema.properties.id).toBeDefined();
  });

  it("does not split when split-schemas is not set", async () => {
    const result = await compileAsyncAPI(multiSchemaSource, {
      "file-type": "json",
    } as never);

    const outputFiles = [...result.allOutputFiles.keys()];
    expect(outputFiles).toStrictEqual(["asyncapi.json"]);

    const doc = result.asyncApiDoc!;
    expect(doc.components?.schemas).toBeDefined();
    expect(doc.components!.schemas!.User).toBeDefined();
    expect(doc.components!.schemas!.Order).toBeDefined();
  });

  it("does not split when split-schemas is false", async () => {
    const result = await compileAsyncAPI(multiSchemaSource, {
      "split-schemas": false,
      "file-type": "json",
    } as never);

    const outputFiles = [...result.allOutputFiles.keys()];
    expect(outputFiles).toStrictEqual(["asyncapi.json"]);

    expect(result.asyncApiDoc!.components?.schemas).toBeDefined();
  });

  it("handles document with no schemas gracefully", async () => {
    const noSchemaSource = `
      namespace NoSchemaTest;

      @channel("events.basic")
      op publishBasic(): string;
    `;

    const result = await compileAsyncAPI(noSchemaSource, {
      "split-schemas": true,
      "file-type": "json",
    } as never);

    expect(
      result.diagnostics.filter((d) => d.severity === "error"),
    ).toStrictEqual([]);
    const outputFiles = [...result.allOutputFiles.keys()];
    expect(outputFiles).toStrictEqual(["asyncapi.json"]);
  });

  it("rewrites nested $ref in schema properties", async () => {
    const nestedSource = `
      namespace NestedRef;

      model Address {
        street: string;
        city: string;
      }

      model Person {
        name: string;
        address: Address;
      }

      @channel("people.created")
      op publishPerson(): Person;
    `;

    const result = await compileAsyncAPI(nestedSource, {
      "split-schemas": true,
      "file-type": "json",
    } as never);

    const personFile = result.allOutputFiles.get("Person.json");
    expect(personFile).toBeDefined();

    const personSchema = JSON.parse(personFile!);
    expect(personSchema.properties.address.$ref).toBe("schemas/Address.json");
  });
});
