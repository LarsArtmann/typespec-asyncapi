/**
 * TypeSpec Compiler Integration
 * 
 * Direct integration with TypeSpec compiler APIs for proper TypeSpec-to-AsyncAPI generation.
 * Eliminates manual string parsing and provides compile-time guarantees.
 * 
 * @author TypeSpec AsyncAPI Emitter Team
 * @since v1.1.0
 */

import { 
  Program, 
  Namespace, 
  Model, 
  Operation, 
  Scalar, 
  StringValue,
  ScalarValue,
  NumericValue,
  BooleanValue,
  EnumMember
} from "@typespec/compiler";

import { Effect } from "effect";
import { AsyncAPIObject, ServerObject, ChannelObject, OperationObject, MessageObject } from "./branded-types.js";

/**
 * TypeSpec program analyzer for direct compiler integration
 */
export class TypeSpecCompilerIntegration {
  /**
   * Extract all namespaces from TypeSpec program
   */
  static extractNamespaces(program: Program): Namespace[] {
    const namespaces: Namespace[] = [];
    
    for (const namespace of program.namespaces) {
      if (namespace.name && namespace.name !== "$") {
        namespaces.push(namespace);
      }
    }
    
    return namespaces;
  }

  /**
   * Extract operations from TypeSpec namespace
   */
  static extractOperations(namespace: Namespace): Operation[] {
    const operations: Operation[] = [];
    
    if (namespace.operations) {
      for (const operation of namespace.operations) {
        operations.push(operation);
      }
    }
    
    return operations;
  }

  /**
   * Extract models from TypeSpec namespace
   */
  static extractModels(namespace: Namespace): Model[] {
    const models: Model[] = [];
    
    if (namespace.models) {
      for (const model of namespace.models) {
        models.push(model);
      }
    }
    
    return models;
  }

  /**
   * Extract server configurations from TypeSpec namespace
   */
  static extractServerConfigs(namespace: Namespace): Map<string, any> {
    const servers = new Map<string, any>();
    
    // Get server configurations from namespace state
    const serverConfigs = program.stateMap(program.stateKeys.serverConfigs).get(namespace);
    
    if (serverConfigs) {
      for (const [serverName, serverConfig] of serverConfigs.entries()) {
        servers.set(serverName, serverConfig);
      }
    }
    
    return servers;
  }

  /**
   * Extract channel configurations from TypeSpec operations
   */
  static extractChannelConfigs(namespace: Namespace): Map<string, any> {
    const channels = new Map<string, any>();
    
    // Channels are implicitly created from operations
    for (const operation of namespace.operations || []) {
      const operationName = operation.name;
      
      // Generate channel address from operation name
      const channelAddress = this.generateChannelAddress(operationName);
      
      // Create channel configuration
      channels.set(channelAddress, {
        address: channelAddress,
        description: `Channel for ${operationName}`,
        messages: this.extractMessagesFromOperation(operation)
      });
    }
    
    return channels;
  }

  /**
   * Extract message configurations from TypeSpec model
   */
  static extractMessageConfigs(model: Model): Map<string, any> {
    const messages = new Map<string, any>();
    
    const messageName = model.name;
    if (!messageName) return messages;
    
    // Extract message structure from model
    const messageConfig = {
      name: messageName,
      title: `Message for ${messageName}`,
      contentType: this.inferContentType(model),
      payload: this.extractPayloadSchema(model)
    };
    
    messages.set(messageName, messageConfig);
    return messages;
  }

  /**
   * Extract schema configurations from TypeSpec model
   */
  static extractSchemaConfigs(model: Model): Map<string, any> {
    const schemas = new Map<string, any>();
    
    const schemaName = model.name;
    if (!schemaName) return schemas;
    
    // Extract schema structure from model
    const schemaConfig = {
      name: schemaName,
      title: `Schema for ${schemaName}`,
      type: this.inferSchemaType(model),
      properties: this.extractProperties(model),
      required: this.extractRequiredProperties(model)
    };
    
    schemas.set(schemaName, schemaConfig);
    return schemas;
  }

