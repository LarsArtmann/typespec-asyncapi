Fixed in #288 — tagged v1.2.0. Verified on current main: the regression tests in `test/validation/schema-emitter-regression.test.ts` pin exactly this scenario (property typed `Value.fixed` emits `{"const": ...}`), ran green here.

One caveat: npm still serves 1.1.0, so the repro as written still hits the old behavior. The 1.2.0 publish run failed on an expired token — tracked in TODO_LIST.md with #298 as the preferred fix path. Until that ships, the v1.2.0 tag has the fix.
