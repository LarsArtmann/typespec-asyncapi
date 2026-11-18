import { formatTypeSpec } from "@typespec/compiler";
import { fail, type ImportWarning } from "./diagnostics.js";
import { Graph } from "./graph.js";
import { entries, ImportDocument, object, text } from "./input.js";
import { SchemaAdapter } from "./schema-adapter.js";
import { renderServers } from "./servers.js";
import { literal, Names } from "./source.js";

export async function importAsyncAPI(
  source: string,
  namespace?: string,
): Promise<{
  source: string;
  warnings: readonly ImportWarning[];
}> {
  const doc = new ImportDocument(source);
  const { root } = doc;
  doc.fields(root, "", [
    "asyncapi",
    "info",
    "servers",
    "channels",
    "operations",
    "components",
    "defaultContentType",
  ]);
  const info = object(root.info, "/info");
  const title = text(info.title, "/info/title");
  const version = text(info.version, "/info/version");
  doc.fields(info, "/info", ["title", "version"]);
  const names = new Names();
  const namespaceName = names.allocate(
    namespace === undefined ? title : text(namespace, ""),
    "Service",
  );
  const adapter = new SchemaAdapter(doc, names);
  let contentType: string | undefined;
  if (root.defaultContentType !== undefined) {
    contentType = text(root.defaultContentType, "/defaultContentType");
    if (!/^[\w!#$&^.+-]+\/[\w!#$&^.+-]+(?:\s*;\s*.+)?$/u.test(contentType)) {
      fail("/defaultContentType", "Expected a specific media type.");
    }
  }
  const servers = renderServers(doc);
  const graph = new Graph(doc, adapter, names, servers.paths, contentType);
  const components =
    root.components === undefined ? {} : object(root.components, "/components");
  doc.fields(components, "/components", ["schemas", "messages"]);
  for (const [key, value] of entries(
    components.schemas,
    "/components/schemas",
  )) {
    adapter.addComponent(key, value);
  }
  const operations = graph.operations();
  graph.warnUnusedMessages(components.messages);
  const declarations = await adapter.render();
  const service = [
    `@service(#{ title: ${literal(title)} })`,
    `@apiVersion(${literal(version)})`,
  ];
  if (contentType) {
    service.push(`@defaultContentType(${literal(contentType)})`);
  }
  const output = [
    'import "@lars-artmann/typespec-asyncapi";\nusing TypeSpec.AsyncAPI;',
    [...service, ...servers.decorators, `namespace ${namespaceName};`].join(
      "\n",
    ),
    ...declarations,
    ...operations,
  ].join("\n\n");
  return { source: await formatTypeSpec(output), warnings: doc.warnings };
}
