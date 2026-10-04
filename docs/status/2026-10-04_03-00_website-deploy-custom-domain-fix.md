# Status Report: Website Deploy + Custom Domain Fix (M2)

**Session:** 2026-10-03 ~16:30 → 2026-10-04 03:00 CEST
**Trigger:** "Is https://typespec-asyncapi.lars.software/guides/mixing-with-openapi/ deployed?"
**Outcome:** No → diagnosed → user said "go fix it" → **fully fixed and live.**
**Scope discipline:** per instruction, this report covers ONLY this session's run and what it surfaced. No fresh project audit.

---

## Headline answers (brutal self-review)

### What did I forget?

1. **I was reactive, not proactive.** My first answer to "is it deployed?" was a diagnosis ("no — stale deploy + missing domain") and I stopped there. The user had to send "go fix it" as a separate instruction. The fix was fully within my reach (creds verified, playbook documented) — I should have either fixed it immediately or explicitly offered to. AGENTS.md says "BE AUTONOMOUS"; I paused at a diagnosis report.
2. **The fleet doc literally prescribed my solution and I walked past it twice.** `dns-terraform.md` says "Use the fetch tool on https://ifconfig.me" for the public IP — I first tried three Node-based IP services (icanhazip, checkip.amazonaws.com, api64.ipify.org), all failed, and only then used the exact command from my own loaded reference. Same class: the `firebase-rest-api.md` reference lists "Method 2: configstore token" and I burned 2–3 calls on the gcloud token (403) before switching.
3. **The literal URL from the question.** The user asked about the trailing-slash URL (`.../mixing-with-openapi/`); I verified only the non-slash variant after deploy and closed the loop. Only caught it while writing this report — it does work (Firebase cleanUrls redirects), but I claimed "live" on a different URL than the one asked about.
4. **Long-running poll liveness.** My 30×2-minute cert poll loop silently degraded to empty output after ~17:45 — the configstore access token expired (~1 h TTL) and the loop had no re-auth or failure detection. I noticed only by reading the raw output. Outcome unaffected (direct HTTPS check proved the cert), but the monitor I built was blind for its last 6 polls.
5. **Cert state was never observed as `CERT_ACTIVE` via the API.** I declared the cert live from end-to-end HTTPS 200s (which is the real ground truth for TLS), but the runbook's Step 9 (poll until CERT_ACTIVE) was never satisfied — the 401s made sure of that. Evidence is behavioral, not API-state-based. Practical, honest, but a deviation from the verified checklist.
6. **The `og.png` was verified as 200, not as correct.** It returns image bytes, but I never confirmed the bytes are the *current* site's branding (a stale image from the September launch would also return 200).

### What could I have done better?

1. **Pre-flight auth audit before touching anything.** `~/.config/gcloud/application_default_credentials.json` had `quota_project_id: "ai-testing-492904"` sitting in plain sight. One `cat` before starting would have predicted the 403 and saved the detour.
2. **Followed the template over the file.** The skill's DNS template says `mx_pref = 0`; the domains repo convention is `mx_pref = 10`. I got this right (followed the file), but only because I read it — the reference itself is stale and will mislead the next session. That's a skill-repo fix I haven't done (see e/f).
3. **Verification asymmetry.** I verified what I built (page, domain, cert, URLs) with genuine rigor, but left three soft ends: formatting of my markdown edits unverified (no prettier in either repo's node_modules; a cold `nix fmt` check was judged too heavy mid-session), og.png content unverified, and the fleet-wide `site-monitor.sh` (fleet doc's own acceptance command for M2) never run — I verified the one site I fixed, not the fleet the doc asked about.
4. **Report file format.** This session's status reports live in `.md` per the standing task-queue convention, but the status-report skill is HTML-canonical — I honored the user's explicit `.md` demand and am flagging the divergence here rather than silently dropping it.

### What could I still improve?

