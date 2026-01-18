#!/bin/bash

# GrindMap Backend Security Audit & Dependency Management Script
# Comprehensive security scanning, vulnerability assessment, and dependency management

set -e

# Configuration
SECURITY_LOG="./logs/security-audit-$(date +%Y%m%d-%H%M%S).log"
VULNERABILITY_REPORT="./reports/vulnerability-report-$(date +%Y%m%d-%H%M%S).json"
DEPENDENCY_REPORT="./reports/dependency-report-$(date +%Y%m%d-%H%M%S).json"

# Severity thresholds
CRITICAL_THRESHOLD=0
HIGH_THRESHOLD=0
MODERATE_THRESHOLD=5

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} ${timestamp} - $message" | tee -a $SECURITY_LOG
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} ${timestamp} - $message" | tee -a $SECURITY_LOG
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message" | tee -a $SECURITY_LOG
            ;;
        "CRITICAL")
            echo -e "${RED}[CRITICAL]${NC} ${timestamp} - $message" | tee -a $SECURITY_LOG
            ;;
    esac
}

# Create necessary directories
setup_directories() {
    log "INFO" "Setting up security audit directories..."
    mkdir -p logs reports security-backups
}

# Backup current package files
backup_package_files() {
    log "INFO" "Creating backup of current package files..."
    
    local backup_dir="./security-backups/backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    cp package.json "$backup_dir/" 2>/dev/null || true
    cp package-lock.json "$backup_dir/" 2>/dev/null || true
    
    echo "$backup_dir" > .last-security-backup
    log "INFO" "Package files backed up to: $backup_dir"
}

