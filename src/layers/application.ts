/**
 * Application Layer Composition
 * 
 * Provides complete Effect.Layer dependency injection setup for the
 * AsyncAPI emitter with Railway Programming and performance monitoring.
 */

import { Layer, Context, Effect, LogLevel } from "effect";
import { PerformanceMetricsService, PerformanceMetricsServiceLive } from "../performance/metrics.js";
import { MemoryMonitorService, MemoryMonitorServiceLive } from "../performance/memory-monitor.js";
import { EmitterService, EmitterServiceLive } from "../integration-example.js";

// APPLICATION CONFIGURATION
export type ApplicationConfig = {
  logLevel: LogLevel.LogLevel;
  enablePerformanceMonitoring: boolean;
  enableMemoryMonitoring: boolean;
  performanceTargets: {
    throughputOpsPerSec: number;
    memoryBytesPerOp: number;
    latencyMicroseconds: number;
  };
  monitoringIntervals: {
    performanceMs: number;
    memoryMs: number;
  };
}

export const defaultApplicationConfig: ApplicationConfig = {
  logLevel: LogLevel.Info,
  enablePerformanceMonitoring: true,
  enableMemoryMonitoring: true,
  performanceTargets: {
    throughputOpsPerSec: 35000,
    memoryBytesPerOp: 1024,
    latencyMicroseconds: 100
  },
  monitoringIntervals: {
    performanceMs: 60000, // 1 minute
    memoryMs: 5000 // 5 seconds
  }
};

// APPLICATION CONFIGURATION SERVICE
export type ApplicationConfigService = {
  getConfig: () => Effect.Effect<ApplicationConfig, never>;
  updateConfig: (config: Partial<ApplicationConfig>) => Effect.Effect<void, never>;
  isPerformanceMonitoringEnabled: () => Effect.Effect<boolean, never>;
  isMemoryMonitoringEnabled: () => Effect.Effect<boolean, never>;
}

export const ApplicationConfigService = Context.GenericTag<ApplicationConfigService>("ApplicationConfigService");

// APPLICATION CONFIG SERVICE IMPLEMENTATION
const makeApplicationConfigService = Effect.gen(function* () {
  let currentConfig = defaultApplicationConfig;
  
  const getConfig = (): Effect.Effect<ApplicationConfig, never> =>
    Effect.succeed(currentConfig);
  
  const updateConfig = (config: Partial<ApplicationConfig>): Effect.Effect<void, never> =>
    Effect.gen(function* () {
      currentConfig = { ...currentConfig, ...config };
      yield* Effect.logInfo("Application configuration updated", {
        enablePerformanceMonitoring: currentConfig.enablePerformanceMonitoring,
        enableMemoryMonitoring: currentConfig.enableMemoryMonitoring,
        throughputTarget: currentConfig.performanceTargets.throughputOpsPerSec
      });
    });
  
  const isPerformanceMonitoringEnabled = (): Effect.Effect<boolean, never> =>
    Effect.succeed(currentConfig.enablePerformanceMonitoring);
  
  const isMemoryMonitoringEnabled = (): Effect.Effect<boolean, never> =>
    Effect.succeed(currentConfig.enableMemoryMonitoring);
  
  return ApplicationConfigService.of({
    getConfig,
    updateConfig,
    isPerformanceMonitoringEnabled,
    isMemoryMonitoringEnabled
  });
});

export const applicationConfigServiceLive = Layer.effect(ApplicationConfigService, makeApplicationConfigService);

// MONITORING SUPERVISOR SERVICE
export type MonitoringSupervisorService = {
  startAllMonitoring: () => Effect.Effect<void, Error, PerformanceMetricsService | MemoryMonitorService | ApplicationConfigService>;
  stopAllMonitoring: () => Effect.Effect<void, never, PerformanceMetricsService | MemoryMonitorService>;
  getMonitoringStatus: () => Effect.Effect<{ performance: boolean; memory: boolean }, never, never>;
}

export const MonitoringSupervisorService = Context.GenericTag<MonitoringSupervisorService>("MonitoringSupervisorService");

