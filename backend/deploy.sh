#!/bin/bash

# GrindMap Backend Deployment Script
# Comprehensive deployment automation with quality gates and rollback support

set -e  # Exit on any error

# Color codes for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
DEPLOYMENT_ENV=${1:-production}
APP_NAME="grindmap-backend"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deployment-$(date +%Y%m%d-%H%M%S).log"
HEALTH_CHECK_URL="http://localhost:5001/health"
MAX_HEALTH_RETRIES=30
HEALTH_RETRY_INTERVAL=10

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} ${timestamp} - $message" | tee -a $LOG_FILE
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} ${timestamp} - $message" | tee -a $LOG_FILE
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message" | tee -a $LOG_FILE
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - $message" | tee -a $LOG_FILE
            ;;
    esac
}

# Create necessary directories
setup_directories() {
    log "INFO" "Setting up deployment directories..."
    mkdir -p logs backups dist
    
    # Create deployment manifest
    cat > deployment-manifest.json << EOF
{
    "deployment": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "environment": "$DEPLOYMENT_ENV",
        "version": "$(npm version --json | jq -r '.\"$APP_NAME\"')",
        "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
        "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
        "deployer": "$(whoami)",
        "node_version": "$(node --version)",
        "npm_version": "$(npm --version)"
    }
}
EOF
    log "INFO" "Deployment manifest created"
}

# Pre-deployment validation
validate_environment() {
    log "INFO" "Validating deployment environment..."
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2)
    local required_version="14.0.0"
    
    if ! command -v node &> /dev/null; then
        log "ERROR" "Node.js is not installed"
        exit 1
    fi
    
    # Check npm version
    if ! command -v npm &> /dev/null; then
        log "ERROR" "npm is not installed"
        exit 1
    fi
    
    # Validate package.json
    if [ ! -f "package.json" ]; then
        log "ERROR" "package.json not found"
        exit 1
    fi
    
    # Check environment-specific configuration
    case $DEPLOYMENT_ENV in
        "production")
            log "INFO" "Validating production environment..."
            # Add production-specific validations
            ;;
        "staging")
            log "INFO" "Validating staging environment..."
            # Add staging-specific validations
            ;;
        "development")
            log "INFO" "Validating development environment..."
            ;;
        *)
            log "ERROR" "Unknown environment: $DEPLOYMENT_ENV"
            exit 1
            ;;
    esac
    
    log "INFO" "Environment validation completed successfully"
}

# Backup current deployment
create_backup() {
    log "INFO" "Creating backup of current deployment..."
    
    local backup_timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_path="$BACKUP_DIR/backup-$backup_timestamp"
    
    mkdir -p "$backup_path"
    
    # Backup current dist directory if exists
    if [ -d "dist" ]; then
        cp -r dist "$backup_path/"
        log "INFO" "Current dist directory backed up"
    fi
    
    # Backup package files
    cp package*.json "$backup_path/" 2>/dev/null || true
    
    # Create backup manifest
    cat > "$backup_path/backup-manifest.json" << EOF
{
    "backup": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "environment": "$DEPLOYMENT_ENV",
        "backup_path": "$backup_path",
        "files_backed_up": [
            "dist/",
            "package.json",
            "package-lock.json"
        ]
    }
}
EOF
    
    echo "$backup_path" > .last-backup
    log "INFO" "Backup created at: $backup_path"
}

# Quality gates - run all checks
run_quality_gates() {
    log "INFO" "Running quality gates..."
    
    # Security audit
    log "INFO" "Running security audit..."
    if ! npm run audit:ci; then
        log "ERROR" "Security audit failed"
        exit 1
    fi
    
    # Linting
    log "INFO" "Running code linting..."
    if ! npm run lint:ci; then
        log "ERROR" "Code linting failed"
        exit 1
    fi
    
    # Testing
    log "INFO" "Running tests..."
    if ! npm run test:ci; then
        log "ERROR" "Tests failed"
        exit 1
    fi
    
    # Code formatting check
    log "INFO" "Checking code formatting..."
    if ! npm run format:check; then
        log "WARN" "Code formatting issues detected, auto-fixing..."
        npm run format
    fi
    
    log "INFO" "All quality gates passed successfully"
}

# Build application
build_application() {
    log "INFO" "Building application for $DEPLOYMENT_ENV environment..."
    
    # Set environment variables for build
    export NODE_ENV=$DEPLOYMENT_ENV
    
    # Clean previous build
    npm run clean:dist
    
    # Run build process
    if ! npm run build; then
        log "ERROR" "Build process failed"
        exit 1
    fi
    
    # Verify build output
    if [ ! -d "dist" ]; then
        log "ERROR" "Build output directory not found"
        exit 1
    fi
    
    log "INFO" "Application built successfully"
}

# Deploy application
deploy_application() {
    log "INFO" "Deploying application to $DEPLOYMENT_ENV environment..."
    
    case $DEPLOYMENT_ENV in
        "production")
            deploy_production
            ;;
        "staging")
            deploy_staging
            ;;
        "development")
            deploy_development
            ;;
    esac
    
    log "INFO" "Application deployed successfully"
}

