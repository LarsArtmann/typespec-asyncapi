// =============================================================================
// Pattern Source: accountability-system (schemas/models/accountability.tsp)
// Pattern: Enums with/without string values, @format decorator, @pattern with
//          regex, validation decorators (@minLength, @maxLength, @maxItems),
//          Record types, boolean optional fields
// =============================================================================

@service(#{ title: "Accountability System" })
@server("ws", #{ url: "ws://accountability.realtime:8080", protocol: "ws" })
namespace AccountabilitySystem;

// --- Enums WITHOUT explicit string values (implicit string enums) ---
enum GoalCategory {
  Career,
  Health,
  Relationships,
  Finance,
  PersonalGrowth,
  Learning,
}

enum GoalPriority {
  Low,
  Medium,
  High,
  Critical,
}

// --- Enums WITH explicit string values ---
enum GoalStatus {
  active: "active",
  paused: "paused",
  completed: "completed",
  abandoned: "abandoned",
}

enum EnergyLevel {
  exhausted: "exhausted",
  tired: "tired",
  neutral: "neutral",
  energized: "energized",
  peak: "peak",
}

// --- User profile with validation decorators ---
model UserProfile {
  @format("uuid")
  id: string;

  @minLength(2)
  @maxLength(50)
  name: string;

  @format("email")
  email: string;

  language: "en" | "de";
  timezone: string;
  theme: "light" | "dark" | "auto";

  notifications: NotificationPreferences;
  preferences: UserPreferences;

  goalMoney: boolean;
  goalHealth: boolean;
  goalRelationships: boolean;
  goalCareer: boolean;

  createdAt: string;
  updatedAt: string;
}

model NotificationPreferences {
  emailNotifications: boolean = true;
  pushNotifications: boolean = true;
  smsNotifications: boolean = false;
  digestFrequency: "daily" | "weekly" | "monthly" = "weekly";
  quietHours: {
    enabled: boolean = false;
    @pattern("^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    startTime: string;
    @pattern("^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    endTime: string;
  };
}

model UserPreferences {
  defaultView: "daily" | "weekly" | "monthly";
  weekStartsOn: "monday" | "sunday";
  timeFormat: "12h" | "24h";
  dateFormat: string;
  reminders: boolean = true;
}

// --- Goal model ---
model Goal {
  @format("uuid")
  id: string;

  userId: string;
  title: string;
  description: string;
  category: GoalCategory;
  priority: GoalPriority;
  status: GoalStatus;

  targetValue: float64;
  currentValue: float64;
  unit: string;

  startDate: string;
  endDate: string;

  milestones: Milestone[];
  tags: string[];
}

model Milestone {
  @format("uuid")
  id: string;
  title: string;
  description: string;
  targetValue: float64;
  completed: boolean = false;
  completedAt: string;
}

// --- Check-in models ---
model CheckIn {
  @format("uuid")
  id: string;
  userId: string;
  goalId: string;
  type: CheckInType;
  timestamp: string;
  scores: CheckInScores;
  notes: string;
}

enum CheckInType {
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
  milestone: "milestone",
}

model CheckInScores {
  energy: EnergyLevel;
  motivation: int32;
  progress: float32;
  confidence: float32;
  satisfaction: float32;
}

// --- Time block model ---
model TimeBlock {
  @format("uuid")
  id: string;
  userId: string;
  title: string;
  @format("date-time")
  startTime: string;
  @format("date-time")
  endTime: string;
  category: "deep_work" | "shallow_work" | "break" | "meeting" | "learning" | "exercise" | "personal";
  goalId: string;
  completed: boolean = false;
}

// --- Report model ---
model Report {
  @format("uuid")
  id: string;
  userId: string;
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  startDate: string;
  endDate: string;
  summary: string;
  metrics: {
    goalsCompleted: int32;
    goalsInProgress: int32;
    averageScore: float64;
    totalTimeBlocks: int32;
    topCategories: GoalCategory[];
  };
  insights: string[];
  recommendations: string[];
}

// --- Root container ---
model AccountabilityData {
  users: UserProfile[];
  goals: Goal[];
  checkIns: CheckIn[];
  timeBlocks: TimeBlock[];
}

// --- AsyncAPI Operations ---
@doc("User registered for accountability tracking")
@channel("users.registered")
@publish
op publishUserRegistered(): UserProfile;

@doc("Goal created")
@channel("goals.created")
@publish
op publishGoalCreated(): Goal;

@doc("Goal updated")
@channel("goals.updated")
@publish
op publishGoalUpdated(): Goal;

@doc("Check-in submitted")
@channel("checkins.submitted")
@publish
op publishCheckInSubmitted(): CheckIn;

@doc("Time block created")
@channel("timeblocks.created")
@publish
op publishTimeBlockCreated(): TimeBlock;

@doc("Report generated")
@channel("reports.generated")
@publish
op publishReportGenerated(): Report;

@doc("Subscribe to user's accountability updates")
@channel("user.{userId}.updates")
@subscribe
op subscribeUserUpdates(userId: string): AccountabilityData;
