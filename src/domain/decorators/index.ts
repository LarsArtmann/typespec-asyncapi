/**
 * Domain Decorators Index
 *
 * Exports all domain decorators for consistent import patterns
 */

export { $server as ServerDecorator } from "./server.js";

/**
 * Domain decorator factory
 */
export type DomainDecorator = {
  namespace: string;
  name: string;
  target: unknown;
};

/**
 * Create domain decorator
 */
export function createDomainDecorator(
  namespace: string,
  name: string,
  target: unknown,
): DomainDecorator {
  return {
    namespace,
    name,
    target,
  };
}
