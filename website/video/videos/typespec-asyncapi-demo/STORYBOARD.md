---
format: 1920x1080
duration: 30s
message: "Your AsyncAPI spec should be as typed as your code"
arc: PAS — hook → value claim → proof (compile) → proof (validation) → CTA
audience: event-driven API architects, platform engineers, TypeSpec users
mode: autonomous
music: none
---

## Video direction

- **palette system** (from frame.md, broadside remixed): warm dark canvas `#0A0908`/`#110E0C` registers; light ink `#A8A29E` (body text), bright ink `#E5E7E7`/`#E7E5E4` (display), teal accent `#14B8A6` (THE single voltage — drift word, checks, URL, caret), mono chrome in JetBrains Mono uppercase 0.14em for labels/terminal, Space Grotesk lowercase for display. Warm card surfaces `#1C1917` with 1px hairline borders. Never pure black/white.
- **motion grammar + reveal model**: smooth long-tail settles (`power3` family, no bounce) — the video is SILENT, so every reveal is paced to its own on-screen text cue (the typed/revealed phrase is the beat). Nothing front-loads: each piece enters when its phrase arrives, spread across the back ~50% of each frame. Terminal typing is character-by-character with a blinking caret; code cards reveal line-group by line-group.
- **rhythm / held-frame allocation**: Frame 2 is the deliberate breather (near-still title card, one restrained move, then hold). Frames 1/3/5 are kinetic; frame 4 lands on a still receipt. Holds stay still — subtle jitter at most.
- **negative list**: no nav bars/footers/scrollbars/browser chrome/cursors (frames are terminal + type, not fake browser UI); no purple-blue gradients, no bokeh, no lazy breathing loops, no back-half slow pans, no infinite/`repeat` motion, no `Math.random`, no CSS keyframe motion; never both failure modes — slideshow (front-load + freeze) and screensaver (independent floating).
- **caption band**: content in the top ~83%; bottom band stays clear.

## Frame 1 — The drift

- scene: Massive lowercase type punches in beat by beat: "hand-written AsyncAPI YAML." then "drifts." — the drift word lands in teal
- duration: 5s
- poster: 4s
- transition_in: cut
- status: outline
- voiceover: ""
- src: compositions/frames/01-drift.html
- type: hook
- persuasion: Pain validation
- beat: frustration
- blueprint: kinetic-type-beats (Reproduce — escalation variant)
- focal: (typography-only beat, no assets)
- asset_candidates: (none — pure typography)

Scene 1 (0.0–1.2s): bare warm-dark canvas; the phrase "hand-written" enters alone via kinetic beat-slam (`kinetic-beat-slam`), lowercase display filling ~60% width, centered upper-third. One move only.
Scene 2 (1.2–2.4s): hard-cut flash word-swap (`discrete-text-sequence`) — "asyncapi yaml." replaces it on an instant cut, same type register; the swap itself is the beat.
Scene 3 (2.4–3.6s): the line "drifts." slams in below in TEAL accent (`kinetic-beat-slam`), weight-transfer reads as the punchline; asymmetric 60/40, two depth layers (type + faint hairline rule).
Scene 4 (3.6–5.0s): held read — everything still; at most subtle jitter (`sine-wave-loop`, low amplitude) on the teal word. No pan, no push.

## Frame 2 — Typed in. Validated out.

- scene: Near-still title card: the product name as mono chrome label, then "typed in. validated out." resolving word by word; small teal logo mark
- duration: 5s
- transition_in: zoom-through
- status: outline
- voiceover: ""
- src: compositions/frames/02-intro.html
- type: product_intro
- persuasion: Future pacing
- beat: clarity
- blueprint: titlecard-reveal (Reproduce)
- focal: (typography-only beat, no assets)
- asset_candidates: (none — pure typography + brand mark drawn in-code as SVG)

Scene 1 (0.0–1.5s): calm open — mono chrome label "@lars-artmann/typespec-asyncapi" letterspaced small above center (`per-word staggered reveal`, `dynamic-content-sequencing`, one restrained move), plus the brand's stream-chevron mark self-drawing (`svg-path-draw`) beside it, teal stroke.
Scene 2 (1.5–3.2s): headline "typed in." then "validated out." resolve word-by-word (`dynamic-content-sequencing`) on the value cues, lowercase display centered; "validated" carries the teal.
Scene 3 (3.2–5.0s): still hold — the breather frame. No motion beyond the settled state; low motion IS the payload.

## Frame 3 — One compile

- scene: The real api.tsp code card; a terminal below types `tsp compile api.tsp` and streams the REAL compile output (✔ Compiling, ✔ emitter 13ms, Compilation completed successfully)
- duration: 8s
- transition_in: crossfade
- status: outline
- voiceover: ""
- src: compositions/frames/03-compile.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: confidence
- blueprint: device-surface-showcase (Adapt — the "surface" is a terminal + editor card pair, not a browser; keep the stepwise-flow-completion spine: source state → command → success state, cursorless)
- focal: (typography/code-only beat — real filenames and real output as live text, no assets)
- asset_candidates: (none — native code rendering is sharper than screenshots)

