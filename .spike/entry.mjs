import { createTestHost } from "@typespec/compiler/testing";
import { compile } from "@typespec/compiler";
globalThis.__probe = { createTestHost: typeof createTestHost, compile: typeof compile };
