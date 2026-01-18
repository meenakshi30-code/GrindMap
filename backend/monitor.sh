#!/bin/bash

# GrindMap Backend Monitoring & Alerting System
# Comprehensive monitoring script for production health checks, performance metrics, and alerting

set -e

# Configuration
APP_NAME="grindmap-backend"
BASE_URL="http://localhost:5001"
HEALTH_ENDPOINT="$BASE_URL/health"
STATS_ENDPOINT="$BASE_URL/api/stats"
METRICS_ENDPOINT="$BASE_URL/metrics"

# Monitoring thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
RESPONSE_TIME_THRESHOLD=2000  # milliseconds
ERROR_RATE_THRESHOLD=5        # percentage
DISK_USAGE_THRESHOLD=90

# Notification settings
ALERT_EMAIL="admin@grindmap.com"
SLACK_WEBHOOK_URL=""
DISCORD_WEBHOOK_URL=""

# Log files
MONITOR_LOG="./logs/monitoring-$(date +%Y%m%d).log"
METRICS_LOG="./logs/metrics-$(date +%Y%m%d).log"
ALERT_LOG="./logs/alerts-$(date +%Y%m%d).log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function with different levels
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} ${timestamp} - $message" | tee -a $MONITOR_LOG
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} ${timestamp} - $message" | tee -a $MONITOR_LOG $ALERT_LOG
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message" | tee -a $MONITOR_LOG $ALERT_LOG
            ;;
        "METRIC")
            echo "${timestamp} - $message" >> $METRICS_LOG
            ;;
    esac
}

# Health check function
check_health() {
    log "INFO" "Performing health check..."
    
    local start_time=$(date +%s%3N)
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT" --max-time 10)
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    # Log metrics
    log "METRIC" "health_check_response_time:$response_time"
    log "METRIC" "health_check_http_code:$http_code"
    
    if [ "$http_code" = "200" ]; then
        log "INFO" "Health check passed (${response_time}ms)"
        
        # Check response time threshold
        if [ $response_time -gt $RESPONSE_TIME_THRESHOLD ]; then
            log "WARN" "Health check response time exceeded threshold: ${response_time}ms > ${RESPONSE_TIME_THRESHOLD}ms"
            send_alert "PERFORMANCE" "Health check response time exceeded threshold: ${response_time}ms"
        fi
        
        return 0
    else
        log "ERROR" "Health check failed with HTTP code: $http_code"
        send_alert "CRITICAL" "Health check failed with HTTP code: $http_code"
        return 1
    fi
}

# System resource monitoring
check_system_resources() {
    log "INFO" "Checking system resources..."
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    cpu_usage=${cpu_usage%.*}  # Remove decimal part
    
    # Memory usage
    local memory_info=$(free | grep Mem)
    local total_memory=$(echo $memory_info | awk '{print $2}')
    local used_memory=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$((used_memory * 100 / total_memory))
    
    # Disk usage
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    # Process count for our application
    local process_count=$(pgrep -f "$APP_NAME" | wc -l)
    
    # Log metrics
    log "METRIC" "cpu_usage:$cpu_usage"
    log "METRIC" "memory_usage:$memory_usage"
    log "METRIC" "disk_usage:$disk_usage"
    log "METRIC" "process_count:$process_count"
    
    log "INFO" "System resources - CPU: ${cpu_usage}%, Memory: ${memory_usage}%, Disk: ${disk_usage}%, Processes: $process_count"
    
    # Check thresholds and send alerts
    if [ $cpu_usage -gt $CPU_THRESHOLD ]; then
        log "WARN" "CPU usage exceeded threshold: ${cpu_usage}% > ${CPU_THRESHOLD}%"
        send_alert "WARNING" "High CPU usage detected: ${cpu_usage}%"
    fi
    
    if [ $memory_usage -gt $MEMORY_THRESHOLD ]; then
        log "WARN" "Memory usage exceeded threshold: ${memory_usage}% > ${MEMORY_THRESHOLD}%"
        send_alert "WARNING" "High memory usage detected: ${memory_usage}%"
    fi
    
    if [ $disk_usage -gt $DISK_USAGE_THRESHOLD ]; then
        log "WARN" "Disk usage exceeded threshold: ${disk_usage}% > ${DISK_USAGE_THRESHOLD}%"
        send_alert "WARNING" "High disk usage detected: ${disk_usage}%"
    fi
    
    if [ $process_count -eq 0 ]; then
        log "ERROR" "No application processes found"
        send_alert "CRITICAL" "Application processes not running"
    fi
}

