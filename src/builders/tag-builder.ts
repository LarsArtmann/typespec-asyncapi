/**
 * Tag Builder
 *
 * Collects all unique tags from @tags decorator state into the reusable
 * components.tags map. Tags are keyed by name for deduplication.
 *
 * Duplicate tag names are overwritten (last decorator wins) because
 * `ctx.tags[name]` is assigned for every tag occurrence in map iteration order.
 */

import type { BuilderFn } from "./types.js";

/** Collect all unique tags from state into ctx.tags, keyed by tag name. */
export const buildTags: BuilderFn = (state, ctx) => {
  for (const [, tagList] of state.tags) {
    for (const tag of tagList) {
      ctx.tags[tag.name] = tag;
    }
  }
};
