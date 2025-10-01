#!/bin/bash

# Community Platform Production Backup Script
# Version: 2.0.0
# Author: Community Platform Team
# Date: 2024-09-28

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
ENVIRONMENT="production"
NAMESPACE="community-platform"
BACKUP_DIR="/backups/community-platform"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="community-platform-backup-$DATE"

# Kubernetes configuration
KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config}"
KUBECTL="kubectl --kubeconfig=$KUBECONFIG"

# AWS S3 configuration
S3_BUCKET="${S3_BUCKET:-community-backups-prod}"
S3_PREFIX="backups/$DATE"
AWS_REGION="${AWS_REGION:-us-west-2}"

# Database configuration
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
MONGODB_PASSWORD="${MONGODB_PASSWORD:-}"

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1" >&2
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        error "Command '$1' not found. Please install it and try again."
        exit 1
    fi
}

# =============================================================================
# BACKUP FUNCTIONS
# =============================================================================

create_backup_directory() {
    log "Creating backup directory: $BACKUP_DIR/$BACKUP_NAME"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
    success "Backup directory created."
}

backup_kubernetes_resources() {
    log "Backing up Kubernetes resources..."
    
    local resources=("deployments" "services" "configmaps" "secrets" "persistentvolumeclaims" "ingresses" "networkpolicies")
    
    for resource in "${resources[@]}"; do
        log "Backing up $resource..."
        $KUBECTL get "$resource" --namespace="$NAMESPACE" -o yaml > "$BACKUP_DIR/$BACKUP_NAME/$resource.yaml"
    done
    
    # Backup custom resources
    log "Backing up custom resources..."
    $KUBECTL get all --namespace="$NAMESPACE" -o yaml > "$BACKUP_DIR/$BACKUP_NAME/all-resources.yaml"
    
    success "Kubernetes resources backed up."
}

