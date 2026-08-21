---
workflow: product-launch-video
flow: automation
storyboard: yes
message: "Your AsyncAPI spec should be as typed as your code"
destination: website-embed
aspect: 1920x1080
language: en
length: 30s
angle: sell
---

## Intent

A 30-second silent promo for typespec-asyncapi, embedded above the fold on the landing page at typespec-asyncapi.lars.software/#demo. It must sell, not tour: the hook speaks the README "Why?" pain (hand-written AsyncAPI YAML drifts from reality), the value beat is the one-paragraph summary (model in TypeSpec, emit validated AsyncAPI 3.1), the evidence beats show real product behavior, and the final beat is the install command plus the site URL. Audience: event-driven API architects, platform engineers, backend teams already using TypeSpec.

## Assets

- capture/ — the freshly built website (localhost:4321): hero with TypeSpec code card, landing page, docs pages.

## Customizations

- Fully silent video: `music: none` in STORYBOARD.md frontmatter, no SCRIPT.md. On-screen text carries the entire argument (muted-test doctrine — most viewers watch muted).
- CTA beat is the typed install command `pnpm add @lars-artmann/typespec-asyncapi` plus `typespec-asyncapi.lars.software`.

## Notes

- Brand: teal accent `#14b8a6` on warm dark `#0a0908`; light `#faf8f5`. Fonts: Space Grotesk (display/body), JetBrains Mono (code).
- Evidence beats must show real product visuals: the actual .tsp source, the actual emitted asyncapi.yaml, the real `tsp compile` terminal output — never fabricated demo UI.
- One narrative, written once in the README: hook = "hand-written AsyncAPI YAML drifts"; value = "typed, validated, protocol-aware AsyncAPI 3.1 from TypeSpec"; proof = compile + validated output; CTA = install + URL.
