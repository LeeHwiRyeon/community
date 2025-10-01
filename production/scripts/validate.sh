#!/bin/bash

# Community Platform Production Validation Script
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

# Kubernetes configuration
KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config}"
KUBECTL="kubectl --kubeconfig=$KUBECONFIG"

# Validation configuration
VALIDATION_TIMEOUT=300
HEALTH_CHECK_INTERVAL=10
MAX_RETRIES=30

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
# VALIDATION FUNCTIONS
# =============================================================================

validate_kubernetes_connectivity() {
    log "Validating Kubernetes connectivity..."
    
    if ! $KUBECTL cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        return 1
    fi
    
    local cluster_info
    cluster_info=$($KUBECTL cluster-info | head -n 1)
    log "Connected to cluster: $cluster_info"
    
    success "Kubernetes connectivity validated."
}

validate_namespace() {
    log "Validating namespace: $NAMESPACE"
    
    if ! $KUBECTL get namespace "$NAMESPACE" &> /dev/null; then
        error "Namespace '$NAMESPACE' not found."
        return 1
    fi
    
    local namespace_status
    namespace_status=$($KUBECTL get namespace "$NAMESPACE" -o jsonpath='{.status.phase}')
    
    if [[ "$namespace_status" != "Active" ]]; then
        error "Namespace '$NAMESPACE' is not active. Status: $namespace_status"
        return 1
    fi
    
    success "Namespace validated."
}

validate_pods() {
    log "Validating pods..."
    
    local pods
    pods=$($KUBECTL get pods --namespace="$NAMESPACE" -o json)
    local total_pods
    total_pods=$(echo "$pods" | jq '.items | length')
    local running_pods
    running_pods=$(echo "$pods" | jq '[.items[] | select(.status.phase == "Running")] | length')
    local failed_pods
    failed_pods=$(echo "$pods" | jq '[.items[] | select(.status.phase == "Failed")] | length')
    local pending_pods
    pending_pods=$(echo "$pods" | jq '[.items[] | select(.status.phase == "Pending")] | length')
    
    log "Pod Status Summary:"
    log "  Total: $total_pods"
    log "  Running: $running_pods"
    log "  Failed: $failed_pods"
    log "  Pending: $pending_pods"
    
    if [[ $failed_pods -gt 0 ]]; then
        error "Found $failed_pods failed pods:"
        echo "$pods" | jq -r '.items[] | select(.status.phase == "Failed") | "  - \(.metadata.name): \(.status.reason // "Unknown")"'
        return 1
    fi
    
    if [[ $pending_pods -gt 0 ]]; then
        warning "Found $pending_pods pending pods. This might be normal during startup."
    fi
    
    success "Pod validation completed."
}

validate_services() {
    log "Validating services..."
    
    local services
    services=$($KUBECTL get services --namespace="$NAMESPACE" -o json)
    local total_services
    total_services=$(echo "$services" | jq '.items | length')
    
    log "Found $total_services services:"
    echo "$services" | jq -r '.items[] | "  - \(.metadata.name): \(.spec.type) \(.spec.ports[0].port // "N/A")"'
    
    # Check for required services
    local required_services=("api-gateway" "auth-service" "user-service" "content-service" "frontend")
    
    for service in "${required_services[@]}"; do
        if ! echo "$services" | jq -e ".items[] | select(.metadata.name == \"$service\")" &> /dev/null; then
            error "Required service '$service' not found."
            return 1
        fi
    done
    
    success "Service validation completed."
}

validate_ingress() {
    log "Validating ingress..."
    
    local ingress
    ingress=$($KUBECTL get ingress --namespace="$NAMESPACE" -o json 2>/dev/null || echo '{"items": []}')
    local total_ingress
    total_ingress=$(echo "$ingress" | jq '.items | length')
    
    if [[ $total_ingress -eq 0 ]]; then
        warning "No ingress resources found. This might be normal if using LoadBalancer services."
    else
        log "Found $total_ingress ingress resources:"
        echo "$ingress" | jq -r '.items[] | "  - \(.metadata.name): \(.spec.rules[0].host // "N/A")"'
    fi
    
    success "Ingress validation completed."
}

