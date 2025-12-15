/**
 * Path Template Utilities
 *
 * Provides utilities for handling TypeSpec path templates
 * and converting them to AsyncAPI channel addresses
 */

/**
 * TypeSpec path template types
 */
export type PathTemplate = {
  path: string;
  parameters: PathParameter[];
  segments: string[];
};

export type PathParameter = {
  name: string;
  type: string;
  required: boolean;
  description?: string;
};

/**
 * Parse TypeSpec path template
 */
export function parsePathTemplate(path: string): PathTemplate {
  const segments = path.split("/").filter((segment) => segment.length > 0);
  const parameters: PathParameter[] = [];

  const pathWithParameters = path.replace(/\{([^}]+)\}/g, (match: string, paramStr: string) => {
    const parts = paramStr.split(":");
    const name = parts[0] ?? "";
    const type = parts[1] ?? "string";

    parameters.push({
      name,
      type,
      required: true,
      description: `Path parameter: ${name}`,
    });

    return `{${name}}`;
  });

  return {
    path: pathWithParameters,
    parameters,
    segments,
  };
}

/**
 * Convert TypeSpec path template to AsyncAPI channel address
 */
export function convertToAsyncAPIAddress(template: PathTemplate): string {
  return template.path.replace(/\{([^}]+)\}/g, "{$1}");
}

/**
 * Extract parameters from path template
 */
export function extractParameters(path: string): PathParameter[] {
  const template = parsePathTemplate(path);
  return template.parameters;
}

/**
 * Validate path template format
 */
export function validatePathTemplate(path: string): boolean {
  // Basic validation
  if (!path || typeof path !== "string") {
    return false;
  }

  // Path should start with / (absolute)
  if (!path.startsWith("/")) {
    return false;
  }

  // Check for balanced braces
  const openBraces = (path.match(/\{/g) ?? []).length;
  const closeBraces = (path.match(/\}/g) ?? []).length;

  if (openBraces !== closeBraces) {
    return false;
  }

  // Check for empty parameter names
  const invalidParams = path.match(/\{[^}]*\}/g);
  if (invalidParams) {
    for (const param of invalidParams) {
      const paramName = param.slice(1, -1);
      if (!paramName.trim() || (paramName.includes(":") && paramName.split(":")[0].trim() === "")) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Normalize path template
 */
export function normalizePathTemplate(path: string): string {
  // Remove trailing slash unless it's the root
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  // Ensure leading slash
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  return path;
}

/**
 * Convert path to channel name
 */
export function pathToChannelName(path: string): string {
  const normalized = normalizePathTemplate(path);
  const template = parsePathTemplate(normalized);

  // Convert path segments to channel name
  const segments = template.segments.map(
    (segment) => segment.replace(/\{([^}]+)\}/g, "$1"), // Remove braces
  );

  return segments.join("-");
}
