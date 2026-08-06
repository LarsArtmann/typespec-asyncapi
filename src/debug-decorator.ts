// Quick debug: print what config looks like
import type { DecoratorContext } from "@typespec/compiler";

export const $debug = (context: DecoratorContext, target: unknown, config: unknown): void => {
  // eslint-disable-next-line no-console
  console.error("DEBUG config:", JSON.stringify(config, null, 2), "kind:", (config as { kind?: string })?.kind);
};