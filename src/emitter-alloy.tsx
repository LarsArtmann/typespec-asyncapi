/**
 * ASYNCAPI EMITTER - Alloy Framework Implementation
 *
 * Uses @alloy-js/core and @typespec/emitter-framework for proper TypeSpec integration
 */

import { Output, SourceFile } from "@alloy-js/core";
import type { EmitContext, Program, Operation, Model, Namespace } from "@typespec/compiler";
import { listOperationsIn, getNamespaceFullName } from "@typespec/compiler";
import { writeOutput } from "@typespec/emitter-framework";
import { consolidateAsyncAPIState, type AsyncAPIConsolidatedState } from "./state.js";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import { stringify } from "yaml";

/**
 * AsyncAPI Document Component - Generates the full AsyncAPI 3.0 YAML document
 */
function AsyncAPIDocument(props: { 
  state: AsyncAPIConsolidatedState; 
  program: Program;
  options: AsyncAPIEmitterOptions;
}) {
  const { state, program, options } = props;
  
  const document = buildAsyncAPIDocument(program, state, options);
  
  return <SourceFile path="asyncapi.yaml" filetype="yaml">
    {stringify(document, { lineWidth: 0 })}
  </SourceFile>;
}

/**
 * Build the AsyncAPI 3.0 document structure
 */
function buildAsyncAPIDocument(
  program: Program, 
  state: AsyncAPIConsolidatedState,
  options: AsyncAPIEmitterOptions
): AsyncAPI3Document {
  const rootNamespace = program.getGlobalNamespaceType();
  const serviceNamespace = findServiceNamespace(rootNamespace);
  
  return {
    asyncapi: "3.0.0",
    info: buildInfo(serviceNamespace, options),
    servers: buildServers(state, serviceNamespace),
    channels: buildChannels(state),
    operations: buildOperations(state),
    components: buildComponents(state),
  };
}

/**
 * AsyncAPI 3.0 Document Structure
 */
type AsyncAPI3Document = {
  asyncapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Record<string, unknown>;
  channels: Record<string, unknown>;
  operations: Record<string, unknown>;
  components?: Record<string, unknown>;
}

/**
 * Find the main service namespace
 */
function findServiceNamespace(namespace: Namespace): Namespace {
  const namespaces = namespace.namespaces;
  for (const ns of namespaces.values()) {
    const operations = listOperationsIn(ns);
    if (operations.length > 0) {
      return ns;
    }
  }
  return namespace;
}

/**
 * Build info section
 */
function buildInfo(
  namespace: Namespace, 
  options: AsyncAPIEmitterOptions
): { title: string; version: string; description?: string } {
  return {
    title: options.title ?? getNamespaceFullName(namespace) ?? "AsyncAPI Service",
    version: options.version ?? "1.0.0",
    description: options.description ?? namespace.decorators
      ?.find(d => d.decorator.name === "$doc")
      ?.args[0]?.value?.toString(),
  };
}

/**
 * Build servers section
 */
function buildServers(
  state: AsyncAPIConsolidatedState, 
  _namespace: Namespace
): Record<string, unknown> | undefined {
  const servers: Record<string, unknown> = {};
  
  if (state.servers) {
    for (const [_type, data] of state.servers) {
      const serverData = data;
      servers[serverData.name] = {
        host: serverData.url,
        protocol: serverData.protocol,
        description: serverData.description,
      };
    }
  }
  
  return Object.keys(servers).length > 0 ? servers : undefined;
}

/**
 * Build channels section - maps channel paths to their configurations
 */
function buildChannels(state: AsyncAPIConsolidatedState): Record<string, unknown> {
  const channels: Record<string, unknown> = {};
  
  if (state.channels) {
    for (const [type, data] of state.channels) {
      const operation = type as Operation;
      const channelData = data;
      const channelPath = channelData.path;
      
      // Get the return type of the operation for message reference
      const returnType = operation.returnType;
      let messageName = "default";
      
      if (returnType?.kind === "Model") {
        const model = returnType;
        messageName = model.name ?? "default";
      }
      
      const channelEntry: Record<string, unknown> = {
        address: channelPath,
        messages: {
          [messageName]: {
            $ref: `#/components/messages/${messageName}`,
          },
        },
      };
      
      // Add protocol bindings if present
      const protocolConfig = state.protocolConfigs?.get(type);
      if (protocolConfig) {
        const bindings: Record<string, unknown> = {};
        
        // Format bindings per AsyncAPI spec based on protocol type
        switch (protocolConfig.protocol) {
          case "kafka":
            bindings.kafka = {
              partitions: protocolConfig.partitions ?? 1,
              replicationFactor: protocolConfig.replicationFactor ?? 1,
              ...(protocolConfig.consumerGroup && { consumerGroup: protocolConfig.consumerGroup }),
              ...(protocolConfig.sasl && { sasl: protocolConfig.sasl }),
            };
            break;
          case "ws":
          case "websocket":
            bindings.ws = {
              ...(protocolConfig.subprotocol && { subprotocol: protocolConfig.subprotocol }),
              ...(protocolConfig.queryParams && { queryParams: protocolConfig.queryParams }),
              ...(protocolConfig.headers && { headers: protocolConfig.headers }),
            };
            break;
          case "mqtt":
            bindings.mqtt = {
              ...(protocolConfig.qos !== undefined && { qos: protocolConfig.qos }),
              ...(protocolConfig.retain !== undefined && { retain: protocolConfig.retain }),
              ...(protocolConfig.lastWill && { lastWill: protocolConfig.lastWill }),
            };
            break;
          case "http":
            bindings.http = {};
            break;
        }
        
        if (Object.keys(bindings).length > 0) {
          channelEntry.bindings = bindings;
        }
      }
      
      channels[channelPath] = channelEntry;
    }
  }
  
  return channels;
}