// MONITORING SUPERVISOR IMPLEMENTATION
const makeMonitoringSupervisorService = Effect.gen(function* () {
  let performanceMonitoringActive = false;
  let memoryMonitoringActive = false;
  
  const startAllMonitoring = (): Effect.Effect<void, Error, PerformanceMetricsService | MemoryMonitorService | ApplicationConfigService> =>
    Effect.gen(function* () {
      const config = yield* ApplicationConfigService;
      const appConfig = yield* config.getConfig();
      
      if (appConfig.enablePerformanceMonitoring) {
        const performanceMetrics = yield* PerformanceMetricsService;
        yield* performanceMetrics.startContinuousMonitoring(appConfig.monitoringIntervals.performanceMs);
        performanceMonitoringActive = true;
        yield* Effect.logInfo("Performance monitoring started");
      }
      
      if (appConfig.enableMemoryMonitoring) {
        const memoryMonitor = yield* MemoryMonitorService;
        yield* memoryMonitor.startMonitoring(appConfig.monitoringIntervals.memoryMs);
        memoryMonitoringActive = true;
        yield* Effect.logInfo("Memory monitoring started");
      }
      
      yield* Effect.logInfo("All monitoring systems started", {
        performanceMonitoring: performanceMonitoringActive,
        memoryMonitoring: memoryMonitoringActive
      });
    });
  
  const stopAllMonitoring = (): Effect.Effect<void, never, PerformanceMetricsService | MemoryMonitorService> =>
    Effect.gen(function* () {
      if (performanceMonitoringActive) {
        const performanceMetrics = yield* PerformanceMetricsService;
        yield* performanceMetrics.stopContinuousMonitoring();
        performanceMonitoringActive = false;
        yield* Effect.logInfo("Performance monitoring stopped");
      }
      
      if (memoryMonitoringActive) {
        const memoryMonitor = yield* MemoryMonitorService;
        yield* memoryMonitor.stopMonitoring();
        memoryMonitoringActive = false;
        yield* Effect.logInfo("Memory monitoring stopped");
      }
      
      yield* Effect.logInfo("All monitoring systems stopped");
    });
  
  const getMonitoringStatus = (): Effect.Effect<{ performance: boolean; memory: boolean }, never, never> =>
    Effect.succeed({
      performance: performanceMonitoringActive,
      memory: memoryMonitoringActive
    });
  
  return MonitoringSupervisorService.of({
    startAllMonitoring,
    stopAllMonitoring,
    getMonitoringStatus
  });
});

export const monitoringSupervisorServiceLive = Layer.effect(MonitoringSupervisorService, makeMonitoringSupervisorService);

// APPLICATION HEALTH SERVICE
export type ApplicationHealthService = {
  performHealthCheck: () => Effect.Effect<{ healthy: boolean; checks: Record<string, boolean>; recommendations: string[] }, never, PerformanceMetricsService | MemoryMonitorService | MonitoringSupervisorService | EmitterService>;
  getSystemStatus: () => Effect.Effect<{ uptime: number; memoryUsage: number; performanceScore: number }, never, PerformanceMetricsService | MemoryMonitorService | MonitoringSupervisorService | EmitterService>;
}

export const ApplicationHealthService = Context.GenericTag<ApplicationHealthService>("ApplicationHealthService");