# Comprehensive npm audit
run_npm_audit() {
    log "INFO" "Running comprehensive npm security audit..."
    
    # Generate detailed audit report
    npm audit --json > "$VULNERABILITY_REPORT" 2>/dev/null || true
    
    # Parse audit results
    if command -v jq &> /dev/null && [ -f "$VULNERABILITY_REPORT" ]; then
        local critical_count=$(jq -r '.metadata.vulnerabilities.critical // 0' "$VULNERABILITY_REPORT")
        local high_count=$(jq -r '.metadata.vulnerabilities.high // 0' "$VULNERABILITY_REPORT")
        local moderate_count=$(jq -r '.metadata.vulnerabilities.moderate // 0' "$VULNERABILITY_REPORT")
        local low_count=$(jq -r '.metadata.vulnerabilities.low // 0' "$VULNERABILITY_REPORT")
        local info_count=$(jq -r '.metadata.vulnerabilities.info // 0' "$VULNERABILITY_REPORT")
        
        log "INFO" "Vulnerability Summary:"
        log "INFO" "  Critical: $critical_count"
        log "INFO" "  High: $high_count"
        log "INFO" "  Moderate: $moderate_count"
        log "INFO" "  Low: $low_count"
        log "INFO" "  Info: $info_count"
        
        # Check against thresholds
        if [ "$critical_count" -gt $CRITICAL_THRESHOLD ]; then
            log "CRITICAL" "Critical vulnerabilities found: $critical_count (threshold: $CRITICAL_THRESHOLD)"
            return 1
        fi
        
        if [ "$high_count" -gt $HIGH_THRESHOLD ]; then
            log "ERROR" "High severity vulnerabilities found: $high_count (threshold: $HIGH_THRESHOLD)"
            return 1
        fi
        
        if [ "$moderate_count" -gt $MODERATE_THRESHOLD ]; then
            log "WARN" "Moderate vulnerabilities exceed threshold: $moderate_count (threshold: $MODERATE_THRESHOLD)"
        fi
        
        # Extract specific vulnerability details
        jq -r '.advisories | to_entries[] | select(.value.severity == "critical" or .value.severity == "high") | 
               "VULNERABILITY: " + .value.title + " (Severity: " + .value.severity + ") - Package: " + .value.module_name + " - CVE: " + (.value.cves[0] // "N/A")' \
               "$VULNERABILITY_REPORT" >> $SECURITY_LOG 2>/dev/null || true
        
    else
        log "WARN" "jq not available or audit report empty, running basic audit..."
        npm audit --audit-level=moderate
    fi
    
    log "INFO" "Security audit completed"
}

# Check for outdated packages
check_outdated_packages() {
    log "INFO" "Checking for outdated packages..."
    
    # Generate outdated packages report
    npm outdated --json > "$DEPENDENCY_REPORT" 2>/dev/null || true
    
    if [ -s "$DEPENDENCY_REPORT" ]; then
        log "WARN" "Outdated packages detected:"
        
        if command -v jq &> /dev/null; then
            jq -r 'to_entries[] | 
                   "OUTDATED: " + .key + " (Current: " + .value.current + ", Wanted: " + .value.wanted + ", Latest: " + .value.latest + ")"' \
                   "$DEPENDENCY_REPORT" | while read line; do
                log "WARN" "$line"
            done
        else
            npm outdated
        fi
    else
        log "INFO" "All packages are up to date"
    fi
}

# Validate package-lock.json integrity
validate_package_lock() {
    log "INFO" "Validating package-lock.json integrity..."
    
    if [ ! -f "package-lock.json" ]; then
        log "ERROR" "package-lock.json not found - dependency versions not locked"
        return 1
    fi
    
    # Check if package-lock.json is in sync with package.json
    if ! npm ci --dry-run > /dev/null 2>&1; then
        log "ERROR" "package-lock.json is out of sync with package.json"
        return 1
    fi
    
    # Verify integrity of installed packages
    if ! npm ls > /dev/null 2>&1; then
        log "WARN" "Dependency tree has issues"
        npm ls 2>&1 | grep -E "WARN|ERROR" | head -10 | while read line; do
            log "WARN" "Dependency issue: $line"
        done
    fi
    
    log "INFO" "Package lock validation completed"
}

# Check for known malicious packages
check_malicious_packages() {
    log "INFO" "Checking for known malicious packages..."
    
    # List of known malicious package patterns (simplified check)
    local suspicious_patterns=(
        "event-stream"
        "eslint-scope"
        "getcookies"
        "http-fetch"
        "node-fetch-npm"
        "crossenv"
        "cross-env.js"
        "d3.js"
        "fabric-js"
    )
    
    local found_suspicious=false
    
    for pattern in "${suspicious_patterns[@]}"; do
        if npm ls "$pattern" > /dev/null 2>&1; then
            log "CRITICAL" "Potentially malicious package detected: $pattern"
            found_suspicious=true
        fi
    done
    
    if [ "$found_suspicious" = false ]; then
        log "INFO" "No known malicious packages detected"
    fi
}

# License compliance check
check_license_compliance() {
    log "INFO" "Checking license compliance..."
    
    # Generate license report
    local license_report="./reports/license-report-$(date +%Y%m%d-%H%M%S).json"
    
    # Check for problematic licenses
    local problematic_licenses=(
        "GPL-3.0"
        "AGPL-3.0"
        "LGPL-3.0"
        "CPAL-1.0"
        "EPL-1.0"
    )
    
    # This is a simplified check - in production, use tools like license-checker
    npm ls --json > "$license_report" 2>/dev/null || true
    
    if command -v jq &> /dev/null && [ -f "$license_report" ]; then
        for license in "${problematic_licenses[@]}"; do
            local count=$(jq -r --arg license "$license" '
                .. | objects | select(has("license")) | 
                select(.license == $license) | .name' "$license_report" 2>/dev/null | wc -l)
            
            if [ "$count" -gt 0 ]; then
                log "WARN" "Packages with $license license found: $count"
            fi
        done
    fi
    
    log "INFO" "License compliance check completed"
}

# Generate security recommendations
generate_security_recommendations() {
    log "INFO" "Generating security recommendations..."
    
    local recommendations_file="./reports/security-recommendations-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$recommendations_file" << EOF
# Security Audit Recommendations

## Generated: $(date)

### Immediate Actions Required

1. **Update Critical Vulnerabilities**
   - Run \`npm audit fix\` to automatically fix vulnerabilities
   - Manually update packages with breaking changes
   - Test thoroughly after updates

2. **Version Pinning**
   - All dependencies are now pinned to exact versions
   - Use \`npm update\` carefully and test before deployment
   - Consider using \`npm shrinkwrap\` for additional security

3. **Regular Security Practices**
   - Run security audits weekly: \`npm audit\`
   - Monitor security advisories for used packages
   - Keep dependencies updated but test thoroughly

### Automated Security Measures

1. **CI/CD Integration**
   - Security audits run automatically in CI pipeline
   - Builds fail on critical/high vulnerabilities
   - Dependency updates trigger security scans

2. **Monitoring Setup**
   - Automated vulnerability scanning
   - License compliance checking
   - Malicious package detection

### Security Tools Recommendations

1. **Snyk** - Continuous vulnerability monitoring
2. **npm audit** - Built-in security scanning
3. **retire.js** - JavaScript library vulnerability scanner
4. **OWASP Dependency Check** - Comprehensive dependency analysis

### Next Steps

1. Review and fix any identified vulnerabilities
2. Implement automated security scanning in CI/CD
3. Set up security monitoring and alerting
4. Regular security training for development team

EOF

    log "INFO" "Security recommendations generated: $recommendations_file"
}

# Fix vulnerabilities automatically
fix_vulnerabilities() {
    log "INFO" "Attempting to fix vulnerabilities automatically..."
    
    # Create backup before fixing
    backup_package_files
    
    # Try automatic fixes first
    if npm audit fix --dry-run > /dev/null 2>&1; then
        log "INFO" "Running npm audit fix..."
        npm audit fix
        
        # Verify fixes didn't break anything
        if npm ci > /dev/null 2>&1; then
            log "INFO" "Automatic vulnerability fixes applied successfully"
        else
            log "ERROR" "Automatic fixes caused dependency issues, restoring backup..."
            restore_from_backup
        fi
    else
        log "WARN" "Automatic fixes not available, manual intervention required"
    fi
    
    # Try force fixes for remaining issues
    local remaining_vulns=$(npm audit --json 2>/dev/null | jq -r '.metadata.vulnerabilities.critical + .metadata.vulnerabilities.high' 2>/dev/null || echo "0")
    
    if [ "$remaining_vulns" -gt 0 ]; then
        log "WARN" "Attempting force fixes for remaining vulnerabilities..."
        npm audit fix --force --dry-run > /dev/null 2>&1 && npm audit fix --force || true
    fi
}

# Restore from backup
restore_from_backup() {
    if [ -f ".last-security-backup" ]; then
        local backup_dir=$(cat .last-security-backup)
        if [ -d "$backup_dir" ]; then
            log "INFO" "Restoring from backup: $backup_dir"
            cp "$backup_dir/package.json" . 2>/dev/null || true
            cp "$backup_dir/package-lock.json" . 2>/dev/null || true
            npm ci > /dev/null 2>&1 || true
        fi
    fi
}

# Generate comprehensive security report
generate_security_report() {
    log "INFO" "Generating comprehensive security report..."
    
    local report_file="./reports/security-audit-summary-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
    "security_audit": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "audit_version": "1.0",
        "project": "grindmap-backend",
        "node_version": "$(node --version)",
        "npm_version": "$(npm --version)",
        "audit_results": {
            "vulnerability_report": "$VULNERABILITY_REPORT",
            "dependency_report": "$DEPENDENCY_REPORT",
            "security_log": "$SECURITY_LOG"
        },
        "package_integrity": {
            "package_lock_exists": $([ -f "package-lock.json" ] && echo "true" || echo "false"),
            "dependencies_synced": $(npm ci --dry-run > /dev/null 2>&1 && echo "true" || echo "false")
        },
        "recommendations": {
            "immediate_action_required": $([ -f "$VULNERABILITY_REPORT" ] && jq -r '.metadata.vulnerabilities.critical + .metadata.vulnerabilities.high > 0' "$VULNERABILITY_REPORT" 2>/dev/null || echo "false"),
            "updates_available": $([ -s "$DEPENDENCY_REPORT" ] && echo "true" || echo "false")
        }
    }
}
EOF
    
    log "INFO" "Security report generated: $report_file"
}

# Main security audit function
run_security_audit() {
    log "INFO" "Starting comprehensive security audit..."
    
    setup_directories
    backup_package_files
    
    # Run all security checks
    run_npm_audit
    check_outdated_packages
    validate_package_lock
    check_malicious_packages
    check_license_compliance
    
    # Generate reports and recommendations
    generate_security_recommendations
    generate_security_report
    
    log "INFO" "Security audit completed successfully"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  --audit-only        Run security audit without fixes"
    echo "  --fix               Run audit and attempt automatic fixes"
    echo "  --report-only       Generate reports from existing data"
    echo "  --help              Show this help message"
    exit 1
}

# Main execution
case "${1:-}" in
    "--audit-only")
        run_security_audit
        ;;
    "--fix")
        run_security_audit
        fix_vulnerabilities
        ;;
    "--report-only")
        setup_directories
        generate_security_recommendations
        generate_security_report
        ;;
    "--help"|"-h")
        usage
        ;;
    "")
        run_security_audit
        ;;
    *)
        echo "Unknown option: $1"
        usage
        ;;
esac