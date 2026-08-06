// =============================================================================
// Pattern Source: blog/content-spec (typespec/events/campaign-events.tsp,
//                  typespec/aggregates/campaign.tsp)
// Pattern: Very deeply nested anonymous objects (4-5 levels), arrays of inline
//          anonymous objects, array of named models, many string literal unions
// =============================================================================

@service(#{ title: "Content Campaign Platform" })
@server("amqp", #{ url: "amqp://rabbitmq.content-platform:5672", protocol: "amqp" })
namespace ContentCampaignPlatform;

// --- Base types ---
scalar Uuid extends string;

model AggregateRoot {
  id: Uuid;
  version: int64;
  createdAt: string;
  updatedAt: string;
}

model DomainEvent {
  eventId: Uuid;
  aggregateId: Uuid;
  eventType: string;
  eventVersion: int32 = 1;
  occurredAt: string;
  metadata: Record<unknown>;
}

// --- Supporting models with nested structure ---
model CampaignBudget {
  totalBudget: decimal;
  dailyBudget: decimal;
  currency: "USD" | "EUR" | "GBP" | "JPY";
  spendingLimit: float32;
  alerts: {
    budgetThreshold: float32;
    enableLowBudgetAlerts: boolean = true;
    alertRecipients: string[];
  };
}

model CampaignSchedule {
  startDate: string;
  endDate: string;
  timezone: string;
  optimalTimes: {
    platform: Uuid;
    times: string[];
  }[];
}

model AudienceSegment {
  id: Uuid;
  name: string;
  demographics: {
    ageRange: {
      min: int32;
      max: int32;
    };
    locations: string[];
    interests: string[];
  };
  size: int32;
}

model CampaignGoal {
  id: Uuid;
  type: "awareness" | "engagement" | "conversion" | "retention";
  target: {
    metric: "impressions" | "clicks" | "conversions" | "reach";
    value: float64;
  };
  priority: "low" | "medium" | "high";
}

model ContentStrategy {
  contentType: string;
  tones: string[];
  contentMix: {
    contentType: string;
    percentage: float32;
  }[];
  customProperties: Record<unknown>;
}

// --- Campaign aggregate (extends AggregateRoot) ---
model Campaign extends AggregateRoot {
  name: string;
  campaignType: "content_marketing" | "social_media" | "email_marketing" | "paid_advertising" | "seo" | "brand_awareness";
  status: "draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled";
  budget: CampaignBudget;
  schedule: CampaignSchedule;
  targetPlatforms: Uuid[];
  audienceSegments: AudienceSegment[];
  goals: CampaignGoal[];
  contentStrategy: ContentStrategy;
  tags: string[] = [];
}

// --- Campaign events (extends DomainEvent, deeply nested eventData) ---
model CampaignCreatedEvent extends DomainEvent {
  eventType: "CampaignCreated";
  data: {
    campaign: Campaign;
    createdBy: string;
    source: "api" | "dashboard" | "automation";
    preflightChecks: {
      passed: boolean;
      platformChecks: {
        platformId: Uuid;
        status: "ready" | "warning" | "error";
        message: string;
      }[];
    };
  };
}

model CampaignUpdatedEvent extends DomainEvent {
  eventType: "CampaignUpdated";
  data: {
    campaignId: Uuid;
    changes: Record<unknown>;
    previousValues: {
      budget: CampaignBudget;
      schedule: CampaignSchedule;
    };
    updatedBy: string;
  };
}

model CampaignStatusChangedEvent extends DomainEvent {
  eventType: "CampaignStatusChanged";
  data: {
    campaignId: Uuid;
    previousStatus: string;
    newStatus: string;
    trigger: "manual" | "scheduled" | "budget_depleted" | "end_date_reached" | "performance_threshold";
    reason: string;
  };
}

model CampaignPausedEvent extends DomainEvent {
  eventType: "CampaignPaused";
  data: {
    campaignId: Uuid;
    pauseType: "manual" | "automatic" | "emergency";
    pausedBy: string;
    pauseReason: string;
    estimatedDowntime: int32;
  };
}

// --- AsyncAPI Operations ---
@doc("Campaign created event")
@channel("campaign.events.created")
@publish
op publishCampaignCreated(): CampaignCreatedEvent;

@doc("Campaign updated event")
@channel("campaign.events.updated")
@publish
op publishCampaignUpdated(): CampaignUpdatedEvent;

@doc("Campaign status changed event")
@channel("campaign.events.status_changed")
@publish
op publishCampaignStatusChanged(): CampaignStatusChangedEvent;

@doc("Campaign paused event")
@channel("campaign.events.paused")
@publish
op publishCampaignPaused(): CampaignPausedEvent;

@doc("Subscribe to campaign events for a tenant")
@channel("tenant.{tenantId}.campaign.events")
@subscribe
op subscribeTenantCampaignEvents(tenantId: string): Campaign;
