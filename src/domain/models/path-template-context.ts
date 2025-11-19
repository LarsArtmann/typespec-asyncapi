/**
 * Context for path template resolution
 */
export type PathTemplateContext = {
  /** Program context from TypeSpec */
  program?: unknown;
  /** Emitter output directory */
  emitterOutputDir?: string;
  /** Current working directory override */
  cwd?: string;
};