1. **The root cause of the incident is still alive: deploys are manual.** Today's bug was "page added to repo, deploy never run". I fixed the symptom (deployed it) and left the process that caused it untouched. The website-launch skill has a ready Phase 7 (two-job CI: build → deploy via `FIREBASE_SERVICE_ACCOUNT`). Until that exists, the next content change recreates this exact stale-deploy state.
2. **Session learnings should flow back into the skill, not just project AGENTS.md.** I recorded 4 new entries in this repo's AGENTS.md (deploy command, domain live, REST-auth gotcha, Namecheap gotchas), but the website-launch skill references themselves (`firebase-rest-api.md`, `dns-terraform.md`, both "Last verified 2026-07-13") are now partially wrong by my own measurements (gcloud Method 1 403s on this setup; api.ipify.org blocked; `mx_pref` convention). Per the skill-authoring rules those fixes belong in the crush-config repo, committed there. Not done.
3. **Cert monitoring for the new domain.** Firebase auto-renews, but nothing alerts if it doesn't. The fleet has a monitor script; whether this domain is in its URL list is unverified.

---

## a) FULLY DONE (verifiable)

| # | Item | Evidence |
|---|------|----------|
| 1 | Diagnosed the "not deployed" report into two exact root causes | NXDOMAIN from local resolver AND 1.1.1.1; apex → Firebase VIP 199.36.158.100; page source in repo since commit `0fcf612d` (2026-10-03); deployed build predates it (sidebar lacked the page, `/guides/mixing-with-openapi` → 404 on web.app) |
| 2 | Rebuilt website including the new guide | `astro build` + `fix-csp.mjs` patched 17/17 files; `dist/guides/mixing-with-openapi/index.html` present |
| 3 | Deployed to Firebase Hosting | `firebase deploy --only hosting:typespec-asyncapi --project lars-software` → release complete; page 200 on `typespec-asyncapi.web.app` with "Mixing with OpenAPI" in sidebar |
| 4 | Registered the custom domain via Firebase Hosting REST API | `POST /v1beta1/.../customDomains?customDomainId=typespec-asyncapi.lars.software` → 200; discovered required CNAME + ACME TXT via polling |
| 5 | Staged + applied DNS in Terraform | `~/projects/domains/lars.software.tf`: CNAME `typespec-asyncapi → typespec-asyncapi.web.app.` + TXT `_acme-challenge → 1wUYfja9...`; fmt + validate + plan (1 to change, 0 destroy) + apply; records confirmed on 1.1.1.1 AND authoritative `dns1.registrar-servers.com` |
| 6 | SSL cert provisioned and custom domain live | Lifecycle observed CERT_VALIDATING → CERT_PROPAGATING; end-to-end proof: `https://typespec-asyncapi.lars.software/`, `/og.png` (200 image/png), `/guides/mixing-with-openapi` (200 text/html), trailing-slash variant — all 200 |
| 7 | Fleet ops doc updated | `site-fleet-ops.md` §1.2 marked RESOLVED 2026-10-03 with method notes; canonical row corrected 15/17 → 16/17 (only cmdguard left). Committed by daemon (`b9d6731`) |
| 8 | Project memory updated | AGENTS.md: manual-deploy command + no-CI fact, domain-live fact, REST-auth gotcha (configstore token vs gcloud 403), Namecheap gotchas (ipify blocked, `NAMECHEAP_CLIENT_IP`, record placement/mx_pref). Committed by daemon |
| 9 | All working trees left clean | `typespec-asyncapi` (clean), `domains` (committed `755c3af`), `vision-review-agent` (committed `b9d6731`) — verified, not assumed |
| 10 | Trailing-slash URL from the original question verified | `https://typespec-asyncapi.lars.software/guides/mixing-with-openapi/` serves full content |

## b) PARTIALLY DONE

