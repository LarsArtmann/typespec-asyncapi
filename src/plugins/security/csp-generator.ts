/**
 * Content Security Policy (CSP) Generator
 * 
 * Generates secure Content Security Policy headers and validation
 * for comprehensive XSS prevention and security hardening.
 */

import { Effect } from "effect"

/**
 * CSP directive configuration
 */
export type CSPDirective = {
    readonly name: string
    readonly sources: string[]
    readonly required: boolean
    readonly description: string
}

/**
 * CSP policy configuration
 */
export type CSPPolicyConfig = {
    readonly strict: boolean
    readonly reportOnly: boolean
    readonly reportUri?: string
    readonly nonce?: boolean
    readonly hash?: boolean
    readonly allowUnsafeInline?: boolean
    readonly allowUnsafeEval?: boolean
    readonly upgradeInsecureRequests?: boolean
    readonly blockAllMixedContent?: boolean
    readonly customDirectives?: Record<string, string[]>
}

/**
 * Security headers configuration
 */
export type SecurityHeadersConfig = {
    readonly contentSecurityPolicy: CSPPolicyConfig
    readonly frameOptions: 'deny' | 'sameorigin' | 'allow-from'
    readonly contentTypeOptions: boolean
    readonly referrerPolicy: 'no-referrer' | 'strict-origin' | 'strict-origin-when-cross-origin'
    readonly strictTransportSecurity: {
        maxAge: number
        includeSubdomains: boolean
        preload: boolean
    }
    readonly permissionsPolicy: Record<string, string[]>
    readonly crossOriginEmbedderPolicy: 'require-corp' | 'unsafe-none'
    readonly crossOriginOpenerPolicy: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none'
}

/**
 * Default secure CSP directives
 */
const DEFAULT_CSP_DIRECTIVES: CSPDirective[] = [
    {
        name: 'default-src',
        sources: ["'self'"],
        required: true,
        description: 'Default source for all content types'
    },
    {
        name: 'script-src',
        sources: ["'self'", "'strict-dynamic'"],
        required: true,
        description: 'Script sources and execution policies'
    },
    {
        name: 'style-src',
        sources: ["'self'", "'unsafe-hashes'"],
        required: true,
        description: 'Stylesheet sources'
    },
    {
        name: 'img-src',
        sources: ["'self'", "data:", "https:"],
        required: true,
        description: 'Image sources'
    },
    {
        name: 'connect-src',
        sources: ["'self'"],
        required: true,
        description: 'Connection sources for AJAX, WebSocket, etc.'
    },
    {
        name: 'font-src',
        sources: ["'self'", "https:", "data:"],
        required: false,
        description: 'Font sources'
    },
    {
        name: 'object-src',
        sources: ["'none'"],
        required: true,
        description: 'Plugin sources (Flash, etc.)'
    },
    {
        name: 'media-src',
        sources: ["'self'"],
        required: false,
        description: 'Audio and video sources'
    },
    {
        name: 'frame-src',
        sources: ["'self'"],
        required: false,
        description: 'Frame sources'
    },
    {
        name: 'frame-ancestors',
        sources: ["'self'"],
        required: true,
        description: 'Valid parents for embedding (replaces X-Frame-Options)'
    },
    {
        name: 'base-uri',
        sources: ["'self'"],
        required: true,
        description: 'Base URI restrictions'
    },
    {
        name: 'form-action',
        sources: ["'self'"],
        required: true,
        description: 'Form submission targets'
    }
]

/**
 * CSP Generator and Validator
 */
export class CSPGenerator {
    private config: CSPPolicyConfig
    private directives: CSPDirective[]
    
    constructor(config: CSPPolicyConfig = { strict: true, reportOnly: false }) {
        this.config = config
        this.directives = [...DEFAULT_CSP_DIRECTIVES]
        
        if (config.customDirectives) {
            this.addCustomDirectives(config.customDirectives)
        }
    }
    
    /**
     * Generate CSP header value
     */
    generateCSPHeader(): Effect.Effect<string, Error> {
        return Effect.gen(() => {
            const policies: string[] = []
            
            for (const directive of this.directives) {
                if (directive.required || this.config.strict) {
                    const sources = this.processSources(directive.sources)
                    policies.push(`${directive.name} ${sources.join(' ')}`)
                }
            }
            
            // Add upgrade-insecure-requests if enabled
            if (this.config.upgradeInsecureRequests) {
                policies.push('upgrade-insecure-requests')
            }
            
            // Add block-all-mixed-content if enabled
            if (this.config.blockAllMixedContent) {
                policies.push('block-all-mixed-content')
            }
            
            // Add report-uri if configured
            if (this.config.reportUri) {
                policies.push(`report-uri ${this.config.reportUri}`)
            }
            
            return policies.join('; ')
        })
    }
    