# Application-specific metrics
check_application_metrics() {
    log "INFO" "Checking application metrics..."
    
    # Get application stats
    local stats_response=$(curl -s "$STATS_ENDPOINT" --max-time 10)
    
    if [ $? -eq 0 ]; then
        # Parse JSON response (requires jq)
        if command -v jq &> /dev/null; then
            local queue_size=$(echo "$stats_response" | jq -r '.data.queueSize // 0')
            local active_requests=$(echo "$stats_response" | jq -r '.data.activeRequests // 0')
            local memory_usage_mb=$(echo "$stats_response" | jq -r '.data.memoryUsage.heapUsed // 0')
            local is_overloaded=$(echo "$stats_response" | jq -r '.data.isOverloaded // false')
            local circuit_breaker_open=$(echo "$stats_response" | jq -r '.data.circuitBreakerOpen // false')
            
            # Log application metrics
            log "METRIC" "app_queue_size:$queue_size"
            log "METRIC" "app_active_requests:$active_requests"
            log "METRIC" "app_memory_usage_mb:$memory_usage_mb"
            log "METRIC" "app_is_overloaded:$is_overloaded"
            log "METRIC" "app_circuit_breaker_open:$circuit_breaker_open"
            
            log "INFO" "Application metrics - Queue: $queue_size, Active: $active_requests, Memory: ${memory_usage_mb}MB"
            
            # Check application-specific thresholds
            if [ "$is_overloaded" = "true" ]; then
                log "WARN" "Application is in overloaded state"
                send_alert "WARNING" "Application overload detected"
            fi
            
            if [ "$circuit_breaker_open" = "true" ]; then
                log "ERROR" "Circuit breaker is open"
                send_alert "CRITICAL" "Circuit breaker activated - service degraded"
            fi
            
            if [ $queue_size -gt 100 ]; then
                log "WARN" "High queue size detected: $queue_size"
                send_alert "WARNING" "High request queue size: $queue_size"
            fi
        else
            log "WARN" "jq not available, skipping JSON parsing"
        fi
    else
        log "ERROR" "Failed to retrieve application stats"
        send_alert "ERROR" "Unable to retrieve application statistics"
    fi
}

# Network connectivity check
check_network_connectivity() {
    log "INFO" "Checking network connectivity..."
    
    # Check external API connectivity (example endpoints)
    local external_apis=(
        "https://leetcode.com"
        "https://codeforces.com"
        "https://www.codechef.com"
        "https://github.com"
    )
    
    local failed_apis=()
    
    for api in "${external_apis[@]}"; do
        local start_time=$(date +%s%3N)
        if curl -s --head "$api" --max-time 10 > /dev/null; then
            local end_time=$(date +%s%3N)
            local response_time=$((end_time - start_time))
            log "METRIC" "external_api_${api//[^a-zA-Z0-9]/_}_response_time:$response_time"
            log "INFO" "External API check passed: $api (${response_time}ms)"
        else
            failed_apis+=("$api")
            log "WARN" "External API check failed: $api"
        fi
    done
    
    if [ ${#failed_apis[@]} -gt 0 ]; then
        local failed_list=$(IFS=', '; echo "${failed_apis[*]}")
        send_alert "WARNING" "External API connectivity issues: $failed_list"
    fi
}

# Log file analysis
analyze_logs() {
    log "INFO" "Analyzing application logs..."
    
    local app_log="./logs/production.log"
    
    if [ -f "$app_log" ]; then
        # Count error occurrences in the last hour
        local error_count=$(grep -c "ERROR" "$app_log" 2>/dev/null || echo "0")
        local warning_count=$(grep -c "WARN" "$app_log" 2>/dev/null || echo "0")
        
        # Calculate error rate (simplified)
        local total_requests=$(grep -c "GET\|POST\|PUT\|DELETE" "$app_log" 2>/dev/null || echo "1")
        local error_rate=$((error_count * 100 / total_requests))
        
        log "METRIC" "log_error_count:$error_count"
        log "METRIC" "log_warning_count:$warning_count"
        log "METRIC" "log_error_rate:$error_rate"
        
        log "INFO" "Log analysis - Errors: $error_count, Warnings: $warning_count, Error rate: ${error_rate}%"
        
        if [ $error_rate -gt $ERROR_RATE_THRESHOLD ]; then
            log "WARN" "High error rate detected: ${error_rate}%"
            send_alert "WARNING" "High error rate in application logs: ${error_rate}%"
        fi
        
        # Check for specific error patterns
        local critical_errors=$(grep -i "crash\|fatal\|panic\|segfault" "$app_log" 2>/dev/null | wc -l)
        if [ $critical_errors -gt 0 ]; then
            log "ERROR" "Critical errors found in logs: $critical_errors"
            send_alert "CRITICAL" "Critical errors detected in application logs"
        fi
    else
        log "WARN" "Application log file not found: $app_log"
    fi
}

# Alert sending function
send_alert() {
    local severity=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    log "INFO" "Sending $severity alert: $message"
    
    # Email notification (requires mailutils or similar)
    if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
        echo "Alert: $message at $timestamp" | mail -s "[$severity] GrindMap Backend Alert" "$ALERT_EMAIL"
    fi
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        case $severity in
            "WARNING") color="warning" ;;
            "ERROR"|"CRITICAL") color="danger" ;;
        esac
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"title\":\"[$severity] GrindMap Backend Alert\",\"text\":\"$message\",\"ts\":$(date +%s)}]}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # Discord notification
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        local embed_color=65280  # Green
        case $severity in
            "WARNING") embed_color=16776960 ;;  # Yellow
            "ERROR"|"CRITICAL") embed_color=16711680 ;;  # Red
        esac
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"embeds\":[{\"title\":\"[$severity] GrindMap Backend Alert\",\"description\":\"$message\",\"color\":$embed_color,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}]}" \
            "$DISCORD_WEBHOOK_URL" 2>/dev/null || true
    fi
}

