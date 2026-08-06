// =============================================================================
// Pattern Source: superb-gh-milestone-extention (typespec/models/milestone.tsp,
//                  typespec/models/analysis.tsp)
// Pattern: Scalar extending numeric types (uint8/uint32/uint64), @format
//          decorator (uuid, uri), numeric validation (@minValue, @maxValue),
//          cross-file model references, enums without values
// =============================================================================

@service(#{ title: "GitHub Milestone Analysis" })
@server("api", #{ url: "https://api.milestone-analysis.io", protocol: "https" })
namespace MilestoneAnalysis;

// --- Scalar extending numeric type ---
@minValue(0)
@maxValue(100)
scalar CompletionPercentage extends uint8;

// --- Enums WITHOUT explicit string values ---
enum AnalysisSubjectType {
  Extension,
  Milestone,
  Repository,
  Competitive,
}

enum AnalysisDepth {
  Quick,
  Standard,
  Deep,
}

// --- Enums WITH values ---
enum FindingCategory {
  architecture: "architecture",
  testing: "testing",
  performance: "performance",
  security: "security",
  maintainability: "maintainability",
  documentation: "documentation",
}

// --- GitHub user model ---
model GitHubUser {
  @format("uuid")
  userId: string;
  login: string;
  @format("uri")
  avatarUrl: string;
  @format("uri")
  profileUrl: string;
  type: "User" | "Bot" | "Organization";
}

// --- Milestone model ---
model Milestone {
  @format("uuid")
  id: string;
  number: uint32;
  title: string;
  description: string;
  creator: GitHubUser;
  state: MilestoneState;
  progress: CompletionPercentage;
  openIssues: uint32;
  closedIssues: uint32;
  totalIssues: uint32;
  labels: string[];
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
  dueOn: utcDateTime;
  closedAt: utcDateTime;
}

enum MilestoneState {
  open: "open",
  closed: "closed",
}

// --- Milestone summary ---
model MilestoneSummary {
  @format("uuid")
  milestoneId: string;
  title: string;
  state: MilestoneState;
  progress: CompletionPercentage;
  stats: MilestoneStats;
}

model MilestoneStats {
  totalIssues: uint32;
  openIssues: uint32;
  closedIssues: uint32;
  totalPRs: uint32;
  openPRs: uint32;
  mergedPRs: uint32;
  contributors: uint32;
  velocity: float64;
  burndownRate: float64;
}

// --- Analysis models ---
model Analysis {
  @format("uuid")
  analysisID: string;
  subject: AnalysisSubject;
  depth: AnalysisDepth;
  findings: Finding[];
  tasks: Task[];
  summary: AnalysisSummary;
  config: AnalysisConfig;
  metadata: AnalysisMetadata;
  startedAt: utcDateTime;
  completedAt: utcDateTime;
  durationSeconds: uint32;
}

model AnalysisSubject {
  type: AnalysisSubjectType;
  repository: RepositoryInfo;
  milestone: MilestoneSummary;
}

model RepositoryInfo {
  @format("uuid")
  repositoryId: string;
  owner: string;
  name: string;
  @format("uri")
  url: string;
  defaultBranch: string;
  language: string;
  stars: uint32;
  forks: uint32;
}

model Finding {
  @format("uuid")
  findingID: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  confidence: CompletionPercentage;
  effortMinutes: uint32;
  file: string;
  line: uint32;
}

enum Severity {
  info: "info",
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
}

model Task {
  @format("uuid")
  taskId: string;
  title: string;
  description: string;
  state: TaskState;
  priority: Priority;
  effortMinutes: uint32;
  assignee: string;
  relatedFindings: string[];
}

enum TaskState {
  pending: "pending",
  inProgress: "in_progress",
  completed: "completed",
  blocked: "blocked",
}

enum Priority {
  low: "low",
  medium: "medium",
  high: "high",
  urgent: "urgent",
}

model AnalysisConfig {
  maxFindings: uint32;
  timeoutSeconds: uint32;
  enabledFeatures: string[];
  custom: Record<string>;
}

model AnalysisMetadata {
  version: string;
  analyzer: string;
  modelVersion: string;
  custom: Record<string>;
}

model AnalysisSummary {
  totalFindings: uint32;
  criticalFindings: uint32;
  totalTasks: uint32;
  overallHealthScore: CompletionPercentage;
  recommendations: string[];
}

// --- AsyncAPI Operations ---
@doc("Milestone analysis completed")
@channel("analysis.milestone.completed")
@publish
op publishMilestoneAnalysisCompleted(): Analysis;

@doc("Finding discovered during analysis")
@channel("analysis.findings.discovered")
@publish
op publishFindingDiscovered(): Finding;

@doc("Task created from analysis")
@channel("analysis.tasks.created")
@publish
op publishTaskCreated(): Task;

@doc("Milestone progress updated")
@channel("milestone.progress.updated")
@publish
op publishMilestoneProgressUpdated(): MilestoneSummary;

@doc("Subscribe to analysis updates for a repository")
@channel("repo.{owner}.{repo}.analysis")
@subscribe
op subscribeRepositoryAnalysis(owner: string, repo: string): Analysis;
