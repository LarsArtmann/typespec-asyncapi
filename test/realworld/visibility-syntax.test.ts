import { compileAsyncAPI } from "../utils/test-helpers.js";

describe("visibility syntax investigation", () => {
  it("string literal @visibility(\"read\") should compile", async () => {
    const source = `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Test" })
@server("dev", #{ url: "localhost:9092", protocol: "kafka" })
namespace TestVis;

model Foo {
  @visibility("read")
  id: string;
  @visibility("create")
  name: string;
  @visibility("none")
  secret: string;
}

@channel("test.foo")
@publish
op publishFoo(payload: Foo): void;
`;
    const result = await compileAsyncAPI(source);
    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(
      errors.map((e) => ({ code: e.code, message: e.message })),
    ).toStrictEqual([]);
  });
});
