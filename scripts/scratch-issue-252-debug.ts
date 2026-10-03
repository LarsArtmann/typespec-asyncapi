import { NodeHost, compile } from "@typespec/compiler";
import { resolve as resolvePath } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

const dir = resolvePath(import.meta.dirname, "ns-test");
mkdirSync(dir, { recursive: true });

const src = `
namespace A.B;

model M { x: string; }

namespace A.B.C {
  op c(): void;
}

namespace A.BC {
  op d(): void;
}
`;
writeFileSync(resolvePath(dir, "main.tsp"), src);
const program = await compile(NodeHost, resolvePath(dir, "main.tsp"), { noEmit: true });
const global = program.getGlobalNamespaceType();

function dumpNs(ns, depth) {
  const indent = "  ".repeat(depth);
  const ops = [...ns.operations.keys()].join(",") || "-";
  console.log(`${indent}ns ${ns.name || "<global>"} ops=[${ops}]`);
  for (const child of ns.namespaces.values()) dumpNs(child, depth + 1);
}
dumpNs(global, 0);