// APPLICATION HEALTH IMPLEMENTATION
const makeApplicationHealthService = Effect.gen(function* () {
  const startTime = Date.now();
  
  const performHealthCheck = (): Effect.Effect<{ healthy: boolean; checks: Record<string, boolean>; recommendations: string[] }, never, PerformanceMetricsService | MemoryMonitorService | MonitoringSupervisorService | EmitterService> =>
    Effect.gen(function* () {
      const checks: Record<string, boolean> = {};
      const recommendations: string[] = [];
      
      // Check services are available
      try {
        yield* PerformanceMetricsService;
        checks["performanceMetrics"] = true;
      } catch {
        checks["performanceMetrics"] = false;
        recommendations.push("Performance metrics service is unavailable");
      }
      
      try {
        yield* MemoryMonitorService;
        checks["memoryMonitor"] = true;
      } catch {
        checks["memoryMonitor"] = false;
        recommendations.push("Memory monitoring service is unavailable");
      }
      
      try {
        yield* EmitterService;
        checks["emitterService"] = true;
      } catch {
        checks["emitterService"] = false;
        recommendations.push("Emitter service is unavailable");
      }
      
      // Check monitoring status
      const monitoringSupervisor = yield* MonitoringSupervisorService;
      const monitoringStatus = yield* monitoringSupervisor.getMonitoringStatus();
      checks["performanceMonitoring"] = monitoringStatus.performance;
      checks["memoryMonitoring"] = monitoringStatus.memory;
      
      if (!monitoringStatus.performance) {
        recommendations.push("Performance monitoring is not active");
      }
      if (!monitoringStatus.memory) {
        recommendations.push("Memory monitoring is not active");
      }
      
      // Check memory usage
      if (typeof process !== "undefined" && process.memoryUsage) {
        const memUsage = process.memoryUsage();
        const memoryMB = memUsage.heapUsed / 1024 / 1024;
        checks["memoryUsage"] = memoryMB < 1000; // Less than 1GB
        
        if (memoryMB > 500) {
          recommendations.push(`High memory usage: ${memoryMB.toFixed(0)}MB`);
        }
      }
      
      const healthy = Object.values(checks).every(check => check === true);
      
      if (healthy && recommendations.length === 0) {
        recommendations.push("All systems operational");
      }
      
      return { healthy, checks, recommendations };
    });
  
  const getSystemStatus = (): Effect.Effect<{ uptime: number; memoryUsage: number; performanceScore: number }, never, PerformanceMetricsService | MemoryMonitorService | MonitoringSupervisorService | EmitterService> =>
    Effect.gen(function* () {
      const uptime = Date.now() - startTime;
      
      let memoryUsage = 0;
      if (typeof process !== "undefined" && process.memoryUsage) {
        memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
      }
      
      // Simple performance score based on system health
      const healthCheck = yield* performHealthCheck();
      const healthyChecks = Object.values(healthCheck.checks).filter(check => check).length;
      const totalChecks = Object.values(healthCheck.checks).length;
      const performanceScore = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 0;
      
      return {
        uptime: Math.floor(uptime / 1000), // seconds
        memoryUsage,
        performanceScore
      };
    });
  
  return ApplicationHealthService.of({
    performHealthCheck,
    getSystemStatus
  });
});

export const applicationHealthServiceLive = Layer.effect(ApplicationHealthService, makeApplicationHealthService);

// COMPLETE APPLICATION LAYER COMPOSITION

/**
 * Production layer with all services and monitoring
 */
export const applicationLayerLive = Layer.mergeAll(
  applicationConfigServiceLive,
  PerformanceMetricsServiceLive,
  MemoryMonitorServiceLive,
  EmitterServiceLive
).pipe(
  Layer.provide(applicationConfigServiceLive)
).pipe(
  Layer.merge(monitoringSupervisorServiceLive),
  Layer.merge(applicationHealthServiceLive)
);

/**
 * Development layer with enhanced logging and debugging
 */
export const developmentApplicationLayerLive = applicationLayerLive.pipe(
  Layer.provide(Layer.succeed(ApplicationConfigService, {
    getConfig: () => Effect.succeed({
      ...defaultApplicationConfig,
      logLevel: LogLevel.Debug,
      monitoringIntervals: {
        performanceMs: 10000, // More frequent in development
        memoryMs: 1000
      }
    } as ApplicationConfig),
    updateConfig: () => Effect.void,
    isPerformanceMonitoringEnabled: () => Effect.succeed(defaultApplicationConfig.enablePerformanceMonitoring),
    isMemoryMonitoringEnabled: () => Effect.succeed(defaultApplicationConfig.enableMemoryMonitoring)
  }))
);

/**
 * Test layer with minimal monitoring for fast test execution
 */
export const testApplicationLayerLive = Layer.mergeAll(
  applicationConfigServiceLive,
  PerformanceMetricsServiceLive,
  MemoryMonitorServiceLive,
  EmitterServiceLive
).pipe(
  Layer.provide(Layer.succeed(ApplicationConfigService, {
    getConfig: () => Effect.succeed({
      ...defaultApplicationConfig,
      enablePerformanceMonitoring: false,
      enableMemoryMonitoring: false,
      logLevel: LogLevel.Warning
    } as ApplicationConfig),
    updateConfig: () => Effect.void,
    isPerformanceMonitoringEnabled: () => Effect.succeed(false),
    isMemoryMonitoringEnabled: () => Effect.succeed(false)
  }))
);