/**
 * Build operations section
 */
function buildOperations(state: AsyncAPIConsolidatedState): Record<string, unknown> {
  const operations: Record<string, unknown> = {};
  
  if (state.operations) {
    for (const [type, data] of state.operations) {
      const operation = type as Operation;
      const operationData = data;
      
      // Get channel path for this operation
      const channelData = state.channels?.get(type);
      const channelPath = channelData?.path ?? operation.name;
      
      // Get return type for message reference
      const returnType = operation.returnType;
      let messageName = "default";
      
      if (returnType?.kind === "Model") {
        const model = returnType;
        messageName = model.name ?? "default";
      }
      
      const operationEntry: Record<string, unknown> = {
        action: operationData.type === "publish" ? "send" : "receive",
        channel: {
          $ref: `#/channels/${channelPath}`,
        },
        messages: [
          {
            $ref: `#/components/messages/${messageName}`,
          },
        ],
      };
      
      // Add security reference if present
      const securityConfig = state.securityConfigs?.get(type);
      if (securityConfig) {
        operationEntry.security = [
          { [securityConfig.name]: [] },
        ];
      }
      
      // Add protocol bindings if present
      const protocolConfig = state.protocolConfigs?.get(type);
      if (protocolConfig) {
        const bindings: Record<string, unknown> = {};
        
        switch (protocolConfig.protocol) {
          case "kafka":
            bindings.kafka = {
              ...(protocolConfig.partitions && { partitions: protocolConfig.partitions }),
              ...(protocolConfig.replicationFactor && { replicationFactor: protocolConfig.replicationFactor }),
            };
            break;
          case "ws":
          case "websocket":
            bindings.ws = {
              ...(protocolConfig.subprotocol && { subprotocol: protocolConfig.subprotocol }),
            };
            break;
          case "mqtt":
            bindings.mqtt = {
              ...(protocolConfig.qos !== undefined && { qos: protocolConfig.qos }),
            };
            break;
        }
        
        if (Object.keys(bindings).length > 0) {
          operationEntry.bindings = bindings;
        }
      }
      
      operations[operation.name] = operationEntry;
    }
  }
  
  return operations;
}

/**
 * Build components section with messages and schemas
 */
function buildComponents(state: AsyncAPIConsolidatedState): Record<string, unknown> | undefined {
  const messages: Record<string, unknown> = {};
  const schemas: Record<string, unknown> = {};
  const collectedModels = new Set<Model>();
  
  // Process messages from @message decorator
  if (state.messages) {
    for (const [type, data] of state.messages) {
      const model = type as Model;
      const messageData = data;
      const modelName = model.name;
      
      const messageEntry: Record<string, unknown> = {
        name: messageData.title ?? modelName,
        title: messageData.title ?? modelName,
        summary: messageData.description,
        contentType: messageData.contentType ?? "application/json",
        payload: {
          $ref: `#/components/schemas/${modelName}`,
        },
      };
      
      // Add tags if present
      const tagsData = state.tags?.get(type);
      if (tagsData) {
        messageEntry.tags = [{ name: tagsData.name }];
      }
      
      // Add correlationId if present
      const correlationIdData = state.correlationIds?.get(type);
      if (correlationIdData) {
        messageEntry.correlationId = {
          location: correlationIdData.location,
          ...(correlationIdData.property && { property: correlationIdData.property }),
        };
      }
      
      messages[modelName] = messageEntry;
      collectedModels.add(model);
    }
  }
  
  // If we have channels but no explicit messages, create messages from operation return types
  if (state.channels && Object.keys(messages).length === 0) {
    for (const [type, _data] of state.channels) {
      const operation = type as Operation;
      const returnType = operation.returnType;
      
      if (returnType?.kind === "Model") {
        const model = returnType;
        const modelName = model.name;
        
        if (modelName && !messages[modelName]) {
          messages[modelName] = {
            name: modelName,
            title: modelName,
            contentType: "application/json",
            payload: {
              $ref: `#/components/schemas/${modelName}`,
            },
          };
          
          collectedModels.add(model);
        }
      }
    }
  }
  
  // Also collect models from channels for schema generation
  if (state.channels) {
    for (const [type, _data] of state.channels) {
      const operation = type as Operation;
      const returnType = operation.returnType;
      
      if (returnType?.kind === "Model") {
        collectedModels.add(returnType);
      }
    }
  }
  
  // Generate schemas for all collected models (including nested references)
  const processedModels = new Set<string>();
  for (const model of collectedModels) {
    collectSchemas(model, schemas, processedModels);
  }
  
  const components: Record<string, unknown> = {};
  
  if (Object.keys(messages).length > 0) {
    components.messages = messages;
  }
  
  if (Object.keys(schemas).length > 0) {
    components.schemas = schemas;
  }
  
  // Add security schemes from @security decorator
  const securitySchemes = buildSecuritySchemes(state);
  if (securitySchemes && Object.keys(securitySchemes).length > 0) {
    components.securitySchemes = securitySchemes;
  }
  
  return Object.keys(components).length > 0 ? components : undefined;
}

