import { getMultiState, getStateMap } from "../../src/state-compatibility.js";
import type { Program } from "@typespec/compiler";

describe("state-compatibility", () => {
  describe("getStateMap", () => {
    it("should return the state map when program.stateMap is available", () => {
      const mockMap = new Map();
      const program = { stateMap: () => mockMap } as unknown as Program;
      const result = getStateMap(program, Symbol("test"));
      expect(result).toBe(mockMap);
    });

    it("should throw when program.stateMap is not a function", () => {
      const program = {} as unknown as Program;
      expect(() => getStateMap(program, Symbol("test"))).toThrow(
        "program.stateMap is not available",
      );
    });

    it("should throw when stateMap returns a non-Map-like value", () => {
      const program = { stateMap: () => "not a map" } as unknown as Program;
      expect(() => getStateMap(program, Symbol("test"))).toThrow(
        "returned unexpected type",
      );
    });

    it("should throw when stateMap returns null", () => {
      const program = { stateMap: () => null } as unknown as Program;
      expect(() => getStateMap(program, Symbol("test"))).toThrow(
        "returned unexpected type",
      );
    });
  });

  describe("getMultiState", () => {
    it("should convert single values to arrays", () => {
      const typeKey = { kind: "Model" } as never;
      const mockMap = new Map([[typeKey, "single-value"]]);
      const program = { stateMap: () => mockMap } as unknown as Program;
      const result = getMultiState<string>(program, Symbol("test"));
      expect(result.get(typeKey)).toStrictEqual(["single-value"]);
    });

    it("should pass through arrays as-is", () => {
      const typeKey = { kind: "Model" } as never;
      const mockMap = new Map([[typeKey, ["a", "b"]]]);
      const program = { stateMap: () => mockMap } as unknown as Program;
      const result = getMultiState<string>(program, Symbol("test"));
      expect(result.get(typeKey)).toStrictEqual(["a", "b"]);
    });

    it("should skip undefined values", () => {
      const typeKey = { kind: "Model" } as never;
      const mockMap = new Map([[typeKey, undefined]]);
      const program = { stateMap: () => mockMap } as unknown as Program;
      const result = getMultiState<string>(program, Symbol("test"));
      expect(result.has(typeKey)).toBeFalsy();
    });
  });
});
