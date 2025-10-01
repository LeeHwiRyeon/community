#!/bin/bash

# Community Platform Production Deployment Script
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
RELEASE_NAME="community-platform"
CHART_PATH="$PROJECT_ROOT/helm/community-platform"
VALUES_FILE="$PROJECT_ROOT/helm/values/production.yaml"

# Kubernetes configuration
KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config}"
KUBECTL="kubectl --kubeconfig=$KUBECONFIG"
HELM="helm --kubeconfig=$KUBECONFIG"

# Git configuration
GIT_REPOSITORY="https://github.com/your-org/community-platform"
GIT_BRANCH="main"
GIT_COMMIT_SHA="${GIT_COMMIT_SHA:-$(git rev-parse HEAD)}"
GIT_TAG="${GIT_TAG:-$(git describe --tags --always)}"

# Docker configuration
DOCKER_REGISTRY="registry.example.com"
DOCKER_NAMESPACE="community-platform"
DOCKER_IMAGE_TAG="${GIT_COMMIT_SHA}"

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
    echo -e "${RED}[$(date +'%Y-%d %H:%M:%S')] ❌${NC} $1" >&2
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        error "Command '$1' not found. Please install it and try again."
        exit 1
    fi
}

check_file() {
    if [[ ! -f "$1" ]]; then
        error "File '$1' not found."
        exit 1
    fi
}

check_directory() {
    if [[ ! -d "$1" ]]; then
        error "Directory '$1' not found."
        exit 1
    fi
}

# =============================================================================
# PRE-DEPLOYMENT CHECKS
# =============================================================================

pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check required commands
    check_command "kubectl"
    check_command "helm"
    check_command "docker"
    check_command "git"
    check_command "jq"
    check_command "curl"
    
    # Check Kubernetes connectivity
    if ! $KUBECTL cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    # Check Helm repository
    if ! $HELM repo list | grep -q "stable"; then
        log "Adding stable Helm repository..."
        $HELM repo add stable https://charts.helm.sh/stable
        $HELM repo update
    fi
    
    # Check required files
    check_file "$VALUES_FILE"
    check_directory "$CHART_PATH"
    
    # Check environment variables
    if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
        error "POSTGRES_PASSWORD environment variable is required."
        exit 1
    fi
    
    if [[ -z "${JWT_SECRET:-}" ]]; then
        error "JWT_SECRET environment variable is required."
        exit 1
    fi
    
    success "Pre-deployment checks passed."
}

# =============================================================================
# SECRETS MANAGEMENT
# =============================================================================

create_secrets() {
    log "Creating Kubernetes secrets..."
    
    # Create namespace if it doesn't exist
    if ! $KUBECTL get namespace "$NAMESPACE" &> /dev/null; then
        log "Creating namespace: $NAMESPACE"
        $KUBECTL create namespace "$NAMESPACE"
    fi
    
    # Create database secrets
    $KUBECTL create secret generic postgres-secret \
        --namespace="$NAMESPACE" \
        --from-literal=password="${POSTGRES_PASSWORD}" \
        --from-literal=username="community_user" \
        --dry-run=client -o yaml | $KUBECTL apply -f -
    
    $KUBECTL create secret generic mongodb-secret \
        --namespace="$NAMESPACE" \
        --from-literal=password="${MONGODB_PASSWORD}" \
        --from-literal=username="community_user" \
        --dry-run=client -o yaml | $KUBECTL apply -f -
    
    $KUBECTL create secret generic redis-secret \
        --namespace="$NAMESPACE" \
        --from-literal=password="${REDIS_PASSWORD}" \
        --dry-run=client -o yaml | $KUBECTL apply -f -
    
    # Create JWT secret
    $KUBECTL create secret generic jwt-secret \
        --namespace="$NAMESPACE" \
        --from-literal=secret="${JWT_SECRET}" \
        --dry-run=client -o yaml | $KUBECTL apply -f -
    
    # Create external service secrets
    $KUBECTL create secret generic external-services \
        --namespace="$NAMESPACE" \
        --from-literal=sendgrid-api-key="${SENDGRID_API_KEY:-}" \
        --from-literal=stripe-secret-key="${STRIPE_SECRET_KEY:-}" \
        --from-literal=openai-api-key="${OPENAI_API_KEY:-}" \
        --dry-run=client -o yaml | $KUBECTL apply -f -
    
    success "Secrets created successfully."
}

# =============================================================================
# DOCKER IMAGE BUILDING
# =============================================================================

