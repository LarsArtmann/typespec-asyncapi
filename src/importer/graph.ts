import { fail } from "./diagnostics.js";
import {
  child,
  entries,
  type ImportDocument,
  object,
  type RecordValue,
  text,
} from "./input.js";
import type { SchemaAdapter } from "./schema-adapter.js";
import { checkKey, literal, type Names, tspValue } from "./source.js";

interface Channel {
  messagesPointer: string;
  address: string;
  messages: Map<string, unknown>;
  serverKeys: string[];
  used: Set<string>;
}

function list(value: unknown, at: string): unknown[] {
  if (!Array.isArray(value)) {
    fail(at, "Expected an array.");
  }
  return value;
}

function optionalText(value: unknown, at: string): string | undefined {
  return value === undefined || value === "" ? undefined : text(value, at);
}

export class Graph {
  private readonly channels = new Map<string, Channel>();
  private readonly serverPaths: ReadonlyMap<string, string>;
  private readonly messages = new Map<string, { key: string; model: string }>();
  private readonly messageKeys = new Set<string>();
  private readonly doc: ImportDocument;
  private readonly schema: SchemaAdapter;
  private readonly names: Names;
  private readonly defaultContentType: string | undefined;

  constructor(
    doc: ImportDocument,
    schema: SchemaAdapter,
    names: Names,
    serverPaths: ReadonlyMap<string, string>,
    defaultContentType?: string,
  ) {
    this.doc = doc;
    this.schema = schema;
    this.names = names;
    this.serverPaths = serverPaths;
    this.defaultContentType = defaultContentType;
  }

  operations(): string[] {
    const inputs = new Map(
      entries(this.doc.root.channels, "/channels").map(([key, value]) => [
        child("/channels", key),
        { key, value },
      ]),
    );
    const operations = entries(this.doc.root.operations, "/operations").map(
      ([key, value]) => {
        const at = child("/operations", key);
        checkKey(key, at);
        const { value: operation, pointer } = this.doc.resolve(value, at);
        if (at !== pointer) {
          this.doc.warn(at, "Reusable operation is inlined.");
        }
        const channelRef = object(operation.channel, child(pointer, "channel"));
        const target = this.doc.lookup(
          channelRef.$ref,
          child(pointer, "channel"),
        );
        const input = inputs.get(target.pointer);
        if (!input) {
          fail(
            child(pointer, "channel"),
            "Operations must reference a root channel.",
          );
        }
        let channel = this.channels.get(target.pointer);
        if (!channel) {
          channel = this.channel(input.key, input.value, target.pointer);
          this.channels.set(target.pointer, channel);
        }
        return this.operation(key, operation, pointer, channel);
      },
    );
    for (const [pointer] of inputs) {
      const channel = this.channels.get(pointer);
      if (!channel) {
        this.doc.warn(pointer, "Channel has no operations and is not emitted.");
        continue;
      }
      for (const key of channel.messages.keys()) {
        if (!channel.used.has(key)) {
          this.doc.warn(
            child(channel.messagesPointer, key),
            "Message is not used by an imported operation.",
          );
        }
      }
    }
    return operations;
  }

  warnUnusedMessages(input: unknown): void {
    const at = "/components/messages";
    for (const [key, value] of entries(input, at)) {
      const path = child(at, key);
      const { pointer } = this.doc.resolve(value, path);
      if (!this.messages.has(pointer)) {
        this.doc.warn(
          path,
          "Reusable message is not used by an imported operation.",
        );
      }
    }
  }

  private channel(key: string, input: unknown, at: string): Channel {
    const { value, pointer } = this.doc.resolve(input, at);
    const address = text(value.address, child(pointer, "address"));
    checkKey(address, child(pointer, "address"));
    if (
      [...this.channels.values()].some((channel) => channel.address === address)
    ) {
      fail(
        child(pointer, "address"),
        "Distinct channels with the same address are not supported.",
      );
    }
    this.doc.fields(value, pointer, ["address", "messages", "servers"]);
    if (pointer !== at) {
      this.doc.warn(at, "Reusable channel is inlined.");
    }
    if (key !== address) {
      this.doc.warn(at, "Channel key becomes its address.", "normalized-value");
    }
    const serverKeys =
      value.servers === undefined
        ? []
        : list(value.servers, child(pointer, "servers")).map((item, index) => {
            const path = child(child(pointer, "servers"), String(index));
            const target = this.doc.lookup(object(item, path).$ref, path);
            const serverKey = this.serverPaths.get(target.pointer);
            if (!serverKey) {
              return fail(path, "Channel servers must reference root servers.");
            }
            if (/[~/]/u.test(serverKey)) {
              return fail(
                path,
                "The emitter cannot reference this server key.",
              );
            }
            return serverKey;
          });
    const messagesPointer = child(pointer, "messages");
    return {
      messagesPointer,
      address,
      serverKeys,
      messages: new Map(entries(value.messages, messagesPointer)),
      used: new Set(),
    };
  }