  /**
   * Generate channel address from operation name
   */
  private static generateChannelAddress(operationName: string): string {
    // Convert camelCase to kebab-case and add prefix
    return `/${operationName.toLowerCase().replace(/([A-Z])/g, '-$1')}`;
  }

  /**
   * Infer content type from TypeSpec model
   */
  private static inferContentType(model: Model): string {
    // Look for content type decorator or infer from model properties
    for (const decorator of model.decorators || []) {
      if (decorator.name === "@message") {
        for (const option of decorator.options || []) {
          if (option.name === "contentType") {
            return option.value as string;
          }
        }
      }
    }
    
    // Default content type
    return "application/json";
  }

  /**
   * Extract payload schema from TypeSpec model
   */
  private static extractPayloadSchema(model: Model): any {
    // Extract schema from model properties
    const properties: Record<string, any> = {};
    
    if (model.properties) {
      for (const [propertyName, property] of model.properties.entries()) {
        properties[propertyName] = this.extractPropertyType(property);
      }
    }
    
    return {
      type: this.inferSchemaType(model),
      properties
    };
  }

  /**
   * Extract property type from TypeSpec property
   */
  private static extractPropertyType(property: any): any {
    const type: Record<string, any> = {};
    
    // Extract type information
    if (property.type) {
      type.type = property.type;
    }
    
    // Extract default value
    if (property.defaultValue) {
      type.default = property.defaultValue;
    }
    
    // Extract constraints
    if (property.enum) {
      type.enum = Array.isArray(property.enum) ? property.enum : [property.enum];
    }
    
    // Extract format
    if (property.format) {
      type.format = property.format;
    }
    
    // Extract description
    if (property.description) {
      type.description = property.description;
    }
    
    return type;
  }

  /**
   * Infer schema type from TypeSpec model
   */
  private static inferSchemaType(model: Model): string {
    // Infer type from model properties
    if (model.properties) {
      const hasStringProps = Array.from(model.properties.entries()).some(([_, prop]) => 
        prop.type === "string"
      );
      
      if (hasStringProps) {
        return "object";
      }
      
      const hasNumericProps = Array.from(model.properties.entries()).some(([_, prop]) => 
        prop.type === "number"
      );
      
      if (hasNumericProps) {
        return "object";
      }
      
      const hasBoolProps = Array.from(model.properties.entries()).some(([_, prop]) => 
        prop.type === "boolean"
      );
      
      if (hasBoolProps) {
        return "object";
      }
    }
    
    return "object";
  }

  /**
   * Extract properties from TypeSpec model
   */
  private static extractProperties(model: Model): Record<string, any> {
    const properties: Record<string, any> = {};
    
    if (model.properties) {
      for (const [propertyName, property] of model.properties.entries()) {
        properties[propertyName] = this.extractPropertyType(property);
      }
    }
    
    return properties;
  }

  /**
   * Extract required properties from TypeSpec model
   */
  private static extractRequiredProperties(model: Model): string[] {
    const required: string[] = [];
    
    if (model.properties) {
      for (const [propertyName, property] of model.properties.entries()) {
        if (property.required) {
          required.push(propertyName);
        }
      }
    }
    
    return required;
  }

  /**
   * Extract messages from TypeSpec operation
   */
  private static extractMessagesFromOperation(operation: Operation): Record<string, any> {
    const messages: Record<string, any> = {};
    
    // Extract message from operation decorators
    for (const decorator of operation.decorators || []) {
      if (decorator.name === "@message") {
        const messageConfig = this.extractMessageConfig(decorator);
        if (messageConfig) {
          messages[messageConfig.name] = messageConfig;
        }
      }
    }
    
    return messages;
  }

  /**
   * Extract message configuration from decorator
   */
  private static extractMessageConfig(decorator: any): any {
    if (!decorator || !decorator.options) return null;
    
    const config = {
      name: "default",
      contentType: "application/json",
      payload: {}
    };
    
    for (const option of decorator.options) {
      if (option.name === "name") {
        config.name = option.value;
      }
      if (option.name === "contentType") {
        config.contentType = option.value;
      }
      if (option.name === "payload") {
        config.payload = option.value;
      }
    }
    
    return config;
  }
}

