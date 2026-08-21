import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync(
  "rg -l '\\.bindings!|\\.securitySchemes!|\\.messages!|\\.items!|\\.items\\.' test/ --glob '*.ts'",
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
  // (also destructuring: `const { k } = <expr>.bindings!;`)
  content = content.replace(
    /((?:const\s+(?:\{[^}]+\}|\w+)\s*=|return)\s+)([^;\n]+?)\.bindings!;/g,
    (_m: string, kw: string, expr: string) => {
      changes++;
      return `${kw}inlineObject(${expr}.bindings, "bindings");`;
    },
  );

  // Form A2: bare local `bindings!.prop` -> inlineObject(bindings, ...).prop
  content = content.replace(
    /(?<![\w.$])bindings!\.(\w+)/g,
    (match: string, prop: string) => {
      if (match.includes("inlineObject(") || prop === "$ref") {
        return match;
      }
      changes++;
      return `inlineObject(bindings, "bindings").${prop}`;
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
    // Form A: `const x = <expr>.<field>!<key>;` -> wrap the keyed value
    content = content.replace(
      new RegExp(
        `((?:const\\s+\\w+\\s*=)\\s+)([^;\\n]+?)\\.${field}!((?:\\.[A-Za-z_$][\\w$]*|\\[[^\\]\\n]*\\]));`,
        "g",
      ),
      (_m: string, kw: string, expr: string, key: string) => {
        changes++;
        return `${kw}inlineObject(${expr}.${field}!${key}, "${label}");`;
      },
    );
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

  // --- JsonSchema.items: union sits on the field (schema | schema[] | boolean) ---
  // Only single-segment post (`X.items.type`), not nested `X.items.items.$ref`.
  content = content.replace(
    /([A-Za-z_$][\w$]*)((?:\.(?!items)[A-Za-z_$][\w$]*!?|\[[^\]\n]*\]!?)*?)\.items!?\.(\w+)/g,
    (match: string, head: string, pre: string, prop: string) => {
      if (match.includes("asJsonSchema(") || prop === "items") {
        return match;
      }
      changes++;
      return `asJsonSchema(${head}${pre}.items, "items").${prop}`;
    },
  );

  if (changes > 0) {
    writeFileSync(file, content);
    totalChanges += changes;
    console.log(`${file}: ${changes}`);
  }
}

console.log(`total: ${totalChanges}`);
