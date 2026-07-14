# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Spec-compliant `$ref` chain: operations → channels → components.messages → components.schemas
- Strongly-typed AsyncAPI 3.0 document model (`src/domain/models/asyncapi-document.ts`)
- Golden file test (`test/golden/golden-file.test.ts`) locking in verified-correct output
- AsyncAPI 3.0.0 JSON Schema validation tests using `@asyncapi/specs`
- `@tags` decorator data now emitted as `Tag[]` arrays on operations
- `@correlationId` decorator data now emitted as `CorrelationId` objects on messages
- `@header` decorator data now emitted as JSON Schema `headers` on messages
- `@bindings` decorator data now emitted on operations and messages
- `protocolBindings` added to consolidated state for emitter access
- Post-mortem analysis at `docs/POST-MORTEM-AND-RECOVERY-PLAN.md`

### Fixed
- Critical: operations referenced `#/components/messages/{id}` directly instead of the spec-required `#/channels/{channelId}/messages/{messageId}` path
- Critical: message names used operation names instead of model names, causing broken payload `$ref`s
- All 8 failing tests that spawned `npx tsp compile` (replaced with programmatic TypeSpec compiler API)
- `storeTags` data model: was storing as comma-separated string, now stores as proper `Tag[]`
- CONTRIBUTING.md referenced `just` commands that don't exist (now `bun run`)

### Changed
- Emitter uses strongly-typed interfaces (`AsyncAPIDocument`, `ChannelObject`, etc.) instead of `Record<string, unknown>`
- AGENTS.md rewritten with verified facts and spec-compliance rules
- CLI test helper rewritten from 336 lines of spawn/fs code to 68-line programmatic API wrapper
