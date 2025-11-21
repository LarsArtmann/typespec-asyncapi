/**
 * 📊 ASYNCAPI VALIDATION RESULT UTILITIES
 * 
 * Provides utility functions for extracting metrics from validated
 * AsyncAPI documents. Used by critical validation tests.
 */

/**
 * Extract channel count from AsyncAPI document
 */
export function getChannelCount(doc: any): number {
  if (!doc.channels) return 0;
  return Object.keys(doc.channels).length;
}

/**
 * Extract operation count from AsyncAPI document  
 */
export function getOperationCount(doc: any): number {
  if (!doc.operations) return 0;
  return Object.keys(doc.operations).length;
}

/**
 * Extract schema count from AsyncAPI document
 */
export function getSchemaCount(doc: any): number {
  if (!doc.components?.schemas) return 0;
  return Object.keys(doc.components.schemas).length;
}

/**
 * Extract server count from AsyncAPI document
 */
export function getServerCount(doc: any): number {
  if (!doc.servers) return 0;
  return Object.keys(doc.servers).length;
}

/**
 * Calculate validation metrics summary
 */
export function getValidationMetrics(doc: any) {
  return {
    channels: getChannelCount(doc),
    operations: getOperationCount(doc),
    schemas: getSchemaCount(doc),
    servers: getServerCount(doc),
    total: getChannelCount(doc) + getOperationCount(doc) + getSchemaCount(doc) + getServerCount(doc)
  };
}