validate_secrets() {
    log "Validating secrets..."
    
    local secrets
    secrets=$($KUBECTL get secrets --namespace="$NAMESPACE" -o json)
    local total_secrets
    total_secrets=$(echo "$secrets" | jq '.items | length')
    
    log "Found $total_secrets secrets:"
    echo "$secrets" | jq -r '.items[] | "  - \(.metadata.name): \(.type)"'
    
    # Check for required secrets
    local required_secrets=("postgres-secret" "jwt-secret" "redis-secret")
    
    for secret in "${required_secrets[@]}"; do
        if ! echo "$secrets" | jq -e ".items[] | select(.metadata.name == \"$secret\")" &> /dev/null; then
            error "Required secret '$secret' not found."
            return 1
        fi
    done
    
    success "Secret validation completed."
}

validate_configmaps() {
    log "Validating configmaps..."
    
    local configmaps
    configmaps=$($KUBECTL get configmaps --namespace="$NAMESPACE" -o json)
    local total_configmaps
    total_configmaps=$(echo "$configmaps" | jq '.items | length')
    
    log "Found $total_configmaps configmaps:"
    echo "$configmaps" | jq -r '.items[] | "  - \(.metadata.name)"'
    
    success "ConfigMap validation completed."
}

validate_persistent_volumes() {
    log "Validating persistent volumes..."
    
    local pvcs
    pvcs=$($KUBECTL get pvc --namespace="$NAMESPACE" -o json)
    local total_pvcs
    total_pvcs=$(echo "$pvcs" | jq '.items | length')
    
    if [[ $total_pvcs -gt 0 ]]; then
        log "Found $total_pvcs persistent volume claims:"
        echo "$pvcs" | jq -r '.items[] | "  - \(.metadata.name): \(.status.phase // "Unknown")"'
        
        # Check for bound PVCs
        local bound_pvcs
        bound_pvcs=$(echo "$pvcs" | jq '[.items[] | select(.status.phase == "Bound")] | length')
        
        if [[ $bound_pvcs -lt $total_pvcs ]]; then
            warning "Some PVCs are not bound. This might cause issues."
        fi
    else
        log "No persistent volume claims found."
    fi
    
    success "Persistent volume validation completed."
}