/**
 * Build security schemes from @security decorator configurations
 */
function buildSecuritySchemes(state: AsyncAPIConsolidatedState): Record<string, unknown> | undefined {
  const schemes: Record<string, unknown> = {};
  
  if (state.securityConfigs) {
    for (const [_type, data] of state.securityConfigs) {
      const securityData = data;
      schemes[securityData.name] = securityData.scheme;
    }
  }
  
  return Object.keys(schemes).length > 0 ? schemes : undefined;
}

/**
 * Recursively collect schemas from models and their property references
 */
function collectSchemas(
  model: Model, 
  schemas: Record<string, unknown>, 
  processed: Set<string>
): void {
  const modelName = model.name;
  if (!modelName || processed.has(modelName)) {
    return;
  }
  
  processed.add(modelName);
  schemas[modelName] = buildSchemaFromModel(model);
  
  // Recursively process referenced models in properties
  if (model.properties) {
    for (const [_name, prop] of model.properties) {
      const propType = prop.type as { kind?: string; model?: Model; name?: string };
      
      if (propType.kind === "Model") {
        const refModel = propType.model ?? propType as Model;
        if (refModel.name) {
          collectSchemas(refModel, schemas, processed);
        }
      }
    }
  }
}

/**
 * Build JSON Schema from TypeSpec model
 */
function buildSchemaFromModel(model: Model): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    type: "object",
  };
  
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  
  if (model.properties) {
    for (const [name, prop] of model.properties) {
      properties[name] = buildPropertySchema(prop);
      
      if (!prop.optional) {
        required.push(name);
      }
    }
  }
  
  schema.properties = properties;
  
  if (required.length > 0) {
    schema.required = required;
  }
  
  return schema;
}

/**
 * Build schema for a single property
 */
function buildPropertySchema(prop: unknown): Record<string, unknown> {
  const property = prop as { 
    type?: { 
      kind?: string; 
      name?: string;
      scalar?: { name: string };
      model?: Model;
    };
    optional?: boolean;
  };
  
  const schema: Record<string, unknown> = {};
  
  if (property.type) {
    const typeKind = property.type.kind;
    const typeName = property.type.name;
    
    if (typeKind === "Scalar") {
      const scalarName = property.type.scalar?.name ?? typeName;
      switch (scalarName) {
        case "string":
          schema.type = "string";
          break;
        case "int32":
        case "int64":
        case "integer":
          schema.type = "integer";
          if (scalarName === "int32") {
            schema.format = "int32";
          } else if (scalarName === "int64") {
            schema.format = "int64";
          }
          break;
        case "float":
        case "double":
        case "decimal":
          schema.type = "number";
          break;
        case "boolean":
          schema.type = "boolean";
          break;
        case "utcDateTime":
        case "offsetDateTime":
          schema.type = "string";
          schema.format = "date-time";
          break;
        default:
          schema.type = "string";
      }
    } else if (typeKind === "Model") {
      // Reference to another model - use the actual model from the type
      const refModel = property.type.model ?? property.type as Model;
      const refName = refModel.name;
      if (refName) {
        schema.$ref = `#/components/schemas/${refName}`;
      } else {
        // Inline anonymous model - generate schema inline
        schema.type = "object";
        if (refModel.properties && refModel.properties.size > 0) {
          const props: Record<string, unknown> = {};
          for (const [propName, propValue] of refModel.properties) {
            props[propName] = buildPropertySchema(propValue);
          }
          schema.properties = props;
        }
      }
     } else if (typeKind === "Array") {
      schema.type = "array";
      // Array handling - simplified for now
      schema.items = { type: "string" };
    } else {
      schema.type = typeName ?? "string";
    }
  }
  
  return schema;
}

/**
 * Main emitter entry point - Called by TypeSpec compiler
 */
export async function $onEmit(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
  const options = context.options ?? {};
  
  const state = consolidateAsyncAPIState(context.program);
  
  await writeOutput(
    context.program,
    <Output>
      <AsyncAPIDocument 
        state={state} 
        program={context.program}
        options={options}
      />
    </Output>,
    context.emitterOutputDir,
  );
}