# Generate monitoring report
generate_report() {
    log "INFO" "Generating monitoring report..."
    
    local report_file="./reports/monitoring-report-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p reports
    
    # Create comprehensive monitoring report
    cat > "$report_file" << EOF
{
    "monitoring_report": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "application": "$APP_NAME",
        "environment": "${NODE_ENV:-production}",
        "monitoring_duration": "$(date +%s)",
        "health_status": "$(check_health > /dev/null 2>&1 && echo 'healthy' || echo 'unhealthy')",
        "system_resources": {
            "cpu_usage": "$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')%",
            "memory_usage": "$(free | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')",
            "disk_usage": "$(df -h / | awk 'NR==2 {print $5}')"
        },
        "alerts_generated": $(grep -c "WARN\|ERROR" "$ALERT_LOG" 2>/dev/null || echo "0"),
        "log_files": {
            "monitor_log": "$MONITOR_LOG",
            "metrics_log": "$METRICS_LOG",
            "alert_log": "$ALERT_LOG"
        }
    }
}
EOF
    
    log "INFO" "Monitoring report generated: $report_file"
}

# Cleanup old logs and reports
cleanup_old_files() {
    log "INFO" "Cleaning up old monitoring files..."
    
    # Keep logs for 30 days
    find ./logs -name "monitoring-*.log" -mtime +30 -delete 2>/dev/null || true
    find ./logs -name "metrics-*.log" -mtime +30 -delete 2>/dev/null || true
    find ./logs -name "alerts-*.log" -mtime +30 -delete 2>/dev/null || true
    
    # Keep reports for 7 days
    find ./reports -name "monitoring-report-*.json" -mtime +7 -delete 2>/dev/null || true
    
    log "INFO" "Cleanup completed"
}

# Main monitoring function
run_monitoring() {
    log "INFO" "Starting comprehensive monitoring cycle..."
    
    # Create necessary directories
    mkdir -p logs reports
    
    # Run all monitoring checks
    check_health
    check_system_resources
    check_application_metrics
    check_network_connectivity
    analyze_logs
    
    # Generate report and cleanup
    generate_report
    cleanup_old_files
    
    log "INFO" "Monitoring cycle completed successfully"
}

# Continuous monitoring mode
continuous_monitoring() {
    local interval=${1:-300}  # Default 5 minutes
    
    log "INFO" "Starting continuous monitoring with ${interval}s interval..."
    
    while true; do
        run_monitoring
        log "INFO" "Waiting ${interval} seconds before next monitoring cycle..."
        sleep $interval
    done
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  --once              Run monitoring once and exit"
    echo "  --continuous [INT]  Run continuous monitoring (default: 300s interval)"
    echo "  --health-only       Run only health check"
    echo "  --help              Show this help message"
    exit 1
}

# Main execution
case "${1:-}" in
    "--once")
        run_monitoring
        ;;
    "--continuous")
        continuous_monitoring "${2:-300}"
        ;;
    "--health-only")
        check_health
        ;;
    "--help"|"-h")
        usage
        ;;
    "")
        run_monitoring
        ;;
    *)
        echo "Unknown option: $1"
        usage
        ;;
esac