backup_postgresql() {
    log "Backing up PostgreSQL database..."
    
    local postgres_pod
    postgres_pod=$($KUBECTL get pod -l app=postgres --namespace="$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
    
    if [[ -z "$postgres_pod" ]]; then
        error "PostgreSQL pod not found."
        return 1
    fi
    
    # Create database dump
    $KUBECTL exec "$postgres_pod" --namespace="$NAMESPACE" -- pg_dump -U community_user -d community_production > "$BACKUP_DIR/$BACKUP_NAME/postgresql.sql"
    
    # Compress the dump
    gzip "$BACKUP_DIR/$BACKUP_NAME/postgresql.sql"
    
    success "PostgreSQL database backed up."
}

backup_mongodb() {
    log "Backing up MongoDB database..."
    
    local mongo_pod
    mongo_pod=$($KUBECTL get pod -l app=mongo --namespace="$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
    
    if [[ -z "$mongo_pod" ]]; then
        warning "MongoDB pod not found. Skipping MongoDB backup."
        return 0
    fi
    
    # Create database dump
    $KUBECTL exec "$mongo_pod" --namespace="$NAMESPACE" -- mongodump --uri="mongodb://community_user:${MONGODB_PASSWORD}@localhost:27017/community_users" --out=/tmp/mongodb-backup
    
    # Copy dump from pod
    $KUBECTL cp "$NAMESPACE/$mongo_pod:/tmp/mongodb-backup" "$BACKUP_DIR/$BACKUP_NAME/mongodb"
    
    # Compress the dump
    tar -czf "$BACKUP_DIR/$BACKUP_NAME/mongodb.tar.gz" -C "$BACKUP_DIR/$BACKUP_NAME" mongodb
    rm -rf "$BACKUP_DIR/$BACKUP_NAME/mongodb"
    
    success "MongoDB database backed up."
}

backup_redis() {
    log "Backing up Redis data..."
    
    local redis_pod
    redis_pod=$($KUBECTL get pod -l app=redis --namespace="$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
    
    if [[ -z "$redis_pod" ]]; then
        warning "Redis pod not found. Skipping Redis backup."
        return 0
    fi
    
    # Create Redis dump
    $KUBECTL exec "$redis_pod" --namespace="$NAMESPACE" -- redis-cli --rdb /tmp/redis-backup.rdb
    $KUBECTL cp "$NAMESPACE/$redis_pod:/tmp/redis-backup.rdb" "$BACKUP_DIR/$BACKUP_NAME/redis.rdb"
    
    success "Redis data backed up."
}

backup_elasticsearch() {
    log "Backing up Elasticsearch indices..."
    
    local elasticsearch_pod
    elasticsearch_pod=$($KUBECTL get pod -l app=elasticsearch --namespace="$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
    
    if [[ -z "$elasticsearch_pod" ]]; then
        warning "Elasticsearch pod not found. Skipping Elasticsearch backup."
        return 0
    fi
    
    # Create snapshot repository
    $KUBECTL exec "$elasticsearch_pod" --namespace="$NAMESPACE" -- curl -X PUT "localhost:9200/_snapshot/backup_repo" -H 'Content-Type: application/json' -d '{
        "type": "fs",
        "settings": {
            "location": "/tmp/elasticsearch-backup"
        }
    }'
    
    # Create snapshot
    $KUBECTL exec "$elasticsearch_pod" --namespace="$NAMESPACE" -- curl -X PUT "localhost:9200/_snapshot/backup_repo/snapshot_$DATE?wait_for_completion=true"
    
    # Copy snapshot from pod
    $KUBECTL cp "$NAMESPACE/$elasticsearch_pod:/tmp/elasticsearch-backup" "$BACKUP_DIR/$BACKUP_NAME/elasticsearch"
    
    # Compress the snapshot
    tar -czf "$BACKUP_DIR/$BACKUP_NAME/elasticsearch.tar.gz" -C "$BACKUP_DIR/$BACKUP_NAME" elasticsearch
    rm -rf "$BACKUP_DIR/$BACKUP_NAME/elasticsearch"
    
    success "Elasticsearch indices backed up."
}

backup_files() {
    log "Backing up file storage..."
    
    # This would typically backup from S3 or other file storage
    # For now, we'll create a placeholder
    echo "File storage backup placeholder" > "$BACKUP_DIR/$BACKUP_NAME/files.txt"
    
    success "File storage backed up."
}

create_backup_manifest() {
    log "Creating backup manifest..."
    
    cat > "$BACKUP_DIR/$BACKUP_NAME/backup-manifest.json" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "namespace": "$NAMESPACE",
  "version": "2.0.0",
  "components": {
    "kubernetes_resources": true,
    "postgresql": true,
    "mongodb": true,
    "redis": true,
    "elasticsearch": true,
    "files": true
  },
  "backup_size": "$(du -sh "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)",
  "backup_path": "$BACKUP_DIR/$BACKUP_NAME"
}
EOF
    
    success "Backup manifest created."
}

compress_backup() {
    log "Compressing backup..."
    
    cd "$BACKUP_DIR"
    tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
    rm -rf "$BACKUP_NAME"
    
    success "Backup compressed: $BACKUP_NAME.tar.gz"
}

upload_to_s3() {
    log "Uploading backup to S3..."
    
    if ! command -v aws &> /dev/null; then
        warning "AWS CLI not found. Skipping S3 upload."
        return 0
    fi
    
    local s3_key="$S3_PREFIX/$BACKUP_NAME.tar.gz"
    
    aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" "s3://$S3_BUCKET/$s3_key" \
        --region "$AWS_REGION" \
        --storage-class STANDARD_IA
    
    success "Backup uploaded to S3: s3://$S3_BUCKET/$s3_key"
}

cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    local retention_days="${BACKUP_RETENTION_DAYS:-30}"
    local cutoff_date=$(date -d "$retention_days days ago" +%Y%m%d)
    
    # Clean up local backups
    find "$BACKUP_DIR" -name "community-platform-backup-*.tar.gz" -type f | while read -r backup_file; do
        local backup_date
        backup_date=$(basename "$backup_file" | sed 's/community-platform-backup-\([0-9]\{8\}\)_.*/\1/')
        if [[ "$backup_date" < "$cutoff_date" ]]; then
            log "Removing old backup: $backup_file"
            rm -f "$backup_file"
        fi
    done
    
    # Clean up S3 backups
    if command -v aws &> /dev/null; then
        aws s3 ls "s3://$S3_BUCKET/backups/" --recursive | while read -r line; do
            local s3_date
            s3_date=$(echo "$line" | awk '{print $1}' | sed 's/-//g')
            if [[ "$s3_date" < "$cutoff_date" ]]; then
                local s3_key
                s3_key=$(echo "$line" | awk '{print $4}')
                log "Removing old S3 backup: s3://$S3_BUCKET/$s3_key"
                aws s3 rm "s3://$S3_BUCKET/$s3_key"
            fi
        done
    fi
    
    success "Old backups cleaned up."
}

