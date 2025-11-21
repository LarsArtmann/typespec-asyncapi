/**
 * Domain Decorators Index
 * 
 * Exports all domain decorators for consistent import patterns
 */

export { $server as ServerDecorator } from './server.js';

/**
 * Domain decorator factory
 */
export interface DomainDecorator {
  namespace: string;
  name: string;
  target: any;
}

/**
 * Create domain decorator
 */
export function createDomainDecorator(
  namespace: string,
  name: string,
  target: any
): DomainDecorator {
  return {
    namespace,
    name,
    target
  };
}