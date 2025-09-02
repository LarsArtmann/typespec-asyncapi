/**
 * Channel Templates - Centralized Channel Pattern Constants
 * 
 * Eliminates hardcoded channel patterns throughout test suites and examples.
 * Provides consistent channel naming and parameterization.
 * 
 * USAGE:
 * - Order channels: CHANNEL_TEMPLATES.ORDERS.*
 * - System channels: CHANNEL_TEMPLATES.SYSTEM.*
 * - Test channels: CHANNEL_TEMPLATES.TEST.*
 */

/**
 * Order-related channel templates
 */
export const ORDER_CHANNELS = {
  /** Order lifecycle channel with orderId parameter */
  LIFECYCLE: "orders/{orderId}" as const,
  /** Order status updates channel */
  STATUS: "orders/{orderId}/status" as const,
  /** Order updates channel */
  UPDATES: "orders/{orderId}/updates" as const,
  /** Order shipping channel */
  SHIPPING: "orders/{orderId}/shipping" as const,
  /** Order items channel with itemId parameter */
  ITEMS: "orders/{orderId}/items/{itemId}" as const,
  /** Order creation events */
  CREATED: "orders/created" as const,
  /** New order events */
  NEW: "orders/new" as const,
  /** Order lifecycle events */
  LIFECYCLE_EVENTS: "orders/lifecycle" as const
} as const

/**
 * System and tenant channel templates
 */
export const SYSTEM_CHANNELS = {
  /** Tenant-specific order channel */
  TENANT_ORDERS: "tenant/{tenantId}/orders/{orderId}" as const,
  /** Tenant order processing */
  TENANT_ORDER_PROCESS: "orders/{tenantId}/process" as const,
  /** System notifications */
  NOTIFICATIONS: "system/notifications" as const,
  /** System events */
  EVENTS: "system/events" as const
} as const

/**
 * Test-specific channel templates
 */
export const TEST_CHANNELS = {
  /** Basic test channel */
  BASIC: "test/basic" as const,
  /** Test with parameters */
  PARAMETERIZED: "test/{id}/param" as const,
  /** Mock service channel */
  MOCK_SERVICE: "mock/service/{serviceId}" as const,
  /** Validation test channel */
  VALIDATION: "test/validation/{testId}" as const
} as const

/**
 * E-commerce channel templates
 */
export const ECOMMERCE_CHANNELS = {
  /** Order created event */
  ORDER_CREATED: ORDER_CHANNELS.CREATED,
  /** Order shipping updates */
  ORDER_SHIPPING: ORDER_CHANNELS.SHIPPING,
  /** Product updates */
  PRODUCT_UPDATES: "products/{productId}/updates" as const,
  /** Inventory updates */
  INVENTORY_UPDATES: "inventory/{productId}/updates" as const,
  /** Customer events */
  CUSTOMER_EVENTS: "customers/{customerId}/events" as const
} as const

/**
 * All channel templates grouped by category
 */
export const CHANNEL_TEMPLATES = {
  /** Order-related channels */
  ORDERS: ORDER_CHANNELS,
  /** System channels */
  SYSTEM: SYSTEM_CHANNELS,
  /** Test channels */
  TEST: TEST_CHANNELS,
  /** E-commerce channels */
  ECOMMERCE: ECOMMERCE_CHANNELS
} as const

/**
 * Channel parameter extraction utilities
 */
export const CHANNEL_PARAMETERS = {
  /** Order ID parameter */
  ORDER_ID: "{orderId}" as const,
  /** Tenant ID parameter */
  TENANT_ID: "{tenantId}" as const,
  /** Item ID parameter */
  ITEM_ID: "{itemId}" as const,
  /** Product ID parameter */
  PRODUCT_ID: "{productId}" as const,
  /** Customer ID parameter */
  CUSTOMER_ID: "{customerId}" as const,
  /** Service ID parameter */
  SERVICE_ID: "{serviceId}" as const,
  /** Test ID parameter */
  TEST_ID: "{testId}" as const,
  /** Generic ID parameter */
  ID: "{id}" as const
} as const

/**
 * Channel validation patterns
 */
export const CHANNEL_PATTERNS = {
  /** Parameter validation pattern */
  PARAMETER: /\{[a-zA-Z][a-zA-Z0-9]*\}/g,
  /** Order channel pattern */
  ORDER: /^orders\/(\{[a-zA-Z]+\}|[a-zA-Z]+)/,
  /** System channel pattern */
  SYSTEM: /^(tenant\/\{[a-zA-Z]+\}\/|system\/)/,
  /** Test channel pattern */
  TEST: /^(test|mock)\//
} as const

/**
 * Channel prefixes for categorization
 */
export const CHANNEL_PREFIXES = {
  /** Order channel prefix */
  ORDERS: "orders/" as const,
  /** System channel prefix */
  SYSTEM: "system/" as const,
  /** Tenant channel prefix */
  TENANT: "tenant/" as const,
  /** Test channel prefix */
  TEST: "test/" as const,
  /** Mock channel prefix */
  MOCK: "mock/" as const,
  /** Product channel prefix */
  PRODUCTS: "products/" as const,
  /** Customer channel prefix */
  CUSTOMERS: "customers/" as const,
  /** Inventory channel prefix */
  INVENTORY: "inventory/" as const
} as const