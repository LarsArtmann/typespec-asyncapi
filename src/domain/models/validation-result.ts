/**
 * 📊 ASYNCAPI VALIDATION RESULT UTILITIES
 * 
 * Provides utility functions for extracting metrics from validated
 * AsyncAPI documents. Used by critical validation tests.
 */

/**
 * Extract channel count from AsyncAPI document
 */
export function getChannelCount(doc: Record<string, unknown>): number {
  if (!doc.channels) return 0;
  return Object.keys(doc.channels).length;
}

/**
 * Extract operation count from AsyncAPI document  
 */
export function getOperationCount(doc: Record<string, unknown>): number {
  if (!doc.operations) return 0;
  return Object.keys(doc.operations).length;
}

/**
 * Extract schema count from AsyncAPI document
 */
export function getSchemaCount(doc: Record<string, unknown>): number {
  const components = doc.components as Record<string, unknown> | undefined;
  const schemas = components?.schemas as Record<string, unknown> | undefined;
  if (!schemas || typeof schemas !== 'object') return 0;
  return Object.keys(schemas).length;
}

/**
 * Extract server count from AsyncAPI document
 */
export function getServerCount(doc: Record<string, unknown>): number {
  if (!doc.servers) return 0;
  return Object.keys(doc.servers).length;
}

/**
 * Calculate validation metrics summary
 */
export function getValidationMetrics(doc: Record<string, unknown>) {
  return {
    channels: getChannelCount(doc),
    operations: getOperationCount(doc),
    schemas: getSchemaCount(doc),
    servers: getServerCount(doc),
    total: getChannelCount(doc) + getOperationCount(doc) + getSchemaCount(doc) + getServerCount(doc)
  };
}