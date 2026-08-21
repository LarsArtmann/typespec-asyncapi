import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync(
  "rg -l '\\.bindings!|\\.securitySchemes!|\\.messages!' test/ --glob '*.ts'",
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

// A property-access chain: identifier, then .prop / [index] / (call) segments,
// each optionally followed by a non-null "!". Cannot cross unbalanced parens.
const SEG = String.raw`(?:\.[A-Za-z_$][\w$]*!?|\[[^\]\n]*\]!?|\([^()\n]*\)!?)`;

let totalChanges = 0;

for (const file of files) {
  let content = readFileSync(file, "utf8");
  let changes = 0;

  // --- bindings: union sits on the field itself (ProtocolBindings | Ref) ---
  // Form A: `const x = <expr>.bindings!;` / `return <expr>.bindings!;`
  content = content.replace(
    /((?:const\s+\w+\s*=|return)\s+)([^;\n]+?)\.bindings!;/g,
    (_m: string, kw: string, expr: string) => {
      changes++;
      return `${kw}inlineObject(${expr}.bindings, "bindings");`;
    },
  );

  // Form B: <chain>.bindings!.<post>.<prop> -> wrap the bindings value only
  content = content.replace(
    new RegExp(
      `([A-Za-z_$][\\w$]*)((?:${SEG})*)\\.bindings!((?:${SEG})+)\\.(\\w+)`,
      "g",
    ),
    (match: string, head: string, pre: string, post: string, prop: string) => {
      if (match.includes("inlineObject(") || prop === "$ref") {
        return match;
      }
      changes++;
      return `inlineObject(${head}${pre}.bindings, "bindings")${post}.${prop}`;
    },
  );

  // --- securitySchemes / messages: union sits on the record VALUE ---
  for (const [field, label] of [
    ["securitySchemes", "security scheme"],
    ["messages", "message"],
  ] as const) {
    content = content.replace(
      new RegExp(
        `([A-Za-z_$][\\w$]*)((?:${SEG})*)\\.${field}!((?:${SEG})+)\\.(\\w+)`,
        "g",
      ),
      (match: string, head: string, pre: string, post: string, prop: string) => {
        if (match.includes("inlineObject(") || prop === "$ref") {
          return match;
        }
        changes++;
        const value = `${head}${pre}.${field}!${post}`;
        return `inlineObject(${value}, "${label}").${prop}`;
      },
    );
  }

  if (changes > 0) {
    writeFileSync(file, content);
    totalChanges += changes;
    console.log(`${file}: ${changes}`);
  }
}

console.log(`total: ${totalChanges}`);