/**
 * TypeSpec to AsyncAPI generator
 */
export class TypeSpecToAsyncAPIGenerator {
  /**
   * Generate AsyncAPI specification from TypeSpec program
   */
  static generateAsyncAPI(program: Program): Effect.Effect<AsyncAPIObject, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Generating AsyncAPI specification from TypeSpec program`);
      
      // Extract all namespaces
      const namespaces = TypeSpecCompilerIntegration.extractNamespaces(program);
      
      // Generate info section
      const info = yield* this.generateInfoSection(program);
      
      // Generate servers section
      const servers = yield* this.generateServersSection(program, namespaces);
      
      // Generate channels section
      const channels = yield* this.generateChannelsSection(program, namespaces);
      
      // Generate operations section
      const operations = yield* this.generateOperationsSection(program, namespaces);
      
      // Generate components section
      const components = yield* this.generateComponentsSection(program, namespaces);
      
      const asyncapiDoc: AsyncAPIObject = {
        asyncapi: "3.0.0",
        info,
        servers: Object.keys(servers).length > 0 ? servers : undefined,
        channels,
        operations,
        components
      };
      
      yield* Effect.log(`✅ AsyncAPI specification generated successfully`);
      yield* Effect.log(`📊 Document summary: ${Object.keys(channels).length} channels, ${Object.keys(operations).length} operations, ${Object.keys(components.messages || {}).length} messages, ${Object.keys(components.schemas || {}).length} schemas`);
      
      return asyncapiDoc;
    });
  }

  /**
   * Generate info section
   */
  private static generateInfoSection(program: Program): Effect.Effect<any, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Generating info section`);
      
      // Extract info from @asyncapi decorator
      const asyncApiConfig = program.stateMap(program.stateKeys.asyncApiConfigs).get(program);
      
      if (!asyncApiConfig) {
        // Generate default info
        return {
          title: "Generated from TypeSpec",
          version: "1.0.0",
          description: "Generated from TypeSpec with TypeSpec compiler integration"
        };
      }
      
      // Extract info from config
      const info: any = {};
      
      if (asyncApiConfig.title) {
        info.title = asyncApiConfig.title;
      }
      
      if (asyncApiConfig.version) {
        info.version = asyncApiConfig.version;
      }
      
      if (asyncApiConfig.description) {
        info.description = asyncApiConfig.description;
      }
      
      if (asyncApiConfig.termsOfService) {
        info.termsOfService = asyncApiConfig.termsOfService;
      }
      
      if (asyncApiConfig.contact) {
        info.contact = asyncApiConfig.contact;
      }
      
      if (asyncApiConfig.license) {
        info.license = asyncApiConfig.license;
      }
      
      yield* Effect.log(`✅ Info section generated: ${info.title} v${info.version}`);
      return info;
    });
  }

  /**
   * Generate servers section
   */
  private static generateServersSection(program: Program, namespaces: Namespace[]): Effect.Effect<Record<string, ServerObject>, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Generating servers section`);
      
      const servers: Record<string, ServerObject> = {};
      
      for (const namespace of namespaces) {
        const serverConfigs = TypeSpecCompilerIntegration.extractServerConfigs(namespace);
        
        for (const [serverName, serverConfig] of serverConfigs.entries()) {
          servers[serverName] = {
            url: serverConfig.url,
            protocol: serverConfig.protocol,
            description: serverConfig.description || `Server for ${serverName}`,
            variables: serverConfig.variables || {}
          };
        }
      }
      
      yield* Effect.log(`✅ Servers section generated: ${Object.keys(servers).length} servers`);
      return servers;
    });
  }

  /**
   * Generate channels section
   */
  private static generateChannelsSection(program: Program, namespaces: Namespace[]): Effect.Effect<Record<string, ChannelObject>, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Generating channels section`);
      
      const channels: Record<string, ChannelObject> = {};
      
      for (const namespace of namespaces) {
        const channelConfigs = TypeSpecCompilerIntegration.extractChannelConfigs(namespace);
        
        for (const [channelAddress, channelConfig] of channelConfigs.entries()) {
          channels[channelAddress] = {
            address: channelConfig.address,
            description: channelConfig.description || `Channel for ${channelAddress}`,
            messages: channelConfig.messages
          };
        }
      }
      
      yield* Effect.log(`✅ Channels section generated: ${Object.keys(channels).length} channels`);
      return channels;
    });
  }

  /**
   * Generate operations section
   */
  private static generateOperationsSection(program: Program, namespaces: Namespace[]): Effect.Effect<Record<string, OperationObject>, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Generating operations section`);
      
      const operations: Record<string, OperationObject> = {};
      
      for (const namespace of namespaces) {
        const extractedOperations = TypeSpecCompilerIntegration.extractOperations(namespace);
        
        for (const operation of extractedOperations) {
          operations[operation.name] = {
            action: this.inferOperationAction(operation),
            channel: this.inferOperationChannel(operation),
            description: operation.description || `Operation ${operation.name}`,
            messages: this.extractMessagesFromOperation(operation)
          };
        }
      }
      
      yield* Effect.log(`✅ Operations section generated: ${Object.keys(operations).length} operations`);
      return operations;
    });
  }

  /**
   * Generate components section
   */
  private static generateComponentsSection(program: Program, namespaces: Namespace[]): Effect.Effect<any, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔧 Generating components section`);
      
      const components: any = {
        messages: {},
        schemas: {},
        securitySchemes: {}
      };
      
      // Generate messages from models
      for (const namespace of namespaces) {
        const models = TypeSpecCompilerIntegration.extractModels(namespace);
        
        for (const model of models) {
          const messageConfigs = TypeSpecCompilerIntegration.extractMessageConfigs(model);
          
          for (const [messageName, messageConfig] of messageConfigs.entries()) {
            components.messages[messageName] = messageConfig;
          }
        }
      }
      
      // Generate schemas from models
      for (const namespace of namespaces) {
        const models = TypeSpecCompilerIntegration.extractModels(namespace);
        
        for (const model of models) {
          const schemaConfigs = TypeSpecCompilerIntegration.extractSchemaConfigs(model);
          
          for (const [schemaName, schemaConfig] of schemaConfigs.entries()) {
            components.schemas[schemaName] = schemaConfig;
          }
        }
      }
      
      yield* Effect.log(`✅ Components section generated: ${Object.keys(components.messages).length} messages, ${Object.keys(components.schemas).length} schemas`);
      return components;
    });
  }

  /**
   * Infer operation action from TypeSpec operation
   */
  private static inferOperationAction(operation: Operation): "send" | "receive" | "reply" {
    // Look for action decorator
    for (const decorator of operation.decorators || []) {
      if (decorator.name === "@operation") {
        for (const option of decorator.options || []) {
          if (option.name === "action") {
            const action = option.value as string;
            if (["send", "receive", "reply"].includes(action)) {
              return action as "send" | "receive" | "reply";
            }
          }
        }
      }
    }
    
    // Infer from operation name (convention)
    if (operation.name.toLowerCase().startsWith("send")) {
      return "send";
    } else if (operation.name.toLowerCase().startsWith("receive")) {
      return "receive";
    } else if (operation.name.toLowerCase().startsWith("reply")) {
      return "reply";
    }
    
    // Default to send
    return "send";
  }

  /**
   * Infer operation channel from TypeSpec operation
   */
  private static inferOperationChannel(operation: Operation): string {
    // Look for channel decorator
    for (const decorator of operation.decorators || []) {
      if (decorator.name === "@operation") {
        for (const option of decorator.options || []) {
          if (option.name === "channel") {
            return option.value as string;
          }
        }
      }
    }
    
    // Generate channel from operation name
    return operation.name.toLowerCase().replace(/^([a-z]+)/, "$1");
  }

  /**
   * Extract messages from TypeSpec operation
   */
  private static extractMessagesFromOperation(operation: Operation): Record<string, any> {
    const messages: Record<string, any> = {};
    
    // Look for message decorators
    for (const decorator of operation.decorators || []) {
      if (decorator.name === "@message") {
        const messageConfig = TypeSpecCompilerIntegration.extractMessageConfig(decorator);
        if (messageConfig) {
          messages[messageConfig.name] = messageConfig;
        }
      }
    }
    
    return messages;
  }
}