build_docker_images() {
    log "Building Docker images..."
    
    # Build frontend image
    log "Building frontend image..."
    docker build -t "$DOCKER_REGISTRY/$DOCKER_NAMESPACE/frontend:$DOCKER_IMAGE_TAG" \
        -f "$PROJECT_ROOT/frontend/Dockerfile" \
        "$PROJECT_ROOT/frontend"
    
    # Build API Gateway image
    log "Building API Gateway image..."
    docker build -t "$DOCKER_REGISTRY/$DOCKER_NAMESPACE/api-gateway:$DOCKER_IMAGE_TAG" \
        -f "$PROJECT_ROOT/microservices/api-gateway/Dockerfile" \
        "$PROJECT_ROOT/microservices/api-gateway"
    
    # Build microservices images
    local services=("auth-service" "user-service" "content-service" "notification-service" "analytics-service" "search-service" "file-service" "chat-service" "admin-service")
    
    for service in "${services[@]}"; do
        log "Building $service image..."
        docker build -t "$DOCKER_REGISTRY/$DOCKER_NAMESPACE/$service:$DOCKER_IMAGE_TAG" \
            -f "$PROJECT_ROOT/microservices/services/$service/Dockerfile" \
            "$PROJECT_ROOT/microservices/services/$service"
    done
    
    success "Docker images built successfully."
}

# =============================================================================
# DOCKER IMAGE PUSHING
# =============================================================================

push_docker_images() {
    log "Pushing Docker images to registry..."
    
    # Login to Docker registry
    if [[ -n "${DOCKER_USERNAME:-}" && -n "${DOCKER_PASSWORD:-}" ]]; then
        echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin
    fi
    
    # Push frontend image
    docker push "$DOCKER_REGISTRY/$DOCKER_NAMESPACE/frontend:$DOCKER_IMAGE_TAG"
    
    # Push API Gateway image
    docker push "$DOCKER_REGISTRY/$DOCKER_NAMESPACE/api-gateway:$DOCKER_IMAGE_TAG"
    
    # Push microservices images
    local services=("auth-service" "user-service" "content-service" "notification-service" "analytics-service" "search-service" "file-service" "chat-service" "admin-service")
    
    for service in "${services[@]}"; do
        docker push "$DOCKER_REGISTRY/$DOCKER_NAMESPACE/$service:$DOCKER_IMAGE_TAG"
    done
    
    success "Docker images pushed successfully."
}

# =============================================================================
# DATABASE MIGRATION
# =============================================================================

run_database_migrations() {
    log "Running database migrations..."
    
    # Wait for PostgreSQL to be ready
    log "Waiting for PostgreSQL to be ready..."
    $KUBECTL wait --for=condition=ready pod -l app=postgres --namespace="$NAMESPACE" --timeout=300s
    
    # Run migrations
    local migration_pod="migration-$(date +%s)"
    $KUBECTL run "$migration_pod" \
        --namespace="$NAMESPACE" \
        --image="$DOCKER_REGISTRY/$DOCKER_NAMESPACE/auth-service:$DOCKER_IMAGE_TAG" \
        --rm -i --restart=Never \
        --env="DATABASE_URL=postgresql://community_user:${POSTGRES_PASSWORD}@postgres-service:5432/community_production" \
        --command -- npm run migrate:up
    
    success "Database migrations completed successfully."
}

# =============================================================================
# HELM DEPLOYMENT
# =============================================================================

deploy_with_helm() {
    log "Deploying with Helm..."
    
    # Update Helm dependencies
    $HELM dependency update "$CHART_PATH"
    
    # Deploy or upgrade the release
    if $HELM list --namespace="$NAMESPACE" | grep -q "$RELEASE_NAME"; then
        log "Upgrading existing release: $RELEASE_NAME"
        $HELM upgrade "$RELEASE_NAME" "$CHART_PATH" \
            --namespace="$NAMESPACE" \
            --values="$VALUES_FILE" \
            --set image.tag="$DOCKER_IMAGE_TAG" \
            --set git.commitSha="$GIT_COMMIT_SHA" \
            --set git.tag="$GIT_TAG" \
            --wait \
            --timeout=10m
    else
        log "Installing new release: $RELEASE_NAME"
        $HELM install "$RELEASE_NAME" "$CHART_PATH" \
            --namespace="$NAMESPACE" \
            --values="$VALUES_FILE" \
            --set image.tag="$DOCKER_IMAGE_TAG" \
            --set git.commitSha="$GIT_COMMIT_SHA" \
            --set git.tag="$GIT_TAG" \
            --wait \
            --timeout=10m
    fi
    
    success "Helm deployment completed successfully."
}

# =============================================================================
# HEALTH CHECKS
# =============================================================================