validate_health_endpoints() {
    log "Validating health endpoints..."
    
    local services
    services=$($KUBECTL get services --namespace="$NAMESPACE" -o json)
    local service_urls=()
    
    # Get service URLs
    while IFS= read -r line; do
        service_urls+=("$line")
    done < <(echo "$services" | jq -r '.items[] | select(.spec.type == "LoadBalancer") | "\(.metadata.name):\(.spec.ports[0].port)"')
    
    if [[ ${#service_urls[@]} -eq 0 ]]; then
        warning "No LoadBalancer services found. Skipping health endpoint validation."
        return 0
    fi
    
    for service_url in "${service_urls[@]}"; do
        local service_name
        service_name=$(echo "$service_url" | cut -d: -f1)
        local service_port
        service_port=$(echo "$service_url" | cut -d: -f2)
        
        log "Checking health endpoint for $service_name..."
        
        # Get service IP
        local service_ip
        service_ip=$($KUBECTL get service "$service_name" --namespace="$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
        
        if [[ -z "$service_ip" ]]; then
            warning "Service $service_name does not have an external IP yet."
            continue
        fi
        
        # Check health endpoint
        local health_url="http://$service_ip:$service_port/health"
        local max_attempts=10
        local attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            if curl -f "$health_url" &> /dev/null; then
                success "Health endpoint for $service_name is responding."
                break
            else
                warning "Health check attempt $attempt/$max_attempts failed for $service_name. Retrying in 5 seconds..."
                sleep 5
                ((attempt++))
            fi
        done
        
        if [[ $attempt -gt $max_attempts ]]; then
            error "Health endpoint for $service_name failed after $max_attempts attempts."
            return 1
        fi
    done
    
    success "Health endpoint validation completed."
}

validate_database_connectivity() {
    log "Validating database connectivity..."
    
    # Check PostgreSQL
    local postgres_pod
    postgres_pod=$($KUBECTL get pod -l app=postgres --namespace="$NAMESPACE" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [[ -n "$postgres_pod" ]]; then
        log "Checking PostgreSQL connectivity..."
        if $KUBECTL exec "$postgres_pod" --namespace="$NAMESPACE" -- pg_isready -U community_user -d community_production &> /dev/null; then
            success "PostgreSQL connectivity validated."
        else
            error "PostgreSQL connectivity check failed."
            return 1
        fi
    else
        warning "PostgreSQL pod not found. Skipping database connectivity check."
    fi
    
    # Check Redis
    local redis_pod
    redis_pod=$($KUBECTL get pod -l app=redis --namespace="$NAMESPACE" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [[ -n "$redis_pod" ]]; then
        log "Checking Redis connectivity..."
        if $KUBECTL exec "$redis_pod" --namespace="$NAMESPACE" -- redis-cli ping &> /dev/null; then
            success "Redis connectivity validated."
        else
            error "Redis connectivity check failed."
            return 1
        fi
    else
        warning "Redis pod not found. Skipping Redis connectivity check."
    fi
    
    success "Database connectivity validation completed."
}

validate_monitoring() {
    log "Validating monitoring setup..."
    
    # Check Prometheus
    local prometheus_pod
    prometheus_pod=$($KUBECTL get pod -l app=prometheus --namespace="$NAMESPACE" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [[ -n "$prometheus_pod" ]]; then
        log "Checking Prometheus..."
        if $KUBECTL exec "$prometheus_pod" --namespace="$NAMESPACE" -- wget -q --spider http://localhost:9090/-/healthy; then
            success "Prometheus is healthy."
        else
            warning "Prometheus health check failed."
        fi
    else
        warning "Prometheus pod not found."
    fi
    
    # Check Grafana
    local grafana_pod
    grafana_pod=$($KUBECTL get pod -l app=grafana --namespace="$NAMESPACE" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [[ -n "$grafana_pod" ]]; then
        log "Checking Grafana..."
        if $KUBECTL exec "$grafana_pod" --namespace="$NAMESPACE" -- wget -q --spider http://localhost:3000/api/health; then
            success "Grafana is healthy."
        else
            warning "Grafana health check failed."
        fi
    else
        warning "Grafana pod not found."
    fi
    
    success "Monitoring validation completed."
}

validate_security() {
    log "Validating security configuration..."
    
    # Check network policies
    local network_policies
    network_policies=$($KUBECTL get networkpolicies --namespace="$NAMESPACE" -o json 2>/dev/null || echo '{"items": []}')
    local total_network_policies
    total_network_policies=$(echo "$network_policies" | jq '.items | length')
    
    if [[ $total_network_policies -gt 0 ]]; then
        log "Found $total_network_policies network policies:"
        echo "$network_policies" | jq -r '.items[] | "  - \(.metadata.name)"'
    else
        warning "No network policies found. Consider implementing network security policies."
    fi
    
    # Check pod security policies
    local pod_security_policies
    pod_security_policies=$($KUBECTL get podsecuritypolicies --namespace="$NAMESPACE" -o json 2>/dev/null || echo '{"items": []}')
    local total_psp
    total_psp=$(echo "$pod_security_policies" | jq '.items | length')
    
    if [[ $total_psp -gt 0 ]]; then
        log "Found $total_psp pod security policies:"
        echo "$pod_security_policies" | jq -r '.items[] | "  - \(.metadata.name)"'
    else
        warning "No pod security policies found. Consider implementing pod security policies."
    fi
    
    # Check RBAC
    local roles
    roles=$($KUBECTL get roles --namespace="$NAMESPACE" -o json 2>/dev/null || echo '{"items": []}')
    local total_roles
    total_roles=$(echo "$roles" | jq '.items | length')
    
    if [[ $total_roles -gt 0 ]]; then
        log "Found $total_roles roles:"
        echo "$roles" | jq -r '.items[] | "  - \(.metadata.name)"'
    else
        warning "No roles found. Consider implementing RBAC."
    fi
    
    success "Security validation completed."
}

validate_performance() {
    log "Validating performance metrics..."
    
    # Check resource usage
    local nodes
    nodes=$($KUBECTL get nodes -o json)
    local total_nodes
    total_nodes=$(echo "$nodes" | jq '.items | length')
    
    log "Node resource usage:"
    for i in $(seq 0 $((total_nodes - 1))); do
        local node_name
        node_name=$(echo "$nodes" | jq -r ".items[$i].metadata.name")
        local cpu_capacity
        cpu_capacity=$(echo "$nodes" | jq -r ".items[$i].status.capacity.cpu")
        local memory_capacity
        memory_capacity=$(echo "$nodes" | jq -r ".items[$i].status.capacity.memory")
        
        log "  - $node_name: CPU $cpu_capacity, Memory $memory_capacity"
    done
    
    # Check pod resource usage
    local pods
    pods=$($KUBECTL get pods --namespace="$NAMESPACE" -o json)
    local total_pods
    total_pods=$(echo "$pods" | jq '.items | length')
    
    log "Pod resource usage:"
    for i in $(seq 0 $((total_pods - 1))); do
        local pod_name
        pod_name=$(echo "$pods" | jq -r ".items[$i].metadata.name")
        local cpu_request
        cpu_request=$(echo "$pods" | jq -r ".items[$i].spec.containers[0].resources.requests.cpu // 'N/A'")
        local memory_request
        memory_request=$(echo "$pods" | jq -r ".items[$i].spec.containers[0].resources.requests.memory // 'N/A'")
        
        log "  - $pod_name: CPU $cpu_request, Memory $memory_request"
    done
    
    success "Performance validation completed."
}

validate_logs() {
    log "Validating application logs..."
    
    local pods
    pods=$($KUBECTL get pods --namespace="$NAMESPACE" -o json)
    local total_pods
    total_pods=$(echo "$pods" | jq '.items | length')
    
    log "Checking logs for $total_pods pods..."
    
    for i in $(seq 0 $((total_pods - 1))); do
        local pod_name
        pod_name=$(echo "$pods" | jq -r ".items[$i].metadata.name")
        local pod_status
        pod_status=$(echo "$pods" | jq -r ".items[$i].status.phase")
        
        if [[ "$pod_status" == "Running" ]]; then
            log "Checking logs for $pod_name..."
            
            # Get recent logs (last 10 lines)
            local recent_logs
            recent_logs=$($KUBECTL logs "$pod_name" --namespace="$NAMESPACE" --tail=10 2>/dev/null || echo "No logs available")
            
            # Check for error patterns
            if echo "$recent_logs" | grep -i "error\|exception\|fatal\|panic" &> /dev/null; then
                warning "Found potential errors in $pod_name logs:"
                echo "$recent_logs" | grep -i "error\|exception\|fatal\|panic" | head -5
            else
                success "No errors found in $pod_name logs."
            fi
        else
            warning "Skipping log check for $pod_name (status: $pod_status)"
        fi
    done
    
    success "Log validation completed."
}

# =============================================================================
# MAIN VALIDATION FUNCTION
# =============================================================================

main() {
    local start_time=$(date +%s)
    local validation_results=()
    
    log "Starting Community Platform validation..."
    log "Environment: $ENVIRONMENT"
    log "Namespace: $NAMESPACE"
    
    # Run all validation functions
    local validations=(
        "validate_kubernetes_connectivity"
        "validate_namespace"
        "validate_pods"
        "validate_services"
        "validate_ingress"
        "validate_secrets"
        "validate_configmaps"
        "validate_persistent_volumes"
        "validate_health_endpoints"
        "validate_database_connectivity"
        "validate_monitoring"
        "validate_security"
        "validate_performance"
        "validate_logs"
    )
    
    for validation in "${validations[@]}"; do
        log "Running $validation..."
        if $validation; then
            validation_results+=("✅ $validation")
        else
            validation_results+=("❌ $validation")
        fi
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Display validation results
    log "Validation Results:"
    for result in "${validation_results[@]}"; do
        echo "  $result"
    done
    
    # Count successes and failures
    local success_count
    success_count=$(printf '%s\n' "${validation_results[@]}" | grep -c "✅" || true)
    local failure_count
    failure_count=$(printf '%s\n' "${validation_results[@]}" | grep -c "❌" || true)
    
    log "Validation Summary:"
    log "  Total validations: ${#validations[@]}"
    log "  Successful: $success_count"
    log "  Failed: $failure_count"
    log "  Duration: ${duration}s"
    
    if [[ $failure_count -eq 0 ]]; then
        success "All validations passed! 🎉"
        exit 0
    else
        error "Some validations failed. Please review the output above."
        exit 1
    fi
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Check required commands
check_command "kubectl"
check_command "jq"
check_command "curl"

# Run main function
main "$@"