    /**
     * Generate complete security headers
     */
    generateSecurityHeaders(config: SecurityHeadersConfig): Effect.Effect<Record<string, string>, Error> {
        return Effect.gen(function* () {
            const headers: Record<string, string> = {}
            
            // Content Security Policy
            const csp = yield* new CSPGenerator(config.contentSecurityPolicy).generateCSPHeader()
            const cspHeaderName = config.contentSecurityPolicy.reportOnly 
                ? 'Content-Security-Policy-Report-Only' 
                : 'Content-Security-Policy'
            headers[cspHeaderName] = csp
            
            // X-Frame-Options (legacy support alongside frame-ancestors)
            if (config.frameOptions === 'deny') {
                headers['X-Frame-Options'] = 'DENY'
            } else if (config.frameOptions === 'sameorigin') {
                headers['X-Frame-Options'] = 'SAMEORIGIN'
            }
            
            // X-Content-Type-Options
            if (config.contentTypeOptions) {
                headers['X-Content-Type-Options'] = 'nosniff'
            }
            
            // Referrer-Policy
            headers['Referrer-Policy'] = config.referrerPolicy
            
            // Strict-Transport-Security
            const hsts = config.strictTransportSecurity
            let hstsValue = `max-age=${hsts.maxAge}`
            if (hsts.includeSubdomains) {
                hstsValue += '; includeSubDomains'
            }
            if (hsts.preload) {
                hstsValue += '; preload'
            }
            headers['Strict-Transport-Security'] = hstsValue
            
            // Permissions-Policy
            if (Object.keys(config.permissionsPolicy).length > 0) {
                const permissions = Object.entries(config.permissionsPolicy)
                    .map(([feature, allowList]) => `${feature}=(${allowList.join(' ')})`)
                    .join(', ')
                headers['Permissions-Policy'] = permissions
            }
            
            // Cross-Origin-Embedder-Policy
            headers['Cross-Origin-Embedder-Policy'] = config.crossOriginEmbedderPolicy
            
            // Cross-Origin-Opener-Policy
            headers['Cross-Origin-Opener-Policy'] = config.crossOriginOpenerPolicy
            
            // Additional security headers
            headers['X-Permitted-Cross-Domain-Policies'] = 'none'
            headers['Cross-Origin-Resource-Policy'] = 'same-origin'
            
            return headers
        })
    }
    
    /**
     * Generate middleware code for different runtimes
     */
    generateMiddleware(runtime: 'go' | 'nodejs', config: SecurityHeadersConfig): Effect.Effect<string, Error> {
        return Effect.gen(function* () {
            const headers = yield* this.generateSecurityHeaders(config)
            
            switch (runtime) {
                case 'go':
                    return this.generateGoMiddleware(headers)
                    
                case 'nodejs':
                    return this.generateNodeJSMiddleware(headers)
                    
                default:
                    throw new Error(`Unsupported runtime: ${runtime}`)
            }
        }.bind(this))
    }
    
    /**
     * Validate existing CSP header
     */
    validateCSP(cspHeader: string): Effect.Effect<{
        valid: boolean
        issues: string[]
        recommendations: string[]
    }, Error> {
        return Effect.gen(() => {
            const issues: string[] = []
            const recommendations: string[] = []
            
            // Check for required directives
            const requiredDirectives = this.directives.filter(d => d.required)
            for (const directive of requiredDirectives) {
                if (!cspHeader.includes(directive.name)) {
                    issues.push(`Missing required directive: ${directive.name}`)
                    recommendations.push(`Add ${directive.name} directive with appropriate sources`)
                }
            }
            
            // Check for unsafe practices
            if (cspHeader.includes("'unsafe-inline'")) {
                issues.push("Found 'unsafe-inline' directive")
                recommendations.push("Use nonces or hashes instead of 'unsafe-inline'")
            }
            
            if (cspHeader.includes("'unsafe-eval'")) {
                issues.push("Found 'unsafe-eval' directive")
                recommendations.push("Remove 'unsafe-eval' or use strict CSP")
            }
            
            // Check for wildcard sources
            if (cspHeader.includes('*') && !cspHeader.includes('https:')) {
                issues.push("Found wildcard (*) without HTTPS restriction")
                recommendations.push("Replace * with 'self' or specific domains")
            }
            
            // Check for data: URIs in script-src
            if (cspHeader.includes('script-src') && cspHeader.includes('data:')) {
                issues.push("Found data: URI in script-src")
                recommendations.push("Remove data: URI from script-src to prevent XSS")
            }
            
            return {
                valid: issues.length === 0,
                issues,
                recommendations
            }
        })
    }
    