run_health_checks() {
    log "Running health checks..."
    
    # Wait for all pods to be ready
    log "Waiting for all pods to be ready..."
    $KUBECTL wait --for=condition=ready pod -l app.kubernetes.io/name=community-platform --namespace="$NAMESPACE" --timeout=600s
    
    # Check API Gateway health
    local api_gateway_url
    api_gateway_url=$($KUBECTL get service api-gateway --namespace="$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [[ -n "$api_gateway_url" ]]; then
        log "Checking API Gateway health..."
        local max_attempts=30
        local attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            if curl -f "http://$api_gateway_url:8000/health" &> /dev/null; then
                success "API Gateway is healthy."
                break
            else
                warning "API Gateway health check attempt $attempt/$max_attempts failed. Retrying in 10 seconds..."
                sleep 10
                ((attempt++))
            fi
        done
        
        if [[ $attempt -gt $max_attempts ]]; then
            error "API Gateway health check failed after $max_attempts attempts."
            return 1
        fi
    else
        warning "API Gateway LoadBalancer IP not available. Skipping health check."
    fi
    
    # Check database connectivity
    log "Checking database connectivity..."
    local postgres_pod
    postgres_pod=$($KUBECTL get pod -l app=postgres --namespace="$NAMESPACE" -o jsonpath='{.items[0].metadata.name}')
    
    if [[ -n "$postgres_pod" ]]; then
        $KUBECTL exec "$postgres_pod" --namespace="$NAMESPACE" -- pg_isready -U community_user -d community_production
        success "Database connectivity check passed."
    else
        error "PostgreSQL pod not found."
        return 1
    fi
    
    success "All health checks passed."
}

# =============================================================================
# POST-DEPLOYMENT TASKS
# =============================================================================

post_deployment_tasks() {
    log "Running post-deployment tasks..."
    
    # Create initial admin user
    log "Creating initial admin user..."
    local admin_pod="admin-setup-$(date +%s)"
    $KUBECTL run "$admin_pod" \
        --namespace="$NAMESPACE" \
        --image="$DOCKER_REGISTRY/$DOCKER_NAMESPACE/admin-service:$DOCKER_IMAGE_TAG" \
        --rm -i --restart=Never \
        --env="DATABASE_URL=postgresql://community_user:${POSTGRES_PASSWORD}@postgres-service:5432/community_production" \
        --command -- npm run create-admin-user
    
    # Initialize search indices
    log "Initializing search indices..."
    local search_pod="search-init-$(date +%s)"
    $KUBECTL run "$search_pod" \
        --namespace="$NAMESPACE" \
        --image="$DOCKER_REGISTRY/$DOCKER_NAMESPACE/search-service:$DOCKER_IMAGE_TAG" \
        --rm -i --restart=Never \
        --env="ELASTICSEARCH_URL=http://elasticsearch-service:9200" \
        --command -- npm run init-indices
    
    # Warm up caches
    log "Warming up caches..."
    local cache_pod="cache-warmup-$(date +%s)"
    $KUBECTL run "$cache_pod" \
        --namespace="$NAMESPACE" \
        --image="$DOCKER_REGISTRY/$DOCKER_NAMESPACE/analytics-service:$DOCKER_IMAGE_TAG" \
        --rm -i --restart=Never \
        --env="REDIS_URL=redis://redis-service:6379" \
        --command -- npm run warmup-cache
    
    success "Post-deployment tasks completed successfully."
}

# =============================================================================
# MONITORING SETUP
# =============================================================================

setup_monitoring() {
    log "Setting up monitoring..."
    
    # Deploy Prometheus
    if ! $KUBECTL get deployment prometheus --namespace="$NAMESPACE" &> /dev/null; then
        log "Deploying Prometheus..."
        $HELM install prometheus stable/prometheus \
            --namespace="$NAMESPACE" \
            --set server.persistentVolume.enabled=true \
            --set server.persistentVolume.size=20Gi \
            --set alertmanager.persistentVolume.enabled=true \
            --set alertmanager.persistentVolume.size=2Gi
    fi
    
    # Deploy Grafana
    if ! $KUBECTL get deployment grafana --namespace="$NAMESPACE" &> /dev/null; then
        log "Deploying Grafana..."
        $HELM install grafana stable/grafana \
            --namespace="$NAMESPACE" \
            --set persistence.enabled=true \
            --set persistence.size=10Gi \
            --set adminPassword="${GRAFANA_PASSWORD:-admin}" \
            --set datasources."datasources\.yaml".apiVersion=1 \
            --set datasources."datasources\.yaml".datasources[0].name=Prometheus \
            --set datasources."datasources\.yaml".datasources[0].type=prometheus \
            --set datasources."datasources\.yaml".datasources[0].url=http://prometheus-server:80 \
            --set datasources."datasources\.yaml".datasources[0].access=proxy
    fi
    
    # Deploy Jaeger
    if ! $KUBECTL get deployment jaeger --namespace="$NAMESPACE" &> /dev/null; then
        log "Deploying Jaeger..."
        $HELM install jaeger jaegertracing/jaeger \
            --namespace="$NAMESPACE" \
            --set strategy=allInOne \
            --set persistence.enabled=true \
            --set persistence.size=10Gi
    fi
    
    success "Monitoring setup completed successfully."
}

# =============================================================================
# NOTIFICATION
# =============================================================================

send_deployment_notification() {
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
                    \"title\": \"Community Platform Deployment\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Namespace\", \"value\": \"$NAMESPACE\", \"short\": true},
                        {\"title\": \"Image Tag\", \"value\": \"$DOCKER_IMAGE_TAG\", \"short\": true},
                        {\"title\": \"Git Commit\", \"value\": \"$GIT_COMMIT_SHA\", \"short\": true}
                    ],
                    \"timestamp\": $(date +%s)
                }]
            }" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# =============================================================================
