/** Escape a token for a plain JSON Pointer (RFC 6901, section 3). */
export function escapePointerToken(token: string): string {
  return token.replaceAll("~", "~0").replaceAll("/", "~1");
}

/** Escape a JSON Pointer token for use in a URI fragment (RFC 6901, section 6). */
export function escapeRefToken(token: string): string {
  return encodeURIComponent(escapePointerToken(token));
}
