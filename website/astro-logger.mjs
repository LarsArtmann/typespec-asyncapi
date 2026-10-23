import nodeLogger from "astro/logger/node";

/**
 * Astro logs two warnings that are expected in this project and are therefore
 * filtered here instead of on every build:
 *
 * - `[config] Shiki syntax highlighting uses inline styles ... CSP`: Starlight
 *   renders code blocks with Expressive Code, which writes token colors as
 *   `style` attributes. `style-src-attr 'unsafe-inline'` in astro.config.mjs is
 *   the supported mitigation, and `scripts/check-csp.mjs` enforces the policy.
 * - `[content] The collection "i18n" does not exist or is empty`: Starlight reads
 *   `getCollection("i18n")` on every build even on a single-language site.
 *
 * Matching is by exact message prefix, so any new or reworded warning still
 * surfaces.
 */
const SUPPRESSED_MESSAGES = [
  "Shiki syntax highlighting uses inline styles that are not compatible with Content Security Policy (CSP).",
  'The collection "i18n" does not exist or is empty.',
];

export default function astroLogger(options) {
  const destination = nodeLogger(options);
  return {
    write(event) {
      const message = event.message ?? "";
      if (SUPPRESSED_MESSAGES.some((fragment) => message.startsWith(fragment))) {
        return;
      }
      destination.write(event);
    },
  };
}
