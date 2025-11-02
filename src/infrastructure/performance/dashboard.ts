/**
 * Real-time Performance Monitoring Dashboard
 * 
 * Provides visibility into pipeline performance and helps identify optimization opportunities.
 * Tracks compilation, processing, and file generation metrics.
 */

import { Effect } from "effect"
import type { Operation } from "@typespec/compiler"

export interface PerformanceMetrics {
  operations: number
  messageModels: number
  securityConfigs: number
  totalProcessed: number
  executionTime: number
  memoryUsage: number
  cacheHits: number
  cacheMisses: number
}

export interface OperationMetrics {
  name: string
  duration: number
  timestamp: Date
  category: "discovery" | "processing" | "validation" | "generation"
  success: boolean
}

export interface SystemMetrics {
  startTime: Date
  totalOperations: number
  averageOperationTime: number
  peakMemoryUsage: number
  cacheEfficiency: number
  errorsEncountered: number
}

/**
 * Performance Dashboard Class
 */
export class PerformanceDashboard {
  private operationMetrics: OperationMetrics[] = []
  private systemMetrics: SystemMetrics = {
    startTime: new Date(),
    totalOperations: 0,
    averageOperationTime: 0,
    peakMemoryUsage: 0,
    cacheEfficiency: 0,
    errorsEncountered: 0
  }

  /**
   * Track individual operation performance
   */
  trackOperation(name: string, duration: number, category: OperationMetrics["category"], success: boolean = true): void {
    const metric: OperationMetrics = {
      name,
      duration,
      timestamp: new Date(),
      category,
      success
    }

    this.operationMetrics.push(metric)
    this.updateSystemMetrics()
  }

  /**
   * Display real-time metrics to console
   */
  displayMetrics(): void {
    const recentMetrics = this.operationMetrics.slice(-10)
    const totalOperations = this.operationMetrics.length
    const averageTime = totalOperations > 0 
      ? this.operationMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations 
      : 0

    console.log(`\n📊 PERFORMANCE DASHBOARD`)
    console.log(`⏱️  Average Operation Time: ${averageTime.toFixed(2)}ms`)
    console.log(`📈 Total Operations: ${totalOperations}`)
    console.log(`🎯 Cache Efficiency: ${this.systemMetrics.cacheEfficiency.toFixed(1)}%`)
    console.log(`💾 Peak Memory: ${this.systemMetrics.peakMemoryUsage}MB`)
    console.log(`❌ Errors: ${this.systemMetrics.errorsEncountered}`)
    
    if (recentMetrics.length > 0) {
      console.log(`\n🔍 RECENT OPERATIONS:`)
      recentMetrics.forEach(metric => {
        const status = metric.success ? "✅" : "❌"
        const category = metric.category.toUpperCase()
        console.log(`  ${status} [${category}] ${metric.name}: ${metric.duration.toFixed(2)}ms`)
      })
    }
    
    console.log(`\n--- Dashboard Updated: ${new Date().toISOString()} ---\n`)
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): { system: SystemMetrics; operations: OperationMetrics[]; summary: PerformanceMetrics } {
    const totalOperations = this.operationMetrics.length
    const totalTime = this.operationMetrics.reduce((sum, m) => sum + m.duration, 0)
    const averageTime = totalOperations > 0 ? totalTime / totalOperations : 0

    // Calculate category breakdown
    const categoryBreakdown = this.operationMetrics.reduce((acc, metric) => {
      acc[metric.category] = (acc[metric.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const summary: PerformanceMetrics = {
      operations: totalOperations,
      messageModels: categoryBreakdown.processing || 0,
      securityConfigs: 0, // Would need more detailed tracking
      totalProcessed: totalOperations,
      executionTime: totalTime,
      memoryUsage: this.systemMetrics.peakMemoryUsage,
      cacheHits: Math.floor(totalOperations * (this.systemMetrics.cacheEfficiency / 100)),
      cacheMisses: Math.floor(totalOperations * (1 - this.systemMetrics.cacheEfficiency / 100))
    }

    return {
      system: { ...this.systemMetrics },
      operations: [...this.operationMetrics],
      summary
    }
  }

  /**
   * Start real-time monitoring
   */
  startRealTimeMonitoring(intervalMs: number = 5000): void {
    console.log(`🚀 Starting real-time performance monitoring (${intervalMs}ms interval)`)
    
    setInterval(() => {
      this.displayMetrics()
    }, intervalMs)
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.operationMetrics = []
    this.systemMetrics = {
      startTime: new Date(),
      totalOperations: 0,
      averageOperationTime: 0,
      peakMemoryUsage: 0,
      cacheEfficiency: 0,
      errorsEncountered: 0
    }
  }

  /**
   * Update system metrics from collected operations
   */
  private updateSystemMetrics(): void {
    this.systemMetrics.totalOperations = this.operationMetrics.length
    
    if (this.operationMetrics.length > 0) {
      const totalTime = this.operationMetrics.reduce((sum, m) => sum + m.duration, 0)
      this.systemMetrics.averageOperationTime = totalTime / this.operationMetrics.length
      
      const errors = this.operationMetrics.filter(m => !m.success).length
      this.systemMetrics.errorsEncountered = errors
    }
  }

  /**
   * Get performance summary for logging
   */
  getPerformanceSummary(): string {
    const { summary } = this.generateReport()
    return `Operations: ${summary.operations}, Avg Time: ${summary.executionTime.toFixed(2)}ms, Cache: ${((summary.cacheHits / (summary.cacheHits + summary.cacheMisses)) * 100).toFixed(1)}%`
  }
}

// Global dashboard instance for easy access
export const performanceDashboard = new PerformanceDashboard()
