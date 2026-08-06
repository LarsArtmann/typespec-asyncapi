// =============================================================================
// Pattern Source: Kernovia (schemas/src/base.tsp, schemas/src/commands.tsp)
// Pattern: Multi-level scalar inheritance, branded types, pattern validation,
//          default values, enums with kebab-case values, Record types
// =============================================================================

@service(#{ title: "Kernovia Plugin System" })
@server("production", #{ url: "kafka://broker:9092", protocol: "kafka" })
namespace KernoviaPluginSystem;

// --- Multi-level scalar inheritance (branded types) ---
@pattern("^[a-zA-Z0-9_-]{21}$")
@minLength(21)
scalar NanoID extends string;

@pattern("^[a-zA-Z0-9_-]{21}$")
scalar ActorId extends NanoID;

@pattern("^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)")
scalar SemanticVersion extends string;

@pattern("^[a-z]+(\\.[a-z]+)*$")
scalar EventType extends string;

// --- Enums with kebab-case values ---
enum ComponentDeploymentStatus {
  healthy: "healthy",
  degraded: "degraded",
  unhealthy: "unhealthy",
}

enum ComponentVersionStrategy {
  blueGreen: "blue-green",
  canary: "canary",
  rolling: "rolling",
  rolledback: "rolledback",
}

// --- Base models with defaults, Record types ---
model BaseCommand {
  commandId: NanoID;
  actorId: ActorId;
  commandType: string;
  commandVersion: SemanticVersion = "1.0.0";
  timestamp: utcDateTime;
  commandData: Record<unknown>;
  rollbackCapable: boolean = true;
}

model BaseEvent {
  eventId: NanoID;
  actorId: ActorId;
  eventType: EventType;
  eventVersion: SemanticVersion = "1.0.0";
  timestamp: utcDateTime;
  eventData: Record<unknown>;
}

// --- Commands with string literal narrowing, nested inline objects, arrays ---
model LoadPluginCommand extends BaseCommand {
  commandType: "plugin.load";
  commandData: {
    manifest: PluginManifest;
    validateSecurity: boolean = true;
    timeoutMs: int32 = 30000;
  };
  dependencies: PluginDependency[];
}

model UnloadPluginCommand extends BaseCommand {
  commandType: "plugin.unload";
  commandData: {
    gracefulShutdown: boolean = true;
    forceKill: boolean = false;
    timeoutMs: int32 = 10000;
  };
}

// --- Events with property narrowing ---
model PluginLoadedEvent extends BaseEvent {
  eventType: "plugin.loaded";
  eventData: {
    manifest: PluginManifest;
    loadedAt: utcDateTime;
    duration: int32;
  };
}

model PluginUnloadedEvent extends BaseEvent {
  eventType: "plugin.unloaded";
  eventData: {
    pluginId: string;
    unloadReason: "manual" | "error" | "shutdown" | "resource-limit";
    duration: int32;
  };
}

// --- Supporting models (from plugin system) ---
model PluginManifest {
  id: string;
  name: string;
  version: SemanticVersion;
  description: string;
  author: string;
  license: string;
  entryPoint: string;
  dependencies: string[];
}

model PluginDependency {
  name: string;
  version: SemanticVersion;
  optional: boolean = false;
}

// --- Validation result (deeply nested, array of union literals) ---
model CommandValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: {
    validatedAt: utcDateTime;
    ruleVersion: SemanticVersion;
    requiredStates: ("loaded" | "running" | "stopped" | "failed")[];
    forbiddenStates: ("loading" | "unloaded")[];
  };
}

model ValidationError {
  severity: "critical" | "high" | "medium" | "low";
  category: "performance" | "security" | "compatibility" | "best-practice";
  code: string;
  message: string;
  field: string;
}

model ValidationWarning {
  code: string;
  message: string;
  suggestion: string;
}

// --- AsyncAPI Operations ---
@doc("Publish a load-plugin command")
@channel("commands.plugin.load")
@publish
op publishLoadPluginCommand(): LoadPluginCommand;

@doc("Publish an unload-plugin command")
@channel("commands.plugin.unload")
@publish
op publishUnloadPluginCommand(): UnloadPluginCommand;

@doc Notify when plugin loaded
@channel("events.plugin.loaded")
@publish
op publishPluginLoadedEvent(): PluginLoadedEvent;

@doc("Notify when plugin unloaded")
@channel("events.plugin.unloaded")
@publish
op publishPluginUnloadedEvent(): PluginUnloadedEvent;

@doc("Publish command validation result")
@channel("events.validation.command")
@publish
op publishCommandValidationResult(): CommandValidationResult;

@doc("Subscribe to plugin manifest queries")
@channel("queries.plugin.manifest")
@subscribe
op subscribePluginManifestQuery(pluginId: string): PluginManifest;
