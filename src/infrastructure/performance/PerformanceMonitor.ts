/**
 * Minimal Performance Monitor for Test Compatibility
 * 
 * Simplified performance monitoring to unblock tests
 */

export type PerformanceMetrics = {
  duration: number;
  memoryUsage: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private startTime: number = 0;
  private startMemory: number = 0;

  start(): void {
    this.startTime = Date.now();
    this.startMemory = process.memoryUsage().heapUsed;
  }

  stop(): PerformanceMetrics {
    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;

    return {
      duration: endTime - this.startTime,
      memoryUsage: endMemory - this.startMemory,
      timestamp: endTime,
    };
  }

  static getCurrentMemoryUsage(): number {
    return process.memoryUsage().heapUsed;
  }

  static formatBytes(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
}