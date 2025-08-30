/**
 * Shared formatting utilities for reports and diagnostics
 */

/**
 * Format recommendations as numbered list
 */
export function formatRecommendations(recommendations: string[]): string[] {
  const sections: string[] = [];
  
  if (recommendations.length > 0) {
    sections.push("");
    sections.push("🔧 Recommendations:");
    recommendations.forEach((rec, index) => {
      sections.push(`  ${index + 1}. ${rec}`);
    });
  }
  
  sections.push("");
  sections.push("=" .repeat(40));
  
  return sections;
}

/**
 * Create a standard report section separator
 */
export function createSeparator(length: number = 40): string {
  return "=".repeat(length);
}

/**
 * Format report header with title
 */
export function formatReportHeader(title: string, length: number = 40): string[] {
  return [
    title,
    createSeparator(length)
  ];
}