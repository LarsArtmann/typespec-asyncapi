/**
 * Source: livesession/xyd (packages/apitoolchain-schemas/tsp/models.tsp, 724 lines)
 * Repo:   https://github.com/livesession/xyd
 *
 * Production API toolchain schemas from LiveSession. Pure data models (no HTTP).
 *
 * STRIPPED: nothing (original has no HTTP/OpenAPI decorators)
 * KEPT (verbatim): All model definitions, enums, spread, arrays, optional fields
 */
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "API Toolchain Events" })
@apiVersion("1.0.0")
@server("main", "apitoolchain.example.com", "kafka", "API toolchain event broker")
namespace Apitoolchain;

enum ApiFormat {
  openapi,
  graphql,
  asyncapi,
  jsonschema,
}

enum EntryKind {
  api,
  schema,
}

enum BuildStatus {
  ready,
  building,
  error,
  draft,
}

enum SdkLanguage {
  go,
  python,
  node,
  ruby,
  java,
  dotnet,
}

enum NotificationSeverity {
  info,
  success,
  warning,
  error,
}

enum NotificationSource {
  sdk,
  docs,
  mcp,
  registry,
  system,
  git,
}

enum UsageRange {
  h24: "24h",
  d7: "7d",
  d30: "30d",
  d90: "90d",
}

model ApiVersion {
  version: string;
  specUrl: string;
  updatedAt: string;
  current: boolean;
}

model DistTag {
  tag: string;
  version: string;
}

model RegistryEntryCore {
  id: string;
  name: string;
  description: string;
  format: ApiFormat;
  kind: EntryKind;
  ns: string;
  source: string;
  versions: ApiVersion[];
  distTags: DistTag[];
  registryUrl: string;
  updatedAt: string;
}

model RegistryEntry {
  ...RegistryEntryCore;
  sdkTargetCount: int32;
  docsProjectCount: int32;
  mcpServerCount: int32;
}

model SdkTarget {
  id: string;
  name: string;
  sdkId: string;
  apiId: string;
  apiVersion: string;
  language: SdkLanguage;
  packageName: string;
  output: string;
  version: string;
  status: BuildStatus;
  buildLogs: string;
  lastPublishedAt?: string;
  registryUrl?: string;
  sdkJson?: string;
  configPending: boolean;
}

model Notification {
  id: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  source: NotificationSource;
  apiId?: string;
}

model UsagePoint {
  t: string;
  value: float64;
}

model UsageSeries {
  id: string;
  label: string;
  unit: string;
  total: float64;
  range: UsageRange;
  points: UsagePoint[];
}

model OverviewStats {
  apis: int32;
  sdkTargets: int32;
  docsProjects: int32;
  mcpServers: int32;
}

model User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

model AuthSession {
  token: string;
  user: User;
}

model GitProvider {
  id: string;
  kind: GitProviderKind;
  name: string;
  baseUrl: string;
  connectedAs: string;
  createdAt: string;
}

enum GitProviderKind {
  github,
  gitlab,
  bitbucket,
  gitea,
}

model RepoConnection {
  id: string;
  providerId: string;
  targetKind: RepoTargetKind;
  targetId: string;
  ref?: string;
  repo: string;
  branch: string;
  prefix: string;
  lastSyncedAt?: string;
  lastSyncStatus?: BuildStatus;
  lastSyncError?: string;
  releaseMode?: string;
  autoRelease?: boolean;
  baseBranch?: string;
  prerelease?: boolean;
  distTags?: string;
  lastReleasedVersion?: string;
}

enum RepoTargetKind {
  spec,
  sdk,
}

@channel("registry.entry.registered")
@publish
op publishRegistryEntry(payload: RegistryEntry): void;

@channel("sdk.target.built")
@publish
op publishSdkTargetBuilt(payload: SdkTarget): void;

@channel("notification.created")
@publish
op publishNotification(payload: Notification): void;

@channel("usage.series.updated")
@publish
op publishUsageSeries(payload: UsageSeries): void;