    /**
     * Add custom directives to the configuration
     */
    private addCustomDirectives(customDirectives: Record<string, string[]>): void {
        for (const [name, sources] of Object.entries(customDirectives)) {
            const existingIndex = this.directives.findIndex(d => d.name === name)
            
            if (existingIndex >= 0) {
                // Update existing directive
                this.directives[existingIndex] = {
                    ...this.directives[existingIndex],
                    sources: [...this.directives[existingIndex].sources, ...sources]
                }
            } else {
                // Add new directive
                this.directives.push({
                    name,
                    sources,
                    required: false,
                    description: `Custom directive: ${name}`
                })
            }
        }
    }
    
    /**
     * Process directive sources based on configuration
     */
    private processSources(sources: string[]): string[] {
        const processedSources = [...sources]
        
        // Remove unsafe directives in strict mode
        if (this.config.strict) {
            const index = processedSources.indexOf("'unsafe-inline'")
            if (index > -1) {
                processedSources.splice(index, 1)
            }
            
            const evalIndex = processedSources.indexOf("'unsafe-eval'")
            if (evalIndex > -1) {
                processedSources.splice(evalIndex, 1)
            }
        }
        
        // Add unsafe directives if explicitly allowed
        if (this.config.allowUnsafeInline && !processedSources.includes("'unsafe-inline'")) {
            processedSources.push("'unsafe-inline'")
        }
        
        if (this.config.allowUnsafeEval && !processedSources.includes("'unsafe-eval'")) {
            processedSources.push("'unsafe-eval'")
        }
        
        return processedSources
    }
    
    /**
     * Generate Go middleware code
     */
    private generateGoMiddleware(headers: Record<string, string>): string {
        const headerSetters = Object.entries(headers)
            .map(([name, value]) => `        w.Header().Set("${name}", "${value}")`)
            .join('\n')
            
        return `package middleware

import (
    "net/http"
)

// SecurityHeadersMiddleware adds security headers to all responses
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Set security headers
${headerSetters}
        
        next.ServeHTTP(w, r)
    })
}

// ApplySecurityHeaders adds security headers to a specific response
func ApplySecurityHeaders(w http.ResponseWriter) {
${headerSetters}
}`
    }
    
    /**
     * Generate Node.js middleware code
     */
    private generateNodeJSMiddleware(headers: Record<string, string>): string {
        const headerSetters = Object.entries(headers)
            .map(([name, value]) => `        res.setHeader('${name}', '${value}');`)
            .join('\n')
            
        return `// Security Headers Middleware
export function securityHeadersMiddleware(req, res, next) {
    // Set security headers
${headerSetters}
    
    next();
}

// Apply security headers to response
export function applySecurityHeaders(res) {
${headerSetters}
}

// Express.js middleware
export function expressSecurityHeaders() {
    return (req, res, next) => {
${headerSetters}
        next();
    };
}`
    }
}

/**
 * Security policy template generator
 */
export function generateSecurityPolicyTemplate(standard: 'gdpr' | 'soc2' | 'hipaa'): Effect.Effect<string, Error> {
    return Effect.gen(() => {
        switch (standard) {
            case 'gdpr':
                return generateGDPRPolicy()
                
            case 'soc2':
                return generateSOC2Policy()
                
            case 'hipaa':
                return generateHIPAAPolicy()
                
            default:
                throw new Error(`Unsupported compliance standard: ${standard}`)
        }
    })
}

/**
 * Generate GDPR compliance policy template
 */
function generateGDPRPolicy(): string {
    return `# GDPR Compliance Policy Template

## Data Processing Policy

### Article 6 - Lawfulness of Processing
- [ ] Legal basis established for all data processing activities
- [ ] Consent mechanisms implemented where required
- [ ] Legitimate interests assessment conducted

### Article 7 - Conditions for Consent
- [ ] Clear and plain language consent forms
- [ ] Granular consent options provided
- [ ] Consent withdrawal mechanism implemented

### Article 13-14 - Information to be Provided
- [ ] Privacy notices provide all required information
- [ ] Data subject rights clearly communicated
- [ ] Contact details of DPO provided

### Article 17 - Right to Erasure
- [ ] Data deletion procedures implemented
- [ ] Right to be forgotten request handling
- [ ] Technical deletion verification

### Article 25 - Data Protection by Design
- [ ] Privacy by design implemented
- [ ] Data minimization principles applied
- [ ] Security measures integrated from design phase

### Article 32 - Security of Processing
- [ ] Appropriate technical measures implemented
- [ ] Organizational security measures in place
- [ ] Regular security testing conducted
- [ ] Incident response procedures established

## Technical Implementation Requirements

### Encryption
- [ ] Data encrypted in transit (TLS 1.3+)
- [ ] Data encrypted at rest (AES-256)
- [ ] Key management procedures implemented

### Access Controls
- [ ] Role-based access control implemented
- [ ] Multi-factor authentication required
- [ ] Regular access reviews conducted

### Monitoring
- [ ] Audit logging implemented
- [ ] Security monitoring active
- [ ] Incident detection procedures
- [ ] Regular compliance assessments`
}

