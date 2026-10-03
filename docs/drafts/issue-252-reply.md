<!-- Draft reply to https://github.com/LarsArtmann/typespec-asyncapi/issues/252 (own repo, maintainer reply to LukasKnuth).
     Genre: own-repo maintainer comment (terse, one point per paragraph, no headers, no footer, no banner).
     Checker: cd ~/.agents/skills/github-voice && python3 scripts/check-draft.py docs/drafts/issue-252-reply.md --kind comment
     Post ONLY on Lars's explicit order. Assumes 1.1.0 tagged (it is, 2026-10-03). -->

@LukasKnuth Your follow-up was right: both operations fall into `@typespec/http`'s implicit routing. Every `op` under a `@service` namespace gets a route, and a verb-less `op` defaults to GET — so `receivePing` and `moduleOperation` both resolve to `GET /api/v1` and clash.

Shipped in 1.1.0: an `event-op-in-service-namespace` warning now cites the resolved route before any emitter runs, so it shows even when the duplicate-operation errors abort the output. The setup itself is supported — the event operations just have to live in a sibling namespace outside the `@service` subtree: https://typespec-asyncapi.lars.software/guides/mixing-with-openapi/

Also filed the underlying implicit-verb default upstream, since the errors you got name neither the verb nor the real conflict: https://github.com/microsoft/typespec/issues/12105
