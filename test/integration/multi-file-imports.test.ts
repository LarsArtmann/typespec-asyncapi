/**
 * Tests: Multi-file TypeSpec imports
 *
 * Verifies that the emitter correctly handles TypeSpec specs split across
 * multiple .tsp files using `import "./file.tsp"` statements.
 *
 * Note: For multi-file specs, we include `import` and `using` explicitly
 * in main.tsp so the tester doesn't prepend them in wrong order.
 */

import { compileAsyncAPI } from "../../test/utils/test-helpers.js";

const IMPORT = 'import "@lars-artmann/typespec-asyncapi";';
const USING = "using TypeSpec.AsyncAPI;";

describe("multi-file imports", () => {
  it("handles models imported from a separate file", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI({
      "main.tsp": `
        ${IMPORT}
        import "./models.tsp";
        ${USING}

        @service(#{title: "Multi-file Test"})
        @defaultContentType("application/json")
        namespace Api;

        @channel("user.events")
        op publishUserCreated(data: UserCreated): void;
      `,
      "models.tsp": `
        namespace Api;

        model UserCreated {
          userId: string;
          eventTime: string;
        }
      `,
    } as never);

    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors).toHaveLength(0);
    expect(asyncApiDoc).toBeTruthy();

    const schema = asyncApiDoc!.components?.schemas?.UserCreated;
    expect(schema).toBeTruthy();
    expect(schema?.type).toBe("object");
    expect(schema?.properties?.userId?.type).toBe("string");
  });

  it("handles models with nested imports (chain)", async () => {
    const { asyncApiDoc } = await compileAsyncAPI({
      "main.tsp": `
        ${IMPORT}
        import "./operations.tsp";
        ${USING}
      `,
      "operations.tsp": `
        import "./models.tsp";
        using TypeSpec.AsyncAPI;

        @service(#{title: "Chain Test"})
        @defaultContentType("application/json")
        namespace Api;

        @channel("orders")
        op publishOrder(data: Order): void;
      `,
      "models.tsp": `
        namespace Api;

        model Order {
          id: string;
          customer: Customer;
        }

        model Customer {
          name: string;
          email: string;
        }
      `,
    } as never);

    expect(asyncApiDoc).toBeTruthy();
    expect(asyncApiDoc!.components?.schemas?.Order).toBeTruthy();
    expect(asyncApiDoc!.components?.schemas?.Customer).toBeTruthy();
    const orderSchema = asyncApiDoc!.components?.schemas?.Order;
    expect(orderSchema?.properties?.customer?.$ref).toBe(
      "#/components/schemas/Customer",
    );
  });

  it("handles shared enum definitions across files", async () => {
    const { asyncApiDoc } = await compileAsyncAPI({
      "main.tsp": `
        ${IMPORT}
        import "./enums.tsp";
        import "./models.tsp";
        ${USING}

        @service(#{title: "Enum Test"})
        namespace Api;

        @channel("events")
        op publishEvent(data: Event): void;
      `,
      "enums.tsp": `
        namespace Api;

        enum Status {
          active: "active",
          inactive: "inactive",
        }
      `,
      "models.tsp": `
        namespace Api;

        model Event {
          status: Status;
          payload: string;
        }
      `,
    } as never);

    expect(asyncApiDoc).toBeTruthy();
    expect(asyncApiDoc!.components?.schemas?.Status).toBeTruthy();
    expect(asyncApiDoc!.components?.schemas?.Event).toBeTruthy();
    const eventSchema = asyncApiDoc!.components?.schemas?.Event;
    expect(eventSchema?.properties?.status?.$ref).toBe(
      "#/components/schemas/Status",
    );
  });

  it("handles cross-file model arrays", async () => {
    const { asyncApiDoc } = await compileAsyncAPI({
      "main.tsp": `
        ${IMPORT}
        import "./models.tsp";
        ${USING}

        @service(#{title: "Array Test"})
        namespace Api;

        @channel("bulk")
        op publishBulk(data: Batch): void;
      `,
      "models.tsp": `
        namespace Api;

        model Batch {
          items: Item[];
        }

        model Item {
          sku: string;
          quantity: int32;
        }
      `,
    } as never);

    expect(asyncApiDoc).toBeTruthy();
    const batchSchema = asyncApiDoc!.components?.schemas?.Batch;
    expect(batchSchema).toBeTruthy();
    const itemsArray = batchSchema?.properties?.items;
    expect(itemsArray?.type).toBe("array");
    expect(itemsArray?.items?.$ref).toBe("#/components/schemas/Item");
  });

  it("handles @doc on imported models", async () => {
    const { asyncApiDoc } = await compileAsyncAPI({
      "main.tsp": `
        ${IMPORT}
        import "./models.tsp";
        ${USING}

        @service(#{title: "Doc Test"})
        namespace Api;

        @channel("events")
        op publish(data: Documented): void;
      `,
      "models.tsp": `
        namespace Api;

        @doc("A documented model from another file")
        model Documented {
          @doc("The name field")
          name: string;
        }
      `,
    } as never);

    expect(asyncApiDoc).toBeTruthy();
    const schema = asyncApiDoc!.components?.schemas?.Documented;
    expect(schema?.description).toBe("A documented model from another file");
    expect(schema?.properties?.name?.description).toBe("The name field");
  });
});