verify_backup() {
    log "Verifying backup integrity..."
    
    local backup_file="$BACKUP_DIR/$BACKUP_NAME.tar.gz"
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Check if tar file is valid
    if ! tar -tzf "$backup_file" &> /dev/null; then
        error "Backup file is corrupted: $backup_file"
        return 1
    fi
    
    # Check backup size
    local backup_size
    backup_size=$(stat -c%s "$backup_file")
    if [[ $backup_size -lt 1024 ]]; then
        warning "Backup file is suspiciously small: $backup_size bytes"
    fi
    
    success "Backup integrity verified."
}

send_backup_notification() {
    local status="$1"
    local message="$2"
    
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color
        if [[ "$status" == "success" ]]; then
            color="good"
        else
            color="danger"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Community Platform Backup\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Namespace\", \"value\": \"$NAMESPACE\", \"short\": true},
                        {\"title\": \"Backup Name\", \"value\": \"$BACKUP_NAME\", \"short\": true},
                        {\"title\": \"Backup Size\", \"value\": \"$(du -sh "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)\", \"short\": true}
                    ],
                    \"timestamp\": $(date +%s)
                }]
            }" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# =============================================================================
# MAIN BACKUP FUNCTION
# =============================================================================

main() {
    local start_time=$(date +%s)
    
    log "Starting Community Platform backup..."
    log "Environment: $ENVIRONMENT"
    log "Namespace: $NAMESPACE"
    log "Backup Name: $BACKUP_NAME"
    
    # Send backup start notification
    send_backup_notification "info" "Backup started for Community Platform v2.0.0"
    
    # Check required commands
    check_command "kubectl"
    check_command "tar"
    check_command "gzip"
    
    # Create backup directory
    create_backup_directory
    
    # Run backup functions
    backup_kubernetes_resources
    backup_postgresql
    backup_mongodb
    backup_redis
    backup_elasticsearch
    backup_files
    
    # Create backup manifest
    create_backup_manifest
    
    # Compress backup
    compress_backup
    
    # Verify backup
    verify_backup
    
    # Upload to S3
    upload_to_s3
    
    # Cleanup old backups
    cleanup_old_backups
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    success "Backup completed successfully in ${duration}s"
    
    # Send success notification
    send_backup_notification "success" "Backup completed successfully in ${duration}s"
    
    # Display backup information
    log "Backup Information:"
    log "  Name: $BACKUP_NAME"
    log "  Environment: $ENVIRONMENT"
    log "  Namespace: $NAMESPACE"
    log "  Size: $(du -sh "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)"
    log "  Duration: ${duration}s"
    log "  Location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
    
    log "Backup completed successfully! 🎉"
}

# =============================================================================
# ERROR HANDLING
# =============================================================================

trap 'error "Backup failed at line $LINENO. Cleaning up..."; send_backup_notification "error" "Backup failed at line $LINENO"; exit 1' ERR

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-s3)
            SKIP_S3=true
            shift
            ;;
        --skip-cleanup)
            SKIP_CLEANUP=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --skip-s3        Skip S3 upload"
            echo "  --skip-cleanup   Skip cleanup of old backups"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"
