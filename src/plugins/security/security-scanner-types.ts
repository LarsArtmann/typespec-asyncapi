/**
 * Security Scanner Plugin Types
 * 
 * Comprehensive security scanning and compliance validation system
 * for generated applications with OWASP Top 10 compliance checking.
 */

import { Effect } from "effect"

export const SecurityScanType = {
    OWASP_TOP_10: "owasp-top-10",
    VULNERABILITY_SCAN: "vulnerability-scan", 
    CODE_ANALYSIS: "code-analysis",
    DEPENDENCY_AUDIT: "dependency-audit",
    SECURITY_HEADERS: "security-headers",
    CSP_VALIDATION: "csp-validation",
    COMPLIANCE_CHECK: "compliance-check"
} as const

export type SecurityScanType = typeof SecurityScanType[keyof typeof SecurityScanType]

export const ComplianceStandard = {
    OWASP_TOP_10: "owasp-top-10",
    GDPR: "gdpr",
    SOC2: "soc2", 
    HIPAA: "hipaa",
    PCI_DSS: "pci-dss",
    ISO_27001: "iso-27001"
} as const

export type ComplianceStandard = typeof ComplianceStandard[keyof typeof ComplianceStandard]

export const SeverityLevel = {
    CRITICAL: "critical",
    HIGH: "high",
    MEDIUM: "medium", 
    LOW: "low",
    INFO: "info"
} as const

export type SeverityLevel = typeof SeverityLevel[keyof typeof SeverityLevel]

/**
 * Security vulnerability finding
 */
export type SecurityVulnerability = {
    readonly id: string
    readonly type: SecurityScanType
    readonly severity: SeverityLevel
    readonly title: string
    readonly description: string
    readonly location: {
        readonly file: string
        readonly line?: number
        readonly column?: number
    }
    readonly cve?: string
    readonly cvss?: number
    readonly remediation: string
    readonly references: string[]
    readonly metadata: Record<string, unknown>
}

/**
 * Security scan result 
 */
export type SecurityScanResult = {
    readonly scanId: string
    readonly timestamp: Date
    readonly scanType: SecurityScanType
    readonly targetPath: string
    readonly success: boolean
    readonly vulnerabilities: SecurityVulnerability[]
    readonly summary: {
        readonly critical: number
        readonly high: number
        readonly medium: number
        readonly low: number
        readonly info: number
        readonly total: number
    }
    readonly compliance: ComplianceResult[]
    readonly duration: number
    readonly metadata: Record<string, unknown>
}

/**
 * Compliance check result
 */
export type ComplianceResult = {
    readonly standard: ComplianceStandard
    readonly passed: boolean
    readonly score: number
    readonly requirements: ComplianceRequirement[]
}

export type ComplianceRequirement = {
    readonly id: string
    readonly name: string
    readonly description: string
    readonly status: 'pass' | 'fail' | 'warning' | 'not-applicable'
    readonly details: string
    readonly remediation?: string
}

/**
 * Security scanner configuration
 */
export type SecurityScannerConfig = {
    readonly enabledScans: SecurityScanType[]
    readonly complianceStandards: ComplianceStandard[]
    readonly excludePaths: string[]
    readonly ruleSets: string[]
    readonly outputFormat: 'json' | 'xml' | 'html' | 'console'
    readonly integration: {
        readonly sonarqube?: {
            url: string
            token: string
            projectKey: string
        }
        readonly owaspZap?: {
            url: string
            apiKey: string
        }
        readonly snyk?: {
            token: string
        }
    }
}

/**
 * Core security scanner plugin interface
 */
export type SecurityScannerPlugin = {
    readonly name: string
    readonly version: string
    readonly scanTypes: SecurityScanType[]
    readonly supportedLanguages: string[]
    
    /**
     * Initialize the security scanner with configuration
     */
    initialize(config: SecurityScannerConfig): Effect.Effect<void, Error>
    
    /**
     * Perform security scan on target path
     */
    scan(targetPath: string, scanType: SecurityScanType): Effect.Effect<SecurityScanResult, Error>
    
    /**
     * Run compliance check against standards
     */
    checkCompliance(targetPath: string, standards: ComplianceStandard[]): Effect.Effect<ComplianceResult[], Error>
    
    /**
     * Generate security report
     */
    generateReport(results: SecurityScanResult[], format: 'json' | 'html' | 'xml'): Effect.Effect<string, Error>
    
    /**
     * Validate security configuration
     */
    validateConfig(config: unknown): Effect.Effect<boolean, Error>
}

/**
 * Security policy template configuration
 */
export type SecurityPolicyTemplate = {
    readonly name: string
    readonly standard: ComplianceStandard
    readonly version: string
    readonly sections: SecurityPolicySection[]
    readonly variables: Record<string, string>
}

export type SecurityPolicySection = {
    readonly id: string
    readonly title: string
    readonly content: string
    readonly requirements: string[]
    readonly controls: SecurityControl[]
}

export type SecurityControl = {
    readonly id: string
    readonly name: string
    readonly description: string
    readonly implementation: string
    readonly testProcedure: string
    readonly frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly'
}