Adapt: surface = editor card (api.tsp) above terminal card (tsp compile); keep the core-loop-once spine and the confirming-success cap.
Scene 1 (0.0–2.2s): the api.tsp editor card coasts in from the left (`spring-pop-entrance` smooth settle, power2 coast — no spring overshoot) to a 55/45 upper position; its first lines reveal line-group by line-group (`dynamic-content-sequencing`) — `model Event` block, then `@channel("events")` + `op publishEvent(): Event;`. Mono, warm card surface, 1px hairline.
Scene 2 (2.2–4.0s): terminal card enters below-right via cluster→outward expansion (`center-outward-expansion`); the command `tsp compile api.tsp` types character-by-character behind a blinking caret (`discrete-text-sequence` + `context-sensitive-cursor`).
Scene 3 (4.0–6.4s): the machine answers — output lines stream in on their own beats (`dynamic-content-sequencing`): "✔ Compiling" → "✔ @lars-artmann/typespec-asyncapi 13ms" → "Compilation completed successfully." — each check lands in teal (`asr-keyword-glow` on the check marks). The typing cursor is the only "actor"; no mouse cursor.
Scene 4 (6.4–8.0s): held read on the success state; subtle jitter on the caret only. Still, confident.

## Frame 4 — The receipt

- scene: The emitted asyncapi.yaml slides in beside the terminal, then yields to the validation line: "270+ tests. official AsyncAPI 3.1.0 JSON Schema." with three stat chips (22 protocols / 19 bindings / 30 decorators)
- duration: 7s
- transition_in: push-slide
- status: outline
- voiceover: ""
- src: compositions/frames/04-receipt.html
- type: benefit_highlight
- persuasion: Statistical proof
- beat: trust
- blueprint: video-text-pivot (Adapt — the "video" is the yaml artifact card; keep the yield-and-fill signature + the typed impact text + the stamp)
- focal: (typography/code-only beat — real emitted YAML as live text)
- asset_candidates: (none — native rendering)

Adapt: replace the video clip with the emitted `asyncapi.yaml` artifact card; keep the slide-aside weight-transfer into the stat, the typed impact line, and the pill stamp.
Scene 1 (0.0–1.8s): the asyncapi.yaml card (file chrome label + the real YAML — `asyncapi: 3.1.0`, `info:`, `channels: events`, `$ref` lines) reveals line-group by line-group (`dynamic-content-sequencing`), centered ~55% width; the `3.1.0` token carries teal.
Scene 2 (1.8–3.4s): signature move — the yaml card SLIDES aside (x + scale down) into the space the hero stat now fills: "270+" pops in with 3D-depth type and counts up (`counting-dynamic-scale`); the label "tests against the official AsyncAPI 3.1.0 JSON Schema" lands beneath it.
Scene 3 (3.4–5.2s): three stat chips — "22 protocols", "19 bindings", "30 decorators" — snap in sequentially (`center-outward-expansion` stagger), mono chrome, hairline borders; reveal spread across this window, not dumped.
Scene 4 (5.2–7.0s): stamp — a teal pill snaps shut (scaleX 0→1) around "validated on every build" (`video-text-pivot` stamp); holds still. The receipt reads clean.

## Frame 5 — One command

- scene: Terminal pill types the install command `pnpm add @lars-artmann/typespec-asyncapi`, caret blinks; below, the URL typespec-asyncapi.lars.software with teal logo mark
- duration: 5s
- transition_in: crossfade
- status: outline
- voiceover: ""
- src: compositions/frames/05-cta.html
- type: cta
- persuasion: Friction reduction
- beat: urgency-to-act
- blueprint: prompt-type-submit-generate (Adapt — sub-shape A: the command is the ask, cut just after submit; keep the typed-command-into-real-surface spine)
- focal: (typography-only beat)
- asset_candidates: (none — terminal pill + URL lockup)

Adapt: surface = a single terminal prompt pill, not a chat composer; keep character-by-character typing, the eased push-in, and the cut just after the submit.
Scene 1 (0.0–0.8s): one eased push-in (`multi-phase-camera`) lands tight on a terminal prompt pill centered, caret blinking (`context-sensitive-cursor`).
Scene 2 (0.8–3.0s): the install command `pnpm add @lars-artmann/typespec-asyncapi` types character-by-character (`discrete-text-sequence`); package name in bright ink, caret leads in teal.
Scene 3 (3.0–5.0s): submit lands (a subtle press settle, `press-release-spring` smooth register — no bounce) and the site lockup reveals beneath: stream-chevron mark + "typespec-asyncapi.lars.software" (URL in teal, per-word staggered reveal `dynamic-content-sequencing`); caret keeps its subtle jitter; hold to the end.