  private operation(
    key: string,
    value: RecordValue,
    at: string,
    channel: Channel,
  ): string {
    this.doc.fields(value, at, [
      "action",
      "channel",
      "messages",
      "description",
      "summary",
    ]);
    const { action } = value;
    if (action !== "send" && action !== "receive") {
      fail(child(at, "action"), "Expected 'send' or 'receive'.");
    }
    const models = this.operationMessages(
      value.messages,
      child(at, "messages"),
      channel,
    );
    if (models.size === 0) {
      fail(
        child(at, "messages"),
        "Operations without messages are not supported.",
      );
    }
    const name = this.names.allocate(key, "Operation");
    const decorators = [
      action === "send" ? "@publish" : "@subscribe",
      `@channel(${literal(channel.address)})`,
    ];
    if (name !== key) {
      decorators.push(`@operationId(${literal(key)})`);
    }
    const description = optionalText(
      value.description,
      child(at, "description"),
    );
    const summary = optionalText(value.summary, child(at, "summary"));
    if (description || summary) {
      this.doc.warn(
        at,
        "Operation documentation may also appear on its channel.",
        "normalized-value",
      );
      if (description) {
        decorators.push(`@doc(${literal(description)})`);
      }
      if (summary) {
        if (name === key) {
          decorators.push(`@summary(${literal(summary)})`);
        } else {
          this.doc.warn(
            child(at, "summary"),
            "The emitter does not preserve operation summary when its ID differs from its declaration.",
          );
        }
      }
    }
    for (let index = channel.serverKeys.length - 1; index >= 0; index--) {
      const server = channel.serverKeys[index];
      if (server !== undefined) {
        decorators.push(`@useChannelServer(${literal(server)})`);
      }
    }
    return [...decorators, `op ${name}(): ${[...models].join(" | ")};`].join(
      "\n",
    );
  }

  private operationMessages(
    input: unknown,
    at: string,
    channel: Channel,
  ): Set<string> {
    const parent = channel.messagesPointer;
    const selected =
      input === undefined
        ? [...channel.messages.keys()]
        : list(input, at).map((item, index) => {
            const path = child(at, String(index));
            const target = this.doc.lookup(object(item, path).$ref, path);
            for (const key of channel.messages.keys()) {
              if (child(parent, key) === target.pointer) {
                return key;
              }
            }
            return fail(
              path,
              "Operation message must reference a message entry on its channel.",
            );
          });
    const models = new Set<string>();
    for (const key of selected) {
      channel.used.add(key);
      models.add(
        this.message(key, channel.messages.get(key), child(parent, key)),
      );
    }
    return models;
  }

  private message(alias: string, input: unknown, at: string): string {
    const { value, pointer } = this.doc.resolve(input, at);
    const existing = this.messages.get(pointer);
    if (existing) {
      if (existing.key !== alias) {
        this.doc.warn(
          at,
          `Message alias becomes '${existing.key}'.`,
          "normalized-value",
        );
      }
      return existing.model;
    }
    checkKey(alias, at);
    if (this.messageKeys.has(alias)) {
      fail(
        at,
        "Distinct messages with the same emitted key are not supported.",
      );
    }
    this.messageKeys.add(alias);
    if (pointer !== at && pointer !== child("/components/messages", alias)) {
      this.doc.warn(
        at,
        "Message is promoted using its channel-local key.",
        "normalized-value",
      );
    }
    const decorators = this.messageDecorators(value, pointer);
    const model = this.schema.add(
      value.payload,
      child(pointer, "payload"),
      alias,
      decorators,
    );
    if (model !== alias) {
      decorators.unshift(`@messageId(${literal(alias)})`);
    }
    this.messages.set(pointer, { key: alias, model });
    return model;
  }

  private messageDecorators(value: RecordValue, at: string): string[] {
    this.doc.fields(value, at, [
      "payload",
      "title",
      "name",
      "summary",
      "contentType",
      "examples",
      "correlationId",
    ]);
    const title = optionalText(value.title, child(at, "title"));
    const name = optionalText(value.name, child(at, "name"));
    if (title && name && name !== title) {
      this.doc.warn(
        child(at, "name"),
        "The emitter uses the title for both display fields.",
      );
    }
    const contentType =
      value.contentType === undefined
        ? this.defaultContentType
        : text(value.contentType, child(at, "contentType"));
    const config: RecordValue = {};
    for (const [key, item] of Object.entries({
      title: title ?? name,
      description: value.summary,
      contentType,
      examples: value.examples,
    })) {
      if (item !== undefined) {
        config[key] = item;
      }
    }
    const decorators = [`@message(${tspValue(config, at)})`];
    if (value.correlationId !== undefined) {
      const path = child(at, "correlationId");
      const { value: correlation, pointer } = this.doc.resolve(
        value.correlationId,
        path,
      );
      this.doc.fields(correlation, pointer, ["location"]);
      if (pointer !== path) {
        this.doc.warn(path, "Reusable correlation ID is inlined.");
      }
      const location = text(correlation.location, child(pointer, "location"));
      if (!/^\$message\.(?:header|payload)#(?:\/|$)/u.test(location)) {
        fail(
          child(pointer, "location"),
          "Expected a message runtime expression.",
        );
      }
      decorators.push(`@correlationId(${literal(location)})`);
    }
    return decorators;
  }
}
