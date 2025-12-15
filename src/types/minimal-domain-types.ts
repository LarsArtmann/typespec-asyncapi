/**
 * 🏗️ MINIMAL DOMAIN TYPES - TYPE SPECIFIC IMPLEMENTATION
 *
 * TEMPORARY: Provides essential types while complex infrastructure is disabled
 * PRINCIPLE: NO 'any' types, NO 'as' casting - Proper types only
 */

export type Brand<K, T> = T & { readonly _brand: K };

export type ChannelPath = Brand<"ChannelPath", string>;
export type MessageId = Brand<"MessageId", string>;
export type SchemaName = Brand<"SchemaName", string>;

export type ChannelConfig = {
  readonly path?: string;
  readonly description?: string;
};

export type MessageConfig = {
  readonly schemaName?: string;
  readonly description?: string;
};

export type AsyncAPIDocument = {
  readonly asyncapi: string;
  readonly info: {
    readonly title: string;
    readonly version: string;
    readonly description?: string;
    readonly channels?: Record<string, Record<string, unknown>>;
    readonly messages?: Record<string, Record<string, unknown>>;
    readonly schemas?: Record<string, Record<string, unknown>>;
  };
  readonly channels?: Record<string, Record<string, unknown>>;
  readonly components?: {
    readonly messages?: Record<string, Record<string, unknown>>;
    readonly schemas?: Record<string, Record<string, unknown>>;
  };
};

export type AsyncAPIChannel = Record<string, unknown>;

export type AsyncAPIMessage = Record<string, unknown>;

export type AsyncAPISchema = Record<string, unknown>;

// Type collections for easier imports
export type AsyncAPIChannels = Record<string, AsyncAPIChannel>;
export type AsyncAPIMessages = Record<string, AsyncAPIMessage>;
export type AsyncAPISchemas = Record<string, AsyncAPISchema>;