/**
 * TypeSpec program analyzer for debugging and analysis
 */
export class TypeSpecProgramAnalyzer {
  /**
   * Analyze TypeSpec program structure
   */
  static analyzeProgram(program: Program): Effect.Effect<{
    namespaces: number;
    models: number;
    operations: number;
    servers: number;
    channels: number;
    messages: number;
    schemas: number;
    securitySchemes: number;
    decorators: Array<{
      name: string;
      type: string;
      count: number;
    }>;
  }, Error> {
    return Effect.gen(function* () {
      yield* Effect.log(`🔍 Analyzing TypeSpec program structure`);
      
      const namespaces = TypeSpecCompilerIntegration.extractNamespaces(program);
      const models = namespaces.flatMap(n => TypeSpecCompilerIntegration.extractModels(n));
      const operations = namespaces.flatMap(n => TypeSpecCompilerIntegration.extractOperations(n));
      
      let totalServers = 0;
      let totalChannels = 0;
      let totalMessages = 0;
      let totalSchemas = 0;
      let totalSecuritySchemes = 0;
      
      // Count servers
      for (const namespace of namespaces) {
        const serverConfigs = TypeSpecCompilerIntegration.extractServerConfigs(namespace);
        totalServers += serverConfigs.size;
      }
      
      // Count channels
      for (const namespace of namespaces) {
        const channelConfigs = TypeSpecCompilerIntegration.extractChannelConfigs(namespace);
        totalChannels += channelConfigs.size;
      }
      
      // Count messages and schemas
      for (const namespace of namespaces) {
        const models = TypeSpecCompilerIntegration.extractModels(namespace);
        
        for (const model of models) {
          totalMessages += TypeSpecCompilerIntegration.extractMessageConfigs(model).size;
          totalSchemas += TypeSpecCompilerIntegration.extractSchemaConfigs(model).size;
        }
      }
      
      // Count decorators
      const decoratorMap = new Map<string, { type: string; count: number }>();
      
      for (const namespace of namespaces) {
        const models = TypeSpecCompilerIntegration.extractModels(namespace);
        
        for (const model of models) {
          for (const decorator of model.decorators || []) {
            const name = decorator.name;
            if (!decoratorMap.has(name)) {
              decoratorMap.set(name, { type: decorator.type || "unknown", count: 0 });
            }
            decoratorMap.get(name).count++;
          }
        }
        
        for (const operation of namespace.operations || []) {
          for (const decorator of operation.decorators || []) {
            const name = decorator.name;
            if (!decoratorMap.has(name)) {
              decoratorMap.set(name, { type: decorator.type || "unknown", count: 0 });
            }
            decoratorMap.get(name).count++;
          }
        }
      }
      
      const decorators = Array.from(decoratorMap.entries()).map(([name, info]) => ({
        name,
        type: info.type,
        count: info.count
      }));
      
      const analysis = {
        namespaces: namespaces.length,
        models: models.length,
        operations: operations.length,
        servers: totalServers,
        channels: totalChannels,
        messages: totalMessages,
        schemas: totalSchemas,
        securitySchemes: totalSecuritySchemes,
        decorators
      };
      
      yield* Effect.log(`✅ Program analysis completed: ${analysis.namespaces} namespaces, ${analysis.models} models, ${analysis.operations} operations, ${analysis.servers} servers, ${analysis.channels} channels, ${analysis.messages} messages, ${analysis.schemas} schemas`);
      
      return analysis;
    });
  }
}

export {
  Effect
};