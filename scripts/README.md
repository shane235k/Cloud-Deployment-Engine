# KubeDeploy Local CI / Development Redeployment Scripts

Automated scripts to rebuild updated code and deploy it directly into the local Kubernetes cluster (Minikube) without using any external container registry.

---

## What the Script Does (Sequence of Execution)

1. **Step 0: Verification**
   - Verifies `kubectl` is available and connected to your active Kubernetes cluster (`minikube`).
2. **Step 1: Delete Existing Kubernetes Pods**
   - Deletes running pods for the targeted component(s) (`app=frontend`, `app=backend`).
3. **Step 2: Build Updated Images Locally (No Registry Required)**
   - Builds `p377-frontend:v1` and/or `p377-backend:v1` directly into Minikube's container runtime using `minikube image build`.
   - Automatic fallback: If `minikube image build` is unavailable, builds with `docker build` and loads the image directly with `minikube image load`.
   - Adheres to `imagePullPolicy: Never` defined in your deployment manifests.
4. **Step 3: Apply Kubernetes Manifests (`kubectl apply -f`)**
   - Applies the appropriate manifests from `k8s/` (`frontend-deployment.yaml`, `frontend-service.yaml`, `backend-deployment.yaml`, `backend-service.yaml`).
   - Automatically detects if the Prometheus `ServiceMonitor` CRD is installed before applying `backend-monitor.yaml`, preventing CRD missing errors.
5. **Step 4: Rollout Restart & Verification**
   - Triggers `kubectl rollout restart` so Kubernetes immediately replaces any replica pods with the newly built local image.
   - Waits for rollout status to finish successfully and prints active pods (`kubectl get pods -o wide`).

---

## How to Run

### Option 1: PowerShell (Recommended on Windows)

```powershell
# Rebuild and redeploy both Frontend and Backend:
.\scripts\redeploy.ps1

# Redeploy Frontend only:
.\scripts\redeploy.ps1 -Frontend

# Redeploy Backend only:
.\scripts\redeploy.ps1 -Backend

# Skip build (just delete pods and re-apply manifests):
.\scripts\redeploy.ps1 -SkipBuild

# Force Docker daemon builder instead of direct minikube builder:
.\scripts\redeploy.ps1 -Builder docker
```

### Option 2: Git Bash / WSL / Linux (`.sh`)

```bash
# Make executable (first time only):
chmod +x ./scripts/redeploy.sh

# Rebuild and redeploy both Frontend and Backend:
./scripts/redeploy.sh

# Redeploy Frontend only:
./scripts/redeploy.sh frontend

# Redeploy Backend only:
./scripts/redeploy.sh backend
```

### Option 3: Command Prompt (`.cmd`)

```cmd
:: Rebuild everything:
scripts\redeploy.cmd

:: Rebuild Frontend only:
scripts\redeploy.cmd -Frontend

:: Rebuild Backend only:
scripts\redeploy.cmd -Backend
```

---

## Component Mapping Reference

| Component | Directory | Docker Image | Deployment | Service |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `frontend/` | `p377-frontend:v1` | `frontend-deployment` | `frontend-service` (NodePort 30007) |
| **Backend** | `backend/` | `p377-backend:v1` | `backend-deployment` | `backend-service` (ClusterIP 5000) |