# CLEANUP
# =============================================================================

cleanup() {
    log "Cleaning up temporary resources..."
    
    # Remove temporary pods
    $KUBECTL delete pod -l app=migration --namespace="$NAMESPACE" --ignore-not-found=true
    $KUBECTL delete pod -l app=admin-setup --namespace="$NAMESPACE" --ignore-not-found=true
    $KUBECTL delete pod -l app=search-init --namespace="$NAMESPACE" --ignore-not-found=true
    $KUBECTL delete pod -l app=cache-warmup --namespace="$NAMESPACE" --ignore-not-found=true
    
    success "Cleanup completed successfully."
}

# =============================================================================
# MAIN DEPLOYMENT FUNCTION
# =============================================================================

main() {
    local start_time=$(date +%s)
    
    log "Starting Community Platform deployment..."
    log "Environment: $ENVIRONMENT"
    log "Namespace: $NAMESPACE"
    log "Image Tag: $DOCKER_IMAGE_TAG"
    log "Git Commit: $GIT_COMMIT_SHA"
    log "Git Tag: $GIT_TAG"
    
    # Send deployment start notification
    send_deployment_notification "info" "Deployment started for Community Platform v2.0.0"
    
    # Run pre-deployment checks
    pre_deployment_checks
    
    # Create secrets
    create_secrets
    
    # Build Docker images
    build_docker_images
    
    # Push Docker images
    push_docker_images
    
    # Deploy with Helm
    deploy_with_helm
    
    # Run database migrations
    run_database_migrations
    
    # Run health checks
    run_health_checks
    
    # Run post-deployment tasks
    post_deployment_tasks
    
    # Setup monitoring
    setup_monitoring
    
    # Cleanup
    cleanup
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    success "Deployment completed successfully in ${duration}s"
    
    # Send success notification
    send_deployment_notification "success" "Deployment completed successfully in ${duration}s"
    
    # Display deployment information
    log "Deployment Information:"
    log "  Environment: $ENVIRONMENT"
    log "  Namespace: $NAMESPACE"
    log "  Release: $RELEASE_NAME"
    log "  Image Tag: $DOCKER_IMAGE_TAG"
    log "  Git Commit: $GIT_COMMIT_SHA"
    log "  Git Tag: $GIT_TAG"
    log "  Duration: ${duration}s"
    
    # Display service URLs
    log "Service URLs:"
    $KUBECTL get services --namespace="$NAMESPACE" -o wide
    
    log "Deployment completed successfully! 🎉"
}

# =============================================================================
# ERROR HANDLING
# =============================================================================

trap 'error "Deployment failed at line $LINENO. Cleaning up..."; cleanup; send_deployment_notification "error" "Deployment failed at line $LINENO"; exit 1' ERR

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-push)
            SKIP_PUSH=true
            shift
            ;;
        --skip-migration)
            SKIP_MIGRATION=true
            shift
            ;;
        --skip-health-check)
            SKIP_HEALTH_CHECK=true
            shift
            ;;
        --skip-monitoring)
            SKIP_MONITORING=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --skip-build        Skip Docker image building"
            echo "  --skip-push         Skip Docker image pushing"
            echo "  --skip-migration    Skip database migration"
            echo "  --skip-health-check Skip health checks"
            echo "  --skip-monitoring   Skip monitoring setup"
            echo "  --help              Show this help message"
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
