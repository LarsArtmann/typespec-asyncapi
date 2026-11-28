import { formatDiagnostic } from "@typespec/compiler";
import { parse, SyntaxKind } from "@typespec/compiler/ast";
import { fail } from "./diagnostics.js";
import { child } from "./input.js";

export interface SchemaAnnotations {
  annotations: Map<string, string[]>;
  messageDecorators?: string[];
}

export function extractSchemaDeclarations(
  content: string,
  schemas: ReadonlyMap<string, SchemaAnnotations>,
): string[] {
  const script = parse(content);
  const [error] = script.parseDiagnostics;
  if (error) {
    fail(
      "/components/schemas",
      `Schema conversion produced invalid TypeSpec: ${formatDiagnostic(error)}`,
    );
  }
  const remaining = new Set(schemas.keys());
  const declarations: string[] = [];
  for (const node of script.statements) {
    if (
      node.kind === SyntaxKind.ImportStatement ||
      node.kind === SyntaxKind.UsingStatement ||
      node.kind === SyntaxKind.NamespaceStatement
    ) {
      continue;
    }
    if (
      node.kind !== SyntaxKind.ModelStatement &&
      node.kind !== SyntaxKind.ScalarStatement
    ) {
      fail(
        "/components/schemas",
        "Unexpected declaration from schema converter.",
      );
    }
    const schema = schemas.get(node.id.sv);
    if (!schema || !remaining.delete(node.id.sv)) {
      fail(
        "/components/schemas",
        `Unexpected schema declaration '${node.id.sv}'.`,
      );
    }
    let start = node.pos;
    const parts: string[] = [];
    if (node.kind === SyntaxKind.ModelStatement) {
      for (const prop of node.properties) {
        if (prop.kind !== SyntaxKind.ModelProperty) {
          continue;
        }
        const decorators = schema.annotations.get(child("", prop.id.sv));
        if (decorators) {
          parts.push(
            content.slice(start, prop.pos),
            `${decorators.join("\n")}\n`,
          );
          start = prop.pos;
        }
      }
    }
    declarations.push(
      [
        ...(schema.messageDecorators ?? []),
        ...(schema.annotations.get("") ?? []),
        parts.join("") + content.slice(start, node.end),
      ].join("\n"),
    );
  }
  if (remaining.size > 0) {
    fail("/components/schemas", "Schema converter omitted declarations.");
  }
  return declarations;
}
