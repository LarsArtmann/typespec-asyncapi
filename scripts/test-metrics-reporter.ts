#!/usr/bin/env bun

/**
 * Test Metrics Reporter - Split Brain Solution for Issue #134
 * 
 * PRIMARY METRIC: Absolute passing tests (always comparable)
 * SECONDARY METRIC: Pass rate (with denominator caveat)
 * TERTIARY METRIC: Failure breakdown by severity
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

interface TestMetrics {
  passing: number;
  failing: number;
  skipped: number;
  total: number;
  passRate: number;
  deltaPassing?: number;
  failures: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface SessionHistory {
  timestamp: string;
  metrics: TestMetrics;
}

class TestMetricsReporter {
  private readonly metricsFile = join(process.cwd(), "test-metrics-history.json");
  
  /**
   * Extract test metrics from bun test output
   */
  private extractMetricsFromOutput(testOutput: string): TestMetrics {
    const lines = testOutput.split('\n');
    
    // Look for the final summary line at the end of output
    // Format: "X pass Y skip Z fail" or "Ran N tests across M files. [X.Ys]"
    const summaryLine = lines.slice().reverse().find(line => 
      (line.includes('pass') && line.includes('skip') && line.includes('fail')) ||
      (line.includes('Ran') && line.includes('tests') && line.includes('across'))
    );
    
    // Primary: Try to parse summary line
    if (summaryLine) {
      const passSkipFailMatch = summaryLine.match(/(\d+)\s+pass\s+(\d+)\s+skip\s+(\d+)\s+fail/);
      if (passSkipFailMatch) {
        const passing = parseInt(passSkipFailMatch[1], 10);
        const skipped = parseInt(passSkipFailMatch[2], 10);
        const failing = parseInt(passSkipFailMatch[3], 10);
        const total = passing + skipped + failing;

        // Count failure types from output
        const failureLines = lines.filter(line => line.includes('(fail)'));
        const failures = this.categorizeFailures(failureLines);

        return {
          passing,
          failing,
          skipped,
          total,
          passRate: (passing / total) * 100,
          failures
        };
      }
    }
    
    // Fallback 1: Count individual test result lines
    console.log('🔍 Using fallback parsing strategy...');
    const passLines = lines.filter(line => line.trim().startsWith('(pass)'));
    const failLines = lines.filter(line => line.trim().startsWith('(fail)'));
    const skipLines = lines.filter(line => line.trim().startsWith('(skip)'));
    
    const passing = passLines.length;
    const failing = failLines.length;
    const skipped = skipLines.length;
    const total = passing + skipped + failing;
    
    console.log(`📊 Extracted metrics from test result lines:`);
    console.log(`   Passing: ${passing}, Failing: ${failing}, Skipped: ${skipped}, Total: ${total}`);
    
    // Count failure types from output
    const failureLines = lines.filter(line => line.includes('(fail)'));
    const failures = this.categorizeFailures(failureLines);

    return {
      passing,
      failing,
      skipped,
      total,
      passRate: total > 0 ? (passing / total) * 100 : 0,
      failures
    };
  }

  /**
   * Categorize failures by severity based on test names and error patterns
   */
  private categorizeFailures(failureLines: string[]): TestMetrics['failures'] {
    const failures = {
      total: failureLines.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const line of failureLines) {
      const testDescription = line.toLowerCase();
      
      // Critical: core functionality broken
      if (testDescription.includes('critical') || 
          testDescription.includes('compilation') ||
          testDescription.includes('typescript') ||
          testDescription.includes('build') ||
          testDescription.includes('integration') ||
          testDescription.includes('validation')) {
        failures.critical++;
      }
      // High: important features failing
      else if (testDescription.includes('security') ||
               testDescription.includes('performance') ||
               testDescription.includes('protocol') ||
               testDescription.includes('decorator') ||
               testDescription.includes('emitter')) {
        failures.high++;
      }
      // Medium: test infrastructure and utilities
      else if (testDescription.includes('test') ||
               testDescription.includes('debug') ||
               testDescription.includes('helper') ||
               testDescription.includes('utils')) {
        failures.medium++;
      }
      // Low: documentation and examples
      else if (testDescription.includes('documentation') ||
               testDescription.includes('example') ||
               testDescription.includes('readme')) {
        failures.low++;
      }
      // Default to medium for uncategorized
      else {
        failures.medium++;
      }
    }

    return failures;
  }

  /**
   * Load previous session metrics
   */
  private loadHistory(): SessionHistory[] {
    if (!existsSync(this.metricsFile)) {
      return [];
    }

    try {
      const content = readFileSync(this.metricsFile, 'utf-8');
      return JSON.parse(content) as SessionHistory[];
    } catch (error) {
      console.warn(`Warning: Could not load metrics history: ${error}`);
      return [];
    }
  }

  /**
   * Save current session metrics
   */
  private saveHistory(currentMetrics: TestMetrics): void {
    const history = this.loadHistory();
    
    const session: SessionHistory = {
      timestamp: new Date().toISOString(),
      metrics: currentMetrics
    };

    history.push(session);
    
    // Keep only last 30 sessions
    if (history.length > 30) {
      history.splice(0, history.length - 30);
    }

    try {
      writeFileSync(this.metricsFile, JSON.stringify(history, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error saving metrics history: ${error}`);
    }
  }

  /**
   * Generate comprehensive test metrics report
   */
  public generateReport(testOutput: string): TestMetrics {
    const currentMetrics = this.extractMetricsFromOutput(testOutput);
    const history = this.loadHistory();
    
    // Calculate delta from previous session
    if (history.length > 0) {
      const previousMetrics = history[history.length - 1].metrics;
      currentMetrics.deltaPassing = currentMetrics.passing - previousMetrics.passing;
    }

    // Save current session
    this.saveHistory(currentMetrics);

    return currentMetrics;
  }

  /**
   * Print formatted metrics report
   */
  public printReport(metrics: TestMetrics): void {
    const trend = metrics.deltaPassing !== undefined 
      ? (metrics.deltaPassing > 0 ? `+${metrics.deltaPassing}` : `${metrics.deltaPassing}`)
      : 'N/A';

    console.log(`
📊 Test Metrics Summary - Split Brain Solution (Issue #134)
================================================================

✅ PRIMARY METRIC (Absolute Passing Tests): ${metrics.passing} (${trend} from last session)
   📝 Total Tests: ${metrics.total}
   📈 Pass Rate: ${metrics.passRate.toFixed(1)}% (⚠️  Denominator may vary between sessions)
   
❌ Failure Analysis:
   Total Failures: ${metrics.failures.total}
     Critical: ${metrics.failures.critical} (core functionality)
     High: ${metrics.failures.high} (important features) 
     Medium: ${metrics.failures.medium} (test infrastructure)
     Low: ${metrics.failures.low} (documentation/examples)

🎯 Interpretation Guide:
   • Absolute passing tests: ALWAYS comparable (primary metric)
   • Pass rate: Use for "good enough" threshold, don't compare across sessions
   • Focus on critical failures first for maximum impact
   
📈 Trend Analysis:
   ${this.generateTrendAnalysis(metrics)}
`);
  }

  /**
   * Generate trend analysis based on metrics
   */
  private generateTrendAnalysis(metrics: TestMetrics): string {
    if (metrics.deltaPassing === undefined) {
      return "• First session - baseline established";
    }

    if (metrics.deltaPassing > 0) {
      return `• ✅ POSITIVE: ${metrics.deltaPassing} more tests passing than last session`;
    } else if (metrics.deltaPassing < 0) {
      return `• ⚠️  NEGATIVE: ${Math.abs(metrics.deltaPassing)} fewer tests passing than last session`;
    } else {
      return "• ➡️  STABLE: Same number of passing tests as last session";
    }
  }

  /**
   * Check if we're hitting quality gates
   */
  public checkQualityGates(metrics: TestMetrics): void {
    console.log("\n🚪 Quality Gate Status:");
    
    // Absolute passing tests gate
    if (metrics.passing >= 200) {
      console.log("   ✅ Absolute Passing Tests: Above 200 baseline");
    } else {
      console.log(`   ❌ Absolute Passing Tests: Below 200 baseline (${metrics.passing})`);
    }

    // Pass rate gate (for production readiness)
    if (metrics.passRate >= 90) {
      console.log("   ✅ Pass Rate: Production ready (≥90%)");
    } else if (metrics.passRate >= 80) {
      console.log("   ⚠️  Pass Rate: Good progress (≥80%, <90%)");
    } else if (metrics.passRate >= 70) {
      console.log("   🟡 Pass Rate: Moderate progress (≥70%, <80%)");
    } else {
      console.log("   🔴 Pass Rate: Needs improvement (<70%)");
    }

    // Critical failures gate
    if (metrics.failures.critical === 0) {
      console.log("   ✅ Critical Failures: None (excellent!)");
    } else {
      console.log(`   🔴 Critical Failures: ${metrics.failures.critical} (address immediately)`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const reporter = new TestMetricsReporter();
  
  try {
    // Get current test output by running tests
    console.log("🧪 Running tests to get current metrics...");
    
    const { execSync } = await import("node:child_process");
    const testOutput = execSync("just test", { 
      encoding: "utf-8", 
      cwd: process.cwd() 
    });
    
    // Generate and print report
    const metrics = reporter.generateReport(testOutput);
    reporter.printReport(metrics);
    reporter.checkQualityGates(metrics);
    
  } catch (error: any) {
    // Try to extract metrics from partial output
    if (error.stdout) {
      console.log("⚠️ Tests failed, extracting metrics from partial output...");
      const metrics = reporter.generateReport(error.stdout);
      reporter.printReport(metrics);
      reporter.checkQualityGates(metrics);
    } else {
      console.error("Error running tests:", error.message);
      process.exit(1);
    }
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

export { TestMetricsReporter, type TestMetrics, type SessionHistory };