/**
 * Supported template variables for path resolution
 */
export type PathTemplateVariables = {
  /** Current command name (e.g., "typespec", "tsp") */
  cmd: string;
  /** Project root directory path */
  "project-root": string;
  /** Name of the emitter ("asyncapi") */
  "emitter-name": string;
  /** Configured output directory */
  "output-dir": string;
};
