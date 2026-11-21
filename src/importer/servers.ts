import {
  isSupportedProtocol,
  normalizeProtocol,
} from "../constants/protocols.js";
import { isValidUrl } from "../decorator-helpers.js";
import { fail } from "./diagnostics.js";
import {
  entries,
  child,
  text,
  type RecordValue,
  type ImportDocument,
} from "./input.js";
import { checkKey, literal, tspValue } from "./source.js";

export function renderServers(doc: ImportDocument): {
  decorators: string[];
  paths: Map<string, string>;
} {
  const paths = new Map<string, string>();
  const decorators = entries(doc.root.servers, "/servers").map(
    ([key, input]) => {
      const at = child("/servers", key);
      checkKey(key, at);
      paths.set(at, key);
      const { value, pointer } = doc.resolve(input, at);
      doc.fields(value, pointer, [
        "host",
        "protocol",
        "protocolVersion",
        "pathname",
        "description",
        "variables",
      ]);
      if (at !== pointer) {
        doc.warn(at, "Reusable server is inlined.");
      }
      const host = text(value.host, child(pointer, "host"));
      if (host.trim() !== host || !isValidUrl(host)) {
        fail(
          child(pointer, "host"),
          "Server host cannot contain whitespace or control characters.",
        );
      }
      const protocol = text(value.protocol, child(pointer, "protocol"));
      if (!isSupportedProtocol(protocol.toLowerCase())) {
        fail(
          child(pointer, "protocol"),
          "Server protocol is not supported by the emitter.",
        );
      }
      const normalized = normalizeProtocol(protocol);
      if (normalized !== protocol) {
        doc.warn(
          child(pointer, "protocol"),
          `Protocol is emitted as '${normalized}'.`,
          "normalized-value",
        );
      }
      const config: RecordValue = { url: host, protocol: normalized };
      for (const field of ["protocolVersion", "pathname", "description"]) {
        const content = value[field];
        if (content !== undefined) {
          config[field] = text(content, child(pointer, field));
        }
      }
      const variables = serverVariables(
        doc,
        value.variables,
        child(pointer, "variables"),
        host,
      );
      if (Object.keys(variables).length > 0) {
        config.variables = variables;
      }
      return `@server(${literal(key)}, ${tspValue(config, at)})`;
    },
  );
  return { decorators, paths };
}

function serverVariables(
  doc: ImportDocument,
  input: unknown,
  at: string,
  host: string,
): RecordValue {
  const hostNames = new Set(
    [...host.matchAll(/\{(?<name>[^}]+)\}/gu)].map(
      (match) => match.groups?.name,
    ),
  );
  const variables = new Map<string, RecordValue>();
  for (const [key, variable] of entries(input, at)) {
    const path = child(at, key);
    const { value, pointer } = doc.resolve(variable, path);
    if (!hostNames.has(key)) {
      doc.warn(path, "Only host-template variables are imported.");
      continue;
    }
    checkKey(key, path);
    doc.fields(value, pointer, ["enum", "default", "description", "examples"]);
    if (path !== pointer) {
      doc.warn(path, "Reusable server variable is inlined.");
    }
    const { enum: choices, default: fallback, description, examples } = value;
    variables.set(
      key,
      Object.fromEntries(
        Object.entries({
          values: choices,
          default: fallback,
          description,
          examples,
        }).filter(([, item]) => item !== undefined),
      ),
    );
  }
  for (const key of hostNames) {
    if (key !== undefined && !variables.has(key)) {
      doc.warn(
        child(at, key),
        "The emitter will synthesize this undeclared host variable.",
        "normalized-value",
      );
    }
  }
  return Object.fromEntries(variables);
}