/**
 * High-performance layer optimized for production workloads
 */
export const highPerformanceApplicationLayerLive = applicationLayerLive.pipe(
  Layer.provide(Layer.succeed(ApplicationConfigService, {
    getConfig: () => Effect.succeed({
      ...defaultApplicationConfig,
      logLevel: LogLevel.Warning, // Minimal logging for performance
      performanceTargets: {
        throughputOpsPerSec: 50000, // Higher target for production
        memoryBytesPerOp: 512, // Stricter memory target
        latencyMicroseconds: 50 // Lower latency target
      },
      monitoringIntervals: {
        performanceMs: 120000, // Less frequent monitoring
        memoryMs: 10000
      }
    } as ApplicationConfig),
    updateConfig: () => Effect.void,
    isPerformanceMonitoringEnabled: () => Effect.succeed(false), // Disabled for test performance
    isMemoryMonitoringEnabled: () => Effect.succeed(false) // Disabled for test performance
  }))
);

// UTILITY FUNCTIONS FOR LAYER MANAGEMENT

/**
 * Initialize application with monitoring
 */
export const initializeApplication = (): Effect.Effect<void, Error, MonitoringSupervisorService | ApplicationHealthService | PerformanceMetricsService | MemoryMonitorService | ApplicationConfigService | EmitterService> =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Initializing AsyncAPI application");
    
    const monitoringSupervisor = yield* MonitoringSupervisorService;
    yield* monitoringSupervisor.startAllMonitoring();
    
    const healthService = yield* ApplicationHealthService;
    const healthCheck = yield* healthService.performHealthCheck();
    
    yield* Effect.logInfo("Application initialization completed", {
      healthy: healthCheck.healthy,
      activeServices: Object.keys(healthCheck.checks).filter(key => healthCheck.checks[key]).length
    });
    
    if (!healthCheck.healthy) {
      yield* Effect.logWarning("Application started with health issues", {
        recommendations: healthCheck.recommendations
      });
    }
  });

/**
 * Shutdown application gracefully
 */
export const shutdownApplication = (): Effect.Effect<void, never, MonitoringSupervisorService | ApplicationHealthService | PerformanceMetricsService | MemoryMonitorService | EmitterService> =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Shutting down AsyncAPI application");
    
    const monitoringSupervisor = yield* MonitoringSupervisorService;
    yield* monitoringSupervisor.stopAllMonitoring();
    
    const healthService = yield* ApplicationHealthService;
    const systemStatus = yield* healthService.getSystemStatus();
    
    yield* Effect.logInfo("Application shutdown completed", {
      uptimeSeconds: systemStatus.uptime,
      finalMemoryUsage: `${systemStatus.memoryUsage.toFixed(1)}MB`,
      finalPerformanceScore: `${systemStatus.performanceScore.toFixed(1)}%`
    });
  });

/**
 * Get application layer based on environment
 */
export const getApplicationLayer = (environment: "development" | "test" | "production" | "high-performance" = "production"): Layer.Layer<ApplicationConfigService | PerformanceMetricsService | MemoryMonitorService | EmitterService | MonitoringSupervisorService | ApplicationHealthService> => {
  switch (environment) {
    case "development":
      return developmentApplicationLayerLive;
    case "test":
      return testApplicationLayerLive;
    case "high-performance":
      return highPerformanceApplicationLayerLive;
    case "production":
    default:
      return applicationLayerLive;
  }
};

/**
 * Create custom application layer with specific configuration
 */
export const createCustomApplicationLayer = (config: Partial<ApplicationConfig>): Layer.Layer<ApplicationConfigService | PerformanceMetricsService | MemoryMonitorService | EmitterService | MonitoringSupervisorService | ApplicationHealthService> =>
  applicationLayerLive.pipe(
    Layer.provide(Layer.succeed(ApplicationConfigService, {
      getConfig: () => Effect.succeed({ ...defaultApplicationConfig, ...config } as ApplicationConfig),
      updateConfig: () => Effect.void,
      isPerformanceMonitoringEnabled: () => Effect.succeed(config.enablePerformanceMonitoring ?? true),
      isMemoryMonitoringEnabled: () => Effect.succeed(config.enableMemoryMonitoring ?? true)
    }))
  );