# Production deployment
deploy_production() {
    log "INFO" "Executing production deployment..."
    
    # Stop existing service gracefully
    if pgrep -f "node.*server.js" > /dev/null; then
        log "INFO" "Stopping existing service..."
        pkill -SIGTERM -f "node.*server.js" || true
        sleep 5
    fi
    
    # Start new service
    log "INFO" "Starting production service..."
    nohup npm run start:prod > logs/production.log 2>&1 &
    
    # Store PID for monitoring
    echo $! > .production.pid
}

# Staging deployment
deploy_staging() {
    log "INFO" "Executing staging deployment..."
    
    # Docker-based staging deployment
    if command -v docker &> /dev/null; then
        log "INFO" "Using Docker for staging deployment..."
        docker-compose -f docker-compose.yml --profile staging up -d
    else
        log "INFO" "Using direct Node.js for staging deployment..."
        nohup npm run start:staging > logs/staging.log 2>&1 &
        echo $! > .staging.pid
    fi
}

# Development deployment
deploy_development() {
    log "INFO" "Executing development deployment..."
    npm run start:dev &
    echo $! > .development.pid
}

# Health check function
health_check() {
    log "INFO" "Performing health checks..."
    
    local retry_count=0
    
    while [ $retry_count -lt $MAX_HEALTH_RETRIES ]; do
        log "DEBUG" "Health check attempt $((retry_count + 1))/$MAX_HEALTH_RETRIES"
        
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log "INFO" "Health check passed - Application is healthy"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        
        if [ $retry_count -lt $MAX_HEALTH_RETRIES ]; then
            log "WARN" "Health check failed, retrying in $HEALTH_RETRY_INTERVAL seconds..."
            sleep $HEALTH_RETRY_INTERVAL
        fi
    done
    
    log "ERROR" "Health check failed after $MAX_HEALTH_RETRIES attempts"
    return 1
}

# Rollback function
rollback() {
    log "WARN" "Initiating rollback procedure..."
    
    if [ ! -f ".last-backup" ]; then
        log "ERROR" "No backup found for rollback"
        exit 1
    fi
    
    local backup_path=$(cat .last-backup)
    
    if [ ! -d "$backup_path" ]; then
        log "ERROR" "Backup directory not found: $backup_path"
        exit 1
    fi
    
    # Stop current service
    if [ -f ".${DEPLOYMENT_ENV}.pid" ]; then
        local pid=$(cat ".${DEPLOYMENT_ENV}.pid")
        if kill -0 "$pid" 2>/dev/null; then
            log "INFO" "Stopping current service (PID: $pid)..."
            kill -SIGTERM "$pid"
            sleep 5
        fi
    fi
    
    # Restore from backup
    log "INFO" "Restoring from backup: $backup_path"
    
    if [ -d "$backup_path/dist" ]; then
        rm -rf dist
        cp -r "$backup_path/dist" .
    fi
    
    # Restart service with backup
    deploy_application
    
    log "INFO" "Rollback completed successfully"
}

# Cleanup function
cleanup() {
    log "INFO" "Performing cleanup..."
    
    # Remove old backups (keep last 5)
    if [ -d "$BACKUP_DIR" ]; then
        ls -t "$BACKUP_DIR" | tail -n +6 | xargs -I {} rm -rf "$BACKUP_DIR/{}" 2>/dev/null || true
    fi
    
    # Clean temporary files
    rm -f .last-backup 2>/dev/null || true
    
    log "INFO" "Cleanup completed"
}

# Signal handlers for graceful shutdown
trap 'log "ERROR" "Deployment interrupted"; cleanup; exit 1' INT TERM

# Main deployment workflow
main() {
    log "INFO" "Starting deployment process for environment: $DEPLOYMENT_ENV"
    log "INFO" "Deployment log: $LOG_FILE"
    
    # Create log directory
    mkdir -p logs
    
    # Deployment steps
    setup_directories
    validate_environment
    create_backup
    
    # Quality gates
    run_quality_gates
    
    # Build and deploy
    build_application
    deploy_application
    
    # Verify deployment
    if health_check; then
        log "INFO" "Deployment completed successfully!"
        
        # Generate deployment report
        cat > "deployment-report-$(date +%Y%m%d-%H%M%S).json" << EOF
{
    "deployment_status": "success",
    "environment": "$DEPLOYMENT_ENV",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "health_check": "passed",
    "backup_location": "$(cat .last-backup 2>/dev/null || echo 'none')",
    "log_file": "$LOG_FILE"
}
EOF
        
    else
        log "ERROR" "Deployment health check failed, initiating rollback..."
        rollback
        
        if health_check; then
            log "INFO" "Rollback successful, service restored"
        else
            log "ERROR" "Rollback failed, manual intervention required"
            exit 1
        fi
    fi
    
    cleanup
    log "INFO" "Deployment process completed"
}

# Script usage information
usage() {
    echo "Usage: $0 [environment]"
    echo "Environments: production, staging, development"
    echo "Default: production"
    exit 1
}

# Validate arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    usage
fi

# Execute main deployment workflow
main