/**
 * Generate SOC2 compliance policy template
 */
function generateSOC2Policy(): string {
    return `# SOC2 Type II Compliance Policy Template

## Security Controls

### CC1 - Control Environment
- [ ] Security policies documented and approved
- [ ] Security roles and responsibilities defined
- [ ] Management oversight mechanisms established

### CC2 - Communication and Information
- [ ] Security objectives communicated organization-wide
- [ ] Security incident reporting procedures established
- [ ] Regular security training conducted

### CC3 - Risk Assessment
- [ ] Risk assessment procedures documented
- [ ] Security risk register maintained
- [ ] Regular risk assessments conducted

### CC4 - Monitoring Activities
- [ ] Security monitoring controls implemented
- [ ] Performance metrics established
- [ ] Regular monitoring reviews conducted

### CC5 - Control Activities
- [ ] Security control procedures documented
- [ ] Access control policies implemented
- [ ] Change management procedures established

## System Availability Controls

### A1 - Availability Commitments
- [ ] Availability SLAs defined and documented
- [ ] Performance monitoring implemented
- [ ] Capacity planning procedures established

### A2 - System Availability
- [ ] Redundancy and failover systems implemented
- [ ] Backup and recovery procedures tested
- [ ] Disaster recovery plan maintained

## Technical Security Requirements

### Infrastructure Security
- [ ] Network security controls implemented
- [ ] System hardening standards applied
- [ ] Vulnerability management program established

### Application Security
- [ ] Secure development lifecycle implemented
- [ ] Code review procedures established
- [ ] Security testing integrated into SDLC

### Data Protection
- [ ] Data classification scheme implemented
- [ ] Encryption standards applied
- [ ] Data retention policies enforced`
}

/**
 * Generate HIPAA compliance policy template
 */
function generateHIPAAPolicy(): string {
    return `# HIPAA Compliance Policy Template

## Administrative Safeguards

### § 164.308(a)(1) - Security Officer
- [ ] Security officer appointed and documented
- [ ] Security responsibilities assigned and documented
- [ ] Security incident procedures established

### § 164.308(a)(3) - Workforce Training
- [ ] Security awareness training program implemented
- [ ] Training records maintained
- [ ] Periodic refresher training conducted

### § 164.308(a)(4) - Access Management
- [ ] Access authorization procedures implemented
- [ ] User access reviews conducted regularly
- [ ] Termination procedures established

## Physical Safeguards

### § 164.310(a)(1) - Facility Access Controls
- [ ] Physical access controls implemented
- [ ] Visitor access procedures established
- [ ] Physical security monitoring active

### § 164.310(d)(1) - Device and Media Controls
- [ ] Device inventory maintained
- [ ] Media sanitization procedures implemented
- [ ] Secure disposal procedures established

## Technical Safeguards

### § 164.312(a)(1) - Access Control
- [ ] Unique user identification required
- [ ] Role-based access control implemented
- [ ] Session timeout controls active

### § 164.312(b) - Audit Controls
- [ ] Audit logging implemented for all systems
- [ ] Log review procedures established
- [ ] Audit trail protection measures active

### § 164.312(c)(1) - Integrity
- [ ] Data integrity controls implemented
- [ ] Alteration detection mechanisms active
- [ ] Backup verification procedures established

### § 164.312(d) - Person or Entity Authentication
- [ ] Multi-factor authentication implemented
- [ ] Identity verification procedures established
- [ ] Authentication logging active

### § 164.312(e)(1) - Transmission Security
- [ ] End-to-end encryption implemented
- [ ] Network security controls active
- [ ] Secure communication protocols required

## Risk Assessment Requirements

### Security Risk Analysis
- [ ] Annual risk assessments conducted
- [ ] Vulnerability assessments performed
- [ ] Risk mitigation plans implemented
- [ ] Compliance monitoring active`
}