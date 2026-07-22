/**
 * Security Builder
 *
 * Builds AsyncAPI security scheme objects from @security decorator state.
 * Applies OAuth2 scope normalization (scopes → availableScopes).
 */

import type { AsyncAPIConsolidatedState } from "../state.js";
import type { DocumentBuildContext } from "./types.js";
import { normalizeOAuth2Scopes } from "./shared-utils.js";

/** Build all security schemes from state. */
export function buildSecuritySchemes(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
): void {
  for (const [_type, data] of state.securityConfigs) {
    const entries = Array.isArray(data) ? data : [data];
    for (const secData of entries) {
      ctx.securitySchemes[secData.name] = normalizeOAuth2Scopes(secData.scheme);
    }
  }
}
