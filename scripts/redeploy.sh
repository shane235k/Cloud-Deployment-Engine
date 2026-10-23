#!/usr/bin/env bash
# ==============================================================================
# Automated Local CI Redeployment Script for KubeDeploy (Minikube / Kubernetes)
#
# Usage:
#   ./scripts/redeploy.sh              # Redeploys both frontend and backend
#   ./scripts/redeploy.sh frontend     # Redeploys only frontend
#   ./scripts/redeploy.sh backend      # Redeploys only backend
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

TARGET="${1:-all}"
TARGET="$(echo "${TARGET}" | tr '[:upper:]' '[:lower:]')"

FRONTEND_IMAGE="p377-frontend:v1"
BACKEND_IMAGE="p377-backend:v1"

FRONTEND_DIR="${PROJECT_ROOT}/frontend"
BACKEND_DIR="${PROJECT_ROOT}/backend"
K8S_DIR="${PROJECT_ROOT}/k8s"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "\n${CYAN}========================================================${NC}"
    echo -e "${CYAN}>> $1${NC}"
    echo -e "${CYAN}========================================================${NC}"
}

print_success() { echo -e "${GREEN}[OK] $1${NC}"; }
print_warn()    { echo -e "${YELLOW}[WARN] $1${NC}"; }
print_fail()    { echo -e "${RED}[ERROR] $1${NC}"; }

echo -e "${CYAN}========================================================${NC}"
echo -e "${CYAN}   KUBEDEPLOY LOCAL CI / REDEPLOYMENT SCRIPT            ${NC}"
echo -e "${CYAN}   Target: $(echo "${TARGET}" | tr '[:lower:]' '[:upper:]')${NC}"
echo -e "${CYAN}   Project Root: ${PROJECT_ROOT}${NC}"
echo -e "${CYAN}========================================================${NC}"

# ------------------------------------------------------------------------------
# Step 0: Pre-flight Verification
# ------------------------------------------------------------------------------
print_step "Step 0: Verifying Environment & Cluster Connectivity"

if ! command -v kubectl &>/dev/null; then
    print_fail "kubectl is not installed or not in PATH."
    exit 1
fi

CURRENT_CTX="$(kubectl config current-context 2>/dev/null || true)"
if [ -z "${CURRENT_CTX}" ]; then
    print_fail "Kubernetes cluster is not reachable or no context is set."
    exit 1
fi
print_success "Connected to Kubernetes context: ${CURRENT_CTX}"

# ------------------------------------------------------------------------------
# Step 1: Delete Current Kubernetes Pods
# ------------------------------------------------------------------------------
print_step "Step 1: Deleting Current Kubernetes Pods"

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "frontend" ]; then
    echo "Deleting existing frontend pods..."
    kubectl delete pod -l app=frontend --ignore-not-found=true --wait=false || true
    print_success "Frontend pods marked for deletion."
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ]; then
    echo "Deleting existing backend pods..."
    kubectl delete pod -l app=backend --ignore-not-found=true --wait=false || true
    print_success "Backend pods marked for deletion."
fi

# ------------------------------------------------------------------------------
# Step 2: Build New Container Images (Locally - No Registry)
# ------------------------------------------------------------------------------
print_step "Step 2: Building New Local Images of Updated Code"

build_local_image() {
    local img_name="$1"
    local context_dir="$2"

    echo -e "\nBuilding local image '${img_name}' from context: ${context_dir}..."

    local build_success=false

    # Try minikube image build directly
    if command -v minikube &>/dev/null; then
        echo "Executing: minikube image build -t ${img_name} ${context_dir}"
        if minikube image build -t "${img_name}" "${context_dir}"; then
            build_success=true
            print_success "Image '${img_name}' successfully built directly into Minikube."
        else
            print_warn "minikube image build failed, attempting docker build fallback..."
        fi
    fi

    if [ "${build_success}" = false ]; then
        if ! command -v docker &>/dev/null; then
            print_fail "Neither minikube image build succeeded nor is docker installed."
            exit 1
        fi

        echo "Building via Docker: docker build -t ${img_name} ${context_dir}"
        docker build -t "${img_name}" "${context_dir}"
        print_success "Docker build completed for ${img_name}."

        if command -v minikube &>/dev/null; then
            echo "Loading image into Minikube: minikube image load ${img_name}"
            minikube image load "${img_name}"
            print_success "Image '${img_name}' loaded into Minikube."
        fi
    fi
}

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "frontend" ]; then
    build_local_image "${FRONTEND_IMAGE}" "${FRONTEND_DIR}"
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ]; then
    build_local_image "${BACKEND_IMAGE}" "${BACKEND_DIR}"
fi

# ------------------------------------------------------------------------------
# Step 3: Apply Kubernetes Manifests (kubectl apply -f)
# ------------------------------------------------------------------------------
print_step "Step 3: Applying Kubernetes Manifests (kubectl apply -f)"

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ]; then
    kubectl apply -f "${K8S_DIR}/backend-deployment.yaml"
    kubectl apply -f "${K8S_DIR}/backend-service.yaml"
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "frontend" ]; then
    kubectl apply -f "${K8S_DIR}/frontend-deployment.yaml"
    kubectl apply -f "${K8S_DIR}/frontend-service.yaml"
fi

# Optional ServiceMonitor check
if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ]; then
    if [ -f "${K8S_DIR}/backend-monitor.yaml" ]; then
        if kubectl get crd servicemonitors.monitoring.coreos.com &>/dev/null; then
            kubectl apply -f "${K8S_DIR}/backend-monitor.yaml" || true
        fi
    fi
fi

print_success "Kubernetes manifests applied."

# ------------------------------------------------------------------------------
# Step 4: Restart Deployments & Verify Rollout
# ------------------------------------------------------------------------------
print_step "Step 4: Restarting Deployments & Verifying Rollout"

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "frontend" ]; then
    echo "Triggering rollout restart for frontend-deployment..."
    kubectl rollout restart deployment frontend-deployment
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ]; then
    echo "Triggering rollout restart for backend-deployment..."
    kubectl rollout restart deployment backend-deployment
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "frontend" ]; then
    echo "Waiting for frontend-deployment rollout to complete..."
    kubectl rollout status deployment/frontend-deployment --timeout=90s
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ]; then
    echo "Waiting for backend-deployment rollout to complete..."
    kubectl rollout status deployment/backend-deployment --timeout=90s
fi

# ------------------------------------------------------------------------------
# Final Status
# ------------------------------------------------------------------------------
print_step "Deployment Complete! Active Pods Status"
kubectl get pods -o wide

echo -e "\n${GREEN}[SUCCESS] CI Redeployment finished for: $(echo "${TARGET}" | tr '[:lower:]' '[:upper:]')${NC}\n"
