/**
 * Performance benchmark fixture generator.
 *
 * Programmatically generates large TypeSpec specs for benchmarking
 * compilation and emission performance.
 */

export interface FixtureOptions {
  channelCount: number;
  modelsPerChannel: number;
  propertiesPerModel: number;
  sharedModelCount: number;
}

export const DEFAULT_OPTIONS: FixtureOptions = {
  channelCount: 100,
  modelsPerChannel: 1,
  propertiesPerModel: 6,
  sharedModelCount: 10,
};

const PROPERTY_TYPES = [
  "string",
  "int32",
  "int64",
  "float64",
  "boolean",
  "utcDateTime",
];

function generateModel(
  name: string,
  propCount: number,
  includeRefs: boolean,
  sharedNames: string[],
): string {
  const lines: string[] = [`  model ${name} {`];

  for (let i = 0; i < propCount; i++) {
    const propName = `field${i}`;
    if (includeRefs && i === propCount - 1 && sharedNames.length > 0) {
      const refModel = sharedNames[i % sharedNames.length]!;
      lines.push(`    ${propName}: ${refModel};`);
    } else {
      const typeIndex = (i + name.length) % PROPERTY_TYPES.length;
      const typeName = PROPERTY_TYPES[typeIndex]!;
      const optional = i % 3 === 0 ? "?" : "";
      lines.push(`    ${propName}${optional}: ${typeName};`);
    }
  }

  lines.push("  }");
  return lines.join("\n");
}

function generateChannel(index: number, modelName: string): string {
  const address = `events.channel.${index}`;
  const opName = `publishEvent${index}`;
  return [`  @channel("${address}")`, `  op ${opName}(): ${modelName};`].join(
    "\n",
  );
}

export function generateFixture(options: FixtureOptions): string {
  const { channelCount, propertiesPerModel, sharedModelCount } = options;
  const lines: string[] = [`namespace BenchmarkSpec;`, ""];

  const sharedNames: string[] = [];
  for (let i = 0; i < sharedModelCount; i++) {
    const name = `SharedModel${i}`;
    sharedNames.push(name);
    lines.push(generateModel(name, propertiesPerModel, false, []));
  }
  lines.push("");

  for (let i = 0; i < channelCount; i++) {
    const modelName = `EventModel${i}`;
    lines.push(
      generateModel(modelName, propertiesPerModel, true, sharedNames),
      generateChannel(i, modelName),
      "",
    );
  }

  return lines.join("\n");
}

export function estimateSpecSize(source: string): {
  bytes: number;
  lines: number;
  models: number;
  channels: number;
} {
  const lines = source.split("\n").length;
  const models = (source.match(/\bmodel\s+\w+/g) ?? []).length;
  const channels = (source.match(/@channel\(/g) ?? []).length;
  return { bytes: source.length, lines, models, channels };
}