| # | Item | Works | Missing | Effort |
|---|------|-------|---------|--------|
| 1 | **Deploy automation** | Nothing — that's the gap | Phase 7 CI workflow (build job → deploy job with `FIREBASE_SERVICE_ACCOUNT` secret) not created; every future website change is one forgotten manual deploy away from this incident's twin | M |
| 2 | **Cert state via API** | End-to-end HTTPS proves TLS works | API-level `CERT_ACTIVE` never observed (token expired mid-poll); runbook Step 9 checklist item technically unsatisfied | S |
| 3 | **Skill reference accuracy** | Project AGENTS.md captures the gotchas | `website-launch` skill references in crush-config repo still carry the now-known-wrong bits (gcloud-as-preferred-method; ipify auto-detect; mx_pref 0 vs 10; long-poll token expiry) | M |
| 4 | **Fleet verification** | This one site fully verified | Fleet doc's own acceptance command (`bash scripts/site-monitor.sh`) not run; og.png *content* correctness unverified | S |
| 5 | **Formatting of edited markdown** | Content correct; tables match existing style | `prettier --check` not runnable (no binary in either repo's node_modules); cold `nix fmt` check deferred — low risk (default proseWrap=preserve) | S |

## c) NOT STARTED

| # | Item | Why | Priority |
|---|------|-----|----------|
| 1 | Fix `cmdguard.lars.software` — the last KNOWN-broken fleet domain (identical M2-class fix, playbook now proven) | Outside this repo; needs owner go-ahead | High |
| 2 | Fleet plan follow-ups the doc attaches to this fix: "re-shoot + re-review typespec at the custom domain (plan F6)" | Explicitly a later fleet task, not session scope | Medium |
| 3 | `/guides` index page — currently 404s (Starlight emits no directory index; users hitting `/guides` get the 404 page) | Noticed during diagnosis, judged out of scope for the fix; design intent unknown | Medium |
| 4 | `docs-health` HARVEST of section f into TODO_LIST/ROADMAP | Report was just written; harvest is the explicit next step if the session continues | High (process) |
| 5 | gcloud ADC repair (quota project `ai-testing-492904`, missing `serviceusage.services.use` on `lars-software`) so the *documented-preferred* auth path actually works | Pre-existing infra issue, not session-caused | Low-Medium |

## d) TOTALLY FUCKED UP

**Nothing I touched broke.** No data loss, no broken production state, no wrong records applied, working trees clean. Being specific about what is nonetheless Fucked Up (pre-existing or self-inflicted-but-mitigated):

| # | What | Severity | Root cause | Mitigation |
|---|------|----------|-----------|------------|
| 1 | **No deploy pipeline for the website at all** — the direct cause of today's incident and guaranteed recurrence | High (every future docs change) | CI has `ci.yml`/`release.yml` only; zero Firebase steps; deploys were someone's manual memory | Today's deploy is current; Phase 7 template exists and is proven across the fleet |
| 2 | **gcloud identity cannot act on `lars-software`** (403 PERMISSION_DENIED, quota project `ai-testing-492904`) | Medium | ADC bound to a different project's quota + missing role | Worked around via firebase-tools configstore token; token expires hourly, which silently killed my poll loop |
| 3 | **`api.ipify.org` blocked on this network** → Terraform Namecheap provider cannot auto-detect `client_ip` | Low | Network-level filtering | `NAMECHEAP_CLIENT_IP` env var (IP via ifconfig.me through the fetch tool); documented in AGENTS.md |
| 4 | **My poll script had no failure detection** — printed empty status for 6 polls instead of alerting on the 401 | Low (self-inflicted, no impact) | No re-auth, no exit-on-auth-failure in the loop | Detected by reading output; end state unaffected |
| 5 | **ACME TXT records accumulate in Terraform after certs go active** (`md-go-validator`'s old challenge token is still in `lars.software.tf`; mine will join it) | Low | Firebase rotates challenges; Terraform state keeps every token forever | Harmless but growing dead weight; cleanup candidate for the domains repo |

## e) WHAT WE SHOULD IMPROVE

1. **Deploy-on-merge for the website** (build + deploy GitHub Actions, service-account auth). Impact: kills the entire stale-deploy failure class. Concrete: Phase 7 of website-launch, two jobs, `FIREBASE_SERVICE_ACCOUNT` secret.
2. **Feed verified corrections back into the website-launch skill** (crush-config repo, committed — never edit the fan-out): configstore token as working auth for this setup, ipify-blocked note, `NAMECHEAP_CLIENT_IP` recipe, `mx_pref` convention note, long-poll re-auth pattern. Impact: next session skips today's detours entirely.
3. **Poll/monitor loops need auth-failure detection as a first-class case**, not silent empty output. Impact: any future long-wait operation (cert provisioning, propagation waits) stays observable.
4. **Answer-then-fix instead of answer-or-fix.** For questions with the shape "is X deployed?" where the answer is "no and I can fix it", the autonomous move is fix-and-report, not report-and-wait. Impact: one round-trip less per incident.
5. **Verify the literal artifact the user asked about** (trailing slash, exact URL) before declaring victory — cheap, and today it was the one gap in an otherwise complete verification.
6. **Status report format convergence:** task-queue `.md` convention vs skill HTML-canonical — the divergence is now flagged twice (here and in the skill); either the skill gets a `.md` mode or the convention gets an HTML upgrade. Decide once.

## f) NEXT TASKS (up to 50; grounded in this session's observations — a brainstorm, not a commitment; HARVEST should route: TODO_LIST = specific+actionable, ROADMAP = larger ideas)

| # | Task | Impact | Effort | Category |
|---|------|--------|--------|----------|
| 1 | Add CI deploy workflow for website/ (Phase 7: build job + deploy job, `FIREBASE_SERVICE_ACCOUNT`) | Critical | M | Feature |
| 2 | Fix `cmdguard.lars.software` with the proven M2 playbook (REST attach + Terraform CNAME/ACME) | High | S-M | Bug |
| 3 | HARVEST this report's section f into TODO_LIST.md / ROADMAP.md | High | S | Process |
| 4 | Run fleet `scripts/site-monitor.sh` to certify all 17 sites post-typespec-fix | High | S | Quality |
| 5 | Push verified corrections into website-launch skill references (firebase-rest-api.md, dns-terraform.md) in crush-config repo | High | M | Documentation |
| 6 | Re-shoot + re-review the typespec site at the custom domain (fleet plan F6) | Medium | M | Quality |
| 7 | Add `/guides` index page (or redirect `/guides` → first guide) to kill the directory 404 | Medium | S | Feature |
| 8 | Add a post-deploy smoke script (`website/scripts/smoke-urls.sh`): root, og.png, each guide, trailing-slash variants → 200 | Medium | S | Quality |
| 9 | Wire deploy workflow to also run the smoke script (item 8) post-deploy | Medium | S | Quality |
| 10 | Confirm og.png content matches current site branding (byte-compare vs `website/public/og.png`) | Medium | S | Quality |
| 11 | Verify one rendered page's canonical/OG meta tags now emit the live custom domain | Medium | S | Quality |
| 12 | Verify `sitemap-index.xml` URLs resolve 200 post-domain-live | Medium | S | Quality |
| 13 | Clean dead ACME TXT records from `lars.software.tf` (md-go-validator's expired challenge; typespec's once its cert renews) | Low | S | Cleanup |
| 14 | Document ACME TXT lifecycle in domains repo README (why records exist, when they're removable) | Low | S | Documentation |
| 15 | Repair gcloud ADC for `lars-software` (set quota project or grant `serviceusage.services.use`) | Low-Med | S-M | Cleanup |
| 16 | Add auth-failure detection to any future polling scripts (exit non-zero on 401/403 instead of empty output) | Low | S | Quality |
| 17 | Add typespec custom domain to the fleet monitor URL list (if explicit) | Medium | S | Quality |
| 18 | Set up cert-expiry/renewal alerting for fleet custom domains (Firebase auto-renews; alert if it doesn't) | Medium | M | Feature |
| 19 | Verify GitHub repo homepage/description metadata matches the live domain (`gh repo view`) | Low | S | Documentation |
| 20 | Add a "Deploying the docs" note to website/README or CONTRIBUTING (the manual command + why CI doesn't do it yet) | Low | S | Documentation |
| 21 | Decide status-report format once: `.md` (task-queue convention) vs HTML (skill canonical); codify the winner | Low | S | Process |
| 22 | Remove `/tmp/firebase-*.js` scratch scripts (trivial hygiene; recreate from skill reference when needed) | Low | S | Cleanup |
| 23 | Consider committing the two REST-API scripts as website/scripts/ utilities (create-domain, list-domains) since they'll be reused per-project | Low | S | Feature |
| 24 | Explore Firebase Hosting preview channels for PR previews of website changes (would have surfaced the missing page pre-merge) | Medium | M | Feature |
| 25 | Add a CI check that fails when `website/src/content` changes but no deploy follows within N days (belt-and-suspenders until item 1) | Low | M | Quality |
| 26 | Verify HSTS/preload interaction for the new subdomain (apex header applies; confirm no cert warnings on first visit in a fresh browser profile) | Low | S | Quality |
| 27 | Cross-browser/device spot-check of the new guide page rendering (fetch-tool text dumps don't prove visual layout) | Low | S | Quality |
| 28 | Confirm Pagefind search index includes the new guide's content (built over 17 files; spot-query the deployed search) | Low | S | Quality |
| 29 | Add the mixed-emitters guide to the repo README's docs table (if one exists) so the page is discoverable from GitHub | Low | S | Documentation |
| 30 | After 2+ sites fixed the same way, extract the M2 fix into a script (input: domain + site ID; does REST attach + emits Terraform block) in the website-launch skill | Medium | M | Feature |
| 31 | Record the "gcloud Method 1 fails on this machine" fact in crush-config lessons.md (cross-project generalizable: ADC quota project mismatch) | Low | S | Process |
| 32 | Consider `minimumReleaseAge`-style soak for DNS changes? (No — no such mechanism for Namecheap; document TTL 1799 propagation expectations instead) | Low | S | Documentation |
| 33 | Audit whether other fleet sites' Astro `site` configs point at domains that don't resolve (cmdguard known; sweep the rest) | Medium | M | Quality |
| 34 | Add `typespec-asyncapi.lars.software` to any uptime/status page the fleet exposes | Low | S | Feature |
| 35 | Update fleet ops doc §1.1/§1.2 cross-references: M2 resolution method differs from documented manual steps (REST vs console) — note which is now preferred | Low | S | Documentation |

*(Stopped at 35 real items rather than padding to 50 — the remaining 15 would be invented, not observed.)*

## g) QUESTIONS I CANNOT FIGURE OUT MYSELF

1. **Should the website deploy automatically?** The root cause of today's incident is manual-only deploys. I can build the Phase 7 CI workflow, but it needs a `FIREBASE_SERVICE_ACCOUNT` GitHub secret — and creating a service-account key on `lars-software` requires IAM rights my gcloud identity lacks (403, see d2). Is automated deploy on merge *wanted*, and if yes, will you create the key (or grant the IAM role) — or is manual deploy a deliberate policy I should document instead of automate?
2. **Do you want the identical fix applied to `cmdguard.lars.software`** (the fleet's last KNOWN-broken domain, same playbook, ~30 min)? It's outside this repo, so scope is your call — and it's the difference between 16/17 and 17/17 fleet domains.
3. **Is the `/guides` directory 404 intentional?** There's no guides-overview page, so `https://typespec-asyncapi.lars.software/guides` 404s while every individual guide works. Should I add a small overview page (or redirect to the most important guide), or is direct-link-only the design?

---

*Point-in-time snapshot 2026-10-04 03:00 CEST. All live-URL evidence re-verifiable via fetch. Report written per user instruction in Markdown (status-report skill canonical is styled HTML — divergence flagged per skill rules; not propagated back as a default). Section f is the HARVEST input for TODO_LIST/ROADMAP.*
